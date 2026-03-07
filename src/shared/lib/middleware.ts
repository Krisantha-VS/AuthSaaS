import { verifyAccessToken } from '@/infrastructure/jwt';
import { err } from './api';
import type { JwtPayload } from '@/shared/types';

export function requireAuth(req: Request): { payload: JwtPayload } | ReturnType<typeof err> {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return err('Unauthorized', 'UNAUTHORIZED', 401);

  try {
    const payload = verifyAccessToken(header.slice(7));
    return { payload };
  } catch {
    return err('Invalid or expired token', 'INVALID_TOKEN', 401);
  }
}

export function isTenantAuth(result: ReturnType<typeof requireAuth>): result is { payload: JwtPayload } {
  return 'payload' in result && Array.isArray((result as any).payload.roles) && (result as any).payload.roles.includes('tenant');
}

/**
 * Returns a 403 response if the JWT payload does not include one of the required roles.
 * Usage: const guard = requireRole(auth, 'admin', 'owner'); if (guard) return guard;
 */
export function requireRole(
  result: ReturnType<typeof requireAuth>,
  ...roles: string[]
): ReturnType<typeof err> | null {
  if (!isTenantAuth(result)) return err('Unauthorized', 'UNAUTHORIZED', 401);
  const payload = (result as { payload: JwtPayload }).payload;
  const hasRole = roles.some(r => payload.roles?.includes(r));
  if (!hasRole) return err('Forbidden — insufficient role', 'FORBIDDEN', 403);
  return null;
}

/**
 * Returns a 403 if the user's roles do not grant the required permission.
 * Requires a DB lookup — pass the user's roles array from the JWT.
 */
export function hasPermission(userRoles: string[], permission: string): boolean {
  // Permission checking is role-name based for now.
  // Extend this to do DB permission lookup for fine-grained control.
  const ROLE_PERMISSIONS: Record<string, string[]> = {
    user:  ['read:profile', 'write:profile'],
    admin: ['read:profile', 'write:profile', 'read:users', 'write:users', 'read:audit', 'read:sessions'],
    owner: ['read:profile', 'write:profile', 'read:users', 'write:users', 'delete:users', 'read:roles', 'write:roles', 'read:audit', 'read:sessions', 'delete:sessions'],
  };
  return userRoles.some(role => ROLE_PERMISSIONS[role]?.includes(permission));
}
