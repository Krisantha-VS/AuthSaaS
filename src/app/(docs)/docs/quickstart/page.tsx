import { PageHeader, SectionHeading, Callout, OnThisPage } from '@/components/docs/ui';
import { CodeBlock } from '@/components/docs/code-block';

const toc = [
  { id: 'register',      title: '1. Register as developer' },
  { id: 'create-app',    title: '2. Create an app' },
  { id: 'install-sdk',   title: '3. Install the SDK' },
  { id: 'add-provider',  title: '4. Add AuthProvider' },
  { id: 'use-auth',      title: '5. Use useAuth()' },
  { id: 'protect-route', title: '6. Protect a route' },
];

export default function QuickstartPage() {
  return (
    <div className="flex gap-12">
      <div className="flex-1 min-w-0 docs-prose">
        <PageHeader
          title="Quick Start"
          description="Add authentication to your Next.js app in under 5 minutes."
        />

        <SectionHeading id="register">1. Register as a developer</SectionHeading>
        <p>Create your tenant account via the API or dashboard:</p>
        <CodeBlock lang="bash" code={`curl -X POST https://your-domain.com/api/v1/tenant/register \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Your Name","email":"you@example.com","password":"securepassword"}'`} />

        <SectionHeading id="create-app">2. Create an app</SectionHeading>
        <p>
          Use the access token from step 1 to create your first app.
          The <code>clientSecret</code> is shown <strong>once</strong> — save it immediately.
        </p>
        <CodeBlock lang="bash" code={`curl -X POST https://your-domain.com/api/v1/tenant/apps \\
  -H "Authorization: Bearer <your_access_token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "My App",
    "allowedOrigins": ["http://localhost:3000"]
  }'`} />
        <CodeBlock lang="json" filename="Response" code={`{
  "app": {
    "id": "app_xxx",
    "clientId": "client_xxx",
    "name": "My App"
  },
  "clientSecret": "sas_abc123..."
}`} />

        <Callout variant="warning">
          Store <code>clientSecret</code> in your environment variables immediately. It cannot be retrieved again.
          Use <code>POST /api/v1/tenant/apps/:id/rotate</code> if lost.
        </Callout>

        <SectionHeading id="install-sdk">3. Install the SDK</SectionHeading>
        <CodeBlock lang="bash" code={`npm install @auth-saas/client`} />

        <SectionHeading id="add-provider">4. Add AuthProvider</SectionHeading>
        <CodeBlock
          lang="typescript"
          filename="app/layout.tsx"
          code={`import { AuthProvider } from '@auth-saas/client/react';
import { AuthClient } from '@auth-saas/client';

const authClient = new AuthClient({
  clientId: process.env.NEXT_PUBLIC_AUTH_CLIENT_ID!,
  baseUrl:  process.env.NEXT_PUBLIC_AUTH_URL + '/api/v1',
});

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider client={authClient}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}`}
        />

        <SectionHeading id="use-auth">5. Use useAuth()</SectionHeading>
        <CodeBlock
          lang="typescript"
          filename="components/login-form.tsx"
          code={`'use client';
import { useAuth } from '@auth-saas/client/react';

export function LoginForm() {
  const { login, isLoading, user } = useAuth();

  if (user) return <p>Welcome, {user.email}</p>;

  return (
    <button
      onClick={() => login({ email: 'user@example.com', password: 'secret' })}
      disabled={isLoading}
    >
      {isLoading ? 'Signing in...' : 'Sign in'}
    </button>
  );
}`}
        />

        <SectionHeading id="protect-route">6. Protect a route</SectionHeading>
        <CodeBlock
          lang="typescript"
          filename="app/dashboard/page.tsx"
          code={`'use client';
import { useAuth } from '@auth-saas/client/react';
import { redirect } from 'next/navigation';

export default function Dashboard() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) redirect('/login');

  return <h1>Hello, {user?.name ?? user?.email}</h1>;
}`}
        />

        <Callout variant="tip">
          Use <code>authFetch()</code> from <code>useAuthFetch()</code> for all authenticated API calls.
          It automatically attaches the JWT and retries with a refreshed token on 401.
        </Callout>
      </div>

      <OnThisPage items={toc} />
    </div>
  );
}
