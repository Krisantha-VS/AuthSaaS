'use client';

import { useEffect, useState } from 'react';
import { useDashboardAuth } from '@/components/dashboard/provider';
import { getAuditLogs, type AuditLog } from '@/lib/dashboard-api';

const ACTION_META: Record<string, { label: string; color: string }> = {
  tenant_register:  { label: 'Account created',       color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  tenant_login:     { label: 'Admin signed in',        color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  app_created:      { label: 'App created',            color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  secret_rotated:   { label: 'Secret rotated',         color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  user_register:    { label: 'User registered',        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  user_login:       { label: 'User login',             color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  user_logout:      { label: 'User logout',            color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' },
  token_refresh:    { label: 'Token refreshed',        color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' },
  token_reuse:      { label: '⚠ Token reuse detected', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
};

export default function AuditPage() {
  const { token }           = useDashboardAuth();
  const [logs, setLogs]     = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getAuditLogs(token, 100).then(setLogs).finally(() => setLoading(false));
  }, [token]);

  const fmt = (d: string) => new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Audit Log</h1>
        <p className="text-zinc-400 text-sm mt-1">Immutable record of all authentication events across your apps.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-white/[0.06] flex items-center justify-between">
          <p className="text-xs text-zinc-500">Showing last {logs.length} events</p>
          <span className="text-xs text-zinc-400 dark:text-zinc-600">UTC timestamps</span>
        </div>

        {loading ? (
          <div className="divide-y divide-zinc-100 dark:divide-white/[0.04]">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-24 h-5 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="w-32 h-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="flex-1 h-4 bg-zinc-200 dark:bg-zinc-800 rounded" />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-zinc-500 text-sm">No audit events yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-white/[0.04]">
            {logs.map(log => {
              const meta = ACTION_META[log.action];
              return (
                <div key={log.id} className="flex items-center gap-5 px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                  <span className="text-xs text-zinc-400 dark:text-zinc-600 font-mono w-32 flex-shrink-0">{fmt(log.createdAt)}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border flex-shrink-0 w-44 justify-center ${meta?.color ?? 'text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-white/[0.08]'}`}>
                    {meta?.label ?? log.action}
                  </span>
                  <span className="text-xs text-zinc-500 flex-shrink-0">{log.resource}</span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-600 font-mono flex-1 truncate">{log.ipAddress ?? '—'}</span>
                  {log.userId && (
                    <span className="text-xs text-zinc-400 dark:text-zinc-600 font-mono truncate max-w-[140px]" title={log.userId}>
                      user:{log.userId.slice(0, 8)}…
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
