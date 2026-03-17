import { ok, err, handleError } from '@/shared/lib/api';
import { requireAuth, isTenantAuth } from '@/shared/lib/middleware';
import { AuditLogRepository } from '@/infrastructure/db/repositories/audit-log.repository';
import { TenantAppRepository } from '@/infrastructure/db/repositories/tenant-app.repository';

const auditRepo = new AuditLogRepository();
const appRepo = new TenantAppRepository();

export async function GET(req: Request) {
  const auth = requireAuth(req);
  if (!isTenantAuth(auth)) return auth;

  try {
    const url    = new URL(req.url);
    const appId  = url.searchParams.get('appId') ?? undefined;
    const userId = url.searchParams.get('userId') ?? undefined;
    const action = url.searchParams.get('action') ?? undefined;
    const page   = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
    const limit  = Math.min(parseInt(url.searchParams.get('limit') ?? '20'), 100);

    if (appId) {
      const app = await appRepo.findById(appId);
      if (!app || app.tenantId !== auth.payload.sub) return err('Not found', 'NOT_FOUND', 404);
    }

    const { logs, total } = await auditRepo.findFiltered({
      tenantId: auth.payload.sub,
      appId,
      userId,
      action,
      page,
      limit,
    });

    return ok({ logs, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (e) {
    return handleError(e);
  }
}
