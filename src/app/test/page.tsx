'use client';

import { useState } from 'react';

const BASE = '/api/v1';

function decode(token: string) {
  try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-zinc-700 rounded-lg p-5 space-y-3">
      <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <div className="flex items-start gap-2">
        <p className={`text-xs break-all flex-1 text-zinc-200 bg-zinc-800 rounded px-2 py-1.5 ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
        {value && (
          <button onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="text-xs text-zinc-500 hover:text-zinc-200 px-2 py-1.5 bg-zinc-800 rounded shrink-0">
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  );
}

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="text-xs text-zinc-400 block mb-1">{label}</label>
      <input {...props} className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-violet-500" />
    </div>
  );
}

function Btn({ onClick, children, variant = 'primary', disabled, small }: {
  onClick: () => void; children: React.ReactNode;
  variant?: 'primary' | 'danger' | 'ghost'; disabled?: boolean; small?: boolean;
}) {
  const cls = { primary: 'bg-violet-600 hover:bg-violet-500 text-white', danger: 'bg-red-600/80 hover:bg-red-600 text-white', ghost: 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200' }[variant];
  return (
    <button onClick={onClick} disabled={disabled}
      className={`rounded font-medium transition-colors disabled:opacity-40 ${small ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-sm'} ${cls}`}>
      {children}
    </button>
  );
}

const ALL_PERMISSIONS = [
  'read:profile','write:profile','read:users','write:users','delete:users',
  'read:roles','write:roles','read:audit','read:sessions','delete:sessions',
];

export default function TestPage() {
  // Auth state
  const [clientId, setClientId]         = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [name, setName]                 = useState('');
  const [accessToken, setAccessToken]   = useState('');
  const [refreshToken, setRefreshToken] = useState('');

  const [resetToken, setResetToken]     = useState('');

  // Users state
  const [appId, setAppId]               = useState('');
  const [users, setUsers]               = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Roles state
  const [roles, setRoles]               = useState<any[]>([]);
  const [newRoleName, setNewRoleName]   = useState('');
  const [newRoleDesc, setNewRoleDesc]   = useState('');
  const [newRolePerms, setNewRolePerms] = useState<string[]>([]);

  // Log
  const [log, setLog] = useState<{ ts: string; msg: string; ok: boolean }[]>([]);
  const addLog = (msg: string, ok: boolean) =>
    setLog(prev => [{ ts: new Date().toLocaleTimeString(), msg, ok }, ...prev].slice(0, 30));

  async function call(method: string, path: string, body?: object, token?: string) {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  }

  // ── Auth ────────────────────────────────────────────────────────────────────

  async function register() {
    const j = await call('POST', '/auth/register', { clientId, email, password, name });
    if (j.success) {
      setAccessToken(j.data.tokens.accessToken);
      setRefreshToken(j.data.tokens.refreshToken);
      setAppId(decode(j.data.tokens.accessToken)?.appId ?? '');
      addLog(`Registered → ${j.data.user.email}`, true);
    } else addLog(`Register failed: ${j.error}`, false);
  }

  async function login() {
    const j = await call('POST', '/auth/login', { clientId, email, password });
    if (j.success) {
      setAccessToken(j.data.tokens.accessToken);
      setRefreshToken(j.data.tokens.refreshToken);
      const d = decode(j.data.tokens.accessToken);
      setAppId(d?.appId ?? '');
      addLog(`Logged in → roles: [${d?.roles?.join(', ') || 'none'}]`, true);
    } else addLog(`Login failed: ${j.error}`, false);
  }

  async function refresh() {
    const j = await call('POST', '/auth/refresh', { refreshToken });
    if (j.success) { setAccessToken(j.data.accessToken); setRefreshToken(j.data.refreshToken); addLog('Token refreshed', true); }
    else addLog(`Refresh failed: ${j.error}`, false);
  }

  async function logout() {
    const j = await call('POST', '/auth/logout', {}, accessToken);
    if (j.success) { setAccessToken(''); setRefreshToken(''); addLog('Logged out', true); }
    else addLog(`Logout failed: ${j.error}`, false);
  }

  async function forgotPassword() {
    const j = await call('POST', '/auth/forgot-password', { clientId, email });
    addLog(j.success ? 'Reset email sent (check inbox)' : `Forgot failed: ${j.error}`, j.success);
  }

  async function resetPassword() {
    const j = await call('POST', '/auth/reset-password', { token: resetToken, email, password });
    addLog(j.success ? 'Password reset — login with new password' : `Reset failed: ${j.error}`, j.success);
  }

  // ── Users ────────────────────────────────────────────────────────────────────

  async function listUsers() {
    if (!appId) { addLog('Set App ID first (login to populate it)', false); return; }
    const j = await call('GET', `/users?appId=${appId}`, undefined, accessToken);
    if (j.success) { setUsers(j.data.users); addLog(`Fetched ${j.data.users.length} users`, true); }
    else addLog(`List users failed: ${j.error}`, false);
  }

  async function assignRoles() {
    if (!selectedUser) { addLog('Select a user first', false); return; }
    const j = await call('PUT', `/users/${selectedUser}/roles`, { appId, roles: selectedRoles }, accessToken);
    if (j.success) { addLog(`Roles updated → [${selectedRoles.join(', ')}]`, true); listUsers(); }
    else addLog(`Assign roles failed: ${j.error}`, false);
  }

  async function toggleStatus(userId: string) {
    const j = await call('PATCH', `/users/${userId}`, { appId }, accessToken);
    if (j.success) { addLog(`User ${j.data.user.isActive ? 'enabled' : 'disabled'}`, true); listUsers(); }
    else addLog(`Toggle failed: ${j.error}`, false);
  }

  // ── Roles ────────────────────────────────────────────────────────────────────

  async function listRoles() {
    if (!appId) { addLog('Set App ID first (login to populate it)', false); return; }
    const j = await call('GET', `/roles?appId=${appId}`, undefined, accessToken);
    if (j.success) { setRoles(j.data.roles); addLog(`Fetched ${j.data.roles.length} roles`, true); }
    else addLog(`List roles failed: ${j.error}`, false);
  }

  async function createRole() {
    if (!newRoleName) { addLog('Role name required', false); return; }
    const j = await call('POST', '/roles', { appId, name: newRoleName, description: newRoleDesc, permissions: newRolePerms }, accessToken);
    if (j.success) { addLog(`Role "${newRoleName}" created`, true); setNewRoleName(''); setNewRoleDesc(''); setNewRolePerms([]); listRoles(); }
    else addLog(`Create role failed: ${j.error}`, false);
  }

  const decoded = accessToken ? decode(accessToken) : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        <div className="border-b border-zinc-800 pb-4">
          <h1 className="text-xl font-bold text-white">AuthSaas — Test Sandbox</h1>
          <p className="text-sm text-zinc-500 mt-1">Dev-only page. Add <code className="text-violet-400 bg-violet-500/10 px-1 rounded">http://localhost:3000</code> to your app's allowed origins first.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* ── Left: Auth ── */}
          <div className="space-y-4">
            <Section title="Config">
              <Input label="Client ID" value={clientId} onChange={e => setClientId(e.target.value)} placeholder="from Dashboard → Apps" />
              <Input label="App ID (auto-filled on login)" value={appId} onChange={e => setAppId(e.target.value)} placeholder="app_xxx" />
            </Section>

            <Section title="User credentials">
              <Input label="Name (register only)" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" />
              <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" />
              <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Test1234!" />
            </Section>

            <Section title="Auth actions">
              <div className="flex flex-wrap gap-2">
                <Btn onClick={register} disabled={!clientId || !email || !password}>Register</Btn>
                <Btn onClick={login}    disabled={!clientId || !email || !password} variant="ghost">Login</Btn>
                <Btn onClick={refresh}  disabled={!refreshToken} variant="ghost">Refresh</Btn>
                <Btn onClick={logout}   disabled={!accessToken} variant="danger">Logout</Btn>
              </div>
            </Section>

            <Section title="Forgot / Reset password">
              <p className="text-xs text-zinc-500">1. Enter email + clientId above, click Send reset email.<br/>2. Check inbox, copy the token from the link URL.<br/>3. Enter token + new password, click Reset.</p>
              <Btn onClick={forgotPassword} disabled={!clientId || !email} variant="ghost">Send reset email</Btn>
              <Input label="Reset token (from email link ?token=...)" value={resetToken} onChange={e => setResetToken(e.target.value)} placeholder="paste token here" />
              <Btn onClick={resetPassword} disabled={!resetToken || !email || !password}>Reset password</Btn>
            </Section>

            <Section title="JWT">
              {decoded ? (
                <div className="space-y-2">
                  <Field label="User ID" value={decoded.sub} mono />
                  <Field label="Email"   value={decoded.email} />
                  <Field label="Roles"   value={JSON.stringify(decoded.roles)} mono />
                  <Field label="App ID"  value={decoded.appId} mono />
                  <Field label="Expires" value={decoded.exp ? new Date(decoded.exp * 1000).toLocaleString() : ''} />
                </div>
              ) : <p className="text-xs text-zinc-600">No token — login or register first.</p>}
            </Section>

            <Section title="Tokens">
              <Field label="Access token"  value={accessToken}  mono />
              <Field label="Refresh token" value={refreshToken} mono />
            </Section>
          </div>

          {/* ── Right: RBAC ── */}
          <div className="space-y-4">

            {/* Users */}
            <Section title="Users">
              <Btn onClick={listUsers} disabled={!accessToken || !appId} variant="ghost">Fetch users</Btn>
              {users.length > 0 && (
                <div className="space-y-2 mt-2">
                  {users.map(u => (
                    <div key={u.id} className="bg-zinc-800/60 rounded p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-zinc-200 font-medium truncate">{u.email}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${u.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {u.isActive ? 'active' : 'disabled'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {u.roles.map((r: string) => (
                          <span key={r} className="px-1.5 py-0.5 bg-violet-500/20 text-violet-300 rounded text-[10px]">{r}</span>
                        ))}
                        {u.roles.length === 0 && <span className="text-zinc-600">no roles</span>}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Btn small variant="ghost" onClick={() => { setSelectedUser(u.id); setSelectedRoles(u.roles); }}>
                          Select to edit roles
                        </Btn>
                        <Btn small variant="danger" onClick={() => toggleStatus(u.id)}>
                          {u.isActive ? 'Disable' : 'Enable'}
                        </Btn>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Assign roles */}
            <Section title="Assign roles to selected user">
              {selectedUser ? (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-400">User: <span className="text-zinc-200 font-mono">{selectedUser}</span></p>
                  <div className="grid grid-cols-2 gap-1">
                    {roles.length === 0 && <p className="text-xs text-zinc-600 col-span-2">Fetch roles first →</p>}
                    {roles.map((r: any) => (
                      <label key={r.id} className="flex items-center gap-2 text-xs cursor-pointer">
                        <input type="checkbox" checked={selectedRoles.includes(r.name)}
                          onChange={e => setSelectedRoles(prev => e.target.checked ? [...prev, r.name] : prev.filter(x => x !== r.name))}
                          className="accent-violet-500" />
                        <span className="text-zinc-300">{r.name}</span>
                      </label>
                    ))}
                  </div>
                  <Btn onClick={assignRoles} disabled={!accessToken}>Save roles</Btn>
                </div>
              ) : <p className="text-xs text-zinc-600">Select a user above first.</p>}
            </Section>

            {/* Roles */}
            <Section title="Roles">
              <Btn onClick={listRoles} disabled={!accessToken || !appId} variant="ghost">Fetch roles</Btn>
              {roles.length > 0 && (
                <div className="space-y-1 mt-2">
                  {roles.map((r: any) => (
                    <div key={r.id} className="bg-zinc-800/60 rounded px-3 py-2 flex items-center justify-between text-xs">
                      <span className="text-zinc-200 font-medium">{r.name}</span>
                      <span className="text-zinc-500">{r.permissions.length} permissions · {r.userCount} users</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Create role */}
            <Section title="Create custom role">
              <Input label="Role name" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="moderator" />
              <Input label="Description (optional)" value={newRoleDesc} onChange={e => setNewRoleDesc(e.target.value)} placeholder="Can moderate content" />
              <div>
                <p className="text-xs text-zinc-400 mb-2">Permissions</p>
                <div className="grid grid-cols-2 gap-1">
                  {ALL_PERMISSIONS.map(p => (
                    <label key={p} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input type="checkbox" checked={newRolePerms.includes(p)}
                        onChange={e => setNewRolePerms(prev => e.target.checked ? [...prev, p] : prev.filter(x => x !== p))}
                        className="accent-violet-500" />
                      <span className="text-zinc-300">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Btn onClick={createRole} disabled={!accessToken || !appId || !newRoleName}>Create role</Btn>
            </Section>

          </div>
        </div>

        {/* Log */}
        <Section title="Activity log">
          {log.length === 0
            ? <p className="text-xs text-zinc-600">No activity yet.</p>
            : <div className="space-y-1 font-mono">{log.map((l, i) => (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <span className="text-zinc-600 shrink-0">{l.ts}</span>
                  <span className={l.ok ? 'text-emerald-400' : 'text-red-400'}>{l.ok ? '✓' : '✗'}</span>
                  <span className="text-zinc-300">{l.msg}</span>
                </div>
              ))}</div>
          }
        </Section>

      </div>
    </div>
  );
}
