import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/infrastructure/db/client';
import { register } from '@/domain/services/auth.service';
import { checkRateLimit } from '@/shared/lib/rate-limit';
import { ok, err, getIp, handleError } from '@/shared/lib/api';

const WINDOW_MS    = 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export async function POST(req: NextRequest) {
  const ip        = getIp(req);
  const userAgent = req.headers.get('user-agent') ?? undefined;

  const rl = await checkRateLimit(`oauth:register:${ip}`, MAX_ATTEMPTS, WINDOW_MS);
  if (!rl.allowed) {
    return err('Too many requests. Try again later.', 'RATE_LIMITED', 429, {
      'Retry-After': String(rl.retryAfter),
    });
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return err('Invalid request body', 'INVALID_REQUEST', 400);
  }

  const { client_id, email, password, name, code_challenge, code_challenge_method, redirect_uri, state } = body;

  if (!client_id || !email || !password || !code_challenge || !redirect_uri || !state) {
    return err('Missing required fields', 'INVALID_REQUEST', 400);
  }

  if (code_challenge_method !== 'S256') {
    return err('code_challenge_method must be S256', 'UNSUPPORTED_METHOD', 400);
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

  try {
    const result = await register({
      clientId: client_id,
      email,
      password,
      name:      name || undefined,
      ipAddress: ip,
      userAgent,
    });

    const codeRaw  = crypto.randomBytes(32).toString('hex');
    const codeHash = hashCode(codeRaw);

    await prisma.authCode.create({
      data: {
        codeHash,
        clientId:            client_id,
        userId:              result.user.id,
        codeChallenge:       code_challenge,
        codeChallengeMethod: 'S256',
        redirectUri:         redirect_uri,
        expiresAt:           new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const callbackUrl = new URL(redirect_uri);
    callbackUrl.searchParams.set('code',  codeRaw);
    callbackUrl.searchParams.set('state', state);

    return NextResponse.json({ success: true, data: { redirectTo: callbackUrl.toString() } });
  } catch (e) {
    return handleError(e);
  }
}
