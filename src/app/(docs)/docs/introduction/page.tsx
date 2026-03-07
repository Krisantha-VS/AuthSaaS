import { PageHeader, SectionHeading, SubHeading, Callout, OnThisPage } from '@/components/docs/ui';
import { CodeBlock } from '@/components/docs/code-block';

const toc = [
  { id: 'what-is-authsaas', title: 'What is AuthSaas?' },
  { id: 'how-it-works',     title: 'How it works' },
  { id: 'key-concepts',     title: 'Key concepts' },
  { id: 'next-steps',       title: 'Next steps' },
];

export default function IntroductionPage() {
  return (
    <div className="flex gap-12">
      <div className="flex-1 min-w-0 docs-prose">
        <PageHeader
          badge="v1 · Stable"
          title="Introduction"
          description="AuthSaas is a multi-tenant authentication service. Add secure sign-in to any project with a single clientId and a lightweight SDK."
        />

        <SectionHeading id="what-is-authsaas">What is AuthSaas?</SectionHeading>
        <p>
          AuthSaas provides authentication as a service — register as a developer, create an app, and use the
          issued <code>clientId</code> to authenticate users from your project. Your users are scoped to your
          app and isolated from all other tenants.
        </p>
        <p>
          It handles the hard parts: <strong>JWT access tokens</strong>, <strong>refresh token rotation</strong>,
          <strong>bcrypt password hashing</strong>, <strong>email verification</strong>,
          <strong>audit logging</strong>, and <strong>RBAC</strong> — so you don't have to.
        </p>

        <SectionHeading id="how-it-works">How it works</SectionHeading>
        <ol>
          <li><strong>Register</strong> as a developer at <code>/docs/quickstart</code>.</li>
          <li><strong>Create an app</strong> — you receive a <code>clientId</code> and a <code>clientSecret</code> (shown once).</li>
          <li><strong>Install the SDK</strong> in your project and pass the <code>clientId</code>.</li>
          <li><strong>Call <code>login()</code> or <code>register()</code></strong> — the SDK handles token storage and refresh automatically.</li>
        </ol>

        <Callout variant="note">
          The <code>clientSecret</code> is only shown once at creation. Store it securely — if lost, rotate via the dashboard.
        </Callout>

        <SectionHeading id="key-concepts">Key concepts</SectionHeading>

        <SubHeading id="tenants">Tenants</SubHeading>
        <p>
          A <strong>tenant</strong> is a developer account. Each tenant can create multiple apps. Tenant credentials
          authenticate you to the developer dashboard — not to your own apps.
        </p>

        <SubHeading id="apps">Apps</SubHeading>
        <p>
          An <strong>app</strong> represents one of your projects (e.g. <em>My Portfolio</em>, <em>Task Manager</em>).
          Each app has a unique <code>clientId</code> and a hashed <code>clientSecret</code>. Users are
          scoped per app — the same email can register independently in two different apps.
        </p>

        <SubHeading id="tokens">Tokens</SubHeading>
        <p>
          Authentication returns two tokens:
        </p>
        <ul>
          <li><strong>Access token</strong> — short-lived JWT (15 min). Sent as <code>Authorization: Bearer &lt;token&gt;</code>.</li>
          <li><strong>Refresh token</strong> — long-lived (7 days), single-use. Used to issue a new token pair. Reuse triggers immediate revocation of all sessions.</li>
        </ul>

        <CodeBlock
          lang="json"
          filename="Token response"
          code={`{
  "accessToken":  "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn":    900
}`}
        />

        <SectionHeading id="next-steps">Next steps</SectionHeading>
        <ul>
          <li><a href="/docs/quickstart">Quick Start</a> — up and running in 5 minutes</li>
          <li><a href="/docs/api-reference">API Reference</a> — full endpoint documentation</li>
          <li><a href="/docs/sdk-js">JavaScript SDK</a> — React hooks and typed client</li>
          <li><a href="/docs/security">Security</a> — token lifecycle and best practices</li>
        </ul>
      </div>

      <OnThisPage items={toc} />
    </div>
  );
}
