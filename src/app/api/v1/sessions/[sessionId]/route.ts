import { ok, err, handleError } from '@/shared/lib/api';
import { requireAuth, isTenantAuth } from '@/shared/lib/middleware';
import { RefreshTokenRepository } from '@/infrastructure/db/repositories/refresh-token.repository';

const refreshTokenRepo = new RefreshTokenRepository();

export async function DELETE(
  req: Request,
  { params }: { params: { sessionId: string } },
) {
  const auth = requireAuth(req);
  if (!isTenantAuth(auth)) return err('Unauthorized', 'UNAUTHORIZED', 401);

  try {
    await refreshTokenRepo.deleteById(params.sessionId);
    return ok({ revoked: true });
  } catch (e) {
    return handleError(e);
  }
}
