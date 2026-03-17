import { ok, err, handleError } from '@/shared/lib/api';
import { requireAuth, isTenantAuth } from '@/shared/lib/middleware';
import { TenantAppRepository } from '@/infrastructure/db/repositories/tenant-app.repository';
import { RoleRepository } from '@/infrastructure/db/repositories/role.repository';

const roleRepo = new RoleRepository();
const tenantAppRepo = new TenantAppRepository();

export async function DELETE(req: Request, { params }: { params: Promise<{ roleId: string }> }) {
  const auth = requireAuth(req);
  if (!isTenantAuth(auth)) return auth;

  try {
    const { roleId } = await params;
    const { searchParams } = new URL(req.url);
    const appId = searchParams.get('appId') ?? '';

    const app = await tenantAppRepo.findById(appId);
    if (!app || app.tenantId !== auth.payload.sub) return err('Not found', 'NOT_FOUND', 404);

    const role = await roleRepo.findById(roleId);
    if (!role || (role as any).appId !== appId) return err('Role not found', 'NOT_FOUND', 404);

    // Prevent deleting built-in roles
    const PROTECTED = ['user', 'admin', 'owner'];
    if (PROTECTED.includes((role as any).name)) {
      return err('Cannot delete built-in roles', 'FORBIDDEN', 403);
    }

    await roleRepo.delete(roleId);
    return ok({ message: 'Role deleted' });
  } catch (e) {
    return handleError(e);
  }
}
