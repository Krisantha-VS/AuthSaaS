import { prisma } from '../client';

export interface RoleWithPermissions {
  id: string;
  appId: string;
  name: string;
  description: string | null;
  permissions: string[]; // "action:resource" format
  userCount: number;
}

export class RoleRepository {
  async findByApp(appId: string): Promise<RoleWithPermissions[]> {
    const roles = await prisma.role.findMany({
      where: { appId },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });
    return roles.map(r => ({
      id: r.id,
      appId: r.appId,
      name: r.name,
      description: r.description,
      permissions: r.permissions.map(rp => `${rp.permission.action}:${rp.permission.resource}`),
      userCount: r._count.users,
    }));
  }

  async findByName(appId: string, name: string) {
    return prisma.role.findUnique({ where: { appId_name: { appId, name } } });
  }

  async findById(id: string) {
    return prisma.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    });
  }

  async create(data: { appId: string; name: string; description?: string }) {
    return prisma.role.create({ data });
  }

  async assignToUser(userId: string, roleId: string) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: {},
      create: { userId, roleId },
    });
  }

  async revokeFromUser(userId: string, roleId: string) {
    await prisma.userRole.deleteMany({ where: { userId, roleId } });
  }

  async setUserRoles(userId: string, appId: string, roleNames: string[]) {
    // Get role ids for this app
    const roles = await prisma.role.findMany({
      where: { appId, name: { in: roleNames } },
    });
    // Delete all current roles for this user in this app
    const appRoleIds = (await prisma.role.findMany({ where: { appId }, select: { id: true } })).map(r => r.id);
    await prisma.userRole.deleteMany({ where: { userId, roleId: { in: appRoleIds } } });
    // Assign new roles
    if (roles.length > 0) {
      await prisma.userRole.createMany({
        data: roles.map(r => ({ userId, roleId: r.id })),
        skipDuplicates: true,
      });
    }
  }

  async setRolePermissions(roleId: string, permissionKeys: string[]) {
    // permissionKeys = ["read:profile", "write:users", ...]
    // Delete all current permissions for this role
    await prisma.rolePermission.deleteMany({ where: { roleId } });
    if (permissionKeys.length === 0) return;

    // Upsert permissions and link
    for (const key of permissionKeys) {
      const [action, resource] = key.split(':');
      const permission = await prisma.permission.upsert({
        where: { action_resource: { action, resource } },
        update: {},
        create: { action, resource },
      });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId: permission.id } },
        update: {},
        create: { roleId, permissionId: permission.id },
      });
    }
  }

  async delete(roleId: string): Promise<void> {
    await prisma.rolePermission.deleteMany({ where: { roleId } });
    await prisma.userRole.deleteMany({ where: { roleId } });
    await prisma.role.delete({ where: { id: roleId } });
  }

  async getUsersWithRoles(appId: string) {
    return prisma.user.findMany({
      where: { appId },
      include: {
        roles: { include: { role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
