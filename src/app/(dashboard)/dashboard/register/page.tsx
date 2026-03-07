'use client';

import { useState } from 'react';
import Link from 'next/link';
import { register } from '@/lib/dashboard-api';
import { useDashboardAuth } from '@/components/dashboard/provider';
import { AuthSaasLogo } from '@/components/docs/header';

export default function RegisterPage() {
  const { login: setSession } = useDashboardAuth();
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <AuthSaasLogo size={28} />
        </div>

        <h1 className="text-xl font-semibold text-white mb-1">Create your developer account</h1>
        <p className="text-sm text-zinc-400 mb-8">
          Already registered?{' '}
          <Link href="/dashboard/login" className="text-violet-400 hover:text-violet-300 transition-colors">
            Sign in
          </Link>
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Full name</label>
            <input
              required value={name} onChange={e => setName(e.target.value)}
              placeholder="Jane Smith"
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/[0.1] rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
            />
          </div>
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
              type="password" required minLength={8} value={password} onChange={e => setPass(e.target.value)}
              placeholder="Min. 8 characters"
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
            className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-600">
          Free forever for personal projects.
        </p>
      </div>
    </div>
  );
}
