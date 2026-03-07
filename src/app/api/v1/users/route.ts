import { getUsersWithRoles } from '@/domain/services/rbac.service';
import { ok, err, handleError } from '@/shared/lib/api';
import { requireAuth, isTenantAuth } from '@/shared/lib/middleware';
import { TenantAppRepository } from '@/infrastructure/db/repositories/tenant-app.repository';

const appRepo = new TenantAppRepository();

export async function GET(req: Request) {
  const auth = requireAuth(req);
  if (!isTenantAuth(auth)) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const appId = searchParams.get('appId') ?? '';

    const app = await appRepo.findById(appId);
    if (!app || app.tenantId !== auth.payload.sub) return err('Not found', 'NOT_FOUND', 404);

    const users = await getUsersWithRoles(appId);
    return ok({ users });
  } catch (e) {
    return handleError(e);
  }
}
