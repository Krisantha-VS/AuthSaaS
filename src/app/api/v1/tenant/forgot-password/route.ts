import { ok, err, handleError, getIp } from '@/shared/lib/api';
import { forgotTenantPassword } from '@/domain/services/tenant.service';
import { checkRateLimit } from '@/shared/lib/rate-limit';
import { z } from 'zod';

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const ip = getIp(req);
  const rl = await checkRateLimit(`tenant-forgot:${ip}`, 3, 15 * 60 * 1000);
  if (!rl.allowed) {
    return err('Too many requests', 'RATE_LIMITED', 429, {
      'Retry-After': String(rl.retryAfter),
    });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message, 'VALIDATION_ERROR');

  try {
    const redirectTo: string | undefined = typeof body?.redirectTo === 'string' ? body.redirectTo : undefined;
    await forgotTenantPassword(parsed.data.email, redirectTo);
    return ok({ message: 'If that email exists, a reset link has been sent.' });
  } catch (e) {
    return handleError(e);
  }
}
