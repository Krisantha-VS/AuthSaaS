import { ok, err, handleError, getIp } from '@/shared/lib/api';
import { checkRateLimit } from '@/shared/lib/rate-limit';
import { prisma } from '@/infrastructure/db/client';
import { sendMail } from '@/infrastructure/email/mailer';
import { z } from 'zod';
import crypto from 'crypto';

const schema = z.object({
  email:     z.string().email(),
  client_id: z.string().min(1),
});

export async function POST(req: Request) {
  const ip = getIp(req);
  const rl = await checkRateLimit(`oauth-forgot:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.allowed) return err('Too many requests', 'RATE_LIMITED', 429, { 'Retry-After': String(rl.retryAfter) });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return err(parsed.error.issues[0].message, 'VALIDATION_ERROR');

  const { email, client_id } = parsed.data;

  try {
    const app = await prisma.tenantApp.findUnique({ where: { clientId: client_id } });
    if (!app || !app.isActive) return ok({ message: 'If that email exists, a reset link has been sent.' });

    const user = await prisma.user.findUnique({
      where: { appId_email: { appId: app.id, email: email.toLowerCase() } },
    });

    // Always return success to avoid user enumeration
    if (!user || !user.passwordHash) return ok({ message: 'If that email exists, a reset link has been sent.' });

    const token     = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiry    = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data:  { resetToken: tokenHash, resetTokenExp: expiry },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/oauth/reset-password?token=${token}&email=${encodeURIComponent(email.toLowerCase())}&client_id=${client_id}`;

    await sendMail(
      email,
      `Reset your password — ${app.name}`,
      `<p>Hi,</p>
<p>Click the link below to reset your password for <strong>${app.name}</strong>. This link expires in 1 hour.</p>
<p><a href="${resetUrl}" style="background:#4f46e5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">Reset password</a></p>
<p>If you didn't request this, you can ignore this email.</p>`,
    );

    return ok({ message: 'If that email exists, a reset link has been sent.' });
  } catch (e) {
    return handleError(e);
  }
}
