import { prisma } from '@/infrastructure/db/client';
import { OAuthLoginForm } from './oauth-login-form';

interface Props {
  searchParams: Promise<{
    client_id?:             string;
    redirect_uri?:          string;
    code_challenge?:        string;
    code_challenge_method?: string;
    state?:                 string;
  }>;
}

export default async function OAuthLoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const { client_id, redirect_uri, code_challenge, code_challenge_method, state } = params;

  // Validate required params — show error screen (never redirect, redirect_uri is untrusted here)
  if (!client_id || !redirect_uri || !code_challenge || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 max-w-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-xl mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Invalid request</h1>
          <p className="text-sm text-slate-500 mt-2">
            This authorization request is missing required parameters.
          </p>
        </div>
      </div>
    );
  }

  // Resolve app name for display (non-fatal if it fails)
  let appName = 'the application';
  try {
    const app = await prisma.tenantApp.findUnique({
      where:  { clientId: client_id },
      select: { name: true, isActive: true },
    });
    if (!app || !app.isActive) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center p-8 max-w-sm">
            <h1 className="text-lg font-semibold text-slate-900">Unknown application</h1>
            <p className="text-sm text-slate-500 mt-2">
              This client is not registered or has been deactivated.
            </p>
          </div>
        </div>
      );
    }
    appName = app.name;
  } catch {
    // Non-fatal — display generic name
  }

  const providersRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/v1/oauth/providers?client_id=${client_id}`).catch(() => null);
  const providersData = providersRes?.ok ? await providersRes.json() : null;
  const enabledProviders: string[] = providersData?.data?.providers ?? [];

  return (
    <OAuthLoginForm
      clientId={client_id}
      redirectUri={redirect_uri}
      codeChallenge={code_challenge}
      codeChallengeMethod={code_challenge_method ?? 'S256'}
      state={state}
      appName={appName}
      enabledProviders={enabledProviders}
    />
  );
}
