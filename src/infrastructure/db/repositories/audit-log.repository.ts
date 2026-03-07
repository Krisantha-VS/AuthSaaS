import { prisma } from '../client';
import type { IAuditLogRepository } from '@/domain/repositories';
import type { AuditLogEntity } from '@/domain/entities';

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
    return {
      id: record.id,
      action: record.action,
      resource: record.resource,
      tenantId: record.tenantId ?? undefined,
      appId: record.appId ?? undefined,
      userId: record.userId ?? undefined,
      meta: (record.meta as Record<string, unknown>) ?? undefined,
      ipAddress: record.ipAddress ?? undefined,
      createdAt: record.createdAt,
    };
  }

  async findByAppId(appId: string, page: number, pageSize: number): Promise<AuditLogEntity[]> {
    const records = await prisma.auditLog.findMany({
      where: { appId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return records.map(r => ({
      id: r.id,
      action: r.action,
      resource: r.resource,
      tenantId: r.tenantId ?? undefined,
      appId: r.appId ?? undefined,
      userId: r.userId ?? undefined,
      meta: (r.meta as Record<string, unknown>) ?? undefined,
      ipAddress: r.ipAddress ?? undefined,
      createdAt: r.createdAt,
    }));
  }
}
