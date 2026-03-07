import { verifyEmail } from '@/domain/services/auth.service';
import { ok, err, handleError } from '@/shared/lib/api';

// GET /api/v1/auth/verify?token=xxx&email=user@example.com
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token || !email) return err('Missing token or email', 'VALIDATION_ERROR');

    await verifyEmail({ token, email });

    return ok({ message: 'Email verified successfully.' });
  } catch (e) {
    return handleError(e);
  }
}
