import { ok, err, handleError, getIp } from '@/shared/lib/api';
import { forgotPasswordSchema } from '@/shared/lib/validators';
import { forgotPassword } from '@/domain/services/auth.service';
import { checkRateLimit } from '@/shared/lib/rate-limit';
import { handlePreflight, withCors } from '@/shared/lib/cors';

export async function OPTIONS(req: Request) {
  return handlePreflight(req, ['*']) ?? new Response(null, { status: 204 });
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  const ip = getIp(req);
  const rl = await checkRateLimit(`forgot:${ip}`, 3, 15 * 60 * 1000);
  if (!rl.allowed) {
    const res = err('Too many requests', 'RATE_LIMITED', 429, {
      'Retry-After': String(rl.retryAfter),
    });
    return origin ? withCors(res, origin) : res;
  }

  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    const res = err(parsed.error.issues[0].message, 'VALIDATION_ERROR');
    return origin ? withCors(res, origin) : res;
  }

  try {
    // Always returns success — never reveals whether email exists
    await forgotPassword(parsed.data);
    const res = ok({ message: 'If that email exists, a reset link has been sent.' });
    return origin ? withCors(res, origin) : res;
  } catch (e) {
    const res = handleError(e);
    return origin ? withCors(res, origin) : res;
  }
}
