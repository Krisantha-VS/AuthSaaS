'use client';

import Link from 'next/link';

/* ── AuthSaas logo mark — inline SVG, no external deps ─────────────────── */
function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="lm-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4f46e5" />
          <stop offset="0.5" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#9333ea" />
        </linearGradient>
        <linearGradient id="lm-kh" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4f46e5" />
          <stop offset="1" stopColor="#9333ea" />
        </linearGradient>
      </defs>
      {/* Squircle background */}
      <rect width="32" height="32" rx="8" fill="url(#lm-bg)" />
      {/* Shackle */}
      <path
        d="M10 15v-3.5a6 6 0 0 1 12 0V15"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Lock body */}
      <rect x="7.5" y="14" width="17" height="12" rx="3.5" fill="white" />
      {/* Keyhole circle */}
      <circle cx="16" cy="19.5" r="2.2" fill="url(#lm-kh)" />
      {/* Keyhole stem */}
      <rect x="15.1" y="20.5" width="1.8" height="3" rx="0.9" fill="url(#lm-kh)" />
    </svg>
  );
}

/* ── Full horizontal wordmark ────────────────────────────────────────────── */
export function AuthSaasLogo({ size = 28 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5 select-none">
      <LogoMark size={size} />
      <span className="flex items-baseline gap-0">
        <span
          style={{ fontSize: size * 0.57, letterSpacing: '-0.02em' }}
          className="font-bold text-foreground"
        >
          Auth
        </span>
        <span
          style={{ fontSize: size * 0.57, letterSpacing: '-0.02em' }}
          className="font-bold bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent"
        >
          Saas
        </span>
      </span>
    </span>
  );
}

/* ── Docs header ─────────────────────────────────────────────────────────── */
export function DocsHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between h-14 px-6">

        {/* Logo */}
        <Link href="/docs/introduction" className="hover:opacity-80 transition-opacity">
          <AuthSaasLogo size={30} />
        </Link>

        {/* Center nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/docs/introduction"  className="hover:text-foreground transition-colors">Docs</Link>
          <Link href="/docs/api-reference" className="hover:text-foreground transition-colors">API</Link>
          <Link href="/docs/sdk-js"        className="hover:text-foreground transition-colors">SDKs</Link>
          <Link href="/dashboard"          className="hover:text-foreground transition-colors">Dashboard</Link>
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
            v1 · Beta
          </span>
          <a
            href="https://github.com/Krisantha-VS/AuthSaaS"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="GitHub"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
        </div>

      </div>
    </header>
  );
}
