'use client';

import { useDashboardAuth } from '@/components/dashboard/provider';
import { CopyBtn } from '@/components/dashboard/copy-btn';

export default function SettingsPage() {
  const { session, logout } = useDashboardAuth();
  if (!session) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-zinc-400 text-sm mt-1">Manage your developer account.</p>
      </div>

      {/* Profile */}
      <div className="bg-zinc-900 border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-zinc-100">Account</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
              {session.tenant.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-white">{session.tenant.name}</p>
              <p className="text-sm text-zinc-400">{session.tenant.email}</p>
            </div>
          </div>

          <div className="grid gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Tenant ID</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3.5 py-2.5 bg-zinc-800 border border-white/[0.08] rounded-lg text-sm font-mono text-zinc-400">
                  {session.tenant.id}
                </code>
                <CopyBtn text={session.tenant.id} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API base URL */}
      <div className="bg-zinc-900 border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-zinc-100">API Configuration</h2>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">API Base URL</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3.5 py-2.5 bg-zinc-800 border border-white/[0.08] rounded-lg text-sm font-mono text-zinc-300">
                {process.env.NEXT_PUBLIC_APP_URL}/api/v1
              </code>
              <CopyBtn text={`${process.env.NEXT_PUBLIC_APP_URL}/api/v1`} />
            </div>
          </div>
          <p className="text-xs text-zinc-600">Use this as the <code className="text-zinc-500">baseUrl</code> in your SDK config.</p>
        </div>
      </div>

      {/* Danger */}
      <div className="bg-zinc-900 border border-red-500/20 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-red-500/10">
          <h2 className="text-sm font-semibold text-red-400">Session</h2>
        </div>
        <div className="p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-200">Sign out</p>
            <p className="text-xs text-zinc-500 mt-0.5">Clears your local session. Your apps remain active.</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-lg transition-all"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
