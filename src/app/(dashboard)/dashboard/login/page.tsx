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
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
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
    `auth-input w-full px-3.5 py-2.5 rounded-lg text-sm${hasError ? ' is-error' : isValid ? ' is-valid' : ''}`;

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
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[400px]">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <AuthSaasLogo size={28} />
        </div>

        {/* Glass card */}
        <div className="glass-auth rounded-2xl p-8">
          {/* Heading */}
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white text-center mb-1">
            Sign in
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-7">
            No account?{' '}
            <Link href="/dashboard/register" className="text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 font-medium transition-colors">
              Create one free
            </Link>
          </p>

          {/* Google */}
          <a
            href="/api/v1/tenant/google/start"
            className="flex items-center justify-center gap-3 w-full py-2.5 px-4 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-5"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </a>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
            <span className="text-xs text-zinc-400 dark:text-zinc-600">or</span>
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => touch('email')}
                placeholder="you@company.com"
                className={fieldClass(emailError, touched.has('email') && !emailError)}
              />
              {emailError && <p className="text-xs text-red-500 dark:text-red-400 mt-1.5">Enter a valid email address.</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Password</label>
                <Link href="/dashboard/forgot-password" className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPass(e.target.value)}
                onBlur={() => touch('password')}
                placeholder="••••••••"
                className={fieldClass(passwordError, touched.has('password') && !passwordError)}
              />
              {passwordError && <p className="text-xs text-red-500 dark:text-red-400 mt-1.5">Password must be at least 8 characters.</p>}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <svg className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm shadow-violet-500/20"
            >
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        {/* Feature grid */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {features.map(f => (
            <div key={f.label} className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
              <span className="text-zinc-400 dark:text-zinc-600 flex-shrink-0">{f.icon}</span>
              {f.label}
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-xs text-zinc-400 dark:text-zinc-600 text-center mt-7">© 2026 AuthSaas</p>
      </div>
    </div>
  );
}
