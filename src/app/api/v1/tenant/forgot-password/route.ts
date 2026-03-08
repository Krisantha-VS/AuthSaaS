import { ok, err, handleError, getIp } from '@/shared/lib/api';
import { forgotTenantPassword } from '@/domain/services/tenant.service';
import { checkRateLimit, retryAfterSeconds } from '@/shared/lib/rate-limit';
import { z } from 'zod';

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const ip = getIp(req);
  if (!checkRateLimit(`tenant-forgot:${ip}`, 3, 15 * 60 * 1000)) {
    return err('Too many requests', 'RATE_LIMITED', 429, {
      'Retry-After': String(retryAfterSeconds(`tenant-forgot:${ip}`)),
    });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message, 'VALIDATION_ERROR');

  try {
    await forgotTenantPassword(parsed.data.email);
    return ok({ message: 'If that email exists, a reset link has been sent.' });
  } catch (e) {
    return handleError(e);
  }
}
