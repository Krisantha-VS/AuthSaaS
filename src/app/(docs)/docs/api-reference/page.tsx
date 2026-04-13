import { PageHeader, SectionHeading, SubHeading, Endpoint, ParamTable, Callout, OnThisPage } from '@/components/docs/ui';
import { CodeBlock } from '@/components/docs/code-block';

const toc = [
  { id: 'base-url',              title: 'Base URL' },
  { id: 'authentication',        title: 'Authentication' },
  { id: 'auth-register',         title: 'POST /auth/register',           depth: 3 },
  { id: 'auth-login',            title: 'POST /auth/login',              depth: 3 },
  { id: 'auth-refresh',          title: 'POST /auth/refresh',            depth: 3 },
  { id: 'auth-logout',           title: 'POST /auth/logout',             depth: 3 },
  { id: 'auth-verify',           title: 'GET /auth/verify',              depth: 3 },
  { id: 'auth-resend',           title: 'POST /auth/resend-verification', depth: 3 },
  { id: 'oauth',                 title: 'OAuth 2.0 + PKCE' },
  { id: 'oauth-authorize-get',   title: 'GET /oauth/authorize',          depth: 3 },
  { id: 'oauth-authorize-post',  title: 'POST /oauth/authorize',         depth: 3 },
  { id: 'oauth-token',           title: 'POST /oauth/token',             depth: 3 },
  { id: 'tenant',                title: 'Tenant' },
  { id: 'tenant-register',       title: 'POST /tenant/register',         depth: 3 },
  { id: 'tenant-login',          title: 'POST /tenant/login',            depth: 3 },
  { id: 'tenant-apps',           title: 'GET /tenant/apps',              depth: 3 },
  { id: 'tenant-apps-post',      title: 'POST /tenant/apps',             depth: 3 },
  { id: 'tenant-rotate',         title: 'POST /tenant/apps/:id/rotate',  depth: 3 },
  { id: 'users',                 title: 'User Management' },
  { id: 'users-list',            title: 'GET /users',                    depth: 3 },
  { id: 'users-status',          title: 'PATCH /users/:id',              depth: 3 },
  { id: 'users-roles',           title: 'PUT /users/:id/roles',          depth: 3 },
  { id: 'roles',                 title: 'Role Management' },
  { id: 'roles-list',            title: 'GET /roles',                    depth: 3 },
  { id: 'roles-create',          title: 'POST /roles',                   depth: 3 },
  { id: 'roles-permissions',     title: 'PUT /roles/:id/permissions',    depth: 3 },
  { id: 'errors',                title: 'Error codes' },
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

        {/* Verify email */}
        <SubHeading id="auth-verify">Verify email</SubHeading>
        <Endpoint method="GET" path="/auth/verify" />
        <p>Verifies a user's email address using the token sent in the verification email. Called automatically when the user clicks the link in their inbox.</p>
        <ParamTable params={[
          { name: 'token', type: 'string (query)', required: true, description: 'Verification token from email link' },
          { name: 'email', type: 'string (query)', required: true, description: 'User email address' },
        ]} />
        <CodeBlock lang="json" filename="Response · 200" code={`{
  "success": true,
  "data": { "message": "Email verified successfully." }
}`} />

        {/* Resend verification */}
        <SubHeading id="auth-resend">Resend verification email</SubHeading>
        <Endpoint method="POST" path="/auth/resend-verification" />
        <p>Re-sends the verification email. Rate-limited to 3 requests per 15 minutes per IP.</p>
        <ParamTable params={[
          { name: 'clientId', type: 'string', required: true, description: 'Your app client ID' },
          { name: 'email',    type: 'string', required: true, description: 'User email address' },
        ]} />
        <Callout variant="note">
          Generating a new token invalidates the previous one.
        </Callout>

        {/* OAuth */}
        <SectionHeading id="oauth">OAuth 2.0 + PKCE</SectionHeading>
        <p>
          Redirect-based authentication flow. See the <a href="/docs/oauth">OAuth guide</a> for
          the full integration walkthrough.
        </p>

        <SubHeading id="oauth-authorize-get">Start authorization</SubHeading>
        <Endpoint method="GET" path="/oauth/authorize" />
        <p>Validates OAuth parameters and redirects to the hosted login page. Triggered by a browser redirect from your app — <strong>not</strong> via <code>fetch</code>.</p>
        <ParamTable params={[
          { name: 'client_id',             type: 'string (query)', required: true,  description: 'Your app clientId' },
          { name: 'redirect_uri',          type: 'string (query)', required: true,  description: 'Must start with an allowedOrigin for the app' },
          { name: 'response_type',         type: 'string (query)', required: true,  description: 'Must be "code"' },
          { name: 'code_challenge',        type: 'string (query)', required: true,  description: 'BASE64URL(SHA256(code_verifier))' },
          { name: 'code_challenge_method', type: 'string (query)', required: true,  description: 'Must be "S256"' },
          { name: 'state',                 type: 'string (query)', required: true,  description: 'Random CSRF token — echoed back to redirect_uri' },
        ]} />
        <CodeBlock lang="text" filename="Success" code={`302 → /oauth/login?client_id=...&redirect_uri=...&code_challenge=...&state=...`} />

        <SubHeading id="oauth-authorize-post">Submit credentials (hosted form only)</SubHeading>
        <Endpoint method="POST" path="/oauth/authorize" />
        <p>Called by the AuthSaas-hosted login form after the user enters their credentials. On success returns a JSON redirect URL — the form navigates via <code>window.location.href</code>.</p>
        <ParamTable params={[
          { name: 'client_id',             type: 'string', required: true, description: 'Your app clientId' },
          { name: 'email',                 type: 'string', required: true, description: 'User email' },
          { name: 'password',              type: 'string', required: true, description: 'User password' },
          { name: 'code_challenge',        type: 'string', required: true, description: 'BASE64URL(SHA256(code_verifier))' },
          { name: 'code_challenge_method', type: 'string', required: true, description: 'Must be "S256"' },
          { name: 'redirect_uri',          type: 'string', required: true, description: 'Must match allowedOrigin' },
          { name: 'state',                 type: 'string', required: true, description: 'CSRF token from step 1' },
        ]} />
        <CodeBlock lang="json" filename="Response · 200" code={`{
  "success": true,
  "data": { "redirectTo": "https://your-app.com/api/auth/callback?code=xxx&state=xxx" }
}`} />

        <SubHeading id="oauth-token">Exchange code for tokens</SubHeading>
        <Endpoint method="POST" path="/oauth/token" />
        <p><strong>Server-to-server only.</strong> No CORS headers — never call from a browser. Exchanges the authorization code for access and refresh tokens.</p>
        <ParamTable params={[
          { name: 'grant_type',    type: 'string', required: true, description: 'Must be "authorization_code"' },
          { name: 'code',          type: 'string', required: true, description: 'Authorization code from callback' },
          { name: 'client_id',     type: 'string', required: true, description: 'Your app clientId' },
          { name: 'code_verifier', type: 'string', required: true, description: 'The original random verifier from step 1' },
          { name: 'redirect_uri',  type: 'string', required: true, description: 'Must exactly match the value used in step 1' },
        ]} />
        <CodeBlock lang="json" filename="Response · 200" code={`{
  "success": true,
  "data": {
    "access_token":  "eyJ...",
    "refresh_token": "eyJ...",
    "token_type":    "Bearer",
    "expires_in":    900
  }
}`} />
        <Callout variant="note">
          Authorization codes expire in <strong>10 minutes</strong> and are single-use.
          A replayed code returns <code>INVALID_GRANT</code>.
        </Callout>

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
          { name: 'name',           type: 'string',   required: true,  description: 'App name' },
          { name: 'description',    type: 'string',   required: false, description: 'Short description' },
          { name: 'allowedOrigins', type: 'string[]', required: true,  description: 'CORS origins e.g. ["https://myapp.com"]' },
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

        {/* User Management */}
        <SectionHeading id="users">User Management</SectionHeading>
        <p>Manage users within a specific app. All endpoints require a <strong>tenant Bearer token</strong> and an <code>appId</code> parameter scoped to the authenticated tenant.</p>

        <SubHeading id="users-list">List users</SubHeading>
        <Endpoint method="GET" path="/users?appId=xxx" description="Requires tenant Bearer token" />
        <CodeBlock lang="json" filename="Response · 200" code={`{
  "success": true,
  "data": [
    {
      "id": "usr_xxx",
      "email": "user@example.com",
      "name": "Jane Doe",
      "emailVerified": true,
      "isActive": true,
      "roles": ["user"],
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}`} />

        <SubHeading id="users-status">Toggle user status</SubHeading>
        <Endpoint method="PATCH" path="/users/:userId" description="Requires tenant Bearer token" />
        <p>Toggles the <code>isActive</code> flag for the specified user. Deactivated users cannot log in and will receive an <code>ACCOUNT_DISABLED</code> error.</p>
        <ParamTable params={[
          { name: 'appId', type: 'string', required: true, description: 'App ID scoped to the authenticated tenant' },
        ]} />

        <SubHeading id="users-roles">Set user roles</SubHeading>
        <Endpoint method="PUT" path="/users/:userId/roles" description="Requires tenant Bearer token" />
        <p>Replaces <strong>all</strong> current roles for the user in this app with the given array.</p>
        <ParamTable params={[
          { name: 'appId', type: 'string',   required: true, description: 'App ID scoped to the authenticated tenant' },
          { name: 'roles', type: 'string[]', required: true, description: 'Complete desired roles array for this user' },
        ]} />
        <Callout variant="warning">
          This is a full replace, not a merge. Pass the complete desired roles array.
          Pass an empty array <code>[]</code> to remove all roles.
        </Callout>

        {/* Role Management */}
        <SectionHeading id="roles">Role Management</SectionHeading>
        <p>Three default roles are created automatically for every new app: <code>owner</code>, <code>admin</code>, and <code>user</code>. You can create additional custom roles.</p>

        <div className="overflow-x-auto rounded-lg border border-border my-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Role</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Permissions</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['user',  'read:profile, write:profile'],
                ['admin', '+ read:users, write:users, read:audit, read:sessions'],
                ['owner', '+ delete:users, read:roles, write:roles, delete:sessions'],
              ].map(([role, perms]) => (
                <tr key={role} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 font-mono text-violet-400 text-xs">{role}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{perms}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SubHeading id="roles-list">List roles</SubHeading>
        <Endpoint method="GET" path="/roles?appId=xxx" description="Requires tenant Bearer token" />
        <CodeBlock lang="json" filename="Response · 200" code={`{
  "success": true,
  "data": [
    {
      "id": "role_xxx",
      "name": "editor",
      "description": "Can read and write content",
      "permissions": ["read:profile", "write:profile", "read:users"],
      "userCount": 12
    }
  ]
}`} />

        <SubHeading id="roles-create">Create role</SubHeading>
        <Endpoint method="POST" path="/roles" description="Requires tenant Bearer token" />
        <ParamTable params={[
          { name: 'appId',       type: 'string',   required: true,  description: 'App ID scoped to the authenticated tenant' },
          { name: 'name',        type: 'string',   required: true,  description: 'Role name (min 2 characters)' },
          { name: 'description', type: 'string',   required: false, description: 'Short description of the role' },
          { name: 'permissions', type: 'string[]', required: false, description: 'Initial permissions e.g. ["read:users","write:users"]' },
        ]} />
        <CodeBlock lang="json" filename="Response · 201" code={`{
  "success": true,
  "data": { "id": "role_xxx", "name": "editor", "permissions": [], "userCount": 0 }
}`} />

        <SubHeading id="roles-permissions">Update role permissions</SubHeading>
        <Endpoint method="PUT" path="/roles/:roleId/permissions" description="Requires tenant Bearer token" />
        <p>Full replace of permissions for the role. Available permission strings:</p>
        <CodeBlock lang="text" code={`read:profile    write:profile
read:users      write:users     delete:users
read:roles      write:roles
read:audit
read:sessions   delete:sessions`} />
        <ParamTable params={[
          { name: 'appId',       type: 'string',   required: true, description: 'App ID scoped to the authenticated tenant' },
          { name: 'permissions', type: 'string[]', required: true, description: 'Complete desired permissions array for this role' },
        ]} />

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
                ['ALREADY_VERIFIED',    '409', 'Email already verified'],
                ['EMAIL_NOT_VERIFIED',  '403', 'Email not yet verified'],
                ['RATE_LIMITED',        '429', 'Too many requests, see Retry-After header'],
                ['ROLE_NOT_FOUND',      '404', 'Role not found'],
                ['ROLE_EXISTS',         '409', 'Role name already exists in this app'],
                ['FORBIDDEN',           '403', 'Insufficient role for this operation'],
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
