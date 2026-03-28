import { login } from '@/domain/services/auth.service';
import { loginSchema } from '@/shared/lib/validators';
import { ok, handleError, err, getIp } from '@/shared/lib/api';
import { checkRateLimit } from '@/shared/lib/rate-limit';
import { isLockedOut, recordFailedAttempt, clearFailedAttempts, lockoutRemainingSeconds } from '@/shared/lib/lockout';
import { checkOrigin, handlePreflight, withCors } from '@/shared/lib/cors';
import { TenantAppRepository } from '@/infrastructure/db/repositories/tenant-app.repository';
import { cookies } from 'next/headers';
import { config } from '@/shared/config';

const appRepo = new TenantAppRepository();

// 10 attempts per 15 minutes per IP
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

export async function OPTIONS(req: Request) {
  // For preflight we don't know clientId yet — allow all registered origins
  return handlePreflight(req, ['*']) ?? new Response(null, { status: 204 });
}

export async function POST(req: Request) {
  const ip = getIp(req);
  const userAgent = req.headers.get('user-agent') ?? undefined;
  const origin = req.headers.get('origin');
  let corsOrigin: string | null = null; // set after origin is validated against app

  const rl = await checkRateLimit(`login:${ip}`, MAX_ATTEMPTS, WINDOW_MS);
  if (!rl.allowed) {
    return err('Too many login attempts. Try again later.', 'RATE_LIMITED', 429,
      { 'Retry-After': String(rl.retryAfter) });
  }

  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message, 'VALIDATION_ERROR');

    // Per-account brute-force lockout check
    const lockoutKey = `${parsed.data.clientId}:${parsed.data.email}`;
    if (await isLockedOut(lockoutKey)) {
      return err(
        'Account temporarily locked. Too many failed attempts.',
        'ACCOUNT_LOCKED',
        429,
        { 'Retry-After': String(await lockoutRemainingSeconds(lockoutKey)) },
      );
    }

    // Validate origin against the app's allowedOrigins
    const app = await appRepo.findByClientId(parsed.data.clientId);
    const originBlock = app ? checkOrigin(req, app.allowedOrigins) : null;
    if (originBlock) return originBlock;

    // Origin is validated — attach CORS to all further responses (including errors)
    if (origin && app) corsOrigin = origin;

    let result: Awaited<ReturnType<typeof login>>;
    try {
      result = await login({ ...parsed.data, ipAddress: ip, userAgent });
    } catch (e) {
      if (e instanceof Error && e.message === 'INVALID_CREDENTIALS') {
        await recordFailedAttempt(lockoutKey);
      }
      throw e;
    }

    // Successful login — clear any accumulated failures
    await clearFailedAttempts(lockoutKey);

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

    const res = ok(result);
    return corsOrigin ? withCors(res, corsOrigin) : res;
  } catch (e) {
    const errorRes = handleError(e);
    return corsOrigin ? withCors(errorRes, corsOrigin) : errorRes;
  }
}
