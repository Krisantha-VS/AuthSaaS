import { RoleRepository } from '@/infrastructure/db/repositories/role.repository';
import { UserRepository } from '@/infrastructure/db/repositories/user.repository';

const roleRepo = new RoleRepository();
const userRepo = new UserRepository();

// Permissions catalog — action:resource pairs available in the system
export const PERMISSIONS_CATALOG = [
  { action: 'read',   resource: 'profile',  description: 'View own profile' },
  { action: 'write',  resource: 'profile',  description: 'Edit own profile' },
  { action: 'read',   resource: 'users',    description: 'List and view users' },
  { action: 'write',  resource: 'users',    description: 'Create and update users' },
  { action: 'delete', resource: 'users',    description: 'Delete users' },
  { action: 'read',   resource: 'roles',    description: 'View roles and permissions' },
  { action: 'write',  resource: 'roles',    description: 'Create and update roles' },
  { action: 'read',   resource: 'audit',    description: 'View audit logs' },
  { action: 'read',   resource: 'sessions', description: 'View active sessions' },
  { action: 'delete', resource: 'sessions', description: 'Revoke sessions' },
] as const;

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  user:  ['read:profile', 'write:profile'],
  admin: ['read:profile', 'write:profile', 'read:users', 'write:users', 'read:audit', 'read:sessions'],
  owner: [
    'read:profile', 'write:profile',
    'read:users', 'write:users', 'delete:users',
    'read:roles', 'write:roles',
    'read:audit',
    'read:sessions', 'delete:sessions',
  ],
};

export async function seedDefaultRoles(appId: string): Promise<void> {
  for (const [name, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const descriptions: Record<string, string> = {
      user:  'Default role for all registered users',
      admin: 'Can manage users and view audit logs',
      owner: 'Full access to all resources',
    };
    let role = await roleRepo.findByName(appId, name);
    if (!role) {
      role = await roleRepo.create({ appId, name, description: descriptions[name] });
    }
    await roleRepo.setRolePermissions(role.id, permissions);
  }
}

export async function assignRole(userId: string, appId: string, roleName: string): Promise<void> {
  const role = await roleRepo.findByName(appId, roleName);
  if (!role) throw new Error('ROLE_NOT_FOUND');
  await roleRepo.assignToUser(userId, role.id);
}

export async function revokeRole(userId: string, appId: string, roleName: string): Promise<void> {
  const role = await roleRepo.findByName(appId, roleName);
  if (!role) throw new Error('ROLE_NOT_FOUND');
  await roleRepo.revokeFromUser(userId, role.id);
}

export async function setUserRoles(userId: string, appId: string, roleNames: string[]): Promise<void> {
  await roleRepo.setUserRoles(userId, appId, roleNames);
}

export async function getUsersWithRoles(appId: string) {
  const users = await roleRepo.getUsersWithRoles(appId);
  return users.map(u => ({
    id: u.id,
    appId: u.appId,
    email: u.email,
    name: u.name,
    emailVerified: u.emailVerified,
    isActive: u.isActive,
    roles: u.roles.map((ur: any) => ur.role.name),
    createdAt: u.createdAt,
  }));
}

export async function getRoles(appId: string) {
  return roleRepo.findByApp(appId);
}

export async function createRole(appId: string, name: string, description?: string, permissions: string[] = []): Promise<void> {
  const existing = await roleRepo.findByName(appId, name);
  if (existing) throw new Error('ROLE_EXISTS');
  const role = await roleRepo.create({ appId, name, description });
  if (permissions.length > 0) {
    await roleRepo.setRolePermissions(role.id, permissions);
  }
}

export async function updateRolePermissions(roleId: string, appId: string, permissions: string[]): Promise<void> {
  const role = await roleRepo.findById(roleId);
  if (!role || (role as any).appId !== appId) throw new Error('ROLE_NOT_FOUND');
  await roleRepo.setRolePermissions(roleId, permissions);
}

export type { RoleWithPermissions } from '@/infrastructure/db/repositories/role.repository';
