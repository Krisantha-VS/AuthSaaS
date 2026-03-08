import { resendVerification } from '@/domain/services/auth.service';
import { ok, err, handleError, getIp } from '@/shared/lib/api';
import { checkRateLimit, retryAfterSeconds } from '@/shared/lib/rate-limit';
import { z } from 'zod';
import { handlePreflight, withCors } from '@/shared/lib/cors';

const schema = z.object({
  clientId: z.string().min(1),
  email: z.string().email(),
});

// 3 resend attempts per 15 minutes per IP
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 3;

export async function OPTIONS(req: Request) {
  return handlePreflight(req, ['*']) ?? new Response(null, { status: 204 });
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  const ip = getIp(req);
  if (!checkRateLimit(`resend-verify:${ip}`, MAX_ATTEMPTS, WINDOW_MS)) {
    const res = err('Too many requests. Try again later.', 'RATE_LIMITED', 429,
      { 'Retry-After': String(retryAfterSeconds(`resend-verify:${ip}`)) });
    return origin ? withCors(res, origin) : res;
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const res = err(parsed.error.issues[0].message, 'VALIDATION_ERROR');
      return origin ? withCors(res, origin) : res;
    }

    await resendVerification(parsed.data);
    const res = ok({ message: 'Verification email sent.' });
    return origin ? withCors(res, origin) : res;
  } catch (e) {
    const res = handleError(e);
    return origin ? withCors(res, origin) : res;
  }
}
