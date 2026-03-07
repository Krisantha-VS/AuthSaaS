'use client';

import { useState } from 'react';
import Link from 'next/link';
import { register } from '@/lib/dashboard-api';
import { useDashboardAuth } from '@/components/dashboard/provider';
import { AuthSaasLogo } from '@/components/docs/header';

function getStrength(password: string): number {
  return [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
}

function strengthBarColor(strength: number, index: number): string {
  if (strength === 0) return 'bg-zinc-800';
  if (index >= strength) return 'bg-zinc-800';
  if (strength >= 4) return 'bg-emerald-500';
  if (strength >= 3) return 'bg-emerald-500/70';
  if (strength >= 2) return 'bg-amber-500';
  return 'bg-red-500';
}

export default function RegisterPage() {
  const { login: setSession } = useDashboardAuth();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPass]     = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [touched, setTouched]   = useState<Set<string>>(new Set());

  const touch = (field: string) =>
    setTouched(prev => new Set(prev).add(field));

  const strength     = getStrength(password);
  const emailError   = touched.has('email') && !email.includes('@');
  const passError    = touched.has('password') && password.length < 8;
  const confirmError = touched.has('confirm') && confirm !== password;

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
      const result = await register(name, email, password);
      setSession(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
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
        <h1 className="text-xl font-semibold text-white text-center mb-1">Create your account</h1>
        <p className="text-sm text-zinc-400 text-center mb-8">
          Already registered?{' '}
          <Link href="/dashboard/login" className="text-violet-400 hover:text-violet-300 transition-colors">
            Sign in
          </Link>
        </p>

        {/* Form */}
        <form onSubmit={submit} className="space-y-4">
          {/* Name — optional */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Full name <span className="text-zinc-600">(optional)</span>
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jane Smith"
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.1] rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
            />
          </div>

          {/* Email */}
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

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPass(e.target.value)}
              onBlur={() => touch('password')}
              placeholder="Min. 8 characters"
              className={fieldClass(passError, touched.has('password') && !passError)}
            />
            {/* Strength meter */}
            {password.length > 0 && (
              <div className="flex gap-1 mt-2">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`h-1 rounded-full flex-1 transition-colors ${strengthBarColor(strength, i)}`} />
                ))}
              </div>
            )}
            {passError && <p className="text-xs text-red-400 mt-1">Password must be at least 8 characters.</p>}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Confirm password</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onBlur={() => touch('confirm')}
              placeholder="••••••••"
              className={fieldClass(confirmError, touched.has('confirm') && !confirmError && confirm.length > 0)}
            />
            {confirmError && <p className="text-xs text-red-400 mt-1">Passwords do not match.</p>}
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
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-xs text-zinc-600 text-center mt-8">© 2026 AuthSaas</p>
      </div>
    </div>
  );
}
