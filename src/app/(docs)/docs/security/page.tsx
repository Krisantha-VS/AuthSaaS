import { PageHeader, SectionHeading, SubHeading, Callout, OnThisPage } from '@/components/docs/ui';
import { CodeBlock } from '@/components/docs/code-block';

const toc = [
  { id: 'token-lifecycle',     title: 'Token lifecycle' },
  { id: 'rotation',            title: 'Refresh token rotation' },
  { id: 'reuse-detection',     title: 'Reuse detection' },
  { id: 'storage',             title: 'Token storage' },
  { id: 'passwords',           title: 'Password hashing' },
  { id: 'audit-log',           title: 'Audit log' },
  { id: 'best-practices',      title: 'Best practices' },
  { id: 'email-verification',  title: 'Email verification' },
  { id: 'rate-limiting',       title: 'Rate limiting' },
  { id: 'cors',                title: 'CORS enforcement' },
  { id: 'password-policy',     title: 'Password policy' },
  { id: 'security-headers',    title: 'Security headers' },
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

        <SubHeading id="bp-alg">JWT algorithm pinning</SubHeading>
        <p>
          AuthSaas explicitly pins <strong>HS256</strong> on both sign and verify — rejecting tokens
          with <code>alg: none</code> or any other algorithm.
        </p>

        <SectionHeading id="email-verification">Email verification</SectionHeading>
        <p>
          Verification tokens are generated with <code>crypto.randomBytes(32)</code> — 256 bits of
          entropy. Only the <strong>SHA-256 hash</strong> of the token is stored in the database;
          the raw token is never persisted. This means a database breach cannot be used to craft
          valid verification links.
        </p>
        <ul>
          <li>Links expire in <strong>24 hours</strong></li>
          <li>Resend is rate-limited to <strong>3 requests per 15 minutes per IP</strong></li>
        </ul>

        <SectionHeading id="rate-limiting">Rate limiting</SectionHeading>
        <p>AuthSaas enforces per-IP rate limits on sensitive auth endpoints:</p>
        <ul>
          <li><strong>Login</strong> — 10 attempts per 15 minutes per IP. Exceeding the limit returns 429 with a <code>Retry-After</code> header.</li>
          <li><strong>Register</strong> — 5 attempts per hour per IP.</li>
          <li><strong>Resend verification</strong> — 3 per 15 minutes per IP.</li>
        </ul>
        <CodeBlock lang="json" code={`// 429 response body
{
  "success": false,
  "error": "Too many login attempts. Try again later.",
  "code": "RATE_LIMITED"
}

// 429 response headers
Retry-After: 847`} />
        <Callout variant="note">
          The current implementation is per-instance (in-process memory). For distributed or serverless
          deployments, upgrade to Upstash Redis for accurate cross-instance rate limiting.
        </Callout>

        <SectionHeading id="cors">CORS enforcement</SectionHeading>
        <p>
          All <code>/auth/login</code> and <code>/auth/register</code> requests that include an{' '}
          <code>Origin</code> header are validated against the app&apos;s <code>allowedOrigins</code>{' '}
          list. Requests without an <code>Origin</code> header (server-side SDK calls) are always
          allowed through without origin validation.
        </p>
        <ul>
          <li>Preflight <code>OPTIONS</code> requests are handled automatically.</li>
          <li>CORS headers are only set when the origin is whitelisted — there is no wildcard <code>*</code> fallback.</li>
        </ul>
        <Callout variant="warning">
          Always set <code>allowedOrigins</code> to your exact production domains.{' '}
          <code>localhost</code> is fine for development.
        </Callout>

        <SectionHeading id="password-policy">Password policy</SectionHeading>
        <p>Passwords must satisfy all four rules:</p>
        <ul>
          <li>Minimum <strong>8 characters</strong>, maximum <strong>128 characters</strong></li>
          <li>At least one <strong>uppercase letter</strong> (A–Z)</li>
          <li>At least one <strong>number</strong> (0–9)</li>
          <li>At least one <strong>special character</strong> (!@#$%…)</li>
        </ul>
        <CodeBlock lang="typescript" code={`const passwordSchema = z.string()
  .min(8).max(128)
  .regex(/[A-Z]/, 'Needs uppercase')
  .regex(/[0-9]/, 'Needs a number')
  .regex(/[^A-Za-z0-9]/, 'Needs a special character');`} />

        <SectionHeading id="security-headers">Security headers</SectionHeading>
        <p>AuthSaas sets the following headers on every response:</p>
        <CodeBlock lang="text" code={`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()`} />
      </div>

      <OnThisPage items={toc} />
    </div>
  );
}
