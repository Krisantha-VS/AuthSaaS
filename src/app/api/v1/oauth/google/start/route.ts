import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/infrastructure/db/client';
import { err } from '@/shared/lib/api';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientId            = searchParams.get('client_id');
  const redirectUri         = searchParams.get('redirect_uri');
  const codeChallenge       = searchParams.get('code_challenge');
  const codeChallengeMethod = searchParams.get('code_challenge_method') ?? 'S256';
  const pkceState           = searchParams.get('state');

  if (!clientId || !redirectUri || !codeChallenge || !pkceState) {
    return err('Missing required parameters', 'INVALID_REQUEST', 400);
  }

  const app = await prisma.tenantApp.findUnique({ where: { clientId } });
  if (!app || !app.isActive) return err('Invalid client', 'UNAUTHORIZED_CLIENT', 403);

  // Encode PKCE params into Google state (base64url JSON)
  const googleState = Buffer.from(JSON.stringify({
    client_id: clientId,
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: codeChallengeMethod,
    pkce_state: pkceState,
    nonce: crypto.randomBytes(16).toString('hex'),
  })).toString('base64url');

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
  googleAuthUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/oauth/google/callback`);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('state', googleState);
  googleAuthUrl.searchParams.set('access_type', 'offline');
  googleAuthUrl.searchParams.set('prompt', 'select_account');

  return NextResponse.redirect(googleAuthUrl.toString());
}
