import { PageHeader, SectionHeading, SubHeading, Callout, OnThisPage } from '@/components/docs/ui';

const toc = [
  { id: 'tenants',     title: 'Tenants' },
  { id: 'apps',        title: 'Apps' },
  { id: 'users',       title: 'Users' },
  { id: 'tokens',      title: 'Tokens' },
  { id: 'rbac',        title: 'RBAC' },
  { id: 'audit',       title: 'Audit log' },
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

        <SectionHeading id="tokens">Tokens</SectionHeading>
        <p>See the <a href="/docs/security">Security</a> page for the full token lifecycle.</p>

        <SectionHeading id="rbac">RBAC</SectionHeading>
        <p>
          AuthSaas includes a <strong>role-based access control</strong> system. Roles are assigned per user
          and included in the JWT payload as a <code>roles</code> array. Your application reads the roles
          from the token and enforces its own permission logic.
        </p>
        <Callout variant="note">
          Role management via API is on the roadmap. Currently manageable via the developer dashboard.
        </Callout>

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
