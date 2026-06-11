import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/infrastructure/db/client';
import { err } from '@/shared/lib/api';
import { decryptSecret } from '@/shared/lib/crypto';

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

  const app = await prisma.tenantApp.findUnique({
    where:   { clientId },
    include: { oauthProviders: { where: { provider: 'google' } } },
  });
  if (!app || !app.isActive) return err('Invalid client', 'UNAUTHORIZED_CLIENT', 403);

  const byok = app.oauthProviders[0];
  const googleClientId = (byok?.providerClientId) || process.env.GOOGLE_CLIENT_ID!;

  // Validate BYOK secret is decryptable — if it fails, fall back to global credentials
  let resolvedClientId = googleClientId;
  if (byok?.providerClientId && byok?.providerSecret) {
    try {
      decryptSecret(byok.providerSecret); // validate it decrypts without error
      resolvedClientId = byok.providerClientId;
    } catch {
      resolvedClientId = process.env.GOOGLE_CLIENT_ID!;
    }
  }

  const googleState = Buffer.from(JSON.stringify({
    client_id:             clientId,
    redirect_uri:          redirectUri,
    code_challenge:        codeChallenge,
    code_challenge_method: codeChallengeMethod,
    pkce_state:            pkceState,
    nonce:                 crypto.randomBytes(16).toString('hex'),
    byok:                  !!(byok?.providerClientId && byok?.providerSecret),
  })).toString('base64url');

  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id',     resolvedClientId);
  googleAuthUrl.searchParams.set('redirect_uri',  `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/oauth/google/callback`);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope',         'openid email profile');
  googleAuthUrl.searchParams.set('state',         googleState);
  googleAuthUrl.searchParams.set('access_type',   'offline');
  googleAuthUrl.searchParams.set('prompt',        'select_account');

  return NextResponse.redirect(googleAuthUrl.toString());
}
