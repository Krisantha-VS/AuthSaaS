import { ok, err, handleError } from '@/shared/lib/api';
import { resetPasswordSchema } from '@/shared/lib/validators';
import { resetPassword } from '@/domain/services/auth.service';
import { checkRateLimit, retryAfterSeconds } from '@/shared/lib/rate-limit';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) return err(parsed.error.errors[0].message, 'VALIDATION_ERROR');

  const key = `reset:${parsed.data.email}`;
  if (!checkRateLimit(key, 5, 15 * 60 * 1000)) {
    return err('Too many requests', 'RATE_LIMITED', 429, {
      'Retry-After': String(retryAfterSeconds(key)),
    });
  }

  try {
    await resetPassword(parsed.data);
    return ok({ message: 'Password reset successfully. Please log in with your new password.' });
  } catch (e) {
    return handleError(e);
  }
}
