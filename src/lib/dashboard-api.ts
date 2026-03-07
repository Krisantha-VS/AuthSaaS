const BASE = '/api/v1/tenant';

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const json = await res.json() as { success: boolean; data: T; error?: string };
  if (!json.success) throw new Error(json.error ?? 'Request failed');
  return json.data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface TenantTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TenantInfo {
  id: string;
  name: string;
  email: string;
}

export interface AuthResult {
  tenant: TenantInfo;
  tokens: TenantTokens;
}

export function register(name: string, email: string, password: string) {
  return request<AuthResult>('/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export function login(email: string, password: string) {
  return request<AuthResult>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// ── Apps ──────────────────────────────────────────────────────────────────────

export interface TenantApp {
  id: string;
  clientId: string;
  name: string;
  description?: string;
  isActive: boolean;
  allowedOrigins: string[];
  createdAt: string;
  tenantId: string;
}

export interface CreateAppResult {
  app: TenantApp;
  clientSecret: string;
}

export function getApps(token: string) {
  return request<TenantApp[]>('/apps', {}, token);
}

export function getApp(token: string, appId: string) {
  return request<TenantApp>(`/apps/${appId}`, {}, token);
}

export function createApp(token: string, data: {
  name: string;
  description?: string;
  allowedOrigins: string[];
}) {
  return request<CreateAppResult>('/apps', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
}

export function updateApp(token: string, appId: string, data: Partial<{
  name: string;
  description: string;
  isActive: boolean;
  allowedOrigins: string[];
}>) {
  return request<TenantApp>(`/apps/${appId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }, token);
}

export function rotateSecret(token: string, appId: string) {
  return request<{ clientSecret: string }>(`/apps/${appId}/rotate`, {
    method: 'POST',
  }, token);
}

// ── Stats & Audit ─────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalApps: number;
  activeApps: number;
  totalUsers: number;
  auditEvents: number;
}

export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  appId?: string;
  userId?: string;
  ipAddress?: string;
  createdAt: string;
}

export function getStats(token: string) {
  return request<DashboardStats>('/stats', {}, token);
}

export function getAuditLogs(token: string, limit = 20) {
  return request<AuditLog[]>(`/audit?limit=${limit}`, {}, token);
}

// ─── RBAC Types ───────────────────────────────────────────────────────────────

export interface UserWithRoles {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  isActive: boolean;
  roles: string[];
  createdAt: string;
}

export interface RoleWithPermissions {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  userCount: number;
}

// ─── User Management ─────────────────────────────────────────────────────────

export async function getUsers(token: string, appId: string): Promise<UserWithRoles[]> {
  const res = await fetch(`${BASE}/users?appId=${appId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data.users;
}

export async function updateUserRoles(token: string, userId: string, appId: string, roles: string[]): Promise<void> {
  const res = await fetch(`${BASE}/users/${userId}/roles`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ appId, roles }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
}

export async function toggleUserStatus(token: string, userId: string, appId: string): Promise<UserWithRoles> {
  const res = await fetch(`${BASE}/users/${userId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ appId }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data.user;
}

// ─── Role Management ─────────────────────────────────────────────────────────

export async function getRoles(token: string, appId: string): Promise<RoleWithPermissions[]> {
  const res = await fetch(`${BASE}/roles?appId=${appId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data.roles;
}

export async function createRole(
  token: string,
  appId: string,
  data: { name: string; description?: string; permissions?: string[] },
): Promise<void> {
  const res = await fetch(`${BASE}/roles`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ appId, ...data }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
}

export async function updateRolePermissions(
  token: string,
  roleId: string,
  appId: string,
  permissions: string[],
): Promise<void> {
  const res = await fetch(`${BASE}/roles/${roleId}/permissions`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ appId, permissions }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
}
