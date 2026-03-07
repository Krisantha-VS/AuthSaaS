import { login } from '@/domain/services/auth.service';
import { loginSchema } from '@/shared/lib/validators';
import { ok, handleError, err, getIp } from '@/shared/lib/api';
import { checkRateLimit, retryAfterSeconds } from '@/shared/lib/rate-limit';
import { checkOrigin, handlePreflight, withCors } from '@/shared/lib/cors';
import { TenantAppRepository } from '@/infrastructure/db/repositories/tenant-app.repository';

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
  if (!checkRateLimit(`login:${ip}`, MAX_ATTEMPTS, WINDOW_MS)) {
    return err('Too many login attempts. Try again later.', 'RATE_LIMITED', 429,
      { 'Retry-After': String(retryAfterSeconds(`login:${ip}`)) });
  }

  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message, 'VALIDATION_ERROR');

    // Validate origin against the app's allowedOrigins
    const app = await appRepo.findByClientId(parsed.data.clientId);
    const originBlock = app ? checkOrigin(req, app.allowedOrigins) : null;
    if (originBlock) return originBlock;

    const result = await login({ ...parsed.data, ipAddress: ip });

    const res = ok(result.tokens);
    const origin = req.headers.get('origin');
    return origin && app ? withCors(res, origin) : res;
  } catch (e) {
    return handleError(e);
  }
}
