import { prisma } from '../client';
import type { IRefreshTokenRepository } from '@/domain/repositories';
import type { RefreshTokenEntity } from '@/domain/entities';

export class RefreshTokenRepository implements IRefreshTokenRepository {
  async create(data: { tokenHash: string; userId: string; appId: string; expiresAt: Date }): Promise<RefreshTokenEntity> {
    return prisma.refreshToken.create({ data });
  }

  async findByHash(tokenHash: string): Promise<RefreshTokenEntity | null> {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  }

  async markUsed(id: string): Promise<void> {
    await prisma.refreshToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }

  async deleteExpired(): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }

  async findActiveForApp(appId: string): Promise<RefreshTokenEntity[]> {
    return prisma.refreshToken.findMany({
      where: { appId, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteById(id: string): Promise<void> {
    await prisma.refreshToken.delete({ where: { id } });
  }
}
