import { createApp, listApps } from '@/domain/services/tenant.service';
import { createAppSchema } from '@/shared/lib/validators';
import { ok, err, handleError } from '@/shared/lib/api';
import { requireAuth, isTenantAuth } from '@/shared/lib/middleware';

export async function GET(req: Request) {
  const auth = requireAuth(req);
  if (!isTenantAuth(auth)) return auth;

  try {
    const apps = await listApps(auth.payload.sub);
    return ok(apps);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (!isTenantAuth(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = createAppSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message, 'VALIDATION_ERROR');

    const result = await createApp({ tenantId: auth.payload.sub, ...parsed.data });

    // clientSecret shown ONCE in response — not retrievable again
    return ok(result, 201);
  } catch (e) {
    return handleError(e);
  }
}
