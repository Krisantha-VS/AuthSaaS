'use client';

import { useState } from 'react';

interface OAuthRegisterFormProps {
  clientId:            string;
  redirectUri:         string;
  codeChallenge:       string;
  codeChallengeMethod: string;
  state:               string;
  appName:             string;
  enabledProviders:    string[];
}

function passwordStrength(pw: string): number {
  if (pw.length === 0) return 0;
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const strengthColors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];
const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

export function OAuthRegisterForm({
  clientId,
  redirectUri,
  codeChallenge,
  codeChallengeMethod,
  state,
  appName,
  enabledProviders,
}: OAuthRegisterFormProps) {
  const [name,        setName]        = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const strength = passwordStrength(password);

  function validateField(field: string, value: string) {
    const next = { ...fieldErrors };
    if (field === 'email') {
      next.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Enter a valid email address.';
    }
    if (field === 'password') {
      next.password = value.length >= 8 ? '' : 'Password must be at least 8 characters.';
      if (confirm) next.confirm = value === confirm ? '' : 'Passwords do not match.';
    }
    if (field === 'confirm') {
      next.confirm = value === password ? '' : 'Passwords do not match.';
    }
    setFieldErrors(next);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const errors: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address.';
    if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
    if (password !== confirm) errors.confirm = 'Passwords do not match.';
    if (Object.values(errors).some(Boolean)) { setFieldErrors(errors); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/oauth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id:             clientId,
          email,
          password,
          name:                  name || undefined,
          code_challenge:        codeChallenge,
          code_challenge_method: codeChallengeMethod,
          redirect_uri:          redirectUri,
          state,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Registration failed. Please try again.');
        return;
      }

      const redirectTo: string | undefined = (data as { data?: { redirectTo?: string } }).data?.redirectTo;
      if (redirectTo) {
        window.location.href = redirectTo;
        return;
      }

      setError('Registration failed. Please try again.');
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const loginHref =
    `/oauth/login?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&code_challenge=${codeChallenge}` +
    `&code_challenge_method=${codeChallengeMethod}` +
    `&state=${state}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-sm px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-xl mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-slate-900">Create account</h1>
            <p className="text-sm text-slate-500 mt-1">
              to continue to <span className="font-medium text-slate-700">{appName}</span>
            </p>
          </div>

          {/* Google sign-in */}
          {enabledProviders.includes('google') && (
            <a
              href={`/api/v1/oauth/google/start?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge=${codeChallenge}&code_challenge_method=${codeChallengeMethod}&state=${state}`}
              className="flex items-center justify-center gap-3 w-full py-2.5 px-4 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </a>
          )}

          {enabledProviders.length > 0 && (
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400">or</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
          )}

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                Name <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
                autoFocus
                placeholder="Your name"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                           placeholder:text-slate-400"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={e => validateField('email', e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className={`w-full px-3 py-2 text-sm border rounded-lg
                            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                            placeholder:text-slate-400
                            ${fieldErrors.email ? 'border-red-400' : 'border-slate-300'}`}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); if (fieldErrors.password) validateField('password', e.target.value); }}
                onBlur={e => validateField('password', e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className={`w-full px-3 py-2 text-sm border rounded-lg
                            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                            placeholder:text-slate-400
                            ${fieldErrors.password ? 'border-red-400' : 'border-slate-300'}`}
              />
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
              )}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? strengthColors[strength - 1] : 'bg-slate-200'}`}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{strengthLabels[strength - 1] ?? 'Weak'}</p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-slate-700 mb-1">
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={e => { setConfirm(e.target.value); if (fieldErrors.confirm) validateField('confirm', e.target.value); }}
                onBlur={e => validateField('confirm', e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className={`w-full px-3 py-2 text-sm border rounded-lg
                            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                            placeholder:text-slate-400
                            ${fieldErrors.confirm ? 'border-red-400' : 'border-slate-300'}`}
              />
              {fieldErrors.confirm && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.confirm}</p>
              )}
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
                  Creating account…
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <a href={loginHref} className="text-indigo-600 hover:text-indigo-700 font-medium">
                Sign in
              </a>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Secured by AuthSaaS
        </p>
      </div>
    </div>
  );
}
