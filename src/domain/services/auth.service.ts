import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/infrastructure/jwt';
import { UserRepository } from '@/infrastructure/db/repositories/user.repository';
import { RefreshTokenRepository } from '@/infrastructure/db/repositories/refresh-token.repository';
import { TenantAppRepository } from '@/infrastructure/db/repositories/tenant-app.repository';
import { AuditLogRepository } from '@/infrastructure/db/repositories/audit-log.repository';
import { sendMail } from '@/infrastructure/email/mailer';
import { verificationEmail, passwordResetEmail } from '@/infrastructure/email/templates';
import { config } from '@/shared/config';
import type { AuthTokens } from '@/shared/types';
import { assignRole } from '@/domain/services/rbac.service';

const userRepo = new UserRepository();
const refreshTokenRepo = new RefreshTokenRepository();
const tenantAppRepo = new TenantAppRepository();
const auditRepo = new AuditLogRepository();

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_TTL_DAYS = 7;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function issueTokens(userId: string, appId: string, email: string, roles: string[]): Promise<AuthTokens> {
  const accessToken = signAccessToken({ sub: userId, appId, email, roles });
  const refreshToken = signRefreshToken(userId);
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await refreshTokenRepo.create({ tokenHash, userId, appId, expiresAt });

  return { accessToken, refreshToken, expiresIn: 15 * 60 };
}

export async function register(params: {
  clientId: string;
  email: string;
  password: string;
  name?: string;
  ipAddress?: string;
}) {
  const app = await tenantAppRepo.findByClientId(params.clientId);
  if (!app || !app.isActive) throw new Error('INVALID_CLIENT');

  const existing = await userRepo.findByEmail(app.id, params.email);
  if (existing) throw new Error('EMAIL_TAKEN');

  const passwordHash = await bcrypt.hash(params.password, SALT_ROUNDS);
  const verifyTokenRaw = crypto.randomBytes(32).toString('hex');
  // Store only the hash — raw token is returned to caller for email delivery
  const verifyToken = crypto.createHash('sha256').update(verifyTokenRaw).digest('hex');

  const user = await userRepo.create({
    appId: app.id,
    email: params.email,
    passwordHash,
    name: params.name,
  });

  await userRepo.update(user.id, { verifyToken } as any);

  await auditRepo.create({
    appId: app.id,
    userId: user.id,
    action: 'register',
    resource: 'auth',
    ipAddress: params.ipAddress,
  });

  const tokens = await issueTokens(user.id, app.id, user.email, user.roles);

  // Auto-assign default 'user' role (non-blocking)
  assignRole(user.id, app.id, 'user').catch(e => console.error('[rbac] role assign failed:', e));

  // Send verification email (non-blocking — don't fail registration if email fails)
  const verifyUrl = `${config.app.url}/api/v1/auth/verify?token=${verifyTokenRaw}&email=${encodeURIComponent(params.email)}`;
  const { subject, html } = verificationEmail({ name: params.name ?? null, verifyUrl });
  sendMail(params.email, subject, html).catch(err => console.error('[email] verification send failed:', err));

  return { user, tokens };
}

export async function login(params: {
  clientId: string;
  email: string;
  password: string;
  ipAddress?: string;
}) {
  const app = await tenantAppRepo.findByClientId(params.clientId);
  if (!app || !app.isActive) throw new Error('INVALID_CLIENT');

  const userWithPassword = await (userRepo as any).findByEmailWithPassword(app.id, params.email);
  if (!userWithPassword) throw new Error('INVALID_CREDENTIALS');
  if (!userWithPassword.isActive) throw new Error('ACCOUNT_DISABLED');

  const valid = await bcrypt.compare(params.password, userWithPassword.passwordHash);
  if (!valid) throw new Error('INVALID_CREDENTIALS');

  await auditRepo.create({
    appId: app.id,
    userId: userWithPassword.id,
    action: 'login',
    resource: 'auth',
    ipAddress: params.ipAddress,
  });

  const roles = userWithPassword.roles?.map((ur: any) => ur.role.name) ?? [];
  const tokens = await issueTokens(userWithPassword.id, app.id, userWithPassword.email, roles);

  const { passwordHash: _ph, verifyToken: _vt, resetToken: _rt, resetTokenExp: _rte, ...safeUser } = userWithPassword;
  return { user: safeUser, tokens };
}

export async function refresh(params: { refreshToken: string; ipAddress?: string }) {
  const tokenHash = hashToken(params.refreshToken);
  const stored = await refreshTokenRepo.findByHash(tokenHash);

  if (!stored) throw new Error('INVALID_TOKEN');
  if (stored.usedAt) {
    // Attacker may have the newer token family — nuke ALL sessions for this user
    await refreshTokenRepo.deleteAllForUser(stored.userId);
    throw new Error('TOKEN_REUSE');
  }
  if (stored.expiresAt < new Date()) throw new Error('TOKEN_EXPIRED');

  // Verify JWT signature
  verifyRefreshToken(params.refreshToken);

  // Invalidate used token (rotation)
  await refreshTokenRepo.markUsed(stored.id);

  const user = await userRepo.findById(stored.userId);
  if (!user || !user.isActive) throw new Error('USER_NOT_FOUND');

  await auditRepo.create({
    appId: stored.appId,
    userId: user.id,
    action: 'token_refresh',
    resource: 'auth',
    ipAddress: params.ipAddress,
  });

  return issueTokens(user.id, stored.appId, user.email, user.roles);
}

export async function logout(params: { userId: string; appId: string }) {
  await refreshTokenRepo.deleteAllForUser(params.userId);
  await auditRepo.create({
    appId: params.appId,
    userId: params.userId,
    action: 'logout',
    resource: 'auth',
  });
}

export async function verifyEmail(params: { token: string; email: string }) {
  const tokenHash = hashToken(params.token);
  const user = await (userRepo as any).findByVerifyToken(tokenHash);
  if (!user) throw new Error('INVALID_TOKEN');
  if (user.emailVerified) throw new Error('ALREADY_VERIFIED');

  await userRepo.update(user.id, { emailVerified: true, verifyToken: null } as any);
}

export async function forgotPassword(params: {
  clientId: string;
  email: string;
}) {
  const app = await tenantAppRepo.findByClientId(params.clientId);
  if (!app || !app.isActive) throw new Error('INVALID_CLIENT');

  // Always respond with success — never reveal whether the email exists
  const user = await userRepo.findByEmail(app.id, params.email);
  if (!user || !user.isActive) return;

  const resetTokenRaw = crypto.randomBytes(32).toString('hex');
  const resetToken = hashToken(resetTokenRaw);
  const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await userRepo.update(user.id, { resetToken, resetTokenExp } as any);

  const resetUrl = `${config.app.url}/reset-password?token=${resetTokenRaw}&email=${encodeURIComponent(params.email)}`;
  const { subject, html } = passwordResetEmail({ name: user.name ?? null, resetUrl });
  await sendMail(params.email, subject, html);
}

export async function resetPassword(params: {
  token: string;
  email: string;
  password: string;
}) {
  const tokenHash = hashToken(params.token);
  const user = await (userRepo as any).findByResetToken(tokenHash);
  if (!user) throw new Error('INVALID_TOKEN');
  if ((user as any).resetTokenExp < new Date()) throw new Error('TOKEN_EXPIRED');

  const passwordHash = await bcrypt.hash(params.password, SALT_ROUNDS);
  await userRepo.update(user.id, { passwordHash, resetToken: null, resetTokenExp: null } as any);

  // Invalidate all sessions after password reset
  await refreshTokenRepo.deleteAllForUser(user.id);
}

export async function resendVerification(params: {
  clientId: string;
  email: string;
}) {
  const app = await tenantAppRepo.findByClientId(params.clientId);
  if (!app || !app.isActive) throw new Error('INVALID_CLIENT');

  const user = await userRepo.findByEmail(app.id, params.email);
  if (!user) throw new Error('USER_NOT_FOUND');
  if (user.emailVerified) throw new Error('ALREADY_VERIFIED');

  const verifyTokenRaw = crypto.randomBytes(32).toString('hex');
  const verifyToken = hashToken(verifyTokenRaw);
  await userRepo.update(user.id, { verifyToken } as any);

  const verifyUrl = `${config.app.url}/api/v1/auth/verify?token=${verifyTokenRaw}&email=${encodeURIComponent(params.email)}`;
  const { subject, html } = verificationEmail({ name: user.name ?? null, verifyUrl });
  await sendMail(params.email, subject, html);
}
