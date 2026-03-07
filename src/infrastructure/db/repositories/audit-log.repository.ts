import { prisma } from '../client';
import type { IAuditLogRepository } from '@/domain/repositories';
import type { AuditLogEntity } from '@/domain/entities';

function mapRecord(r: {
  id: string; action: string; resource: string;
  tenantId: string | null; appId: string | null; userId: string | null;
  meta: unknown; ipAddress: string | null; userAgent: string | null;
  createdAt: Date;
}): AuditLogEntity {
  return {
    id: r.id,
    action: r.action,
    resource: r.resource,
    tenantId: r.tenantId ?? undefined,
    appId: r.appId ?? undefined,
    userId: r.userId ?? undefined,
    meta: (r.meta as Record<string, unknown>) ?? undefined,
    ipAddress: r.ipAddress ?? undefined,
    createdAt: r.createdAt,
  };
}

export class AuditLogRepository implements IAuditLogRepository {
  async create(data: Omit<AuditLogEntity, 'id' | 'createdAt'>): Promise<AuditLogEntity> {
    const record = await prisma.auditLog.create({
      data: {
        action: data.action,
        resource: data.resource,
        tenantId: data.tenantId ?? null,
        appId: data.appId ?? null,
        userId: data.userId ?? null,
        meta: data.meta ? JSON.parse(JSON.stringify(data.meta)) : undefined,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      },
    });
    return mapRecord(record);
  }

  async findByTenantId(tenantId: string, limit = 20): Promise<AuditLogEntity[]> {
    const records = await prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return records.map(mapRecord);
  }

  async findByAppId(appId: string, page: number, pageSize: number): Promise<AuditLogEntity[]> {
    const records = await prisma.auditLog.findMany({
      where: { appId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return records.map(mapRecord);
  }
}
