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

export function emailVerifiedEmail(params: {
  name: string | null;
}): { subject: string; html: string } {
  return {
    subject: 'Your email has been verified',
    html: base(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;background:linear-gradient(135deg,#16a34a,#22c55e);border-radius:50%;width:56px;height:56px;line-height:56px;text-align:center;">
          <span style="color:#fff;font-size:28px;line-height:56px;">&#10003;</span>
        </div>
      </div>
      <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 8px;text-align:center;">Email verified</h1>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 28px;text-align:center;">
        Hi ${params.name ?? 'there'}, your email address has been successfully verified.
        You can now sign in to your account.
      </p>
      <div style="text-align:center;">
        ${btn('https://auth-saas.royalda.com/login', 'Sign in to your account')}
      </div>
    `),
  };
}

export function passwordChangedEmail(params: {
  name: string | null;
}): { subject: string; html: string } {
  const timestamp = new Date().toUTCString();
  return {
    subject: 'Your password has been changed',
    html: base(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;background:linear-gradient(135deg,#b45309,#f59e0b);border-radius:50%;width:56px;height:56px;line-height:56px;text-align:center;">
          <span style="color:#fff;font-size:26px;line-height:56px;">&#9888;</span>
        </div>
      </div>
      <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 8px;text-align:center;">Password changed</h1>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Hi ${params.name ?? 'there'}, the password for your account was successfully changed.
      </p>
      <div style="background:#27272a;border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:12px 16px;margin-bottom:24px;">
        <p style="color:#71717a;font-size:12px;margin:0 0 4px;">Time of change</p>
        <p style="color:#e4e4e7;font-size:13px;font-weight:600;margin:0;">${timestamp}</p>
      </div>
      <p style="color:#f87171;font-size:13px;font-weight:600;margin:0 0 8px;">If this wasn't you, act immediately:</p>
      <p style="color:#a1a1aa;font-size:13px;line-height:1.6;margin:0 0 20px;">
        Contact our support team right away at
        <a href="mailto:support@royalda.com" style="color:#7c3aed;">support@royalda.com</a>
        to secure your account.
      </p>
    `),
  };
}

export function tenantWelcomeEmail(params: {
  name: string | null;
}): { subject: string; html: string } {
  return {
    subject: 'Welcome to Royalda',
    html: base(`
      <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 8px;">Welcome to Royalda&#x1F44B;</h1>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Hi ${params.name ?? 'there'}, your Royalda account is ready. You can now manage your applications,
        configure authentication, and monitor your users from the dashboard.
      </p>
      <ul style="color:#a1a1aa;font-size:14px;line-height:2;margin:0 0 28px;padding-left:20px;">
        <li>Create and configure apps with a single client ID</li>
        <li>Invite users and manage roles</li>
        <li>Monitor auth events in real time</li>
      </ul>
      ${btn('https://auth-saas.royalda.com/dashboard', 'Go to dashboard')}
      <p style="color:#52525b;font-size:12px;margin:24px 0 0;">
        Need help? Reach us at <a href="mailto:support@royalda.com" style="color:#7c3aed;">support@royalda.com</a>
      </p>
    `),
  };
}

export function tenantPasswordChangedEmail(params: {
  name: string | null;
}): { subject: string; html: string } {
  const timestamp = new Date().toUTCString();
  return {
    subject: 'Your password has been changed',
    html: base(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;background:linear-gradient(135deg,#b45309,#f59e0b);border-radius:50%;width:56px;height:56px;line-height:56px;text-align:center;">
          <span style="color:#fff;font-size:26px;line-height:56px;">&#9888;</span>
        </div>
      </div>
      <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 8px;text-align:center;">Dashboard password changed</h1>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Hi ${params.name ?? 'there'}, the password for your Royalda dashboard account was successfully changed.
      </p>
      <div style="background:#27272a;border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:12px 16px;margin-bottom:24px;">
        <p style="color:#71717a;font-size:12px;margin:0 0 4px;">Time of change</p>
        <p style="color:#e4e4e7;font-size:13px;font-weight:600;margin:0;">${timestamp}</p>
      </div>
      <p style="color:#f87171;font-size:13px;font-weight:600;margin:0 0 8px;">If this wasn't you, act immediately:</p>
      <p style="color:#a1a1aa;font-size:13px;line-height:1.6;margin:0 0 20px;">
        Contact our support team at
        <a href="mailto:support@royalda.com" style="color:#7c3aed;">support@royalda.com</a>
        to secure your account.
      </p>
    `),
  };
}

export function accountLockedEmail(params: {
  name: string | null;
  unlockTime: string;
}): { subject: string; html: string } {
  return {
    subject: 'Your account has been temporarily locked',
    html: base(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;background:linear-gradient(135deg,#dc2626,#ef4444);border-radius:50%;width:56px;height:56px;line-height:56px;text-align:center;">
          <span style="color:#fff;font-size:26px;line-height:56px;">&#128274;</span>
        </div>
      </div>
      <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 8px;text-align:center;">Account temporarily locked</h1>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Hi ${params.name ?? 'there'}, your account has been temporarily locked due to too many failed sign-in attempts.
      </p>
      <div style="background:#27272a;border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:12px 16px;margin-bottom:24px;">
        <p style="color:#71717a;font-size:12px;margin:0 0 4px;">Account will unlock at</p>
        <p style="color:#e4e4e7;font-size:13px;font-weight:600;margin:0;">${params.unlockTime}</p>
      </div>
      <p style="color:#a1a1aa;font-size:13px;line-height:1.6;margin:0 0 20px;">
        If you did not attempt to sign in, your account may be under attack.
        Please contact support immediately at
        <a href="mailto:support@royalda.com" style="color:#7c3aed;">support@royalda.com</a>.
      </p>
    `),
  };
}
