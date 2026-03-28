import { refresh } from '@/domain/services/auth.service';
import { refreshSchema } from '@/shared/lib/validators';
import { ok, err, handleError, getIp } from '@/shared/lib/api';
import { handlePreflight, withCors } from '@/shared/lib/cors';
import { cookies } from 'next/headers';
import { config } from '@/shared/config';

export async function OPTIONS(req: Request) {
  return handlePreflight(req, ['*']) ?? new Response(null, { status: 204 });
}

export async function POST(req: Request) {
  const preflight = handlePreflight(req, ['*']);
  if (preflight) return preflight;

  const origin = req.headers.get('origin');
  const userAgent = req.headers.get('user-agent') ?? undefined;

  try {
    // Accept token from body OR httpOnly cookie
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('refresh_token')?.value;

    const body = await req.json().catch(() => ({}));
    const parsed = refreshSchema.safeParse({ refreshToken: body.refreshToken ?? cookieToken });
    if (!parsed.success) return err('Refresh token required', 'VALIDATION_ERROR', 401);

    const tokens = await refresh({ refreshToken: parsed.data.refreshToken, ipAddress: getIp(req), userAgent });

    // Rotate the cookie alongside the token
    cookieStore.set('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: config.cookie.secure,
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: config.cookie.refreshTtlSeconds,
      ...(config.cookie.domain ? { domain: config.cookie.domain } : {}),
    });

    const res = ok(tokens);
    return origin ? withCors(res, origin) : res;
  } catch (e) {
    const errorRes = handleError(e);
    return origin ? withCors(errorRes, origin) : errorRes;
  }
}
