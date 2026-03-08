import Link from 'next/link';
import { AuthSaasLogo } from '@/components/docs/header';

const features = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
      </svg>
    ),
    title: 'JWT Rotation',
    desc: 'Rotating refresh tokens with reuse detection. Compromised tokens nuke the entire session family.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
    title: 'Multi-tenant',
    desc: 'One platform, unlimited apps. Each tenant owns isolated apps with their own users, roles, and audit logs.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'RBAC',
    desc: 'Per-app roles with a full permissions catalog. Owner, admin, user — or define your own custom roles.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.59 4.9 2 2 0 0 1 3.56 2.73h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.4a16 16 0 0 0 6.29 6.29l.89-.89a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
    ),
    title: 'Email Verification',
    desc: 'Branded verification and password reset emails via Brevo SMTP. Tokens hashed at rest, 1-hour expiry.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M9 12h6M9 16h6M9 8h6M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/>
      </svg>
    ),
    title: 'Audit Logs',
    desc: 'Every auth event logged — logins, registrations, role changes, token reuse. Filterable per app.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
    title: 'Account Lockout',
    desc: '5 consecutive failed logins trigger a 15-minute lockout per email+app. Separate from IP rate limiting — both apply simultaneously.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
      </svg>
    ),
    title: 'Session Control',
    desc: 'View and revoke individual user sessions from the dashboard. All sessions invalidated on password reset or token reuse detection.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
    title: 'CSP + Security Headers',
    desc: 'Full security header suite: HSTS, CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy on every response.',
  },
];

const links = [
  {
    group: 'Product',
    items: [
      { label: 'Dashboard',  href: '/dashboard' },
      { label: 'Sign in',    href: '/dashboard/login' },
      { label: 'Register',   href: '/dashboard/register' },
    ],
  },
  {
    group: 'Docs',
    items: [
      { label: 'Introduction',  href: '/docs/introduction' },
      { label: 'Quick Start',   href: '/docs/quickstart' },
      { label: 'API Reference', href: '/docs/api-reference' },
      { label: 'Security',      href: '/docs/security' },
      { label: 'RBAC',          href: '/docs/rbac' },
    ],
  },
  {
    group: 'SDKs',
    items: [
      { label: 'JavaScript / React', href: '/docs/sdk-js' },
      { label: 'C# / Blazor',        href: '/docs/sdk-js#csharp' },
    ],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-6">
          <AuthSaasLogo size={28} />
          <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
            <Link href="/docs/introduction" className="hover:text-white transition-colors">Docs</Link>
            <Link href="/docs/api-reference" className="hover:text-white transition-colors">API</Link>
            <Link href="/docs/rbac" className="hover:text-white transition-colors">RBAC</Link>
            <Link href="/docs/security" className="hover:text-white transition-colors">Security</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              href="/dashboard/register"
              className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-medium text-white transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/10 text-xs font-medium text-violet-400 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          v1 · Open Beta
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.05]">
          Auth infrastructure
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            for your SaaS
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Drop-in authentication with JWT rotation, RBAC, email verification, audit logs,
          and a full tenant dashboard. Ship auth in minutes, not weeks.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard/register"
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-500/25"
          >
            Start for free
          </Link>
          <Link
            href="/docs/introduction"
            className="w-full sm:w-auto px-8 py-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 font-medium text-sm transition-all"
          >
            Read the docs
          </Link>
          <Link
            href="/docs/quickstart"
            className="w-full sm:w-auto px-8 py-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 font-medium text-sm transition-all"
          >
            Quick start →
          </Link>
        </div>
      </section>

      {/* ── Code snippet ─────────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-6 pb-20">
        <div className="rounded-xl border border-white/[0.06] bg-zinc-900 overflow-hidden">
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06]">
            <span className="w-3 h-3 rounded-full bg-zinc-700" />
            <span className="w-3 h-3 rounded-full bg-zinc-700" />
            <span className="w-3 h-3 rounded-full bg-zinc-700" />
            <span className="ml-3 text-xs text-zinc-500">Register a user</span>
          </div>
          <pre className="p-5 text-sm overflow-x-auto text-zinc-300 leading-relaxed">
{`POST /api/v1/auth/register
{
  "clientId": "your-app-client-id",
  "email": "user@example.com",
  "password": "SecurePass1!",
  "name": "Jane Doe"
}

// Response
{
  "success": true,
  "data": {
    "user": { "id": "usr_...", "roles": ["user"] },
    "tokens": { "accessToken": "eyJ...", "expiresIn": 900 }
  }
}`}
          </pre>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Everything auth needs</h2>
          <p className="text-zinc-400">Production-grade, not toy examples.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(f => (
            <div key={f.title} className="p-5 rounded-xl border border-white/[0.06] bg-zinc-900 hover:border-violet-500/20 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 mb-4">
                {f.icon}
              </div>
              <h3 className="text-sm font-semibold text-white mb-1.5">{f.title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ───────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="relative rounded-2xl overflow-hidden border border-violet-500/20 bg-gradient-to-br from-violet-600/10 via-purple-600/5 to-zinc-900 p-12 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-500/10 via-transparent to-transparent pointer-events-none" />
          <h2 className="relative text-3xl font-bold mb-3">Ready to ship auth?</h2>
          <p className="relative text-zinc-400 mb-8 max-w-md mx-auto">
            Create a tenant account, spin up an app, and get your <code className="text-violet-300 bg-violet-500/10 px-1 rounded">clientId</code> in under 2 minutes.
          </p>
          <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard/register"
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-500/25"
            >
              Create free account
            </Link>
            <Link
              href="/dashboard/login"
              className="px-8 py-3 rounded-xl border border-white/10 hover:bg-white/[0.06] text-zinc-300 font-medium text-sm transition-all"
            >
              Sign in to dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] bg-zinc-900/50">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <AuthSaasLogo size={26} />
              <p className="text-xs text-zinc-500 mt-3 leading-relaxed">
                Secure authentication infrastructure for multi-tenant SaaS applications.
              </p>
              <a
                href="https://github.com/Krisantha-VS/AuthSaaS"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-4 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                GitHub
              </a>
            </div>

            {/* Link groups */}
            {links.map(group => (
              <div key={group.group}>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">{group.group}</p>
                <ul className="space-y-2">
                  {group.items.map(item => (
                    <li key={item.label}>
                      <Link href={item.href} className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600">
            <p>© 2026 AuthSaas. Built by Krisantha Sarma.</p>
            <p>Open source · MIT License</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
