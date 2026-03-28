'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDashboardAuth } from '@/components/dashboard/provider';
import { getStats, getAuditLogs, type DashboardStats, type AuditLog } from '@/lib/dashboard-api';

function StatCard({ label, value, icon, color, sub }: {
  label: string; value: number | string;
  icon: React.ReactNode; color: string;
  sub?: string;
}) {
  return (
    <div className="glass-card rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">{label}</span>
        <span className={`p-1.5 rounded-lg ${color}`}>{icon}</span>
      </div>
      <div>
        <p className="text-3xl font-bold text-zinc-900 dark:text-white tabular-nums tracking-tight">{value}</p>
        {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

const ACTION_META: Record<string, { label: string; dot: string; ring: string }> = {
  tenant_register:  { label: 'Account created',        dot: 'bg-violet-500',  ring: 'bg-violet-500/10' },
  tenant_login:     { label: 'Signed in',               dot: 'bg-blue-500',    ring: 'bg-blue-500/10' },
  app_created:      { label: 'App created',             dot: 'bg-emerald-500', ring: 'bg-emerald-500/10' },
  secret_rotated:   { label: 'Secret rotated',          dot: 'bg-amber-500',   ring: 'bg-amber-500/10' },
  user_register:    { label: 'User registered',         dot: 'bg-emerald-500', ring: 'bg-emerald-500/10' },
  user_login:       { label: 'User login',              dot: 'bg-blue-500',    ring: 'bg-blue-500/10' },
  user_logout:      { label: 'User logout',             dot: 'bg-zinc-400',    ring: 'bg-zinc-500/10' },
  token_refresh:    { label: 'Token refreshed',         dot: 'bg-zinc-400',    ring: 'bg-zinc-500/10' },
  token_reuse:      { label: '⚠ Token reuse detected',  dot: 'bg-red-500',     ring: 'bg-red-500/10' },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { token, session }  = useDashboardAuth();
  const [stats, setStats]   = useState<DashboardStats | null>(null);
  const [logs, setLogs]     = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
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
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          {getGreeting()},{' '}
          <span className="bg-gradient-to-r from-violet-600 to-purple-500 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
            {session?.tenant.name?.split(' ')[0]}
          </span>
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Here&apos;s what&apos;s happening across your applications.</p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-5 animate-pulse">
              <div className="h-2.5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded mb-4" />
              <div className="h-8 w-14 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Apps" value={stats?.totalApps ?? 0} color="bg-violet-500/10"
            sub={stats?.totalApps === 0 ? 'No apps yet' : `${stats?.activeApps} active`}
            icon={<svg className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>}
          />
          <StatCard label="Active Apps" value={stats?.activeApps ?? 0} color="bg-emerald-500/10"
            sub={stats && stats.totalApps > 0 ? `${Math.round((stats.activeApps / stats.totalApps) * 100)}% of total` : 'No apps yet'}
            icon={<svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>}
          />
          <StatCard label="Total Users" value={stats?.totalUsers ?? 0} color="bg-blue-500/10"
            sub="across all apps"
            icon={<svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
          />
          <StatCard label="Audit Events" value={stats?.auditEvents ?? 0} color="bg-amber-500/10"
            sub="lifetime events"
            icon={<svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 12h6M9 16h6M9 8h6M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/></svg>}
          />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 glass-card rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.05] dark:border-white/[0.06]">
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 tracking-tight">Recent Activity</h2>
            <Link href="/dashboard/audit" className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 transition-colors font-medium">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
            {logs.length === 0 && !loading && (
              <p className="p-5 text-sm text-zinc-400 text-center">No activity yet.</p>
            )}
            {logs.map(log => {
              const meta = ACTION_META[log.action] ?? { label: log.action, dot: 'bg-zinc-400', ring: 'bg-zinc-500/10' };
              return (
                <div key={log.id} className="flex items-center gap-4 px-5 py-3">
                  <div className={`w-7 h-7 rounded-full ${meta.ring} flex items-center justify-center flex-shrink-0`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-800 dark:text-zinc-200">{meta.label}</p>
                    <p className="text-xs text-zinc-400 truncate">
                      {log.ipAddress && `${log.ipAddress} · `}{log.resource}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-400 dark:text-zinc-600 flex-shrink-0">{timeAgo(log.createdAt)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-5">
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 tracking-tight mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href="/dashboard/apps/new"
                className="flex items-center gap-3 w-full px-3.5 py-2.5 bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-violet-500/25 rounded-lg text-sm text-violet-700 dark:text-violet-300 hover:from-violet-600/30 hover:to-purple-600/30 transition-all font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>
                </svg>
                Create application
              </Link>
              <Link
                href="/dashboard/apps"
                className="flex items-center gap-3 w-full px-3.5 py-2.5 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                </svg>
                Manage apps
              </Link>
              <Link
                href="/docs/quickstart"
                target="_blank"
                className="flex items-center gap-3 w-full px-3.5 py-2.5 bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                Read the docs
              </Link>
            </div>
          </div>

          <div className="glass-card rounded-xl p-5 border-violet-500/20 dark:border-violet-500/20" style={{ background: 'rgba(124,58,237,0.06)' }}>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 tracking-tight">Integration tip</p>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Each app gets a unique <code className="text-violet-600 dark:text-violet-300 bg-violet-500/10 px-1 rounded font-mono">clientId</code>.
              Pass it to the SDK — your users are automatically scoped to that app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
