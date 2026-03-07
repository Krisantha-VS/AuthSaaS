import { updateRolePermissions } from '@/domain/services/rbac.service';
import { ok, err, handleError } from '@/shared/lib/api';
import { requireAuth, isTenantAuth } from '@/shared/lib/middleware';
import { TenantAppRepository } from '@/infrastructure/db/repositories/tenant-app.repository';

const appRepo = new TenantAppRepository();

export async function PUT(req: Request, { params }: { params: Promise<{ roleId: string }> }) {
  const auth = requireAuth(req);
  if (!isTenantAuth(auth)) return auth;

  try {
    const { roleId } = await params;
    const body = await req.json() as { appId?: string; permissions?: unknown };

    if (!body.appId) return err('appId is required', 'VALIDATION_ERROR');
    if (!Array.isArray(body.permissions) || !body.permissions.every((p) => typeof p === 'string')) {
      return err('permissions must be an array of strings', 'VALIDATION_ERROR');
    }

    const app = await appRepo.findById(body.appId);
    if (!app || app.tenantId !== auth.payload.sub) return err('Not found', 'NOT_FOUND', 404);

    await updateRolePermissions(roleId, body.appId, body.permissions as string[]);
    return ok({ message: 'Permissions updated' });
  } catch (e) {
    return handleError(e);
  }
}
