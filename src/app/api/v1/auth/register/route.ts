import { register } from '@/domain/services/auth.service';
import { registerSchema } from '@/shared/lib/validators';
import { ok, err, handleError, getIp } from '@/shared/lib/api';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return err(parsed.error.issues[0].message, 'VALIDATION_ERROR');

    const result = await register({ ...parsed.data, ipAddress: getIp(req) });

    return ok({
      user: result.user,
      tokens: result.tokens,
    }, 201);
  } catch (e) {
    return handleError(e);
  }
}
