'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useDashboardAuth } from '@/components/dashboard/provider';
import { getApp, rotateSecret, updateApp, getOAuthProviders, setOAuthProvider, type TenantApp, type OAuthProviderSetting } from '@/lib/dashboard-api';
import { CopyBtn } from '@/components/dashboard/copy-btn';
import { useToast } from '@/components/dashboard/toast';

export default function AppDetailPage() {
  const { token }                   = useDashboardAuth();
  const { toast }                   = useToast();
  const { appId }                   = useParams<{ appId: string }>();
  const [app, setApp]               = useState<TenantApp | null>(null);
  const [loading, setLoading]       = useState(true);
  const [newSecret, setNewSecret]   = useState<string | null>(null);
  const [rotating, setRotating]     = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [name, setName]             = useState('');
  const [desc, setDesc]             = useState('');
  const [origins, setOrigins]       = useState('');
  const [oauthProviders, setOauthProviders] = useState<OAuthProviderSetting[]>([]);

  useEffect(() => {
    if (!token || !appId) return;
    getApp(token, appId).then(a => {
      setApp(a); setName(a.name);
      setDesc(a.description ?? '');
      setOrigins(a.allowedOrigins.join(', '));
    }).finally(() => setLoading(false));
    getOAuthProviders(token, appId).then(setOauthProviders).catch(() => {});
  }, [token, appId]);

  const handleRotate = async () => {
    if (!token || !appId) return;
    setRotating(true);
    try {
      const { clientSecret } = await rotateSecret(token, appId);
      setNewSecret(clientSecret);
      setConfirmRotate(false);
      toast({ message: 'Secret rotated — save it now', type: 'warning' });
    } catch {
      toast({ message: 'Something went wrong', type: 'error' });
    } finally { setRotating(false); }
  };

  const handleSave = async () => {
    if (!token || !appId) return;
    setSaving(true);
    try {
      const updated = await updateApp(token, appId, {
        name: name.trim(),
        description: desc.trim() || undefined,
        allowedOrigins: origins.split(',').map(s => s.trim()).filter(Boolean),
      });
      setApp(updated);
      toast({ message: 'Changes saved', type: 'success' });
    } catch {
      toast({ message: 'Something went wrong', type: 'error' });
    } finally { setSaving(false); }
  };

  const handleToggle = async () => {
    if (!token || !appId || !app) return;
    try {
      const updated = await updateApp(token, appId, { isActive: !app.isActive });
      toast({ message: app.isActive ? 'App deactivated' : 'App activated', type: 'info' });
      setApp(updated);
    } catch {
      toast({ message: 'Something went wrong', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white dark:bg-zinc-900 rounded-xl animate-pulse border border-zinc-200 dark:border-white/[0.06]" />)}
      </div>
    );
  }

  if (!app) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <p className="text-zinc-400">Application not found.</p>
        <Link href="/dashboard/apps" className="text-violet-400 text-sm mt-2 inline-block">← Back</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/dashboard/apps" className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Applications</Link>
        <span>/</span>
        <span className="text-zinc-700 dark:text-zinc-300">{app.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 flex items-center justify-center">
            <span className="text-sm font-bold text-violet-400">{app.name[0]}</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">{app.name}</h1>
            <p className="text-xs text-zinc-500">Created {new Date(app.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
          app.isActive
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-white/[0.06]'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${app.isActive ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
          {app.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Integration */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-white/[0.06]">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Integration credentials</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Use these in your SDK configuration.</p>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Client ID</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/[0.08] rounded-lg text-sm font-mono text-zinc-800 dark:text-zinc-100">
                {app.clientId}
              </code>
              <CopyBtn text={app.clientId} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Client Secret</label>
            {newSecret ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-amber-500/20 rounded-lg text-sm font-mono text-amber-300 break-all">
                    {newSecret}
                  </code>
                  <CopyBtn text={newSecret} />
                </div>
                <p className="text-xs text-amber-400/80">⚠ Save this now — it won&apos;t be shown again.</p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/[0.08] rounded-lg text-sm font-mono text-zinc-400 dark:text-zinc-600 select-none">
                  sas_••••••••••••••••••••••••••••••••
                </div>
                {!confirmRotate ? (
                  <button
                    onClick={() => setConfirmRotate(true)}
                    className="px-3 py-2 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/[0.15] rounded-lg transition-all whitespace-nowrap"
                  >
                    Rotate secret
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleRotate} disabled={rotating}
                      className="px-3 py-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-lg transition-all whitespace-nowrap"
                    >
                      {rotating ? 'Rotating…' : 'Confirm rotate'}
                    </button>
                    <button
                      onClick={() => setConfirmRotate(false)}
                      className="px-3 py-2 text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/[0.08] rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-white/[0.06]">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">App settings</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Name</label>
            <input
              value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/[0.1] rounded-lg text-sm text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Description</label>
            <input
              value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Optional description"
              className="w-full px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/[0.1] rounded-lg text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Allowed origins (comma-separated)</label>
            <input
              value={origins} onChange={e => setOrigins(e.target.value)}
              placeholder="https://myapp.com, http://localhost:3000"
              className="w-full px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/[0.1] rounded-lg text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
            />
          </div>
          <button
            onClick={handleSave} disabled={saving}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* OAuth Providers */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-white/[0.06]">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">OAuth providers</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Enable social login options for this app&apos;s users.</p>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-white/[0.04]">
          {[
            { key: 'google', label: 'Google', icon: (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )},
            { key: 'microsoft', label: 'Microsoft', icon: (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#F25022" d="M1 1h10v10H1z"/>
                <path fill="#00A4EF" d="M13 1h10v10H13z"/>
                <path fill="#7FBA00" d="M1 13h10v10H1z"/>
                <path fill="#FFB900" d="M13 13h10v10H13z"/>
              </svg>
            )},
          ].map(({ key, label, icon }) => {
            const setting = oauthProviders.find(p => p.provider === key);
            const enabled = setting?.enabled ?? false;
            return (
              <div key={key} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  {icon}
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{label}</span>
                </div>
                <button
                  onClick={async () => {
                    if (!token) return;
                    try {
                      const updated = await setOAuthProvider(token, appId, key, !enabled);
                      setOauthProviders(prev => {
                        const exists = prev.find(p => p.provider === key);
                        if (exists) return prev.map(p => p.provider === key ? updated : p);
                        return [...prev, updated];
                      });
                      toast({ message: `${label} ${!enabled ? 'enabled' : 'disabled'}`, type: 'success' });
                    } catch {
                      toast({ message: 'Something went wrong', type: 'error' });
                    }
                  }}
                  className={`relative w-10 h-[22px] rounded-full transition-colors ${enabled ? 'bg-violet-600' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                >
                  <span className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white dark:bg-zinc-900 border border-red-500/20 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-red-500/10">
          <h2 className="text-sm font-semibold text-red-400">Danger zone</h2>
        </div>
        <div className="p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{app.isActive ? 'Deactivate' : 'Activate'} application</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {app.isActive
                ? 'Disables authentication for all users of this app immediately.'
                : 'Re-enables authentication for users of this app.'}
            </p>
          </div>
          <button
            onClick={handleToggle}
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
              app.isActive
                ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
            }`}
          >
            {app.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>
    </div>
  );
}
