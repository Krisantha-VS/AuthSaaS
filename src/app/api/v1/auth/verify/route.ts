import { verifyEmail } from '@/domain/services/auth.service';
import { ok, err, handleError } from '@/shared/lib/api';
import { handlePreflight, withCors } from '@/shared/lib/cors';

export async function OPTIONS(req: Request) {
  return handlePreflight(req, ['*']) ?? new Response(null, { status: 204 });
}

// GET /api/v1/auth/verify?token=xxx&email=user@example.com
export async function GET(req: Request) {
  const origin = req.headers.get('origin');
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) {
      const res = err('Missing token or email', 'VALIDATION_ERROR');
      return origin ? withCors(res, origin) : res;
    }

    await verifyEmail({ token, email });

    const res = ok({ message: 'Email verified successfully.' });
    return origin ? withCors(res, origin) : res;
  } catch (e) {
    const res = handleError(e);
    return origin ? withCors(res, origin) : res;
  }
}
