import { PageHeader, SectionHeading, SubHeading, Callout, OnThisPage } from '@/components/docs/ui';
import { CodeBlock } from '@/components/docs/code-block';

const toc = [
  { id: 'install',        title: 'Installation' },
  { id: 'auth-client',    title: 'AuthClient' },
  { id: 'auth-provider',  title: 'AuthProvider' },
  { id: 'use-auth',       title: 'useAuth()' },
  { id: 'use-auth-fetch', title: 'useAuthFetch()' },
  { id: 'events',         title: 'Events' },
  { id: 'typescript',     title: 'TypeScript types' },
  { id: 'csharp',         title: 'C# SDK', },
];

export default function SdkJsPage() {
  return (
    <div className="flex gap-12">
      <div className="flex-1 min-w-0 docs-prose">
        <PageHeader
          title="JavaScript / React SDK"
          description="Type-safe authentication for Next.js and React applications. Zero dependencies beyond React."
        />

        <SectionHeading id="install">Installation</SectionHeading>
        <CodeBlock lang="bash" code={`npm install @auth-saas/client`} />

        <SectionHeading id="auth-client">AuthClient</SectionHeading>
        <p>The core client class. Create one instance per app and share it via <code>AuthProvider</code>.</p>
        <CodeBlock lang="typescript" code={`import { AuthClient } from '@auth-saas/client';

const authClient = new AuthClient({
  clientId: process.env.NEXT_PUBLIC_AUTH_CLIENT_ID!, // required
  baseUrl:  'https://your-domain.com/api/v1',        // optional, defaults to /api/v1
});`} />

        <div className="overflow-x-auto rounded-lg border border-border my-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Method</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Returns</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['register(params)',    'Promise<AuthSession>', 'Register + auto sign in'],
                ['login(params)',       'Promise<AuthSession>', 'Sign in user'],
                ['logout()',            'Promise<void>',        'Revoke all sessions'],
                ['refreshTokens()',     'Promise<AuthTokens>',  'Manual token refresh (deduped)'],
                ['authFetch(url, init)','Promise<Response>',    'Fetch with auto JWT + refresh'],
                ['getSession()',        'AuthSession | null',   'Current session'],
                ['getUser()',           'AuthUser | null',      'Current user'],
                ['isAuthenticated()',   'boolean',              'True if session not expired'],
                ['on(event, fn)',       '() => void',           'Subscribe to auth events'],
              ].map(([method, returns, description]) => (
                <tr key={method} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 font-mono text-violet-400 text-xs">{method}</td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground text-xs">{returns}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionHeading id="auth-provider">AuthProvider</SectionHeading>
        <p>Wrap your app (or a subtree) with <code>AuthProvider</code> to make auth available via hooks.</p>
        <CodeBlock lang="typescript" filename="app/layout.tsx" code={`import { AuthProvider } from '@auth-saas/client/react';
import { authClient } from '@/lib/auth-client'; // your singleton

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
}`} />

        <SectionHeading id="use-auth">useAuth()</SectionHeading>
        <p>Access auth state and actions anywhere inside <code>AuthProvider</code>.</p>
        <CodeBlock lang="typescript" code={`import { useAuth } from '@auth-saas/client/react';

const {
  user,            // AuthUser | null
  session,         // AuthSession | null
  isAuthenticated, // boolean
  isLoading,       // boolean — true during login/register/logout
  login,           // (params: LoginParams) => Promise<void>
  register,        // (params: RegisterParams) => Promise<void>
  logout,          // () => Promise<void>
  client,          // AuthClient — direct access if needed
} = useAuth();`} />

        <CodeBlock lang="typescript" filename="Full example" code={`'use client';
import { useAuth } from '@auth-saas/client/react';
import { useState } from 'react';

export function AuthForm() {
  const { login, register, logout, user, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (user) {
    return (
      <div>
        <p>Signed in as {user.email}</p>
        <button onClick={logout}>Sign out</button>
      </div>
    );
  }

  return (
    <form onSubmit={e => { e.preventDefault(); login({ email, password }); }}>
      <input value={email}    onChange={e => setEmail(e.target.value)}    placeholder="Email" />
      <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" />
      <button type="submit" disabled={isLoading}>Sign in</button>
    </form>
  );
}`} />

        <SectionHeading id="use-auth-fetch">useAuthFetch()</SectionHeading>
        <p>A <code>fetch</code> wrapper that automatically attaches the JWT and handles token refresh transparently.</p>
        <CodeBlock lang="typescript" code={`import { useAuthFetch } from '@auth-saas/client/react';

function MyComponent() {
  const authFetch = useAuthFetch();

  async function loadData() {
    // JWT is attached automatically.
    // On 401, token is refreshed and the request is retried once.
    const res = await authFetch('/api/my-protected-endpoint');
    const data = await res.json();
  }
}`} />

        <SectionHeading id="events">Events</SectionHeading>
        <p>Subscribe to auth lifecycle events via <code>client.on()</code>. Unsubscribe by calling the returned function.</p>
        <CodeBlock lang="typescript" code={`const unsubscribe = authClient.on('sessionExpired', () => {
  // Redirect to login, show toast, etc.
  toast.error('Your session has expired. Please sign in again.');
  router.push('/login');
});

// Clean up
unsubscribe();`} />

        <div className="overflow-x-auto rounded-lg border border-border my-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Event</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Payload</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Fired when</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['signedIn',       'AuthSession', 'Successful login or register'],
                ['signedOut',      'null',        'logout() called'],
                ['tokenRefreshed', 'AuthSession', 'Access token silently refreshed'],
                ['sessionExpired', 'null',        'Refresh failed — user must re-authenticate'],
              ].map(([event, payload, when]) => (
                <tr key={event} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 font-mono text-violet-400 text-xs">{event}</td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground text-xs">{payload}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SectionHeading id="typescript">TypeScript types</SectionHeading>
        <CodeBlock lang="typescript" code={`import type {
  AuthConfig,    // { clientId: string; baseUrl?: string }
  AuthSession,   // { user, tokens, expiresAt }
  AuthUser,      // { id, email, name, roles, emailVerified }
  AuthTokens,    // { accessToken, refreshToken, expiresIn }
  AuthEvent,     // 'signedIn' | 'signedOut' | 'tokenRefreshed' | 'sessionExpired'
  LoginParams,   // { email, password }
  RegisterParams // { email, password, name? }
} from '@auth-saas/client';`} />

        <SectionHeading id="csharp">C# SDK</SectionHeading>
        <Callout variant="note">
          The C# / Blazor SDK is in development. It will be published as a NuGet package with full ASP.NET Core
          DI integration and <code>[Authorize]</code> attribute support. Check back soon.
        </Callout>
      </div>

      <OnThisPage items={toc} />
    </div>
  );
}
