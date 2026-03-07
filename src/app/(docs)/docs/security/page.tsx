import { PageHeader, SectionHeading, SubHeading, Callout, OnThisPage } from '@/components/docs/ui';
import { CodeBlock } from '@/components/docs/code-block';

const toc = [
  { id: 'token-lifecycle',  title: 'Token lifecycle' },
  { id: 'rotation',         title: 'Refresh token rotation' },
  { id: 'reuse-detection',  title: 'Reuse detection' },
  { id: 'storage',          title: 'Token storage' },
  { id: 'passwords',        title: 'Password hashing' },
  { id: 'audit-log',        title: 'Audit log' },
  { id: 'best-practices',   title: 'Best practices' },
];

export default function SecurityPage() {
  return (
    <div className="flex gap-12">
      <div className="flex-1 min-w-0 docs-prose">
        <PageHeader
          title="Security"
          description="How AuthSaas handles tokens, passwords, and security events."
        />

        <SectionHeading id="token-lifecycle">Token lifecycle</SectionHeading>
        <p>Every authentication returns two tokens:</p>
        <CodeBlock lang="text" code={`┌─────────────────────────────────────────────────┐
│              AuthSaas Token Flow                │
├─────────────────────────────────────────────────┤
│                                                 │
│  login()                                        │
│    │                                            │
│    ├─ access_token  (JWT, 15 min)  ──► API      │
│    └─ refresh_token (JWT, 7 days)               │
│              │                                  │
│              └─ /auth/refresh ──► new pair      │
│                   │                             │
│                   └─ old refresh token REVOKED  │
│                                                 │
└─────────────────────────────────────────────────┘`} />

        <ul>
          <li><strong>Access token</strong> — signed JWT, expires in 15 minutes. Sent in every API request as <code>Authorization: Bearer &lt;token&gt;</code>.</li>
          <li><strong>Refresh token</strong> — signed JWT, expires in 7 days. Used only to get a new token pair. Never sent to API endpoints.</li>
        </ul>

        <SectionHeading id="rotation">Refresh token rotation</SectionHeading>
        <p>
          AuthSaas uses <strong>single-use refresh token rotation</strong>. Every call to <code>/auth/refresh</code>{' '}
          invalidates the submitted token and issues a new pair. This means a stolen refresh token can only be
          used once — after which it&apos;s invalidated.
        </p>
        <CodeBlock lang="typescript" code={`// The SDK handles this automatically.
// Manual rotation if needed:
const tokens = await authClient.refreshTokens();`} />

        <SectionHeading id="reuse-detection">Reuse detection</SectionHeading>
        <p>
          If a refresh token that has already been used is submitted again, AuthSaas detects the reuse and
          <strong> immediately revokes all refresh tokens for that user</strong>. This forces a full re-login
          and limits the blast radius of a token theft.
        </p>
        <Callout variant="danger">
          On <code>TOKEN_REUSE</code>, all user sessions are terminated. The user will need to log in again.
          This is by design — it indicates a potential token theft.
        </Callout>

        <SectionHeading id="storage">Token storage</SectionHeading>
        <p>The SDK stores tokens in <code>sessionStorage</code> by default:</p>
        <ul>
          <li>Access token — in memory (via React state), never written to persistent storage</li>
          <li>Refresh token — in <code>sessionStorage</code> (cleared when tab closes)</li>
        </ul>
        <Callout variant="warning">
          Never store tokens in <code>localStorage</code> — they persist across sessions and are accessible
          to any JavaScript on the page. If you need persistent sessions,
          use the httpOnly cookie mode (contact for configuration).
        </Callout>

        <SectionHeading id="passwords">Password hashing</SectionHeading>
        <p>
          All passwords are hashed using <strong>bcrypt with a cost factor of 12</strong> before storage.
          Plain-text passwords are never logged or stored at any point.
        </p>
        <CodeBlock lang="typescript" code={`// Equivalent to what AuthSaas does server-side:
import bcrypt from 'bcryptjs';
const hash = await bcrypt.hash(password, 12); // ~400ms per hash`} />

        <SectionHeading id="audit-log">Audit log</SectionHeading>
        <p>Every auth event is written to an immutable audit log with:</p>
        <ul>
          <li>Event type (<code>register</code>, <code>login</code>, <code>logout</code>, <code>token_refresh</code>)</li>
          <li>User ID, app ID, tenant ID</li>
          <li>IP address</li>
          <li>Timestamp</li>
        </ul>
        <p>Audit logs are queryable per app from the developer dashboard.</p>

        <SectionHeading id="best-practices">Best practices</SectionHeading>
        <SubHeading id="bp-origins">Restrict allowed origins</SubHeading>
        <p>
          When creating an app, set <code>allowedOrigins</code> to only the domains that will use the
          <code>clientId</code>. This prevents other sites from registering users under your app.
        </p>
        <CodeBlock lang="json" code={`{
  "allowedOrigins": [
    "https://myapp.com",
    "https://www.myapp.com"
  ]
}`} />

        <SubHeading id="bp-secret">Protect your clientSecret</SubHeading>
        <p>
          The <code>clientSecret</code> is only needed for server-to-server calls. Never expose it in
          client-side code. Store it only in environment variables on your server.
        </p>

        <SubHeading id="bp-https">Always use HTTPS</SubHeading>
        <p>
          Never send tokens over plain HTTP. All AuthSaas endpoints enforce HTTPS in production.
          Your app should do the same.
        </p>
      </div>

      <OnThisPage items={toc} />
    </div>
  );
}
