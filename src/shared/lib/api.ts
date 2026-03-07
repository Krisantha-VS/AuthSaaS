import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/shared/types';

export function ok<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function err(
  error: string,
  code: string,
  status = 400,
  extraHeaders?: Record<string, string>,
): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ success: false, error, code }, { status, headers: extraHeaders });
}

const ERROR_MAP: Record<string, { status: number; message: string }> = {
  INVALID_CLIENT:      { status: 401, message: 'Invalid client credentials' },
  EMAIL_TAKEN:         { status: 409, message: 'Email already registered' },
  INVALID_CREDENTIALS: { status: 401, message: 'Invalid email or password' },
  ACCOUNT_DISABLED:    { status: 403, message: 'Account is disabled' },
  INVALID_TOKEN:       { status: 401, message: 'Invalid token' },
  TOKEN_REUSE:         { status: 401, message: 'Token reuse detected — all sessions invalidated' },
  TOKEN_EXPIRED:       { status: 401, message: 'Token expired' },
  USER_NOT_FOUND:      { status: 404, message: 'User not found' },
  NOT_FOUND:           { status: 404, message: 'Resource not found' },
  UNAUTHORIZED:        { status: 401, message: 'Unauthorized' },
};

export function handleError(e: unknown) {
  const code = e instanceof Error ? e.message : 'UNKNOWN_ERROR';
  const mapped = ERROR_MAP[code];
  if (mapped) return err(mapped.message, code, mapped.status);
  console.error(e);
  return err('Internal server error', 'INTERNAL_ERROR', 500);
}

export function getIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
}
