'use client';

import { useEffect, useState, useCallback } from 'react';
import { useDashboardAuth } from '@/components/dashboard/provider';
import { useToast } from '@/components/dashboard/toast';
import {
  getApps,
  getRoles,
  createRole,
  updateRolePermissions,
  type TenantApp,
  type RoleWithPermissions,
} from '@/lib/dashboard-api';

// ─── Permissions catalog ───────────────────────────────────────────────────────

const PERMISSIONS_CATALOG: Record<string, string[]> = {
  profile:  ['read', 'update'],
  users:    ['read', 'create', 'update', 'delete'],
  roles:    ['read', 'create', 'update', 'delete'],
  apps:     ['read', 'create', 'update', 'delete'],
  audit:    ['read'],
  settings: ['read', 'update'],
};

const ALL_PERMISSIONS = Object.entries(PERMISSIONS_CATALOG).flatMap(([resource, actions]) =>
  actions.map(action => `${action}:${resource}`),
);

// ─── Helpers ───────────────────────────────────────────────────────────────────

const DEFAULT_ROLES = new Set(['owner', 'admin', 'user']);

function isDefaultRole(name: string) {
  return DEFAULT_ROLES.has(name.toLowerCase());
}

function roleChipClass(name: string) {
  if (isDefaultRole(name)) return 'bg-zinc-200/60 dark:bg-zinc-700/60 text-zinc-500 dark:text-zinc-400 border-zinc-300 dark:border-white/[0.08]';
  return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
}

// Permission badge: "read:profile" → "read · profile"
function PermBadge({ perm }: { perm: string }) {
  const [action, resource] = perm.split(':');
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/[0.06] rounded text-xs">
      <span className="text-zinc-500">{action}</span>
      <span className="text-zinc-400 dark:text-zinc-600">·</span>
      <span className="text-zinc-700 dark:text-zinc-200">{resource}</span>
    </span>
  );
}

// ─── Skeleton cards ────────────────────────────────────────────────────────────

function SkeletonCards() {
  return (
    <>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06] rounded-xl p-5 animate-pulse space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-24 h-5 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="w-14 h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
          </div>
          <div className="w-48 h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="flex gap-2 flex-wrap">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="w-20 h-5 bg-zinc-200 dark:bg-zinc-800 rounded" />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

// ─── Permission checklist (grouped) ───────────────────────────────────────────

interface PermChecklistProps {
  selected: string[];
  onChange: (perms: string[]) => void;
}

function PermChecklist({ selected, onChange }: PermChecklistProps) {
  const toggle = (perm: string) => {
    onChange(
      selected.includes(perm) ? selected.filter(p => p !== perm) : [...selected, perm],
    );
  };

  return (
    <div className="space-y-3">
      {Object.entries(PERMISSIONS_CATALOG).map(([resource, actions]) => (
        <div key={resource}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-1.5">{resource}</p>
          <div className="flex flex-wrap gap-2">
            {actions.map(action => {
              const perm = `${action}:${resource}`;
              const checked = selected.includes(perm);
              return (
                <button
                  key={perm}
                  type="button"
                  onClick={() => toggle(perm)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-all ${
                    checked
                      ? 'bg-violet-500/15 text-violet-300 border-violet-500/30'
                      : 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 border-zinc-200 dark:border-white/[0.06] hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {checked && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {action}:{resource}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Create role form card ─────────────────────────────────────────────────────

interface CreateRoleFormProps {
  token: string;
  appId: string;
  onCreated: () => void;
  onCancel: () => void;
}

function CreateRoleForm({ token, appId, onCreated, onCancel }: CreateRoleFormProps) {
  const { toast } = useToast();
  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [perms, setPerms]             = useState<string[]>([]);
  const [saving, setSaving]           = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createRole(token, appId, { name: name.trim(), description: description.trim() || undefined, permissions: perms });
      toast({ message: `Role "${name.trim()}" created.`, type: 'success' });
      onCreated();
    } catch (err) {
      toast({ message: err instanceof Error ? err.message : 'Failed to create role.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-violet-500/20 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Create new role</h2>
        <button onClick={onCancel} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Role name <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. moderator"
              className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 placeholder-zinc-400 dark:placeholder-zinc-600"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Description</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 placeholder-zinc-400 dark:placeholder-zinc-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-2">Permissions</label>
          <PermChecklist selected={perms} onChange={setPerms} />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all"
          >
            {saving ? 'Creating…' : 'Create role'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Role card ─────────────────────────────────────────────────────────────────

interface RoleCardProps {
  role: RoleWithPermissions;
  token: string;
  appId: string;
  onUpdated: (updated: RoleWithPermissions) => void;
}

function RoleCard({ role, token, appId, onUpdated }: RoleCardProps) {
  const { toast } = useToast();
  const [expanded, setExpanded]       = useState(false);
  const [editingPerms, setEditingPerms] = useState(false);
  const [draftPerms, setDraftPerms]   = useState<string[]>(role.permissions);
  const [saving, setSaving]           = useState(false);

  const isDefault = isDefaultRole(role.name);

  // Group permissions by resource for display
  const grouped = role.permissions.reduce<Record<string, string[]>>((acc, perm) => {
    const [action, resource] = perm.split(':');
    if (!acc[resource]) acc[resource] = [];
    acc[resource].push(action);
    return acc;
  }, {});

  const savePerms = async () => {
    setSaving(true);
    try {
      await updateRolePermissions(token, role.id, appId, draftPerms);
      onUpdated({ ...role, permissions: draftPerms });
      setEditingPerms(false);
      toast({ message: 'Permissions updated.', type: 'success' });
    } catch (err) {
      toast({ message: err instanceof Error ? err.message : 'Failed to update permissions.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06] rounded-xl overflow-hidden transition-all">
      {/* Card header */}
      <button
        onClick={() => { setExpanded(e => !e); setEditingPerms(false); }}
        className="w-full text-left px-5 py-4 hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-semibold text-zinc-800 dark:text-zinc-100 capitalize">{role.name}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${roleChipClass(role.name)}`}>
                {isDefault ? 'Default' : 'Custom'}
              </span>
            </div>
            {role.description && (
              <p className="text-xs text-zinc-500 mt-0.5 truncate">{role.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs text-zinc-500">{role.userCount} user{role.userCount !== 1 ? 's' : ''}</span>
            <span className="text-xs text-zinc-400 dark:text-zinc-600">{role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}</span>
            <svg
              className={`w-4 h-4 text-zinc-400 dark:text-zinc-600 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
            >
              <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-zinc-200 dark:border-white/[0.06] px-5 py-4 space-y-4">
          {!editingPerms ? (
            <>
              {/* Permission display */}
              {role.permissions.length === 0 ? (
                <p className="text-xs text-zinc-400 dark:text-zinc-600">No permissions assigned.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(grouped).map(([resource, actions]) => (
                    <div key={resource} className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600 w-16 flex-shrink-0">{resource}</span>
                      {actions.map(action => (
                        <PermBadge key={`${action}:${resource}`} perm={`${action}:${resource}`} />
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Edit button for non-default roles */}
              {!isDefault && (
                <button
                  onClick={e => { e.stopPropagation(); setDraftPerms(role.permissions); setEditingPerms(true); }}
                  className="text-xs text-zinc-500 hover:text-violet-400 border border-zinc-200 dark:border-white/[0.06] hover:border-violet-500/30 px-3 py-1.5 rounded-lg transition-all"
                >
                  Edit permissions
                </button>
              )}
            </>
          ) : (
            <>
              <PermChecklist selected={draftPerms} onChange={setDraftPerms} />
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={savePerms}
                  disabled={saving}
                  className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-all"
                >
                  {saving ? 'Saving…' : 'Save permissions'}
                </button>
                <button
                  onClick={() => setEditingPerms(false)}
                  className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function RolesPage() {
  const { token }                               = useDashboardAuth();
  const { toast }                               = useToast();

  const [apps, setApps]                         = useState<TenantApp[]>([]);
  const [appsLoading, setAppsLoading]           = useState(true);
  const [selectedAppId, setSelectedAppId]       = useState<string>('');

  const [roles, setRoles]                       = useState<RoleWithPermissions[]>([]);
  const [rolesLoading, setRolesLoading]         = useState(false);
  const [showCreateForm, setShowCreateForm]     = useState(false);

  // Load apps once
  useEffect(() => {
    if (!token) return;
    getApps(token)
      .then(setApps)
      .catch(err => toast({ message: err instanceof Error ? err.message : 'Failed to load apps.', type: 'error' }))
      .finally(() => setAppsLoading(false));
  }, [token]);

  // Load roles when app selected
  const loadRoles = useCallback(async (appId: string) => {
    if (!token || !appId) return;
    setRolesLoading(true);
    try {
      const r = await getRoles(token, appId);
      setRoles(r);
    } catch (err) {
      toast({ message: err instanceof Error ? err.message : 'Failed to load roles.', type: 'error' });
    } finally {
      setRolesLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (selectedAppId) loadRoles(selectedAppId);
    else setRoles([]);
  }, [selectedAppId, loadRoles]);

  const handleRoleUpdated = (updated: RoleWithPermissions) => {
    setRoles(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  const handleCreated = () => {
    setShowCreateForm(false);
    if (selectedAppId) loadRoles(selectedAppId);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Roles</h1>
          <p className="text-zinc-400 text-sm mt-1">Define roles and permissions for your app&apos;s users.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* App selector */}
          {appsLoading ? (
            <div className="w-44 h-9 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
          ) : (
            <select
              value={selectedAppId}
              onChange={e => { setSelectedAppId(e.target.value); setShowCreateForm(false); }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 min-w-[180px]"
            >
              <option value="">Select an app…</option>
              {apps.map(app => (
                <option key={app.id} value={app.id}>{app.name}</option>
              ))}
            </select>
          )}

          {/* Create role button */}
          {selectedAppId && !showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-medium rounded-lg transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
              </svg>
              Create role
            </button>
          )}
        </div>
      </div>

      {/* No app selected */}
      {!selectedAppId ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06] rounded-xl p-16 text-center">
          <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <p className="text-zinc-400 text-sm">Select an application to view its roles.</p>
        </div>
      ) : (
        <>
          {/* Create role form */}
          {showCreateForm && token && (
            <CreateRoleForm
              token={token}
              appId={selectedAppId}
              onCreated={handleCreated}
              onCancel={() => setShowCreateForm(false)}
            />
          )}

          {/* Roles grid */}
          {rolesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SkeletonCards />
            </div>
          ) : roles.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06] rounded-xl p-16 text-center">
              <p className="text-zinc-500 text-sm">No roles defined yet. Create your first role above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map(role => (
                token && (
                  <RoleCard
                    key={role.id}
                    role={role}
                    token={token}
                    appId={selectedAppId}
                    onUpdated={handleRoleUpdated}
                  />
                )
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
