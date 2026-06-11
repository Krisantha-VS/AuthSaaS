'use client';

import { useState } from 'react';

interface ResetPasswordFormProps {
  token:     string;
  email:     string;
  clientId:  string;
  returnTo:  string;
  appName:   string;
}

export function ResetPasswordForm({ token, email, clientId, returnTo, appName }: ResetPasswordFormProps) {
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [done,      setDone]      = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');

    try {
      const res  = await fetch('/api/v1/oauth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, email, client_id: clientId, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Something went wrong. Please try again.');
        return;
      }

      setDone(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-sm px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-xl mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-slate-900">Set new password</h1>
            <p className="text-sm text-slate-500 mt-1">
              for <span className="font-medium text-slate-700">{appName}</span>
            </p>
          </div>

          {done ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-slate-600">Password updated successfully.</p>
              {returnTo && (
                <a
                  href={returnTo}
                  className="inline-block w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700
                             text-white text-sm font-medium rounded-lg transition-colors text-center"
                >
                  Sign in
                </a>
              )}
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                    New password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoFocus
                    autoComplete="new-password"
                    placeholder="Min. 8 chars, uppercase, number, symbol"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                               placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label htmlFor="confirm" className="block text-sm font-medium text-slate-700 mb-1">
                    Confirm password
                  </label>
                  <input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg
                               focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                               placeholder:text-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700
                             disabled:opacity-60 disabled:cursor-not-allowed
                             text-white text-sm font-medium rounded-lg transition-colors
                             flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Resetting…
                    </>
                  ) : (
                    'Reset password'
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">Secured by AuthSaaS</p>
      </div>
    </div>
  );
}
