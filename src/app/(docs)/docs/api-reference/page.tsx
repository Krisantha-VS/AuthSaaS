import { PageHeader, SectionHeading, SubHeading, Endpoint, ParamTable, Callout, OnThisPage } from '@/components/docs/ui';
import { CodeBlock } from '@/components/docs/code-block';

const toc = [
  { id: 'base-url',         title: 'Base URL' },
  { id: 'authentication',   title: 'Authentication' },
  { id: 'auth-register',    title: 'POST /auth/register',   depth: 3 },
  { id: 'auth-login',       title: 'POST /auth/login',      depth: 3 },
  { id: 'auth-refresh',     title: 'POST /auth/refresh',    depth: 3 },
  { id: 'auth-logout',      title: 'POST /auth/logout',     depth: 3 },
  { id: 'tenant',           title: 'Tenant' },
  { id: 'tenant-register',  title: 'POST /tenant/register', depth: 3 },
  { id: 'tenant-login',     title: 'POST /tenant/login',    depth: 3 },
  { id: 'tenant-apps',      title: 'GET /tenant/apps',      depth: 3 },
  { id: 'tenant-apps-post', title: 'POST /tenant/apps',     depth: 3 },
  { id: 'tenant-rotate',    title: 'POST /tenant/apps/:id/rotate', depth: 3 },
  { id: 'errors',           title: 'Error codes' },
];

export default function ApiReferencePage() {
  return (
    <div className="flex gap-12">
      <div className="flex-1 min-w-0 docs-prose">
        <PageHeader
          title="API Reference"
          description="Full reference for all AuthSaas REST endpoints. All requests and responses use JSON."
        />

        <SectionHeading id="base-url">Base URL</SectionHeading>
        <CodeBlock lang="bash" code={`https://your-domain.com/api/v1`} />

        <SectionHeading id="authentication">Authentication Endpoints</SectionHeading>
        <p>These endpoints authenticate <strong>end users</strong> of your app. All require a valid <code>clientId</code>.</p>

        {/* Register */}
        <SubHeading id="auth-register">Register a user</SubHeading>
        <Endpoint method="POST" path="/auth/register" />
        <ParamTable params={[
          { name: 'clientId', type: 'string',        required: true,  description: 'Your app client ID' },
          { name: 'email',    type: 'string (email)', required: true,  description: 'User email address' },
          { name: 'password', type: 'string',        required: true,  description: 'Min 8 characters' },
          { name: 'name',     type: 'string',        required: false, description: 'Display name' },
        ]} />
        <CodeBlock lang="json" filename="Response · 201" code={`{
  "success": true,
  "data": {
    "user": { "id": "usr_xxx", "email": "user@example.com", "name": null, "roles": [], "emailVerified": false },
    "tokens": { "accessToken": "eyJ...", "refreshToken": "eyJ...", "expiresIn": 900 }
  }
}`} />

        {/* Login */}
        <SubHeading id="auth-login">Login</SubHeading>
        <Endpoint method="POST" path="/auth/login" />
        <ParamTable params={[
          { name: 'clientId', type: 'string',        required: true, description: 'Your app client ID' },
          { name: 'email',    type: 'string (email)', required: true, description: 'User email address' },
          { name: 'password', type: 'string',        required: true, description: 'User password' },
        ]} />
        <CodeBlock lang="json" filename="Response · 200" code={`{
  "success": true,
  "data": { "accessToken": "eyJ...", "refreshToken": "eyJ...", "expiresIn": 900 }
}`} />

        {/* Refresh */}
        <SubHeading id="auth-refresh">Refresh tokens</SubHeading>
        <Endpoint method="POST" path="/auth/refresh" />
        <p>Issues a new token pair. The submitted refresh token is immediately invalidated (rotation). Reuse detection revokes all user sessions.</p>
        <ParamTable params={[
          { name: 'refreshToken', type: 'string', required: false, description: 'Omit if using httpOnly cookie' },
        ]} />
        <CodeBlock lang="json" filename="Response · 200" code={`{
  "success": true,
  "data": { "accessToken": "eyJ...", "refreshToken": "eyJ...", "expiresIn": 900 }
}`} />
        <Callout variant="warning">
          Never store refresh tokens in <code>localStorage</code>. The SDK stores them in <code>sessionStorage</code> by default,
          or you can configure httpOnly cookie mode for maximum security.
        </Callout>

        {/* Logout */}
        <SubHeading id="auth-logout">Logout</SubHeading>
        <Endpoint method="POST" path="/auth/logout" />
        <p>Revokes <strong>all</strong> refresh tokens for the user. Requires a valid access token in the Authorization header.</p>
        <CodeBlock lang="bash" code={`curl -X POST /api/v1/auth/logout \\
  -H "Authorization: Bearer <access_token>"`} />

        {/* Tenant */}
        <SectionHeading id="tenant">Tenant Endpoints</SectionHeading>
        <p>These endpoints are for <strong>developers</strong> managing their apps. Protected routes require a tenant JWT.</p>

        <SubHeading id="tenant-register">Register as developer</SubHeading>
        <Endpoint method="POST" path="/tenant/register" />
        <ParamTable params={[
          { name: 'name',     type: 'string',        required: true, description: 'Your full name or company name' },
          { name: 'email',    type: 'string (email)', required: true, description: 'Developer email' },
          { name: 'password', type: 'string',        required: true, description: 'Min 8 characters' },
        ]} />

        <SubHeading id="tenant-login">Developer login</SubHeading>
        <Endpoint method="POST" path="/tenant/login" />

        <SubHeading id="tenant-apps">List apps</SubHeading>
        <Endpoint method="GET" path="/tenant/apps" description="Requires Bearer token" />

        <SubHeading id="tenant-apps-post">Create app</SubHeading>
        <Endpoint method="POST" path="/tenant/apps" description="Requires Bearer token" />
        <ParamTable params={[
          { name: 'name',           type: 'string',     required: true,  description: 'App name' },
          { name: 'description',    type: 'string',     required: false, description: 'Short description' },
          { name: 'allowedOrigins', type: 'string[]',   required: true,  description: 'CORS origins e.g. ["https://myapp.com"]' },
        ]} />
        <CodeBlock lang="json" filename="Response · 201" code={`{
  "success": true,
  "data": {
    "app": { "id": "app_xxx", "clientId": "client_xxx", "name": "My App", "isActive": true },
    "clientSecret": "sas_abc123def456..."
  }
}`} />
        <Callout variant="danger">
          <code>clientSecret</code> is returned <strong>once only</strong>. It is hashed server-side and cannot be recovered.
          Rotate via <code>POST /tenant/apps/:id/rotate</code> if lost.
        </Callout>

        <SubHeading id="tenant-rotate">Rotate client secret</SubHeading>
        <Endpoint method="POST" path="/tenant/apps/:id/rotate" description="Requires Bearer token" />
        <p>Invalidates the current secret and returns a new one. Existing app users are unaffected — only API calls using the old secret will fail.</p>

        {/* Error codes */}
        <SectionHeading id="errors">Error codes</SectionHeading>
        <p>All errors follow a consistent shape:</p>
        <CodeBlock lang="json" code={`{ "success": false, "error": "Human readable message", "code": "ERROR_CODE" }`} />

        <div className="overflow-x-auto rounded-lg border border-border my-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Code</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['INVALID_CLIENT',      '401', 'clientId not found or app is disabled'],
                ['EMAIL_TAKEN',         '409', 'Email already registered in this app'],
                ['INVALID_CREDENTIALS', '401', 'Wrong email or password'],
                ['ACCOUNT_DISABLED',    '403', 'User account has been deactivated'],
                ['INVALID_TOKEN',       '401', 'Token not found or already used'],
                ['TOKEN_REUSE',         '401', 'Refresh token reuse — all sessions revoked'],
                ['TOKEN_EXPIRED',       '401', 'Refresh token has expired'],
                ['UNAUTHORIZED',        '401', 'Missing or invalid Authorization header'],
                ['NOT_FOUND',           '404', 'Resource not found'],
                ['VALIDATION_ERROR',    '400', 'Request body failed validation'],
                ['INTERNAL_ERROR',      '500', 'Unexpected server error'],
              ].map(([code, status, meaning]) => (
                <tr key={code} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 font-mono text-violet-400 text-xs">{code}</td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground text-xs">{status}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <OnThisPage items={toc} />
    </div>
  );
}
