import { verifyAccessToken } from '@/infrastructure/jwt';
import { err } from './api';
import type { JwtPayload } from '@/shared/types';

export function requireAuth(req: Request): { payload: JwtPayload } | ReturnType<typeof err> {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return err('Unauthorized', 'UNAUTHORIZED', 401);

  try {
    const payload = verifyAccessToken(header.slice(7));
    return { payload };
  } catch {
    return err('Invalid or expired token', 'INVALID_TOKEN', 401);
  }
}

export function isTenantAuth(result: ReturnType<typeof requireAuth>): result is { payload: JwtPayload } {
  return 'payload' in result;
}
