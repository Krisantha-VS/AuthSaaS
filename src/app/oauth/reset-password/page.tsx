import { prisma } from '@/infrastructure/db/client';
import { ResetPasswordForm } from './reset-password-form';

interface Props {
  searchParams: Promise<{
    token?:     string;
    email?:     string;
    client_id?: string;
  }>;
}

export default async function OAuthResetPasswordPage({ searchParams }: Props) {
  const { token, email, client_id } = await searchParams;

  if (!token || !email || !client_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 max-w-sm">
          <h1 className="text-lg font-semibold text-slate-900">Invalid reset link</h1>
          <p className="text-sm text-slate-500 mt-2">
            This link is missing required parameters. Please request a new reset link.
          </p>
        </div>
      </div>
    );
  }

  let appName = 'the application';
  let returnTo = '';
  try {
    const app = await prisma.tenantApp.findUnique({
      where:  { clientId: client_id },
      select: { name: true },
    });
    if (app?.name) appName = app.name;
  } catch { /* non-fatal */ }

  // returnTo is the OAuth login page — user will need to restart the flow from the app
  // after reset since PKCE params are one-time use
  returnTo = `/oauth/login?client_id=${client_id}&_reset=1`;

  return (
    <ResetPasswordForm
      token={token}
      email={email}
      clientId={client_id}
      returnTo={returnTo}
      appName={appName}
    />
  );
}
