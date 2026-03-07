import { login } from '@/domain/services/auth.service';
import { loginSchema } from '@/shared/lib/validators';
import { ok, handleError, err, getIp } from '@/shared/lib/api';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message, 'VALIDATION_ERROR');

    const result = await login({ ...parsed.data, ipAddress: getIp(req) });

    return ok(result.tokens);
  } catch (e) {
    return handleError(e);
  }
}
