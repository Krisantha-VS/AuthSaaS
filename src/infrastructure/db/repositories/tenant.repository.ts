import { prisma } from '../client';
import type { ITenantRepository } from '@/domain/repositories';
import type { TenantEntity } from '@/domain/entities';

export class TenantRepository implements ITenantRepository {
  async findById(id: string): Promise<TenantEntity | null> {
    const t = await prisma.tenant.findUnique({ where: { id } });
    return t ? this.toEntity(t) : null;
  }

  async findByEmail(email: string): Promise<TenantEntity | null> {
    const t = await prisma.tenant.findUnique({ where: { email } });
    return t ? this.toEntity(t) : null;
  }

  async findByEmailWithPassword(email: string) {
    return prisma.tenant.findUnique({ where: { email } });
  }

  async create(data: { name: string; email: string; password: string }): Promise<TenantEntity> {
    const t = await prisma.tenant.create({ data });
    return this.toEntity(t);
  }

  async update(id: string, data: Partial<TenantEntity>): Promise<TenantEntity> {
    const t = await prisma.tenant.update({ where: { id }, data });
    return this.toEntity(t);
  }

  private toEntity(t: any): TenantEntity {
    return { id: t.id, name: t.name, email: t.email, verified: t.verified, createdAt: t.createdAt };
  }
}
