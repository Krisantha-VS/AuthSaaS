import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/infrastructure/db/client';
import { AuditLogRepository } from '@/infrastructure/db/repositories/audit-log.repository';

const auditRepo = new AuditLogRepository();

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function errorPage(message: string): NextResponse {
  return new NextResponse(`<!DOCTYPE html><html><body><h2>Sign-in failed</h2><p>${message}</p></body></html>`, {
    status: 400,
    headers: { 'Content-Type': 'text/html' },
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code        = searchParams.get('code');
  const stateParam  = searchParams.get('state');
  const errorParam  = searchParams.get('error');

  if (errorParam) return errorPage('Google sign-in was cancelled or failed.');
  if (!code || !stateParam) return errorPage('Invalid callback parameters.');

  // Decode PKCE params from state
  let pkce: { client_id: string; redirect_uri: string; code_challenge: string; code_challenge_method: string; pkce_state: string };
  try {
    pkce = JSON.parse(Buffer.from(stateParam, 'base64url').toString('utf-8'));
  } catch {
    return errorPage('Invalid state parameter.');
  }

  // Validate client
  const app = await prisma.tenantApp.findUnique({ where: { clientId: pkce.client_id } });
  if (!app || !app.isActive) return errorPage('Invalid client application.');

  // Exchange code for Google tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri:  `${process.env.NEXT_PUBLIC_APP_URL}/api/v1/oauth/google/callback`,
      grant_type:    'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    const googleErr = await tokenRes.text();
    return errorPage(`Token exchange failed (${tokenRes.status}): ${googleErr}`);
  }
  const tokenData = await tokenRes.json() as { access_token: string };

  // Fetch Google user info
  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  if (!userInfoRes.ok) return errorPage('Failed to fetch Google user info.');
  const googleUser = await userInfoRes.json() as { id: string; email: string; name?: string };

  if (!googleUser.id || !googleUser.email) return errorPage('Google did not return required user info.');

  // Find or create user
  let user = await prisma.user.findFirst({
    where: { appId: app.id, googleId: googleUser.id },
  });

  if (!user) {
    // Try to find by email and link
    const byEmail = await prisma.user.findUnique({
      where: { appId_email: { appId: app.id, email: googleUser.email.toLowerCase() } },
    });
    if (byEmail) {
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data: { googleId: googleUser.id },
      });
    } else {
      // Create new user (no password — Google-only account)
      user = await prisma.user.create({
        data: {
          appId:         app.id,
          email:         googleUser.email.toLowerCase(),
          name:          googleUser.name ?? null,
          passwordHash:  null,
          googleId:      googleUser.id,
          emailVerified: true,
          isActive:      true,
        },
      });
      await auditRepo.create({
        appId:  app.id,
        userId: user.id,
        action: 'register',
        resource: 'auth',
        meta: { provider: 'google' },
      });
    }
  }

  if (!user.isActive) return errorPage('This account has been disabled.');

  await auditRepo.create({
    appId:  app.id,
    userId: user.id,
    action: 'login',
    resource: 'auth',
    meta: { provider: 'google' },
  });

  // Create AuthCode and redirect to app
  const codeRaw  = crypto.randomBytes(32).toString('hex');
  const codeHash = hashCode(codeRaw);

  await prisma.authCode.create({
    data: {
      codeHash,
      clientId:            pkce.client_id,
      userId:              user.id,
      codeChallenge:       pkce.code_challenge,
      codeChallengeMethod: 'S256',
      redirectUri:         pkce.redirect_uri,
      expiresAt:           new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  const callbackUrl = new URL(pkce.redirect_uri);
  callbackUrl.searchParams.set('code',  codeRaw);
  callbackUrl.searchParams.set('state', pkce.pkce_state);

  return NextResponse.redirect(callbackUrl.toString());
}
