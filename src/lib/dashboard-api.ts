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
