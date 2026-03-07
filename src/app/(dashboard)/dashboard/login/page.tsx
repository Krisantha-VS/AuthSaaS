'use client';

import { useState } from 'react';
import Link from 'next/link';
import { login } from '@/lib/dashboard-api';
import { useDashboardAuth } from '@/components/dashboard/provider';
import { AuthSaasLogo } from '@/components/docs/header';

export default function LoginPage() {
  const { login: setSession } = useDashboardAuth();
  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const result = await login(email, password);
      setSession(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-[480px] bg-zinc-900 border-r border-white/[0.06] flex-col p-12">
        <AuthSaasLogo size={30} />
        <div className="flex-1 flex flex-col justify-center gap-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Enterprise authentication,<br />
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                without the complexity.
              </span>
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Add secure multi-tenant auth to any project in minutes. JWT rotation, RBAC, audit logging — all handled.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { icon: '🔐', title: 'JWT + refresh rotation',    desc: '15-min access tokens, 7-day rotating refresh' },
              { icon: '🏢', title: 'Multi-tenant isolation',     desc: 'Your users are scoped to your app only' },
              { icon: '📋', title: 'Immutable audit log',        desc: 'Every auth event logged and queryable' },
              { icon: '⚡', title: 'JS + C# SDKs',              desc: 'One clientId, works anywhere' },
            ].map(f => (
              <div key={f.title} className="flex items-start gap-3">
                <span className="text-lg mt-0.5">{f.icon}</span>
                <div>
                  <p className="text-sm font-medium text-zinc-200">{f.title}</p>
                  <p className="text-xs text-zinc-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-zinc-600">© 2026 AuthSaas · Enterprise Auth Platform</p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <AuthSaasLogo size={28} />
          </div>

          <h1 className="text-xl font-semibold text-white mb-1">Sign in to your account</h1>
          <p className="text-sm text-zinc-400 mb-8">
            No account?{' '}
            <Link href="/dashboard/register" className="text-violet-400 hover:text-violet-300 transition-colors">
              Create one free
            </Link>
          </p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email address</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.1] rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
              <input
                type="password" required value={password} onChange={e => setPass(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.1] rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-zinc-600">
            By signing in, you agree to the{' '}
            <Link href="/docs/security" className="text-zinc-500 hover:text-zinc-400">Terms of Service</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
