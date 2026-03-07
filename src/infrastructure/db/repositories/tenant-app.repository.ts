import { prisma } from '../client';
import type { ITenantAppRepository } from '@/domain/repositories';
import type { TenantAppEntity } from '@/domain/entities';

export class TenantAppRepository implements ITenantAppRepository {
  async findById(id: string): Promise<TenantAppEntity | null> {
    return prisma.tenantApp.findUnique({ where: { id } });
  }

  async findByClientId(clientId: string): Promise<TenantAppEntity | null> {
    return prisma.tenantApp.findUnique({ where: { clientId } });
  }

  async findByTenantId(tenantId: string): Promise<TenantAppEntity[]> {
    return prisma.tenantApp.findMany({ where: { tenantId } });
  }

  async create(data: {
    tenantId: string;
    name: string;
    description?: string;
    secretHash: string;
    allowedOrigins: string[];
  }): Promise<TenantAppEntity> {
    return prisma.tenantApp.create({ data });
  }

  async update(id: string, data: Partial<TenantAppEntity>): Promise<TenantAppEntity> {
    return prisma.tenantApp.update({ where: { id }, data });
  }
}
