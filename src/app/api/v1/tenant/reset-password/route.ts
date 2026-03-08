import { ok, err, handleError } from '@/shared/lib/api';
import { resetTenantPassword } from '@/domain/services/tenant.service';
import { z } from 'zod';

const passwordSchema = z.string().min(8).max(128)
  .regex(/[A-Z]/, 'Must contain uppercase')
  .regex(/[0-9]/, 'Must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Must contain a special character');

const schema = z.object({
  token: z.string().min(1),
  email: z.string().email(),
  password: passwordSchema,
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.errors[0].message, 'VALIDATION_ERROR');

  try {
    await resetTenantPassword(parsed.data);
    return ok({ message: 'Password reset successfully.' });
  } catch (e) {
    return handleError(e);
  }
}
