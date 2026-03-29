import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { TenantRepository } from '@/infrastructure/db/repositories/tenant.repository';
import { TenantAppRepository } from '@/infrastructure/db/repositories/tenant-app.repository';
import { AuditLogRepository } from '@/infrastructure/db/repositories/audit-log.repository';
import { config } from '@/shared/config';
import { seedDefaultRoles } from '@/domain/services/rbac.service';
import { sendMail } from '@/infrastructure/email/mailer';
import { passwordResetEmail, tenantWelcomeEmail, tenantPasswordChangedEmail } from '@/infrastructure/email/templates';

const tenantRepo = new TenantRepository();
const appRepo = new TenantAppRepository();
const auditRepo = new AuditLogRepository();

const SALT_ROUNDS = 12;
const TENANT_TOKEN_TTL_SECONDS = 24 * 60 * 60; // 24 h — no server-side refresh needed (localStorage session)

function generateSecret(): { plain: string; hash: string } {
  const plain = `sas_${crypto.randomBytes(32).toString('hex')}`;
  const hash = bcrypt.hashSync(plain, SALT_ROUNDS);
  return { plain, hash };
}

function issueTenantTokens(tenantId: string, email: string) {
  const accessToken = jwt.sign(
    { sub: tenantId, appId: 'dashboard', email, roles: ['tenant'] },
    config.jwt.accessSecret,
    { expiresIn: TENANT_TOKEN_TTL_SECONDS },
  );
  return { accessToken, refreshToken: '', expiresIn: TENANT_TOKEN_TTL_SECONDS };
}

// ─── Tenant Register / Login ─────────────────────────────

export async function registerTenant(params: {
  name: string;
  email: string;
  password: string;
  ipAddress?: string;
}) {
  const existing = await tenantRepo.findByEmail(params.email);
  if (existing) throw new Error('EMAIL_TAKEN');

  const passwordHash = await bcrypt.hash(params.password, SALT_ROUNDS);
  const tenant = await tenantRepo.create({ name: params.name, email: params.email, password: passwordHash });

  await auditRepo.create({ tenantId: tenant.id, action: 'tenant_register', resource: 'tenant', ipAddress: params.ipAddress });

  // Send welcome email (non-blocking)
  const { subject: twSubject, html: twHtml } = tenantWelcomeEmail({ name: tenant.name ?? null });
  sendMail(tenant.email, twSubject, twHtml).catch(err => console.error('email error:', err));

  const tokens = issueTenantTokens(tenant.id, tenant.email);
  return { tenant, tokens };
}

export async function loginTenant(params: {
  email: string;
  password: string;
  ipAddress?: string;
}) {
  const record = await (tenantRepo as any).findByEmailWithPassword(params.email);
  if (!record) throw new Error('INVALID_CREDENTIALS');

  const valid = await bcrypt.compare(params.password, record.password);
  if (!valid) throw new Error('INVALID_CREDENTIALS');

  await auditRepo.create({ tenantId: record.id, action: 'tenant_login', resource: 'tenant', ipAddress: params.ipAddress });

  const tokens = issueTenantTokens(record.id, record.email);
  return { tenant: { id: record.id, name: record.name, email: record.email }, tokens };
}

// ─── Tenant Forgot / Reset Password ──────────────────────

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function forgotTenantPassword(email: string) {
  // Always silent — never reveal if email exists
  const tenant = await (tenantRepo as any).findByEmailWithPassword(email);
  if (!tenant) return;

  await auditRepo.create({
    tenantId: tenant.id,
    action: 'tenant_password_reset_requested',
    resource: 'tenant',
  });

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const exp = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await tenantRepo.update(tenant.id, { resetToken: tokenHash, resetTokenExp: exp } as any);

  const resetUrl = `${config.app.url}/dashboard/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;
  const { subject, html } = passwordResetEmail({ name: tenant.name ?? null, resetUrl });
  await sendMail(email, subject, html);
}

export async function resetTenantPassword(params: { token: string; email: string; password: string }) {
  const tokenHash = hashToken(params.token);
  const tenant = await (tenantRepo as any).findByResetToken(tokenHash);
  if (!tenant) throw new Error('INVALID_TOKEN');
  if (tenant.resetTokenExp < new Date()) throw new Error('TOKEN_EXPIRED');

  const passwordHash = await bcrypt.hash(params.password, SALT_ROUNDS);
  await tenantRepo.update(tenant.id, { password: passwordHash, resetToken: null, resetTokenExp: null } as any);

  await auditRepo.create({
    tenantId: tenant.id,
    action: 'tenant_password_reset_completed',
    resource: 'tenant',
  });

  // Send password-changed notification (non-blocking)
  const { subject: tpcSubject, html: tpcHtml } = tenantPasswordChangedEmail({ name: tenant.name ?? null });
  sendMail(tenant.email, tpcSubject, tpcHtml).catch(err => console.error('email error:', err));
}

// ─── App Management ──────────────────────────────────────

export async function createApp(params: {
  tenantId: string;
  name: string;
  description?: string;
  allowedOrigins: string[];
}) {
  const { plain, hash } = generateSecret();

  const app = await appRepo.create({
    tenantId: params.tenantId,
    name: params.name,
    description: params.description,
    secretHash: hash,
    allowedOrigins: params.allowedOrigins,
  });

  await auditRepo.create({ tenantId: params.tenantId, appId: app.id, action: 'app_created', resource: 'tenant_app' });

  await seedDefaultRoles(app.id);

  // plain secret shown ONCE — not stored retrievable
  return { app, clientSecret: plain };
}

export async function listApps(tenantId: string) {
  return appRepo.findByTenantId(tenantId);
}

export async function rotateSecret(appId: string, tenantId: string) {
  const app = await appRepo.findById(appId);
  if (!app || app.tenantId !== tenantId) throw new Error('NOT_FOUND');

  const { plain, hash } = generateSecret();
  await appRepo.update(appId, { secretHash: hash } as any);

  await auditRepo.create({ tenantId, appId, action: 'secret_rotated', resource: 'tenant_app' });

  return { clientSecret: plain };
}

export async function toggleApp(appId: string, tenantId: string, isActive: boolean) {
  const app = await appRepo.findById(appId);
  if (!app || app.tenantId !== tenantId) throw new Error('NOT_FOUND');

  const result = await appRepo.update(appId, { isActive } as any);

  await auditRepo.create({
    tenantId,
    appId,
    action: isActive ? 'app_activated' : 'app_deactivated',
    resource: 'tenant_app',
  });

  return result;
}
