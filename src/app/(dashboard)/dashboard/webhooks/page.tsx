'use client';

import { useEffect, useState, useCallback } from 'react';
import { useDashboardAuth } from '@/components/dashboard/provider';
import { useToast } from '@/components/dashboard/toast';
import {
  getApps,
  getWebhooks,
  createWebhook,
  deleteWebhook,
  toggleWebhook,
  getWebhookDeliveries,
  type TenantApp,
  type WebhookInfo,
  type WebhookDelivery,
} from '@/lib/dashboard-api';

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${ok ? 'bg-emerald-400' : 'bg-zinc-400 dark:bg-zinc-600'}`} />
  );
}

function DeliveryStatusBadge({ status }: { status: number }) {
  const ok = status >= 200 && status < 300;
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-mono ${ok ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
      {status === 0 ? 'ERR' : status}
    </span>
  );
}

function SkeletonRows() {
  return (
    <>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-zinc-200/40 dark:bg-zinc-800/40 animate-pulse" />
      ))}
    </>
  );
}

export default function WebhooksPage() {
  const { session } = useDashboardAuth();
  const { toast } = useToast();

  const [apps, setApps]               = useState<TenantApp[]>([]);
  const [selectedApp, setSelectedApp] = useState('');
  const [webhooks, setWebhooks]       = useState<WebhookInfo[]>([]);
  const [events, setEvents]           = useState<string[]>([]);
  const [loading, setLoading]         = useState(false);
  const [creating, setCreating]       = useState(false);

  // New webhook form
  const [newUrl, setNewUrl]         = useState('');
  const [newEvents, setNewEvents]   = useState<Set<string>>(new Set());
  const [showForm, setShowForm]     = useState(false);

  // Delivery drawer
  const [drawerHook, setDrawerHook]         = useState<WebhookInfo | null>(null);
  const [deliveries, setDeliveries]         = useState<WebhookDelivery[]>([]);
  const [deliveriesLoading, setDLoading]    = useState(false);

  const token = session?.tokens.accessToken ?? '';

  // Load apps
  useEffect(() => {
    if (!token) return;
    getApps(token)
      .then(list => {
        setApps(list);
        if (list.length > 0) setSelectedApp(list[0].id);
      })
      .catch(() => toast({ message: 'Failed to load apps', type: 'error' }));
  }, [token]);

  // Load webhooks when app changes
  const loadWebhooks = useCallback(async (appId: string) => {
    if (!appId || !token) return;
    setLoading(true);
    try {
      const data = await getWebhooks(token, appId);
      setWebhooks(data.webhooks);
      setEvents(data.availableEvents);
    } catch {
      toast({ message: 'Failed to load webhooks', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (selectedApp) loadWebhooks(selectedApp);
  }, [selectedApp, loadWebhooks]);

  const toggleEvent = (ev: string) => {
    setNewEvents(prev => {
      const next = new Set(prev);
      next.has(ev) ? next.delete(ev) : next.add(ev);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!newUrl.trim()) return toast({ message: 'URL is required', type: 'error' });
    if (newEvents.size === 0) return toast({ message: 'Select at least one event', type: 'error' });
    setCreating(true);
    try {
      const hook = await createWebhook(token, selectedApp, { url: newUrl.trim(), events: [...newEvents] });
      setWebhooks(prev => [hook, ...prev]);
      setShowForm(false);
      setNewUrl('');
      setNewEvents(new Set());
      toast({ message: "Webhook created — save the secret now, it won't be shown again", type: 'success' });
    } catch (e: unknown) {
      toast({ message: e instanceof Error ? e.message : 'Create failed', type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (hook: WebhookInfo) => {
    if (!confirm(`Delete webhook for ${hook.url}?`)) return;
    try {
      await deleteWebhook(token, hook.id, selectedApp);
      setWebhooks(prev => prev.filter(h => h.id !== hook.id));
      toast({ message: 'Webhook deleted', type: 'success' });
    } catch {
      toast({ message: 'Failed to delete webhook', type: 'error' });
    }
  };

  const handleToggle = async (hook: WebhookInfo) => {
    try {
      const updated = await toggleWebhook(token, hook.id, selectedApp);
      setWebhooks(prev => prev.map(h => h.id === hook.id ? updated : h));
    } catch {
      toast({ message: 'Failed to toggle webhook', type: 'error' });
    }
  };

  const openDeliveries = async (hook: WebhookInfo) => {
    setDrawerHook(hook);
    setDLoading(true);
    try {
      const data = await getWebhookDeliveries(token, hook.id, selectedApp);
      setDeliveries(data);
    } catch {
      toast({ message: 'Failed to load deliveries', type: 'error' });
    } finally {
      setDLoading(false);
    }
  };

  const selectedAppName = apps.find(a => a.id === selectedApp)?.name ?? '';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Webhooks</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Receive real-time events when users register, login, or take actions.
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          disabled={!selectedApp}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          New webhook
        </button>
      </div>

      {/* App selector */}
      {apps.length > 1 && (
        <div className="mb-5">
          <label className="text-xs text-zinc-500 block mb-1.5">Application</label>
          <select
            value={selectedApp}
            onChange={e => setSelectedApp(e.target.value)}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-100 text-sm rounded-lg px-3 py-2 outline-none focus:border-violet-500/50 w-full sm:w-auto"
          >
            {apps.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="mb-6 p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06] rounded-xl space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Create webhook — {selectedAppName}</h2>

          <div>
            <label className="text-xs text-zinc-500 block mb-1.5">Endpoint URL</label>
            <input
              type="url"
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              placeholder="https://your-app.com/webhooks/authsaas"
              className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-100 text-sm rounded-lg px-3 py-2 outline-none focus:border-violet-500/50 placeholder-zinc-400 dark:placeholder-zinc-600"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500 block mb-2">Events to subscribe</label>
            <div className="flex flex-wrap gap-2">
              {events.map(ev => (
                <button
                  key={ev}
                  type="button"
                  onClick={() => toggleEvent(ev)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                    newEvents.has(ev)
                      ? 'bg-violet-600/20 border-violet-500/40 text-violet-300'
                      : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-white/[0.06] text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                  }`}
                >
                  {ev}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {creating ? 'Creating…' : 'Create webhook'}
            </button>
            <button
              onClick={() => { setShowForm(false); setNewUrl(''); setNewEvents(new Set()); }}
              className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Webhook list */}
      <div className="space-y-3">
        {loading ? (
          <SkeletonRows />
        ) : webhooks.length === 0 ? (
          <div className="text-center py-16 text-zinc-400 dark:text-zinc-500 text-sm">
            No webhooks yet — create one to start receiving events.
          </div>
        ) : (
          webhooks.map(hook => (
            <div key={hook.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06] rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <StatusDot ok={hook.isActive} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-800 dark:text-zinc-100 font-mono truncate">{hook.url}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {hook.events.map(ev => (
                      <span key={ev} className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-mono border border-zinc-200 dark:border-white/[0.06]">
                        {ev}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-600 mt-1.5 font-mono">
                    secret: {hook.secret}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => openDeliveries(hook)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
                  >
                    Deliveries
                  </button>
                  <button
                    onClick={() => handleToggle(hook)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                      hook.isActive
                        ? 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
                        : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400'
                    }`}
                  >
                    {hook.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleDelete(hook)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delivery drawer */}
      {drawerHook && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerHook(null)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-white/[0.06] flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-white/[0.06]">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">Delivery log</p>
                <p className="text-xs text-zinc-500 font-mono mt-0.5 truncate max-w-xs">{drawerHook.url}</p>
              </div>
              <button onClick={() => setDrawerHook(null)} className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {deliveriesLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-lg bg-zinc-200/40 dark:bg-zinc-800/40 animate-pulse" />)}
                </div>
              ) : deliveries.length === 0 ? (
                <p className="text-center text-zinc-400 dark:text-zinc-500 text-sm py-12">No deliveries yet.</p>
              ) : (
                deliveries.map(d => (
                  <div key={d.id} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.06] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300">{d.event}</span>
                      <div className="flex items-center gap-2">
                        <DeliveryStatusBadge status={d.status} />
                        <span className="text-xs text-zinc-400 dark:text-zinc-600">
                          {new Date(d.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    {d.response && (
                      <p className="text-xs text-zinc-500 font-mono truncate">{d.response}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
