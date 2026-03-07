import { PageHeader, SectionHeading, SubHeading, Callout, OnThisPage } from '@/components/docs/ui';
import { CodeBlock } from '@/components/docs/code-block';

const toc = [
  { id: 'overview',      title: 'Overview' },
  { id: 'default-roles', title: 'Default roles' },
  { id: 'permissions',   title: 'Permissions catalog' },
  { id: 'assign-roles',  title: 'Assigning roles' },
  { id: 'check-roles',   title: 'Checking roles' },
  { id: 'custom-roles',  title: 'Custom roles' },
  { id: 'jwt-claims',    title: 'JWT claims' },
];

export default function RbacPage() {
  return (
    <div className="flex gap-12">
      <div className="flex-1 min-w-0 docs-prose">
        <PageHeader
          title="RBAC & Permissions"
          description="Role-based access control in AuthSaas — how roles work, how to assign them, and how to enforce them in your app."
        />

        <SectionHeading id="overview">Overview</SectionHeading>
        <p>
          AuthSaas ships with a fully live role-based access control system. Key properties:
        </p>
        <ul>
          <li>Roles are <strong>per-app</strong> (scoped to a <code>TenantApp</code>) — completely isolated between your different projects.</li>
          <li>Three default roles are <strong>auto-seeded</strong> every time you create an app: <code>owner</code>, <code>admin</code>, and <code>user</code>.</li>
          <li>New users are automatically assigned the <code>user</code> role on registration.</li>
          <li>Roles are included in the JWT <code>roles</code> array — read them in your app to gate features without an extra API call.</li>
        </ul>

        <SectionHeading id="default-roles">Default roles</SectionHeading>
        <p>
          The following roles and permission sets are created automatically for every new app:
        </p>
        <CodeBlock lang="text" code={`Role    Permissions
user    read:profile, write:profile
admin   + read:users, write:users, read:audit, read:sessions
owner   + delete:users, read:roles, write:roles, delete:sessions`} />
        <p>
          The <code>+</code> notation means the role inherits all permissions from the role above it
          plus the listed additions.
        </p>

        <SectionHeading id="permissions">Permissions catalog</SectionHeading>
        <p>All 10 available permissions and what they grant:</p>
        <ul>
          <li><code>read:profile</code> — View own profile</li>
          <li><code>write:profile</code> — Edit own profile</li>
          <li><code>read:users</code> — List and view users</li>
          <li><code>write:users</code> — Create and update users</li>
          <li><code>delete:users</code> — Delete users</li>
          <li><code>read:roles</code> — View roles and permissions</li>
          <li><code>write:roles</code> — Create and update roles</li>
          <li><code>read:audit</code> — View audit logs</li>
          <li><code>read:sessions</code> — View active sessions</li>
          <li><code>delete:sessions</code> — Revoke sessions</li>
        </ul>

        <SectionHeading id="assign-roles">Assigning roles</SectionHeading>
        <p>
          New users automatically receive the <code>user</code> role when they register. To assign a
          different role — or add additional roles — use the dashboard UI or call the API directly:
        </p>
        <CodeBlock lang="typescript" code={`// Assign roles to a user via the API
const response = await fetch(\`/users/\${userId}/roles\`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${accessToken}\`,
  },
  body: JSON.stringify({ roles: ['admin'] }),
});

const { user } = await response.json();
console.log(user.roles); // ['admin']`} />

        <SectionHeading id="check-roles">Checking roles</SectionHeading>
        <p>
          Read the <code>roles</code> array from the decoded JWT payload to enforce access control
          in your application:
        </p>
        <CodeBlock lang="typescript" code={`// Decode the access token in your API route
const payload = verifyAccessToken(req.headers.authorization.slice(7));
// payload.roles = ['admin']

// Gate a feature
if (!payload.roles.includes('admin')) {
  return Response.json({ error: 'Forbidden' }, { status: 403 });
}`} />
        <Callout variant="note">
          Roles in JWT reflect the state at login time. For real-time role changes, call{' '}
          <code>/auth/refresh</code> to get a new token pair.
        </Callout>

        <SectionHeading id="custom-roles">Custom roles</SectionHeading>
        <p>
          You can create custom roles beyond the three defaults. First create the role, then assign
          permissions to it:
        </p>
        <CodeBlock lang="typescript" code={`// 1. Create a custom role
const roleRes = await fetch('/roles', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${accessToken}\`,
  },
  body: JSON.stringify({ name: 'moderator' }),
});
const { role } = await roleRes.json();

// 2. Assign permissions to the new role
await fetch(\`/roles/\${role.id}/permissions\`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${accessToken}\`,
  },
  body: JSON.stringify({
    permissions: ['read:users', 'read:audit'],
  }),
});`} />
        <Callout variant="note">
          Custom role names are case-sensitive and must be unique per app.
        </Callout>

        <SectionHeading id="jwt-claims">JWT claims</SectionHeading>
        <p>
          The full decoded access token payload — all claims your application can rely on:
        </p>
        <CodeBlock lang="json" code={`{
  "sub": "usr_clxxxxxxxxxxxxxxxx",
  "email": "user@example.com",
  "appId": "app_clxxxxxxxxxxxxxxxx",
  "roles": ["admin"],
  "iat": 1709812345,
  "exp": 1709813245
}`} />
      </div>
      <OnThisPage items={toc} />
    </div>
  );
}
