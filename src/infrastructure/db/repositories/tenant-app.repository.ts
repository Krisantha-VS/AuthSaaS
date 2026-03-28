import { prisma } from '../client';
import type { ITenantAppRepository } from '@/domain/repositories';
import type { TenantAppEntity } from '@/domain/entities';

function castApp(app: Record<string, unknown>): TenantAppEntity {
  return { ...app, allowedOrigins: app.allowedOrigins as string[] } as TenantAppEntity;
}

export class TenantAppRepository implements ITenantAppRepository {
  async findById(id: string): Promise<TenantAppEntity | null> {
    const app = await prisma.tenantApp.findUnique({ where: { id } });
    return app ? castApp(app as unknown as Record<string, unknown>) : null;
  }

  async findByClientId(clientId: string): Promise<TenantAppEntity | null> {
    const app = await prisma.tenantApp.findUnique({ where: { clientId } });
    return app ? castApp(app as unknown as Record<string, unknown>) : null;
  }

  async findByTenantId(tenantId: string): Promise<TenantAppEntity[]> {
    const apps = await prisma.tenantApp.findMany({ where: { tenantId } });
    return apps.map(a => castApp(a as unknown as Record<string, unknown>));
  }

  async create(data: {
    tenantId: string;
    name: string;
    description?: string;
    secretHash: string;
    allowedOrigins: string[];
  }): Promise<TenantAppEntity> {
    const app = await prisma.tenantApp.create({ data });
    return castApp(app as unknown as Record<string, unknown>);
  }

  async update(id: string, data: Partial<TenantAppEntity>): Promise<TenantAppEntity> {
    const app = await prisma.tenantApp.update({ where: { id }, data });
    return castApp(app as unknown as Record<string, unknown>);
  }
}
