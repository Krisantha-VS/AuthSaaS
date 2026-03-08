import { ok, err, handleError } from '@/shared/lib/api';
import { resetPasswordSchema } from '@/shared/lib/validators';
import { resetPassword } from '@/domain/services/auth.service';
import { checkRateLimit, retryAfterSeconds } from '@/shared/lib/rate-limit';
import { handlePreflight, withCors } from '@/shared/lib/cors';

export async function OPTIONS(req: Request) {
  return handlePreflight(req, ['*']) ?? new Response(null, { status: 204 });
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  const body = await req.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    const res = err(parsed.error.issues[0].message, 'VALIDATION_ERROR');
    return origin ? withCors(res, origin) : res;
  }

  const key = `reset:${parsed.data.email}`;
  if (!checkRateLimit(key, 5, 15 * 60 * 1000)) {
    const res = err('Too many requests', 'RATE_LIMITED', 429, {
      'Retry-After': String(retryAfterSeconds(key)),
    });
    return origin ? withCors(res, origin) : res;
  }

  try {
    await resetPassword(parsed.data);
    const res = ok({ message: 'Password reset successfully. Please log in with your new password.' });
    return origin ? withCors(res, origin) : res;
  } catch (e) {
    const res = handleError(e);
    return origin ? withCors(res, origin) : res;
  }
}
