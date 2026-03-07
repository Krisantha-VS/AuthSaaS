import { rotateSecret } from '@/domain/services/tenant.service';
import { ok, handleError } from '@/shared/lib/api';
import { requireAuth, isTenantAuth } from '@/shared/lib/middleware';

export async function POST(req: Request, { params }: { params: Promise<{ appId: string }> }) {
  const auth = requireAuth(req);
  if (!isTenantAuth(auth)) return auth;

  try {
    const { appId } = await params;
    const result = await rotateSecret(appId, auth.payload.sub);
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
