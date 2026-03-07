import jwt from 'jsonwebtoken';
import type { JwtPayload } from '@/shared/types';
import { config } from '@/shared/config';

export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
    algorithm: 'HS256',
  });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
    algorithm: 'HS256',
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.accessSecret, { algorithms: ['HS256'] }) as JwtPayload;
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, config.jwt.refreshSecret, { algorithms: ['HS256'] }) as { sub: string };
}
