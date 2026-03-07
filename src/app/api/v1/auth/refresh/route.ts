import { refresh } from '@/domain/services/auth.service';
import { refreshSchema } from '@/shared/lib/validators';
import { ok, err, handleError, getIp } from '@/shared/lib/api';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    // Accept token from body OR httpOnly cookie
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('refresh_token')?.value;

    const body = await req.json().catch(() => ({}));
    const parsed = refreshSchema.safeParse({ refreshToken: body.refreshToken ?? cookieToken });
    if (!parsed.success) return err('Refresh token required', 'VALIDATION_ERROR', 401);

    const tokens = await refresh({ refreshToken: parsed.data.refreshToken, ipAddress: getIp(req) });

    return ok(tokens);
  } catch (e) {
    return handleError(e);
  }
}
