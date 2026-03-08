import { logout } from '@/domain/services/auth.service';
import { ok, err, handleError } from '@/shared/lib/api';
import { verifyAccessToken } from '@/infrastructure/jwt';
import { cookies } from 'next/headers';
import { handlePreflight, withCors } from '@/shared/lib/cors';

export async function OPTIONS(req: Request) {
  return handlePreflight(req, ['*']) ?? new Response(null, { status: 204 });
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      const res = err('Unauthorized', 'UNAUTHORIZED', 401);
      return origin ? withCors(res, origin) : res;
    }

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);

    await logout({ userId: payload.sub, appId: payload.appId });

    // Clear refresh token cookie if present
    const cookieStore = await cookies();
    cookieStore.delete('refresh_token');

    const res = ok(null);
    return origin ? withCors(res, origin) : res;
  } catch (e) {
    const res = handleError(e);
    return origin ? withCors(res, origin) : res;
  }
}
