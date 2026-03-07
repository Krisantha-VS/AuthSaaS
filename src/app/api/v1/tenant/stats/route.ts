import { ok, handleError } from '@/shared/lib/api';
import { requireAuth, isTenantAuth } from '@/shared/lib/middleware';
import { TenantAppRepository } from '@/infrastructure/db/repositories/tenant-app.repository';
import { AuditLogRepository } from '@/infrastructure/db/repositories/audit-log.repository';
import { getPrisma } from '@/infrastructure/db/client';

const appRepo   = new TenantAppRepository();
const auditRepo = new AuditLogRepository();

export async function GET(req: Request) {
  const auth = requireAuth(req);
  if (!isTenantAuth(auth)) return auth;

  try {
    const tenantId = auth.payload.sub;
    const apps = await appRepo.findByTenantId(tenantId);

    const appIds = apps.map(a => a.id);
    const prisma = getPrisma();

    const [userCount, auditCount] = await Promise.all([
      appIds.length
        ? prisma.user.count({ where: { appId: { in: appIds } } })
        : 0,
      prisma.auditLog.count({ where: { tenantId } }),
    ]);

    return ok({
      totalApps:    apps.length,
      activeApps:   apps.filter(a => a.isActive).length,
      totalUsers:   userCount,
      auditEvents:  auditCount,
    });
  } catch (e) {
    return handleError(e);
  }
}
