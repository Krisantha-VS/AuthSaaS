import { prisma } from '../client';
import type { IUserRepository } from '@/domain/repositories';
import type { UserEntity } from '@/domain/entities';

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });
    return user ? this.toEntity(user) : null;
  }

  async findByEmail(appId: string, email: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { appId_email: { appId, email } },
      include: { roles: { include: { role: true } } },
    });
    return user ? this.toEntity(user) : null;
  }

  async findByEmailWithPassword(appId: string, email: string) {
    return prisma.user.findUnique({
      where: { appId_email: { appId, email } },
      include: { roles: { include: { role: true } } },
    });
  }

  async create(data: { appId: string; email: string; passwordHash: string; name?: string }): Promise<UserEntity> {
    const user = await prisma.user.create({
      data,
      include: { roles: { include: { role: true } } },
    });
    return this.toEntity(user);
  }

  async update(id: string, data: Record<string, unknown>): Promise<UserEntity> {
    const user = await prisma.user.update({
      where: { id },
      data,
      include: { roles: { include: { role: true } } },
    });
    return this.toEntity(user);
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }

  private toEntity(user: any): UserEntity {
    return {
      id: user.id,
      appId: user.appId,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
      roles: user.roles?.map((ur: any) => ur.role.name) ?? [],
      createdAt: user.createdAt,
    };
  }
}
