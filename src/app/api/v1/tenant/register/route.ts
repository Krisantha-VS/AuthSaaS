import { registerTenant } from '@/domain/services/tenant.service';
import { tenantRegisterSchema } from '@/shared/lib/validators';
import { ok, err, handleError, getIp } from '@/shared/lib/api';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = tenantRegisterSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message, 'VALIDATION_ERROR');

    const result = await registerTenant({ ...parsed.data, ipAddress: getIp(req) });
    return ok(result, 201);
  } catch (e) {
    return handleError(e);
  }
}
