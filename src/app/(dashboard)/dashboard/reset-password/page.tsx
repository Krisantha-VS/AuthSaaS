'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthSaasLogo } from '@/components/docs/header';

function ResetForm() {
  const params   = useSearchParams();
  const router   = useRouter();
  const token      = params.get('token') ?? '';
  const email      = params.get('email') ?? '';
  const redirectTo = params.get('redirectTo') || '/dashboard';

  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    if (!token || !email) setError('Invalid reset link. Please request a new one.');
  }, [token, email]);

  const strength = (() => {
    let s = 0;
    if (password.length >= 8)            s++;
    if (/[A-Z]/.test(password))          s++;
    if (/[0-9]/.test(password))          s++;
    if (/[^A-Za-z0-9]/.test(password))  s++;
    return s;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'][strength];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/v1/tenant/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password }),
      });
      const j = await res.json();
      if (j.success) { setDone(true); setTimeout(() => router.push(redirectTo), 2500); }
      else setError(j.error ?? 'Reset failed');
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div className="text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
        <svg className="w-6 h-6 text-emerald-500 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/>
        </svg>
      </div>
      <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">Password updated</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Redirecting you to sign in…</p>
    </div>
  );

  return (
    <>
      <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white text-center mb-1">Set new password</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-7">
        For <span className="text-zinc-800 dark:text-zinc-200 font-medium">{email}</span>
      </p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">New password</label>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Min 8 chars, uppercase, number, special"
            className="auth-input w-full px-3.5 py-2.5 rounded-lg text-sm"
          />
          {password && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? strengthColor : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                ))}
              </div>
              <p className="text-xs text-zinc-500">{strengthLabel}</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">Confirm password</label>
          <input
            type="password"
            required
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="••••••••"
            className={`auth-input w-full px-3.5 py-2.5 rounded-lg text-sm${
              confirm && password !== confirm ? ' is-error' : ''
            }`}
          />
          {confirm && password !== confirm && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-1.5">Passwords do not match</p>
          )}
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
          disabled={loading || !token || strength < 4 || password !== confirm}
          className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm shadow-violet-500/20"
        >
          {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {loading ? 'Resetting…' : 'Reset password'}
        </button>
      </form>

      <p className="text-sm text-zinc-500 text-center mt-6">
        <Link href="/dashboard/forgot-password" className="text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 transition-colors">
          Request a new link
        </Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[400px]">
        <div className="flex justify-center mb-8">
          <AuthSaasLogo size={28} />
        </div>
        <div className="glass-auth rounded-2xl p-8">
          <Suspense fallback={<p className="text-zinc-500 dark:text-zinc-400 text-center text-sm">Loading…</p>}>
            <ResetForm />
          </Suspense>
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-600 text-center mt-7">© 2026 AuthSaas</p>
      </div>
    </div>
  );
}
