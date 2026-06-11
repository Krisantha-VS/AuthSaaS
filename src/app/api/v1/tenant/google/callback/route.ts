import { NextRequest, NextResponse } from 'next/server';
import { loginOrCreateTenantWithGoogle } from '@/domain/services/tenant.service';
import { getIp } from '@/shared/lib/api';

function errorPage(msg: string) {
  return new NextResponse(
    `<!DOCTYPE html><html><body><h2>Sign-in failed</h2><p>${msg}</p><a href="/dashboard/login">Back to login</a></body></html>`,
    { status: 400, headers: { 'Content-Type': 'text/html' } }
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code       = searchParams.get('code');
  const stateParam = searchParams.get('state');
  const errorParam = searchParams.get('error');

  if (errorParam) return errorPage('Google sign-in was cancelled.');
  if (!code || !stateParam) return errorPage('Invalid callback parameters.');

  // Exchange code for Google tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri:  `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/tenant/google/callback`,
      grant_type:    'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    const e = await tokenRes.text();
    return errorPage(`Token exchange failed: ${e}`);
  }
  const { access_token } = await tokenRes.json() as { access_token: string };

  // Fetch Google user info
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!userRes.ok) return errorPage('Failed to fetch Google user info.');
  const { id, email, name } = await userRes.json() as { id: string; email: string; name: string };

  if (!id || !email) return errorPage('Google did not return required user info.');

  const ip = getIp(req);
  const result = await loginOrCreateTenantWithGoogle({ googleId: id, email, name, ipAddress: ip });

  // Pass session to client-side page via URL params
  const dest = new URL('/dashboard/google-session', process.env.NEXT_PUBLIC_APP_URL!);
  dest.searchParams.set('at',    result.tokens.accessToken);
  dest.searchParams.set('ei',    String(result.tokens.expiresIn));
  dest.searchParams.set('tid',   result.tenant.id);
  dest.searchParams.set('tn',    result.tenant.name);
  dest.searchParams.set('te',    result.tenant.email);

  return NextResponse.redirect(dest.toString());
}
