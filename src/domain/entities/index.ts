export interface TenantEntity {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  createdAt: Date;
}

export interface TenantAppEntity {
  id: string;
  tenantId: string;
  name: string;
  clientId: string;
  allowedOrigins: string[];
  isActive: boolean;
}

export interface UserEntity {
  id: string;
  appId: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  isActive: boolean;
  roles: string[];
  createdAt: Date;
}

export interface RefreshTokenEntity {
  id: string;
  tokenHash: string;
  userId: string;
  appId: string;
  expiresAt: Date;
  usedAt: Date | null;
}

export interface AuditLogEntity {
  id: string;
  tenantId?: string;
  appId?: string;
  userId?: string;
  action: string;
  resource: string;
  meta?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
