import { logout } from '@/domain/services/auth.service';
import { ok, err, handleError } from '@/shared/lib/api';
import { verifyAccessToken } from '@/infrastructure/jwt';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return err('Unauthorized', 'UNAUTHORIZED', 401);

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);

    await logout({ userId: payload.sub, appId: payload.appId });

    // Clear refresh token cookie if present
    const cookieStore = await cookies();
    cookieStore.delete('refresh_token');

    return ok(null);
  } catch (e) {
    return handleError(e);
  }
}
