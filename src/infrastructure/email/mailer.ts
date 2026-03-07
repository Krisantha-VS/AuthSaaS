import nodemailer from 'nodemailer';
import { config } from '@/shared/config';

let _transporter: nodemailer.Transporter | undefined;

function getTransporter(): nodemailer.Transporter {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: false, // STARTTLS on port 587
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  }
  return _transporter;
}

export async function sendMail(to: string, subject: string, html: string): Promise<void> {
  await getTransporter().sendMail({
    from: `"AuthSaas" <${config.email.from}>`,
    to,
    subject,
    html,
  });
}
