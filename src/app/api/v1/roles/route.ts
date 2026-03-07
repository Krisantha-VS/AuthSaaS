import { getRoles, createRole } from '@/domain/services/rbac.service';
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

    const roles = await getRoles(appId);
    return ok({ roles });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (!isTenantAuth(auth)) return auth;

  try {
    const body = await req.json() as {
      appId?: string;
      name?: string;
      description?: string;
      permissions?: string[];
    };

    if (!body.appId) return err('appId is required', 'VALIDATION_ERROR');
    if (!body.name || body.name.length < 2) return err('name must be at least 2 characters', 'VALIDATION_ERROR');

    const app = await appRepo.findById(body.appId);
    if (!app || app.tenantId !== auth.payload.sub) return err('Not found', 'NOT_FOUND', 404);

    await createRole(body.appId, body.name, body.description, body.permissions);
    return ok({ message: 'Role created' }, 201);
  } catch (e) {
    return handleError(e);
  }
}
