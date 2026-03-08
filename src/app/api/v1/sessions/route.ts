import { ok, err, handleError } from '@/shared/lib/api';
import { requireAuth, isTenantAuth } from '@/shared/lib/middleware';
import { RefreshTokenRepository } from '@/infrastructure/db/repositories/refresh-token.repository';

const refreshTokenRepo = new RefreshTokenRepository();

export async function GET(req: Request) {
  const auth = requireAuth(req);
  if (!isTenantAuth(auth)) return err('Unauthorized', 'UNAUTHORIZED', 401);

  const { searchParams } = new URL(req.url);
  const appId = searchParams.get('appId');
  if (!appId) return err('appId query parameter is required', 'VALIDATION_ERROR', 400);

  try {
    const tokens = await refreshTokenRepo.findActiveForApp(appId);
    const sessions = tokens.map(({ id, appId, userId, createdAt, expiresAt }) => ({
      id,
      appId,
      userId,
      createdAt,
      expiresAt,
    }));
    return ok({ sessions });
  } catch (e) {
    return handleError(e);
  }
}
