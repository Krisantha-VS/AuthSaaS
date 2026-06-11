import { ok, err, handleError } from '@/shared/lib/api';
import { prisma } from '@/infrastructure/db/client';
import { z } from 'zod';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const passwordSchema = z.string().min(8).max(128)
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[0-9]/, 'Must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Must contain a special character');

const schema = z.object({
  token:     z.string().min(1),
  email:     z.string().email(),
  client_id: z.string().min(1),
  password:  passwordSchema,
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message, 'VALIDATION_ERROR');

  const { token, email, client_id, password } = parsed.data;

  try {
    const app = await prisma.tenantApp.findUnique({ where: { clientId: client_id } });
    if (!app) return err('Invalid request', 'INVALID_REQUEST', 400);

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        appId:      app.id,
        email:      email.toLowerCase(),
        resetToken: tokenHash,
      },
    });

    if (!user) return err('Invalid or expired reset link.', 'INVALID_TOKEN', 400);
    if (!user.resetTokenExp || user.resetTokenExp < new Date()) {
      return err('This reset link has expired. Please request a new one.', 'TOKEN_EXPIRED', 400);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data:  { passwordHash, resetToken: null, resetTokenExp: null },
    });

    return ok({ message: 'Password reset successfully.' });
  } catch (e) {
    return handleError(e);
  }
}
