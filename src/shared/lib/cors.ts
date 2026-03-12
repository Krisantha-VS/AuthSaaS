import { NextResponse } from 'next/server';

/**
 * Validate the request Origin against the app's allowedOrigins list.
 *
 * - No Origin header → server-side SDK call → always allowed.
 * - Origin present but not in the list → 403.
 * - Origin present and in the list → adds CORS response headers.
 *
 * Returns null if allowed, or a ready-to-return 403 NextResponse if blocked.
 */
export function checkOrigin(
  req: Request,
  allowedOrigins: string[],
): NextResponse | null {
  const origin = req.headers.get('origin');

  // Not a browser cross-origin request — allow (SDK / server-side call)
  if (!origin) return null;

  // Allow any localhost origin in development
  if (process.env.NODE_ENV !== 'production' && /^https?:\/\/localhost(:\d+)?$/.test(origin)) return null;

  if (!allowedOrigins.includes(origin)) {
    return NextResponse.json(
      { success: false, error: 'Origin not allowed', code: 'ORIGIN_FORBIDDEN' },
      { status: 403 },
    );
  }

  return null; // allowed — caller adds CORS headers to their response
}

/** Appends CORS headers to an existing response. */
export function withCors(response: NextResponse, origin: string): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  return response;
}

/** Handles OPTIONS preflight for CORS-enabled routes. */
export function handlePreflight(req: Request, allowedOrigins: string[]): NextResponse | null {
  if (req.method !== 'OPTIONS') return null;
  const origin = req.headers.get('origin') ?? '';
  const isLocalhost = process.env.NODE_ENV !== 'production' && /^https?:\/\/localhost(:\d+)?$/.test(origin);
  const allowed = isLocalhost || allowedOrigins.includes('*') || allowedOrigins.includes(origin);
  if (!allowed) {
    return new NextResponse(null, { status: 204 });
  }
  const res = new NextResponse(null, { status: 204 });
  withCors(res, origin);
  return res;
}
