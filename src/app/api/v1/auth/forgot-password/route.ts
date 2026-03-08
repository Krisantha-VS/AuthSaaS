import { ok, err, handleError, getIp } from '@/shared/lib/api';
import { forgotPasswordSchema } from '@/shared/lib/validators';
import { forgotPassword } from '@/domain/services/auth.service';
import { checkRateLimit, retryAfterSeconds } from '@/shared/lib/rate-limit';

export async function POST(req: Request) {
  const ip = getIp(req);
  if (!checkRateLimit(`forgot:${ip}`, 3, 15 * 60 * 1000)) {
    return err('Too many requests', 'RATE_LIMITED', 429, {
      'Retry-After': String(retryAfterSeconds(`forgot:${ip}`)),
    });
  }

  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message, 'VALIDATION_ERROR');

  try {
    // Always returns success — never reveals whether email exists
    await forgotPassword(parsed.data);
    return ok({ message: 'If that email exists, a reset link has been sent.' });
  } catch (e) {
    return handleError(e);
  }
}
