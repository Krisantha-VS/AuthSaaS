import { ok } from '@/shared/lib/api';
import { requireAuth, isTenantAuth } from '@/shared/lib/middleware';
import { PERMISSIONS_CATALOG } from '@/domain/services/rbac.service';

export async function GET(req: Request) {
  const auth = requireAuth(req);
  if (!isTenantAuth(auth)) return auth;
  return ok({ permissions: PERMISSIONS_CATALOG });
}
