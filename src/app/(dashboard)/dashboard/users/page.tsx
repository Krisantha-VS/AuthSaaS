'use client';

import { useEffect, useState, useCallback } from 'react';
import { useDashboardAuth } from '@/components/dashboard/provider';
import { useToast } from '@/components/dashboard/toast';
import {
  getApps,
  getUsers,
  getRoles,
  updateUserRoles,
  toggleUserStatus,
  type TenantApp,
  type UserWithRoles,
  type RoleWithPermissions,
} from '@/lib/dashboard-api';

// ─── Role badge colours ────────────────────────────────────────────────────────

function roleBadgeClass(role: string): string {
  if (role === 'owner')  return 'bg-violet-500/15 text-violet-300 border-violet-500/25';
  if (role === 'admin')  return 'bg-blue-500/15 text-blue-300 border-blue-500/25';
  if (role === 'user')   return 'bg-zinc-700/60 text-zinc-300 border-white/[0.08]';
  return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25';
}

// ─── Avatar initial ────────────────────────────────────────────────────────────

function Avatar({ name, email }: { name?: string; email: string }) {
  const letter = (name?.[0] ?? email[0]).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
      {letter}
    </div>
  );
}

// ─── Skeleton rows ─────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-800" />
              <div className="space-y-1.5">
                <div className="w-28 h-3.5 bg-zinc-800 rounded" />
                <div className="w-40 h-3 bg-zinc-800 rounded" />
              </div>
            </div>
          </td>
          <td className="px-5 py-4"><div className="w-20 h-5 bg-zinc-800 rounded-full" /></td>
          <td className="px-5 py-4"><div className="w-12 h-5 bg-zinc-800 rounded-full" /></td>
          <td className="px-5 py-4"><div className="w-16 h-6 bg-zinc-800 rounded-full" /></td>
          <td className="px-5 py-4"><div className="w-14 h-6 bg-zinc-800 rounded-lg" /></td>
        </tr>
      ))}
    </>
  );
}

// ─── Manage row (inline expanded panel) ───────────────────────────────────────

interface ManageRowProps {
  user: UserWithRoles;
  roles: RoleWithPermissions[];
  token: string;
  appId: string;
  onUpdate: (updated: UserWithRoles) => void;
}

function ManageRow({ user, roles, token, appId, onUpdate }: ManageRowProps) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<string[]>(user.roles);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const toggleRole = (roleName: string) => {
    setSelected(prev =>
      prev.includes(roleName) ? prev.filter(r => r !== roleName) : [...prev, roleName],
    );
  };

  const saveRoles = async () => {
    setSaving(true);
    try {
      await updateUserRoles(token, user.id, appId, selected);
      onUpdate({ ...user, roles: selected });
      toast({ message: 'Roles updated successfully.', type: 'success' });
    } catch (err) {
      toast({ message: err instanceof Error ? err.message : 'Failed to update roles.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    setToggling(true);
    try {
      const updated = await toggleUserStatus(token, user.id, appId);
      onUpdate(updated);
      toast({ message: `User ${updated.isActive ? 'activated' : 'deactivated'}.`, type: 'success' });
    } catch (err) {
      toast({ message: err instanceof Error ? err.message : 'Failed to toggle status.', type: 'error' });
    } finally {
      setToggling(false);
    }
  };

  return (
    <tr>
      <td colSpan={5} className="px-5 py-4 bg-zinc-800/40 border-b border-white/[0.04]">
        <div className="flex flex-col gap-4 max-w-2xl">
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Roles</p>
            <div className="flex flex-wrap gap-2">
              {roles.map(role => {
                const assigned = selected.includes(role.name);
                return (
                  <button
                    key={role.id}
                    onClick={() => toggleRole(role.name)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                      assigned
                        ? roleBadgeClass(role.name)
                        : 'bg-transparent text-zinc-500 border-white/[0.10] hover:border-zinc-500'
                    }`}
                  >
                    {role.name}
                  </button>
                );
              })}
              {roles.length === 0 && (
                <p className="text-xs text-zinc-600">No roles defined for this app yet.</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={saveRoles}
              disabled={saving}
              className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-all"
            >
              {saving ? 'Saving…' : 'Save roles'}
            </button>

            <button
              onClick={handleToggleStatus}
              disabled={toggling}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all disabled:opacity-50 ${
                user.isActive
                  ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
            >
              {toggling ? '…' : user.isActive ? 'Deactivate user' : 'Activate user'}
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { token }                               = useDashboardAuth();
  const { toast }                               = useToast();

  const [apps, setApps]                         = useState<TenantApp[]>([]);
  const [appsLoading, setAppsLoading]           = useState(true);
  const [selectedAppId, setSelectedAppId]       = useState<string>('');

  const [users, setUsers]                       = useState<UserWithRoles[]>([]);
  const [roles, setRoles]                       = useState<RoleWithPermissions[]>([]);
  const [usersLoading, setUsersLoading]         = useState(false);

  const [expandedUserId, setExpandedUserId]     = useState<string | null>(null);

  // Load apps once
  useEffect(() => {
    if (!token) return;
    getApps(token)
      .then(setApps)
      .catch(err => toast({ message: err instanceof Error ? err.message : 'Failed to load apps.', type: 'error' }))
      .finally(() => setAppsLoading(false));
  }, [token]);

  // Load users + roles when app is selected
  const loadAppData = useCallback(async (appId: string) => {
    if (!token || !appId) return;
    setUsersLoading(true);
    setExpandedUserId(null);
    try {
      const [u, r] = await Promise.all([getUsers(token, appId), getRoles(token, appId)]);
      setUsers(u);
      setRoles(r);
    } catch (err) {
      toast({ message: err instanceof Error ? err.message : 'Failed to load users.', type: 'error' });
    } finally {
      setUsersLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (selectedAppId) loadAppData(selectedAppId);
    else { setUsers([]); setRoles([]); }
  }, [selectedAppId, loadAppData]);

  const handleUserUpdate = (updated: UserWithRoles) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
  };

  // Stats
  const totalUsers    = users.length;
  const activeUsers   = users.filter(u => u.isActive).length;
  const verifiedUsers = users.filter(u => u.emailVerified).length;

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage your app&apos;s users and roles.</p>
        </div>

        {/* App selector */}
        <div className="flex items-center gap-2">
          {appsLoading ? (
            <div className="w-44 h-9 bg-zinc-800 rounded-lg animate-pulse" />
          ) : (
            <select
              value={selectedAppId}
              onChange={e => setSelectedAppId(e.target.value)}
              className="bg-zinc-900 border border-white/[0.08] text-zinc-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 min-w-[180px]"
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
        <div className="bg-zinc-900 border border-white/[0.06] rounded-xl p-16 text-center">
          <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <p className="text-zinc-400 text-sm">Select an application to view its users.</p>
        </div>
      ) : (
        <>
          {/* Stats row */}
          {!usersLoading && (
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-white/[0.06] rounded-lg">
                <span className="text-xs text-zinc-500">Total</span>
                <span className="text-sm font-semibold text-white">{totalUsers}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-white/[0.06] rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-zinc-500">Active</span>
                <span className="text-sm font-semibold text-emerald-400">{activeUsers}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-white/[0.06] rounded-lg">
                <span className="text-xs text-zinc-500">Verified</span>
                <span className="text-sm font-semibold text-blue-400">{verifiedUsers}</span>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-zinc-900 border border-white/[0.06] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-3.5">User</th>
                  <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-3.5">Roles</th>
                  <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-3.5">Verified</th>
                  <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {usersLoading ? (
                  <SkeletonRows />
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <p className="text-zinc-500 text-sm">No users yet. Share your clientId to start accepting registrations.</p>
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <>
                      <tr
                        key={user.id}
                        className="group hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Avatar + Name/Email */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={user.name} email={user.email} />
                            <div>
                              {user.name && (
                                <p className="text-sm font-medium text-zinc-100">{user.name}</p>
                              )}
                              <p className={`text-xs ${user.name ? 'text-zinc-500' : 'text-zinc-200 text-sm font-medium'}`}>
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Roles */}
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {user.roles.length === 0 ? (
                              <span className="text-xs text-zinc-600">—</span>
                            ) : (
                              user.roles.map(role => (
                                <span
                                  key={role}
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${roleBadgeClass(role)}`}
                                >
                                  {role}
                                </span>
                              ))
                            )}
                          </div>
                        </td>

                        {/* Verified */}
                        <td className="px-5 py-4">
                          {user.emailVerified ? (
                            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ) : (
                            <span className="text-zinc-600 text-sm">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            user.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-zinc-800 text-zinc-400 border-white/[0.06]'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        {/* Manage */}
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setExpandedUserId(prev => prev === user.id ? null : user.id)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                              expandedUserId === user.id
                                ? 'bg-violet-600/20 text-violet-300 border-violet-500/30'
                                : 'text-zinc-400 border-white/[0.08] hover:text-zinc-100 hover:border-zinc-600'
                            }`}
                          >
                            {expandedUserId === user.id ? 'Close' : 'Manage'}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded manage panel */}
                      {expandedUserId === user.id && token && (
                        <ManageRow
                          key={`manage-${user.id}`}
                          user={user}
                          roles={roles}
                          token={token}
                          appId={selectedAppId}
                          onUpdate={handleUserUpdate}
                        />
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
