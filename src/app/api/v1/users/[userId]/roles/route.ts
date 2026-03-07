import { setUserRoles } from '@/domain/services/rbac.service';
import { ok, err, handleError } from '@/shared/lib/api';
import { requireAuth, isTenantAuth } from '@/shared/lib/middleware';
import { TenantAppRepository } from '@/infrastructure/db/repositories/tenant-app.repository';

const appRepo = new TenantAppRepository();

export async function PUT(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const auth = requireAuth(req);
  if (!isTenantAuth(auth)) return auth;

  try {
    const { userId } = await params;
    const body = await req.json() as { appId?: string; roles?: unknown };

    if (!body.appId) return err('appId is required', 'VALIDATION_ERROR');
    if (!Array.isArray(body.roles) || !body.roles.every((r) => typeof r === 'string')) {
      return err('roles must be an array of strings', 'VALIDATION_ERROR');
    }

    const app = await appRepo.findById(body.appId);
    if (!app || app.tenantId !== auth.payload.sub) return err('Not found', 'NOT_FOUND', 404);

    await setUserRoles(userId, body.appId, body.roles as string[]);
    return ok({ message: 'Roles updated' });
  } catch (e) {
    return handleError(e);
  }
}
