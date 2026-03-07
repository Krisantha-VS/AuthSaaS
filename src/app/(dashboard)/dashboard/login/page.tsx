'use client';

import { useState } from 'react';
import Link from 'next/link';
import { login } from '@/lib/dashboard-api';
import { useDashboardAuth } from '@/components/dashboard/provider';
import { AuthSaasLogo } from '@/components/docs/header';

const features = [
  {
    label: 'JWT rotation',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
      </svg>
    ),
  },
  {
    label: 'Multi-tenant',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    label: 'Audit log',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    label: 'SDKs',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
  },
];

export default function LoginPage() {
  const { login: setSession } = useDashboardAuth();
  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const touch = (field: string) =>
    setTouched(prev => new Set(prev).add(field));

  const emailError    = touched.has('email') && !email.includes('@');
  const passwordError = touched.has('password') && password.length < 8;

  const fieldClass = (hasError: boolean, isValid: boolean) =>
    [
      'w-full px-3.5 py-2.5 bg-zinc-900 border rounded-lg text-sm text-zinc-100',
      'placeholder:text-zinc-600 focus:outline-none focus:ring-1 transition-all',
      hasError
        ? 'border-red-500/50 focus:border-red-500/60 focus:ring-red-500/20'
        : isValid
        ? 'border-emerald-500/30 focus:border-violet-500/60 focus:ring-violet-500/30'
        : 'border-white/[0.1] focus:border-violet-500/60 focus:ring-violet-500/30',
    ].join(' ');

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
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[400px]">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <AuthSaasLogo size={28} />
        </div>

        {/* Heading */}
        <h1 className="text-xl font-semibold text-white text-center mb-1">Sign in</h1>
        <p className="text-sm text-zinc-400 text-center mb-8">
          No account?{' '}
          <Link href="/dashboard/register" className="text-violet-400 hover:text-violet-300 transition-colors">
            Create one free
          </Link>
        </p>

        {/* Form */}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => touch('email')}
              placeholder="you@company.com"
              className={fieldClass(emailError, touched.has('email') && !emailError)}
            />
            {emailError && <p className="text-xs text-red-400 mt-1">Enter a valid email address.</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPass(e.target.value)}
              onBlur={() => touch('password')}
              placeholder="••••••••"
              className={fieldClass(passwordError, touched.has('password') && !passwordError)}
            />
            {passwordError && <p className="text-xs text-red-400 mt-1">Password must be at least 8 characters.</p>}
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
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Feature grid */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          {features.map(f => (
            <div key={f.label} className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="text-zinc-600 flex-shrink-0">{f.icon}</span>
              {f.label}
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-xs text-zinc-600 text-center mt-8">© 2026 AuthSaas</p>
      </div>
    </div>
  );
}
