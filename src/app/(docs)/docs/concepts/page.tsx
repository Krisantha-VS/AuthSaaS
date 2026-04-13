import { PageHeader, SectionHeading, SubHeading, Callout, OnThisPage } from '@/components/docs/ui';
import { CodeBlock } from '@/components/docs/code-block';

const toc = [
  { id: 'tenants',      title: 'Tenants' },
  { id: 'apps',         title: 'Apps' },
  { id: 'users',        title: 'Users' },
  { id: 'tokens',       title: 'Tokens' },
  { id: 'oauth',        title: 'OAuth 2.0 + PKCE' },
  { id: 'email-verify', title: 'Email verification' },
  { id: 'rbac',         title: 'RBAC' },
  { id: 'roles',        title: 'Default roles',   depth: 3 },
  { id: 'permissions',  title: 'Permissions',     depth: 3 },
  { id: 'jwt-roles',    title: 'Roles in JWT',    depth: 3 },
  { id: 'audit',        title: 'Audit log' },
];

export default function ConceptsPage() {
  return (
    <div className="flex gap-12">
      <div className="flex-1 min-w-0 docs-prose">
        <PageHeader
          title="Core Concepts"
          description="Understand the data model and key abstractions before integrating."
        />

        <SectionHeading id="tenants">Tenants</SectionHeading>
        <p>
          A <strong>tenant</strong> is a developer account — you, registering to use AuthSaas for your projects.
          Tenant credentials are separate from end-user credentials. You log in to the tenant dashboard
          to manage your apps; your users log in to <em>your app</em> via the SDK.
        </p>
        <Callout variant="note">
          One email address = one tenant. A tenant can own multiple apps.
        </Callout>

        <SectionHeading id="apps">Apps</SectionHeading>
        <p>
          An <strong>app</strong> maps to one of your projects. Each app has:
        </p>
        <ul>
          <li><strong>clientId</strong> — public identifier, safe to include in frontend code</li>
          <li><strong>clientSecret</strong> — private, server-side only, hashed at rest</li>
          <li><strong>allowedOrigins</strong> — CORS whitelist</li>
          <li><strong>isActive</strong> — disable to immediately block all new auth for this app</li>
        </ul>

        <SectionHeading id="users">Users</SectionHeading>
        <p>
          <strong>Users</strong> are scoped per app — a user in <em>App A</em> is completely
          separate from a user with the same email in <em>App B</em>. There is no cross-app identity.
        </p>
        <p>
          Each user record includes: <code>id</code>, <code>email</code>, <code>emailVerified</code>,
          <code>createdAt</code>, and their assigned <code>roles</code> within the app.
        </p>

        <SectionHeading id="tokens">Tokens</SectionHeading>
        <p>
          Authentication returns an <strong>access token</strong> (15-minute JWT) and a{' '}
          <strong>refresh token</strong> (7-day JWT). The access token is sent with every API request;
          the refresh token is used only to obtain a new pair. See the{' '}
          <a href="/docs/security">Security</a> page for the full token lifecycle and rotation behaviour.
        </p>

        <SectionHeading id="oauth">OAuth 2.0 + PKCE</SectionHeading>
        <p>
          In addition to the direct <code>POST /auth/login</code> flow, AuthSaas supports the{' '}
          <strong>Authorization Code Flow with PKCE</strong>. Use it when you want a hosted
          login page (users never enter credentials in your app) or to enable SSO across multiple
          apps with a single sign-in session.
        </p>
        <p>
          The flow at a glance: your app generates a PKCE verifier/challenge pair, redirects the
          browser to <code>GET /api/v1/oauth/authorize</code>, the user logs in on the AuthSaas
          page, and AuthSaas redirects back to your <code>redirect_uri</code> with a short-lived
          authorization code. Your server exchanges the code for tokens via{' '}
          <code>POST /api/v1/oauth/token</code> (server-to-server only).
        </p>
        <Callout variant="note">
          See the full guide and code samples on the{' '}
          <a href="/docs/oauth">OAuth 2.0 + PKCE</a> page.
        </Callout>

        <SectionHeading id="email-verify">Email verification</SectionHeading>
        <p>
          When a user registers, AuthSaas automatically sends a verification email containing a
          time-limited link. The flow works as follows:
        </p>
        <ul>
          <li>
            <strong>GET /auth/verify?token=xxx&amp;email=xxx</strong> — validates the token and sets{' '}
            <code>emailVerified: true</code> on the user record.
          </li>
          <li>
            <strong>POST /auth/resend-verification</strong> — generates a fresh token and resends the
            email. This endpoint is rate-limited to prevent abuse.
          </li>
        </ul>
        <p>
          The <code>emailVerified</code> field is present on the user object and is also included in
          the JWT payload so your application can inspect it without an extra round-trip.
        </p>
        <Callout variant="note">
          Whether to require email verification before allowing login is configurable per your integration.
        </Callout>

        <SectionHeading id="rbac">RBAC</SectionHeading>
        <p>
          AuthSaas ships with a fully live <strong>role-based access control</strong> system. Three
          default roles — <code>owner</code>, <code>admin</code>, and <code>user</code> — are
          automatically created whenever you create a new app. New users are auto-assigned the{' '}
          <code>user</code> role on registration.
        </p>
        <p>
          Roles are <strong>per-app</strong> — they are completely isolated between your different
          projects. A user&apos;s <code>admin</code> role in App A has no effect in App B.
          Roles flow into the JWT <code>roles</code> array, which your application reads to gate
          features or protect routes.
        </p>

        <SubHeading id="roles">Default roles</SubHeading>
        <p>
          Each app is seeded with the following role hierarchy and permission assignments:
        </p>
        <CodeBlock lang="text" code={`Role    Permissions
user    read:profile, write:profile
admin   + read:users, write:users, read:audit, read:sessions
owner   + delete:users, read:roles, write:roles, delete:sessions`} />

        <SubHeading id="permissions">Permissions</SubHeading>
        <p>The full set of available permissions across all roles:</p>
        <ul>
          <li><code>read:profile</code></li>
          <li><code>write:profile</code></li>
          <li><code>read:users</code></li>
          <li><code>write:users</code></li>
          <li><code>delete:users</code></li>
          <li><code>read:roles</code></li>
          <li><code>write:roles</code></li>
          <li><code>read:audit</code></li>
          <li><code>read:sessions</code></li>
          <li><code>delete:sessions</code></li>
        </ul>

        <SubHeading id="jwt-roles">Roles in JWT</SubHeading>
        <p>
          The JWT access token payload contains a <code>roles</code> array. Read it in your
          application to enforce access control without any extra API call:
        </p>
        <CodeBlock lang="typescript" code={`// The JWT payload includes roles:
// { sub: "usr_xxx", email: "user@example.com", roles: ["admin"], appId: "app_xxx" }

// Check roles in your Next.js middleware:
import { verifyAccessToken } from '@/lib/auth';

export function middleware(req) {
  const token = req.headers.get('authorization')?.slice(7);
  const payload = verifyAccessToken(token);

  if (!payload.roles.includes('admin')) {
    return new Response('Forbidden', { status: 403 });
  }
}`} />

        <SectionHeading id="audit">Audit log</SectionHeading>
        <p>
          Every auth event (register, login, logout, refresh, reuse detection) is written to an
          append-only audit log. Queryable per app with pagination. Useful for security reviews and
          compliance requirements.
        </p>
      </div>
      <OnThisPage items={toc} />
    </div>
  );
}
