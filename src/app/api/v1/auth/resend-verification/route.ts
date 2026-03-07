import { resendVerification } from '@/domain/services/auth.service';
import { ok, err, handleError, getIp } from '@/shared/lib/api';
import { checkRateLimit, retryAfterSeconds } from '@/shared/lib/rate-limit';
import { z } from 'zod';

const schema = z.object({
  clientId: z.string().min(1),
  email: z.string().email(),
});

// 3 resend attempts per 15 minutes per IP
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 3;

export async function POST(req: Request) {
  const ip = getIp(req);
  if (!checkRateLimit(`resend-verify:${ip}`, MAX_ATTEMPTS, WINDOW_MS)) {
    return err('Too many requests. Try again later.', 'RATE_LIMITED', 429,
      { 'Retry-After': String(retryAfterSeconds(`resend-verify:${ip}`)) });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message, 'VALIDATION_ERROR');

    await resendVerification(parsed.data);
    return ok({ message: 'Verification email sent.' });
  } catch (e) {
    return handleError(e);
  }
}
