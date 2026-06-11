import { prisma } from '@/infrastructure/db/client';
import { ForgotPasswordForm } from './forgot-password-form';

interface Props {
  searchParams: Promise<{
    client_id?: string;
    return_to?: string;
  }>;
}

export default async function OAuthForgotPasswordPage({ searchParams }: Props) {
  const { client_id, return_to } = await searchParams;

  if (!client_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 max-w-sm">
          <h1 className="text-lg font-semibold text-slate-900">Invalid request</h1>
          <p className="text-sm text-slate-500 mt-2">Missing required parameters.</p>
        </div>
      </div>
    );
  }

  let appName = 'the application';
  try {
    const app = await prisma.tenantApp.findUnique({
      where:  { clientId: client_id },
      select: { name: true, isActive: true },
    });
    if (app?.name) appName = app.name;
  } catch { /* non-fatal */ }

  return (
    <ForgotPasswordForm
      clientId={client_id}
      returnTo={return_to ?? ''}
      appName={appName}
    />
  );
}
