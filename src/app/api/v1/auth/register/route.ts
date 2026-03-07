import { register } from '@/domain/services/auth.service';
import { registerSchema } from '@/shared/lib/validators';
import { ok, err, handleError, getIp } from '@/shared/lib/api';
import { checkRateLimit, retryAfterSeconds } from '@/shared/lib/rate-limit';
import { checkOrigin, handlePreflight, withCors } from '@/shared/lib/cors';
import { TenantAppRepository } from '@/infrastructure/db/repositories/tenant-app.repository';

const appRepo = new TenantAppRepository();

// 5 registrations per hour per IP
const WINDOW_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export async function OPTIONS(req: Request) {
  return handlePreflight(req, ['*']) ?? new Response(null, { status: 204 });
}

export async function POST(req: Request) {
  const ip = getIp(req);
  if (!checkRateLimit(`register:${ip}`, MAX_ATTEMPTS, WINDOW_MS)) {
    return err('Too many requests. Try again later.', 'RATE_LIMITED', 429,
      { 'Retry-After': String(retryAfterSeconds(`register:${ip}`)) });
  }

  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message, 'VALIDATION_ERROR');

    const app = await appRepo.findByClientId(parsed.data.clientId);
    const originBlock = app ? checkOrigin(req, app.allowedOrigins) : null;
    if (originBlock) return originBlock;

    const result = await register({ ...parsed.data, ipAddress: ip });

    const res = ok({ user: result.user, tokens: result.tokens }, 201);
    const origin = req.headers.get('origin');
    return origin && app ? withCors(res, origin) : res;
  } catch (e) {
    return handleError(e);
  }
}
