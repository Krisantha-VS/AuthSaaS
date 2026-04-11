import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/infrastructure/db/client';
import { signAccessToken, signRefreshToken } from '@/infrastructure/jwt';
import { checkRateLimit } from '@/shared/lib/rate-limit';
import { isLockedOut, recordFailedAttempt, clearFailedAttempts, lockoutRemainingSeconds } from '@/shared/lib/lockout';
import { ok, err, getIp, handleError } from '@/shared/lib/api';
import { config } from '@/shared/config';
import bcrypt from 'bcryptjs';
import { RefreshTokenRepository } from '@/infrastructure/db/repositories/refresh-token.repository';

const refreshTokenRepo = new RefreshTokenRepository();

const WINDOW_MS   = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ─── GET /api/v1/oauth/authorize ─────────────────────────────────────────────
// Validates OAuth params and redirects to hosted login page.

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const clientId            = searchParams.get('client_id');
  const redirectUri         = searchParams.get('redirect_uri');
  const codeChallenge       = searchParams.get('code_challenge');
  const codeChallengeMethod = searchParams.get('code_challenge_method');
  const state               = searchParams.get('state');
  const responseType        = searchParams.get('response_type');

  if (!clientId || !redirectUri || !codeChallenge || !state) {
    return err('Missing required parameters', 'INVALID_REQUEST', 400);
  }

  if (responseType !== 'code') {
    return err('response_type must be code', 'UNSUPPORTED_RESPONSE_TYPE', 400);
  }

  if (codeChallengeMethod !== 'S256') {
    return err('code_challenge_method must be S256', 'UNSUPPORTED_METHOD', 400);
  }

  const app = await prisma.tenantApp.findUnique({ where: { clientId } });
  if (!app || !app.isActive) {
    return err('Invalid or inactive client', 'UNAUTHORIZED_CLIENT', 403);
  }

  const allowedOrigins = app.allowedOrigins as string[];
  const redirectBase   = redirectUri.split('?')[0];
  const isAllowed      = allowedOrigins.some(o => redirectBase.startsWith(o.replace(/\/$/, '')));
  const isLocalhost    = /^https?:\/\/localhost(:\d+)?/.test(redirectBase);

  if (!isAllowed && !isLocalhost) {
    return err('redirect_uri not allowed', 'INVALID_REDIRECT_URI', 400);
  }

  // Forward all params to the hosted login page
  const loginUrl = new URL('/oauth/login', req.url);
  loginUrl.searchParams.set('client_id',             clientId);
  loginUrl.searchParams.set('redirect_uri',          redirectUri);
  loginUrl.searchParams.set('code_challenge',        codeChallenge);
  loginUrl.searchParams.set('code_challenge_method', codeChallengeMethod ?? 'S256');
  loginUrl.searchParams.set('state',                 state);

  return NextResponse.redirect(loginUrl);
}

// ─── POST /api/v1/oauth/authorize ────────────────────────────────────────────
// Authenticates user credentials, generates auth code, redirects back.

export async function POST(req: NextRequest) {
  const ip = getIp(req);

  const rl = await checkRateLimit(`oauth:${ip}`, MAX_ATTEMPTS, WINDOW_MS);
  if (!rl.allowed) {
    return err('Too many attempts. Try again later.', 'RATE_LIMITED', 429, {
      'Retry-After': String(rl.retryAfter),
    });
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return err('Invalid request body', 'INVALID_REQUEST', 400);
  }

  const { client_id, email, password, code_challenge, code_challenge_method, redirect_uri, state } = body;

  if (!client_id || !email || !password || !code_challenge || !redirect_uri || !state) {
    return err('Missing required fields', 'INVALID_REQUEST', 400);
  }

  if (code_challenge_method !== 'S256') {
    return err('code_challenge_method must be S256', 'UNSUPPORTED_METHOD', 400);
  }

  // Per-account lockout
  const lockoutKey = `${client_id}:${email}`;
  if (await isLockedOut(lockoutKey)) {
    return err(
      'Account temporarily locked. Too many failed attempts.',
      'ACCOUNT_LOCKED',
      429,
      { 'Retry-After': String(await lockoutRemainingSeconds(lockoutKey)) },
    );
  }

  const app = await prisma.tenantApp.findUnique({ where: { clientId: client_id } });
  if (!app || !app.isActive) {
    return err('Invalid client', 'UNAUTHORIZED_CLIENT', 403);
  }

  const allowedOrigins = app.allowedOrigins as string[];
  const redirectBase   = redirect_uri.split('?')[0];
  const isAllowed      = allowedOrigins.some(o => redirectBase.startsWith(o.replace(/\/$/, '')));
  const isLocalhost    = /^https?:\/\/localhost(:\d+)?/.test(redirectBase);

  if (!isAllowed && !isLocalhost) {
    return err('redirect_uri not allowed', 'INVALID_REDIRECT_URI', 400);
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { appId_email: { appId: app.id, email: email.toLowerCase() } },
    include: { roles: { include: { role: true } } },
  });

  if (!user) {
    await recordFailedAttempt(lockoutKey);
    return err('Invalid email or password', 'INVALID_CREDENTIALS', 401);
  }

  if (!user.isActive) {
    return err('Account is disabled', 'ACCOUNT_DISABLED', 403);
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    await recordFailedAttempt(lockoutKey);
    return err('Invalid email or password', 'INVALID_CREDENTIALS', 401);
  }

  await clearFailedAttempts(lockoutKey);

  // Generate authorization code
  const codeRaw  = crypto.randomBytes(32).toString('hex');
  const codeHash = hashCode(codeRaw);

  await prisma.authCode.create({
    data: {
      codeHash,
      clientId: client_id,
      userId:   user.id,
      codeChallenge:       code_challenge,
      codeChallengeMethod: 'S256',
      redirectUri:         redirect_uri,
      expiresAt:           new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  // Redirect to TaskFlow callback with code
  const callbackUrl = new URL(redirect_uri);
  callbackUrl.searchParams.set('code',  codeRaw);
  callbackUrl.searchParams.set('state', state);

  return NextResponse.redirect(callbackUrl, { status: 302 });
}
