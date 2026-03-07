const base = (content: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>AuthSaas</title>
</head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Logo -->
        <tr><td style="padding-bottom:32px;" align="center">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed,#9333ea);border-radius:10px;width:36px;height:36px;text-align:center;vertical-align:middle;">
              <span style="color:#fff;font-size:18px;font-weight:700;line-height:36px;">A</span>
            </td>
            <td style="padding-left:10px;vertical-align:middle;">
              <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-0.02em;">Auth</span><span style="background:linear-gradient(90deg,#818cf8,#a78bfa,#c084fc);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:18px;font-weight:700;letter-spacing:-0.02em;">Saas</span>
            </td>
          </tr></table>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#18181b;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:40px 36px;">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;">
          <p style="color:#52525b;font-size:12px;margin:0;">
            AuthSaas · Secure Authentication as a Service<br/>
            If you didn't request this email, you can safely ignore it.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

const btn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;margin-top:8px;">${label}</a>`;

export function verificationEmail(params: {
  name: string | null;
  verifyUrl: string;
}): { subject: string; html: string } {
  return {
    subject: 'Verify your email address',
    html: base(`
      <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 8px;">Verify your email</h1>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 28px;">
        Hi ${params.name ?? 'there'}, click the button below to verify your email address and activate your account.
        This link expires in <strong style="color:#e4e4e7;">24 hours</strong>.
      </p>
      ${btn(params.verifyUrl, 'Verify email address')}
      <p style="color:#52525b;font-size:12px;margin:24px 0 0;">
        Or copy this link:<br/>
        <a href="${params.verifyUrl}" style="color:#818cf8;word-break:break-all;">${params.verifyUrl}</a>
      </p>
    `),
  };
}

export function passwordResetEmail(params: {
  name: string | null;
  resetUrl: string;
}): { subject: string; html: string } {
  return {
    subject: 'Reset your password',
    html: base(`
      <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 8px;">Reset your password</h1>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 28px;">
        Hi ${params.name ?? 'there'}, we received a request to reset your password.
        This link expires in <strong style="color:#e4e4e7;">1 hour</strong>.
      </p>
      ${btn(params.resetUrl, 'Reset password')}
      <p style="color:#52525b;font-size:12px;margin:24px 0 0;">
        If you didn't request a password reset, ignore this email — your password won't change.
      </p>
    `),
  };
}
