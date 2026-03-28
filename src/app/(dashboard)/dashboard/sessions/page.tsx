'use client';

import { useEffect, useState, useCallback } from 'react';
import { useDashboardAuth } from '@/components/dashboard/provider';
import { useToast } from '@/components/dashboard/toast';
import {
  getApps,
  getSessions,
  revokeSession,
  type TenantApp,
  type SessionInfo,
} from '@/lib/dashboard-api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function truncate(str: string, len = 12): string {
  return str.length <= len ? str : `${str.slice(0, len)}…`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {[...Array(4)].map((_, i) => (
        <tr key={i} className="border-b border-zinc-100 dark:border-white/[0.04]">
          {[...Array(5)].map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" style={{ width: j === 0 ? '96px' : j === 4 ? '56px' : '120px' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SessionsPage() {
  const { token }                               = useDashboardAuth();
  const { toast }                               = useToast();

  const [apps, setApps]                         = useState<TenantApp[]>([]);
  const [appsLoading, setAppsLoading]           = useState(true);
  const [selectedAppId, setSelectedAppId]       = useState<string>('');

  const [sessions, setSessions]                 = useState<SessionInfo[]>([]);
  const [sessionsLoading, setSessionsLoading]   = useState(false);
  const [revoking, setRevoking]                 = useState<string | null>(null);

  // Load apps once
  useEffect(() => {
    if (!token) return;
    getApps(token)
      .then(setApps)
      .catch(e => toast({ message: e instanceof Error ? e.message : 'Failed to load apps.', type: 'error' }))
      .finally(() => setAppsLoading(false));
  }, [token]);

  // Load sessions when app selected
  const loadSessions = useCallback(async (appId: string) => {
    if (!token || !appId) return;
    setSessionsLoading(true);
    try {
      const data = await getSessions(token, appId);
      setSessions(data);
    } catch (e) {
      toast({ message: e instanceof Error ? e.message : 'Failed to load sessions.', type: 'error' });
    } finally {
      setSessionsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (selectedAppId) loadSessions(selectedAppId);
    else setSessions([]);
  }, [selectedAppId, loadSessions]);

  const handleRevoke = async (sessionId: string) => {
    if (!token) return;
    setRevoking(sessionId);
    try {
      await revokeSession(token, sessionId);
      toast({ message: 'Session revoked.', type: 'success' });
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (e) {
      toast({ message: e instanceof Error ? e.message : 'Failed to revoke session.', type: 'error' });
    } finally {
      setRevoking(null);
    }
  };

  const selectedApp = apps.find(a => a.id === selectedAppId);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Sessions</h1>
          <p className="text-zinc-400 text-sm mt-1">View and revoke active user sessions for your applications.</p>
        </div>

        {/* App selector */}
        <div>
          {appsLoading ? (
            <div className="w-44 h-9 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
          ) : (
            <select
              value={selectedAppId}
              onChange={e => setSelectedAppId(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 min-w-[180px]"
            >
              <option value="">Select an app…</option>
              {apps.map(app => (
                <option key={app.id} value={app.id}>{app.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* No app selected */}
      {!selectedAppId ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06] rounded-xl p-16 text-center">
          <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <rect x="2" y="4" width="20" height="14" rx="2"/>
              <path d="M8 20h8M12 18v2"/>
            </svg>
          </div>
          <p className="text-zinc-400 text-sm">Select an application to view its active sessions.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
          {/* Card header */}
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-white/[0.06] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Active Sessions</h2>
              {selectedApp && (
                <p className="text-xs text-zinc-500 mt-0.5">{selectedApp.name}</p>
              )}
            </div>
            {!sessionsLoading && (
              <button
                onClick={() => loadSessions(selectedAppId)}
                className="text-xs text-zinc-500 hover:text-violet-400 border border-zinc-200 dark:border-white/[0.06] hover:border-violet-500/30 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 3v5h-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Refresh
              </button>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">User ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">App</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Expires</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {sessionsLoading ? (
                  <SkeletonRows />
                ) : sessions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-zinc-500 text-sm">
                      No active sessions found.
                    </td>
                  </tr>
                ) : (
                  sessions.map(session => (
                    <tr key={session.id} className="border-b border-zinc-100 dark:border-white/[0.04] hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <span
                          className="font-mono text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded"
                          title={session.userId}
                        >
                          {truncate(session.userId, 14)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">
                        {apps.find(a => a.id === session.appId)?.name ?? truncate(session.appId, 12)}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">
                        {formatDate(session.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">
                        {formatDate(session.expiresAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRevoke(session.id)}
                          disabled={revoking === session.id}
                          className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {revoking === session.id ? 'Revoking…' : 'Revoke'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
