import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST!,
  port:   Number(process.env.EMAIL_PORT ?? 587),
  secure: Number(process.env.EMAIL_PORT) === 465,
  auth: {
    user: process.env.EMAIL_USER!,
    pass: process.env.EMAIL_PASS!,
  },
});

const FROM = process.env.EMAIL_FROM ?? 'noreply@royalda.com';

export async function sendMail(to: string, subject: string, html: string): Promise<void> {
  await transporter.sendMail({ from: FROM, to, subject, html });
}
