import { getUsersWithRoles } from '@/domain/services/rbac.service';
import { ok, err, handleError } from '@/shared/lib/api';
import { requireAuth, isTenantAuth } from '@/shared/lib/middleware';
import { TenantAppRepository } from '@/infrastructure/db/repositories/tenant-app.repository';
import { UserRepository } from '@/infrastructure/db/repositories/user.repository';

const appRepo = new TenantAppRepository();
const userRepo = new UserRepository();

export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const auth = requireAuth(req);
  if (!isTenantAuth(auth)) return auth;

  try {
    const { userId } = await params;
    const { searchParams } = new URL(req.url);
    const appId = searchParams.get('appId') ?? '';

    const app = await appRepo.findById(appId);
    if (!app || app.tenantId !== auth.payload.sub) return err('Not found', 'NOT_FOUND', 404);

    const users = await getUsersWithRoles(appId);
    const user = users.find((u) => u.id === userId);
    if (!user) return err('User not found', 'NOT_FOUND', 404);

    return ok({ user });
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const auth = requireAuth(req);
  if (!isTenantAuth(auth)) return auth;

  try {
    const { userId } = await params;
    const body = await req.json() as { appId?: string };

    if (!body.appId) return err('appId is required', 'VALIDATION_ERROR');

    const app = await appRepo.findById(body.appId);
    if (!app || app.tenantId !== auth.payload.sub) return err('Not found', 'NOT_FOUND', 404);

    const user = await userRepo.findById(userId);
    if (!user || user.appId !== body.appId) return err('User not found', 'NOT_FOUND', 404);

    const updated = await userRepo.update(userId, { isActive: !user.isActive });
    return ok({ user: updated });
  } catch (e) {
    return handleError(e);
  }
}
