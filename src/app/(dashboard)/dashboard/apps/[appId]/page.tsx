'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useDashboardAuth } from '@/components/dashboard/provider';
import { getApp, rotateSecret, updateApp, getOAuthProviders, setOAuthProvider, saveOAuthProviderKeys, type TenantApp, type OAuthProviderSetting } from '@/lib/dashboard-api';
import { CopyBtn } from '@/components/dashboard/copy-btn';
import { useToast } from '@/components/dashboard/toast';

const PROVIDER_DOCS: Record<string, string> = {
  google:    'https://developers.google.com/identity/protocols/oauth2',
  microsoft: 'https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app',
};

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
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [byokInputs, setByokInputs] = useState<Record<string, { clientId: string; clientSecret: string }>>({});
  const [keysSaving, setKeysSaving] = useState<Record<string, boolean>>({});
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!token || !appId) return;
    getApp(token, appId).then(a => {
      setApp(a); setName(a.name);
      setDesc(a.description ?? '');
      setOrigins(a.allowedOrigins.join(', '));
    }).finally(() => setLoading(false));
    getOAuthProviders(token, appId).then(providers => {
      setOauthProviders(providers);
      const initial: Record<string, { clientId: string; clientSecret: string }> = {};
      providers.forEach(p => { initial[p.provider] = { clientId: p.providerClientId ?? '', clientSecret: '' }; });
      setByokInputs(initial);
    }).catch(() => {});
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

  const handleSaveKeys = async (provider: string) => {
    if (!token) return;
    const inputs = byokInputs[provider] ?? { clientId: '', clientSecret: '' };
    setKeysSaving(prev => ({ ...prev, [provider]: true }));
    try {
      const updated = await saveOAuthProviderKeys(token, appId, provider, inputs.clientId, inputs.clientSecret);
      setOauthProviders(prev => prev.map(p => p.provider === provider ? updated : p));
      setByokInputs(prev => ({ ...prev, [provider]: { clientId: updated.providerClientId ?? '', clientSecret: '' } }));
      setExpandedProvider(null);
      toast({ message: `${provider.charAt(0).toUpperCase() + provider.slice(1)} credentials saved`, type: 'success' });
    } catch {
      toast({ message: 'Something went wrong', type: 'error' });
    } finally {
      setKeysSaving(prev => ({ ...prev, [provider]: false }));
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
          <p className="text-xs text-zinc-500 mt-0.5">Enable social login and optionally use your own OAuth credentials.</p>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-white/[0.04]">
          {[
            { key: 'google', label: 'Google', icon: (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )},
            { key: 'microsoft', label: 'Microsoft', icon: (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#F25022" d="M1 1h10v10H1z"/>
                <path fill="#00A4EF" d="M13 1h10v10H13z"/>
                <path fill="#7FBA00" d="M1 13h10v10H1z"/>
                <path fill="#FFB900" d="M13 13h10v10H13z"/>
              </svg>
            )},
          ].map(({ key, label, icon }) => {
            const setting  = oauthProviders.find(p => p.provider === key);
            const enabled  = setting?.enabled ?? false;
            const hasKeys  = setting?.hasKeys ?? false;
            const expanded = expandedProvider === key;
            const inputs   = byokInputs[key] ?? { clientId: '', clientSecret: '' };
            const isSaving = keysSaving[key] ?? false;

            return (
              <div key={key} className="divide-y divide-zinc-100 dark:divide-white/[0.04]">
                {/* Row */}
                <div className="flex items-center gap-3 px-5 py-3.5">
                  {icon}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{label}</span>
                      {hasKeys && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                          Own keys
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedProvider(expanded ? null : key)}
                    className="text-xs text-zinc-400 hover:text-violet-400 transition-colors mr-3 whitespace-nowrap"
                  >
                    {expanded ? 'Close' : 'Configure keys'}
                  </button>
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
                    className={`relative w-10 h-[22px] rounded-full transition-colors shrink-0 ${enabled ? 'bg-violet-600' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                  >
                    <span className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* BYOK panel */}
                {expanded && (
                  <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-800/40 space-y-3">
                    <p className="text-xs text-zinc-500">
                      Use your own {label} OAuth credentials. Leave blank to use AuthSaaS shared credentials.{' '}
                      <a
                        href={PROVIDER_DOCS[key]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet-400 hover:text-violet-300 underline underline-offset-2"
                      >
                        How to get these keys →
                      </a>
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">Client ID</label>
                        <input
                          value={inputs.clientId}
                          onChange={e => setByokInputs(prev => ({ ...prev, [key]: { ...prev[key], clientId: e.target.value } }))}
                          placeholder="Paste your client ID"
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/[0.1] rounded-lg text-xs text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1">
                          Client Secret {hasKeys && <span className="text-emerald-400">(stored — enter new to replace)</span>}
                        </label>
                        <div className="relative">
                          <input
                            type={showSecret[key] ? 'text' : 'password'}
                            value={inputs.clientSecret}
                            onChange={e => setByokInputs(prev => ({ ...prev, [key]: { ...prev[key], clientSecret: e.target.value } }))}
                            placeholder={hasKeys ? '••••••••••••••••' : 'Paste your client secret'}
                            className="w-full px-3 py-2 pr-8 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/[0.1] rounded-lg text-xs text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSecret(prev => ({ ...prev, [key]: !prev[key] }))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                            tabIndex={-1}
                          >
                            {showSecret[key]
                              ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                              : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            }
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleSaveKeys(key)}
                        disabled={isSaving}
                        className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isSaving && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        {isSaving ? 'Saving…' : 'Save credentials'}
                      </button>
                      <button
                        onClick={() => setExpandedProvider(null)}
                        className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
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
