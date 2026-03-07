import { toggleApp } from '@/domain/services/tenant.service';
import { ok, err, handleError } from '@/shared/lib/api';
import { requireAuth, isTenantAuth } from '@/shared/lib/middleware';
import { z } from 'zod';

const schema = z.object({ isActive: z.boolean() });

export async function PATCH(req: Request, { params }: { params: Promise<{ appId: string }> }) {
  const auth = requireAuth(req);
  if (!isTenantAuth(auth)) return auth;

  try {
    const { appId } = await params;
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message, 'VALIDATION_ERROR');

    const app = await toggleApp(appId, auth.payload.sub, parsed.data.isActive);
    return ok(app);
  } catch (e) {
    return handleError(e);
  }
}
