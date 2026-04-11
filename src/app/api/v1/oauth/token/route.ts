import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/infrastructure/db/client';
import { signAccessToken, signRefreshToken } from '@/infrastructure/jwt';
import { err, handleError } from '@/shared/lib/api';
import { config } from '@/shared/config';
import { RefreshTokenRepository } from '@/infrastructure/db/repositories/refresh-token.repository';

const refreshTokenRepo = new RefreshTokenRepository();

const REFRESH_TOKEN_TTL_DAYS = 7;

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function verifyPkce(codeVerifier: string, storedChallenge: string): boolean {
  const computed = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return computed === storedChallenge;
}

// ─── POST /api/v1/oauth/token ─────────────────────────────────────────────────
// Backend-to-backend only. Exchanges authorization code for tokens.
// No CORS headers — browser should never call this directly.

export async function POST(req: NextRequest) {
  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return err('Invalid request body', 'INVALID_REQUEST', 400);
  }

  const { grant_type, code, client_id, code_verifier, redirect_uri } = body;

  if (grant_type !== 'authorization_code') {
    return err('grant_type must be authorization_code', 'UNSUPPORTED_GRANT_TYPE', 400);
  }

  if (!code || !client_id || !code_verifier || !redirect_uri) {
    return err('Missing required fields', 'INVALID_REQUEST', 400);
  }

  const codeHash = hashCode(code);
  const authCode = await prisma.authCode.findUnique({ where: { codeHash } });

  if (!authCode) {
    return err('Authorization code not found', 'INVALID_GRANT', 400);
  }

  if (authCode.used) {
    return err('Authorization code already used', 'INVALID_GRANT', 400);
  }

  if (authCode.expiresAt < new Date()) {
    return err('Authorization code expired', 'INVALID_GRANT', 400);
  }

  if (authCode.clientId !== client_id) {
    return err('client_id mismatch', 'INVALID_CLIENT', 401);
  }

  if (authCode.redirectUri !== redirect_uri) {
    return err('redirect_uri does not match', 'INVALID_GRANT', 400);
  }

  if (!verifyPkce(code_verifier, authCode.codeChallenge)) {
    return err('code_verifier does not match code_challenge', 'INVALID_GRANT', 400);
  }

  // Load user with roles
  const user = await prisma.user.findUnique({
    where: { id: authCode.userId },
    include: { roles: { include: { role: true } } },
  });

  if (!user || !user.isActive) {
    return err('User not found or inactive', 'INVALID_GRANT', 400);
  }

  // Mark code as used — prevent replay
  await prisma.authCode.update({
    where: { id: authCode.id },
    data:  { used: true, usedAt: new Date() },
  });

  // Issue tokens
  const roles        = user.roles.map(r => r.role.name);
  const accessToken  = signAccessToken({ sub: user.id, appId: authCode.clientId, email: user.email, roles });
  const refreshToken = signRefreshToken(user.id);
  const tokenHash    = hashToken(refreshToken);
  const expiresAt    = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  // Find the TenantApp id by clientId for the refresh token record
  const app = await prisma.tenantApp.findUnique({ where: { clientId: client_id } });
  if (app) {
    await refreshTokenRepo.create({ tokenHash, userId: user.id, appId: app.id, expiresAt });
  }

  const res = NextResponse.json({
    success: true,
    data: {
      access_token:  accessToken,
      refresh_token: refreshToken,
      token_type:    'Bearer',
      expires_in:    15 * 60,
    },
  });

  // Set refresh token as httpOnly cookie
  res.cookies.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure:   config.cookie.secure,
    sameSite: 'lax',
    path:     '/api/v1/auth',
    maxAge:   config.cookie.refreshTtlSeconds,
    ...(config.cookie.domain ? { domain: config.cookie.domain } : {}),
  });

  return res;
}
