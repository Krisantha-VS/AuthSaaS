import { loginTenant } from '@/domain/services/tenant.service';
import { tenantLoginSchema } from '@/shared/lib/validators';
import { ok, err, handleError, getIp } from '@/shared/lib/api';
import { checkRateLimit } from '@/shared/lib/rate-limit';
import { handlePreflight, withCors } from '@/shared/lib/cors';

// 10 attempts per 15 minutes per IP
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

export async function OPTIONS(req: Request) {
  return handlePreflight(req, ['*']) ?? new Response(null, { status: 204 });
}

export async function POST(req: Request) {
  const ip = getIp(req);
  const origin = req.headers.get('origin') ?? '';

  const rl = await checkRateLimit(`tenant-login:${ip}`, MAX_ATTEMPTS, WINDOW_MS);
  if (!rl.allowed) {
    return err('Too many login attempts. Try again later.', 'RATE_LIMITED', 429,
      { 'Retry-After': String(rl.retryAfter) });
  }

  try {
    const body = await req.json();
    const parsed = tenantLoginSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message, 'VALIDATION_ERROR');

    const result = await loginTenant({ ...parsed.data, ipAddress: ip });
    return withCors(ok(result), origin);
  } catch (e) {
    return withCors(handleError(e), origin);
  }
}
