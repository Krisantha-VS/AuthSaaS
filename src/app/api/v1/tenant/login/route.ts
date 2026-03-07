import { loginTenant } from '@/domain/services/tenant.service';
import { tenantLoginSchema } from '@/shared/lib/validators';
import { ok, err, handleError, getIp } from '@/shared/lib/api';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = tenantLoginSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message, 'VALIDATION_ERROR');

    const result = await loginTenant({ ...parsed.data, ipAddress: getIp(req) });
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
