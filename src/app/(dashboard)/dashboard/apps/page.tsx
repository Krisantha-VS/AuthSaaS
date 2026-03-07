'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDashboardAuth } from '@/components/dashboard/provider';
import { getApps, updateApp, type TenantApp } from '@/lib/dashboard-api';
import { CopyBtn } from '@/components/dashboard/copy-btn';

export default function AppsPage() {
  const { token }             = useDashboardAuth();
  const [apps, setApps]       = useState<TenantApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getApps(token).then(setApps).finally(() => setLoading(false));
  }, [token]);

  const toggle = async (app: TenantApp) => {
    if (!token) return;
    setToggling(app.id);
    try {
      const updated = await updateApp(token, app.id, { isActive: !app.isActive });
      setApps(prev => prev.map(a => a.id === app.id ? updated : a));
    } finally { setToggling(null); }
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Applications</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage your tenant apps and integration keys.</p>
        </div>
        <Link
          href="/dashboard/apps/new"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-medium rounded-lg transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
          </svg>
          New application
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-zinc-900 rounded-xl animate-pulse border border-white/[0.06]" />
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="bg-zinc-900 border border-white/[0.06] rounded-xl p-16 text-center">
          <div className="w-14 h-14 bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-violet-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No applications yet</h3>
          <p className="text-sm text-zinc-400 mb-6">Create your first app to get a clientId and start integrating.</p>
          <Link
            href="/dashboard/apps/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            Create your first app
          </Link>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-white/[0.06] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-3.5">App</th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-3.5">Client ID</th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-3.5">Status</th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-3.5">Created</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {apps.map(app => (
                <tr key={app.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-violet-400">{app.name[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-100">{app.name}</p>
                        {app.description && <p className="text-xs text-zinc-500 truncate max-w-[200px]">{app.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-zinc-300 font-mono bg-zinc-800 px-2 py-1 rounded border border-white/[0.06] max-w-[160px] truncate block">
                        {app.clientId}
                      </code>
                      <CopyBtn text={app.clientId} />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggle(app)}
                      disabled={toggling === app.id}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                        app.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-zinc-800 text-zinc-400 border-white/[0.06] hover:bg-zinc-700'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${app.isActive ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                      {app.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-zinc-500">{fmt(app.createdAt)}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/dashboard/apps/${app.id}`}
                      className="text-xs text-zinc-500 hover:text-zinc-200 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Configure →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
