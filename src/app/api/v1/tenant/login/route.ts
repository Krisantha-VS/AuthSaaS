import { loginTenant } from '@/domain/services/tenant.service';
import { tenantLoginSchema } from '@/shared/lib/validators';
import { ok, err, handleError, getIp } from '@/shared/lib/api';
import { checkRateLimit, retryAfterSeconds } from '@/shared/lib/rate-limit';

// 10 attempts per 15 minutes per IP
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

export async function POST(req: Request) {
  const ip = getIp(req);
  if (!checkRateLimit(`tenant-login:${ip}`, MAX_ATTEMPTS, WINDOW_MS)) {
    return err('Too many login attempts. Try again later.', 'RATE_LIMITED', 429,
      { 'Retry-After': String(retryAfterSeconds(`tenant-login:${ip}`)) });
  }

  try {
    const body = await req.json();
    const parsed = tenantLoginSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message, 'VALIDATION_ERROR');

    const result = await loginTenant({ ...parsed.data, ipAddress: ip });
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
