'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDashboardAuth } from '@/components/dashboard/provider';
import { createApp } from '@/lib/dashboard-api';
import { CopyBtn } from '@/components/dashboard/copy-btn';
import { useToast } from '@/components/dashboard/toast';

export default function NewAppPage() {
  const { token }                   = useDashboardAuth();
  const { toast }                   = useToast();
  const router                      = useRouter();
  const [name, setName]             = useState('');
  const [desc, setDesc]             = useState('');
  const [origins, setOrigins]       = useState('');
  const [loading, setLoading]       = useState(false);
  const [secret, setSecret]         = useState<{ clientId: string; clientSecret: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    try {
      const allowedOrigins = origins.split(',').map(s => s.trim()).filter(Boolean);
      const result = await createApp(token, { name: name.trim(), description: desc.trim() || undefined, allowedOrigins });
      setSecret({ clientId: result.app.clientId, clientSecret: result.clientSecret });
      toast({ message: 'Application created', type: 'success' });
    } catch (err) {
      toast({ message: err instanceof Error ? err.message : 'Failed to create app', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (secret) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-zinc-900 border border-white/[0.06] rounded-xl overflow-hidden">
          {/* Success header */}
          <div className="px-6 py-5 border-b border-white/[0.06] bg-emerald-500/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-white">Application created</h2>
                <p className="text-xs text-zinc-400">Save your credentials — the secret is shown only once.</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Warning */}
            <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
              <svg className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <path d="M12 9v4M12 17h.01"/>
              </svg>
              <p className="text-xs text-amber-300/80">
                <strong className="font-semibold">Store your client secret now.</strong> It will not be shown again. If you lose it, you&apos;ll need to rotate and update your integration.
              </p>
            </div>

            {/* Client ID */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Client ID</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3.5 py-2.5 bg-zinc-800 border border-white/[0.08] rounded-lg text-sm font-mono text-zinc-100">
                  {secret.clientId}
                </code>
                <CopyBtn text={secret.clientId} />
              </div>
            </div>

            {/* Client Secret */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Client Secret <span className="text-amber-400">(one-time)</span></label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3.5 py-2.5 bg-zinc-800 border border-amber-500/20 rounded-lg text-sm font-mono text-amber-300 break-all">
                  {secret.clientSecret}
                </code>
                <CopyBtn text={secret.clientSecret} />
              </div>
            </div>

            {/* Usage snippet */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Quick start</label>
              <pre className="px-4 py-3.5 bg-zinc-950 border border-white/[0.06] rounded-lg text-xs font-mono text-zinc-300 overflow-x-auto">
{`// JS SDK
const client = new AuthClient({
  clientId: "${secret.clientId}",
  baseUrl:  "${process.env.NEXT_PUBLIC_APP_URL}",
});

await client.login({ email, password });`}
              </pre>
            </div>

            <button
              onClick={() => router.push('/dashboard/apps')}
              className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:opacity-90 text-white text-sm font-medium rounded-lg transition-opacity"
            >
              Done — go to applications
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/dashboard/apps" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1 mb-4">
          ← Back to applications
        </Link>
        <h1 className="text-2xl font-bold text-white">New application</h1>
        <p className="text-zinc-400 text-sm mt-1">Each app gets a unique clientId to authenticate your users.</p>
      </div>

      <div className="bg-zinc-900 border border-white/[0.06] rounded-xl p-6">
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Application name <span className="text-red-400">*</span></label>
            <input
              required value={name} onChange={e => setName(e.target.value)}
              placeholder="My App"
              className="w-full px-3.5 py-2.5 bg-zinc-800 border border-white/[0.1] rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description <span className="text-zinc-600">(optional)</span></label>
            <input
              value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="What does this app do?"
              className="w-full px-3.5 py-2.5 bg-zinc-800 border border-white/[0.1] rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Allowed origins <span className="text-zinc-600">(comma-separated, optional)</span>
            </label>
            <input
              value={origins} onChange={e => setOrigins(e.target.value)}
              placeholder="https://myapp.com, http://localhost:3000"
              className="w-full px-3.5 py-2.5 bg-zinc-800 border border-white/[0.1] rounded-lg text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
            />
            <p className="text-xs text-zinc-600 mt-1.5">Leave empty to allow all origins during development.</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? 'Creating…' : 'Create application'}
            </button>
            <Link
              href="/dashboard/apps"
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
