import type { UserEntity, RefreshTokenEntity, TenantEntity, TenantAppEntity, AuditLogEntity } from '../entities';

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(appId: string, email: string): Promise<UserEntity | null>;
  create(data: { appId: string; email: string; passwordHash: string; name?: string }): Promise<UserEntity>;
  update(id: string, data: Partial<UserEntity>): Promise<UserEntity>;
  delete(id: string): Promise<void>;
}

export interface IRefreshTokenRepository {
  create(data: { tokenHash: string; userId: string; appId: string; expiresAt: Date }): Promise<RefreshTokenEntity>;
  findByHash(tokenHash: string): Promise<RefreshTokenEntity | null>;
  markUsed(id: string): Promise<void>;
  deleteAllForUser(userId: string): Promise<void>;
  deleteExpired(): Promise<void>;
}

export interface ITenantRepository {
  findById(id: string): Promise<TenantEntity | null>;
  findByEmail(email: string): Promise<TenantEntity | null>;
  create(data: { name: string; email: string; password: string }): Promise<TenantEntity>;
  update(id: string, data: Partial<TenantEntity>): Promise<TenantEntity>;
}

export interface ITenantAppRepository {
  findById(id: string): Promise<TenantAppEntity | null>;
  findByClientId(clientId: string): Promise<TenantAppEntity | null>;
  findByTenantId(tenantId: string): Promise<TenantAppEntity[]>;
  create(data: { tenantId: string; name: string; description?: string; secretHash: string; allowedOrigins: string[] }): Promise<TenantAppEntity>;
  update(id: string, data: Partial<TenantAppEntity>): Promise<TenantAppEntity>;
}

export interface IAuditLogRepository {
  create(data: Omit<AuditLogEntity, 'id' | 'createdAt'>): Promise<AuditLogEntity>;
  findByAppId(appId: string, page: number, pageSize: number): Promise<AuditLogEntity[]>;
}
