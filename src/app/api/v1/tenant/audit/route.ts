import { ok, handleError } from '@/shared/lib/api';
import { requireAuth, isTenantAuth } from '@/shared/lib/middleware';
import { AuditLogRepository } from '@/infrastructure/db/repositories/audit-log.repository';

const auditRepo = new AuditLogRepository();

export async function GET(req: Request) {
  const auth = requireAuth(req);
  if (!isTenantAuth(auth)) return auth;

  try {
    const url    = new URL(req.url);
    const limit  = Math.min(parseInt(url.searchParams.get('limit') ?? '20'), 100);
    const logs   = await auditRepo.findByTenantId(auth.payload.sub, limit);
    return ok(logs);
  } catch (e) {
    return handleError(e);
  }
}
