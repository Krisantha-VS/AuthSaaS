'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDashboardAuth } from '@/components/dashboard/provider';
import { getStats, getAuditLogs, type DashboardStats, type AuditLog } from '@/lib/dashboard-api';

function StatCard({ label, value, icon, color }: {
  label: string; value: number | string;
  icon: React.ReactNode; color: string;
}) {
  return (
    <div className="bg-zinc-900 border border-white/[0.06] rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <span className="text-zinc-400 text-sm">{label}</span>
        <span className={`p-2 rounded-lg ${color}`}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

const ACTION_LABELS: Record<string, string> = {
  tenant_register:  'Account created',
  tenant_login:     'Signed in',
  app_created:      'App created',
  secret_rotated:   'Secret rotated',
  user_register:    'User registered',
  user_login:       'User login',
  user_logout:      'User logout',
  token_refresh:    'Token refreshed',
  token_reuse:      'Token reuse detected',
};

export default function DashboardPage() {
  const { token, session }  = useDashboardAuth();
  const [stats, setStats]   = useState<DashboardStats | null>(null);
  const [logs, setLogs]     = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([getStats(token), getAuditLogs(token, 10)])
      .then(([s, l]) => { setStats(s); setLogs(l); })
      .finally(() => setLoading(false));
  }, [token]);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Good day, <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
            {session?.tenant.name?.split(' ')[0]}
          </span>
        </h1>
        <p className="text-zinc-400 text-sm mt-1">Here&apos;s what&apos;s happening across your applications.</p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-white/[0.06] rounded-xl p-5 animate-pulse">
              <div className="h-3 w-20 bg-zinc-800 rounded mb-4" />
              <div className="h-7 w-12 bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Apps" value={stats?.totalApps ?? 0} color="bg-violet-500/10"
            icon={<svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>}
          />
          <StatCard label="Active Apps" value={stats?.activeApps ?? 0} color="bg-emerald-500/10"
            icon={<svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>}
          />
          <StatCard label="Total Users" value={stats?.totalUsers ?? 0} color="bg-blue-500/10"
            icon={<svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          />
          <StatCard label="Audit Events" value={stats?.auditEvents ?? 0} color="bg-amber-500/10"
            icon={<svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 12h6M9 16h6M9 8h6M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/></svg>}
          />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-zinc-900 border border-white/[0.06] rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <h2 className="text-sm font-semibold text-zinc-100">Recent Activity</h2>
            <Link href="/dashboard/audit" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {logs.length === 0 && !loading && (
              <p className="p-5 text-sm text-zinc-500 text-center">No activity yet.</p>
            )}
            {logs.map(log => (
              <div key={log.id} className="flex items-center gap-4 px-5 py-3">
                <div className="w-7 h-7 rounded-full bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200">{ACTION_LABELS[log.action] ?? log.action}</p>
                  <p className="text-xs text-zinc-500 truncate">
                    {log.ipAddress && `${log.ipAddress} · `}{log.resource}
                  </p>
                </div>
                <span className="text-xs text-zinc-600 flex-shrink-0">{timeAgo(log.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-white/[0.06] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-zinc-100 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href="/dashboard/apps/new"
                className="flex items-center gap-3 w-full px-3.5 py-2.5 bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-violet-500/20 rounded-lg text-sm text-violet-300 hover:from-violet-600/30 hover:to-purple-600/30 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>
                </svg>
                Create application
              </Link>
              <Link
                href="/dashboard/apps"
                className="flex items-center gap-3 w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-zinc-300 hover:bg-white/[0.06] transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                </svg>
                Manage apps
              </Link>
              <Link
                href="/docs/quickstart"
                target="_blank"
                className="flex items-center gap-3 w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-zinc-300 hover:bg-white/[0.06] transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                Read the docs
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-600/10 to-purple-600/10 border border-violet-500/20 rounded-xl p-5">
            <p className="text-xs font-semibold text-violet-300 mb-1">🔑 Integration tip</p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Each app gets a unique <code className="text-violet-300 bg-violet-500/10 px-1 rounded">clientId</code>.
              Pass it to the SDK — your users are automatically scoped to that app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
