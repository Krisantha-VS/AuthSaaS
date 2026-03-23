import { resendVerification } from '@/domain/services/auth.service';
import { ok, err, handleError, getIp } from '@/shared/lib/api';
import { checkRateLimit } from '@/shared/lib/rate-limit';
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
  const rl = await checkRateLimit(`resend-verify:${ip}`, MAX_ATTEMPTS, WINDOW_MS);
  if (!rl.allowed) {
    const res = err('Too many requests. Try again later.', 'RATE_LIMITED', 429,
      { 'Retry-After': String(rl.retryAfter) });
    return origin ? withCors(res, origin) : res;
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const res = err(parsed.error.issues[0].message, 'VALIDATION_ERROR');
      return origin ? withCors(res, origin) : res;
    }

    // Always return success — never reveal whether email/account exists
    try { await resendVerification(parsed.data); } catch { /* swallow */ }
    const res = ok({ message: 'If that email is registered and unverified, a verification email has been sent.' });
    return origin ? withCors(res, origin) : res;
  } catch (e) {
    const res = handleError(e);
    return origin ? withCors(res, origin) : res;
  }
}
