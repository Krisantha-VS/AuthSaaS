import { registerTenant } from '@/domain/services/tenant.service';
import { tenantRegisterSchema } from '@/shared/lib/validators';
import { ok, err, handleError, getIp } from '@/shared/lib/api';
import { checkRateLimit } from '@/shared/lib/rate-limit';

// 5 registrations per hour per IP
const WINDOW_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export async function POST(req: Request) {
  const ip = getIp(req);
  const rl = await checkRateLimit(`tenant-register:${ip}`, MAX_ATTEMPTS, WINDOW_MS);
  if (!rl.allowed) {
    return err('Too many requests. Try again later.', 'RATE_LIMITED', 429,
      { 'Retry-After': String(rl.retryAfter) });
  }

  try {
    const body = await req.json();
    const parsed = tenantRegisterSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message, 'VALIDATION_ERROR');

    const result = await registerTenant({ ...parsed.data, ipAddress: ip });
    return ok(result, 201);
  } catch (e) {
    return handleError(e);
  }
}
