import { register } from '@/domain/services/auth.service';
import { registerSchema } from '@/shared/lib/validators';
import { ok, err, handleError, getIp } from '@/shared/lib/api';
import { checkRateLimit } from '@/shared/lib/rate-limit';
import { checkOrigin, handlePreflight, withCors } from '@/shared/lib/cors';
import { TenantAppRepository } from '@/infrastructure/db/repositories/tenant-app.repository';
import { cookies } from 'next/headers';
import { config } from '@/shared/config';

const appRepo = new TenantAppRepository();

// 5 registrations per hour per IP
const WINDOW_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export async function OPTIONS(req: Request) {
  return handlePreflight(req, ['*']) ?? new Response(null, { status: 204 });
}

export async function POST(req: Request) {
  const ip = getIp(req);
  const userAgent = req.headers.get('user-agent') ?? undefined;
  const origin = req.headers.get('origin');
  let corsOrigin: string | null = null;

  const rl = await checkRateLimit(`register:${ip}`, MAX_ATTEMPTS, WINDOW_MS);
  if (!rl.allowed) {
    return err('Too many requests. Try again later.', 'RATE_LIMITED', 429,
      { 'Retry-After': String(rl.retryAfter) });
  }

  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message, 'VALIDATION_ERROR');

    const app = await appRepo.findByClientId(parsed.data.clientId);
    const originBlock = app ? checkOrigin(req, app.allowedOrigins) : null;
    if (originBlock) return originBlock;

    if (origin && app) corsOrigin = origin;

    const result = await register({ ...parsed.data, ipAddress: ip, userAgent });

    // Set refresh token as httpOnly cookie (browser clients)
    const cookieStore = await cookies();
    cookieStore.set('refresh_token', result.tokens.refreshToken, {
      httpOnly: true,
      secure: config.cookie.secure,
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: config.cookie.refreshTtlSeconds,
      ...(config.cookie.domain ? { domain: config.cookie.domain } : {}),
    });

    const res = ok({ user: result.user, tokens: result.tokens }, 201);
    return corsOrigin ? withCors(res, corsOrigin) : res;
  } catch (e) {
    const errorRes = handleError(e);
    return corsOrigin ? withCors(errorRes, corsOrigin) : errorRes;
  }
}
