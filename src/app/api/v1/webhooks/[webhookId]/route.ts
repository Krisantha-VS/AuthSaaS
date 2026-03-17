import { ok, err, handleError } from '@/shared/lib/api';
import { requireAuth, isTenantAuth } from '@/shared/lib/middleware';
import { TenantAppRepository } from '@/infrastructure/db/repositories/tenant-app.repository';
import { WebhookRepository } from '@/infrastructure/db/repositories/webhook.repository';
import { deleteWebhook } from '@/domain/services/webhook.service';

const appRepo = new TenantAppRepository();
const webhookRepo = new WebhookRepository();

export async function DELETE(req: Request, { params }: { params: Promise<{ webhookId: string }> }) {
  const auth = requireAuth(req);
  if (!isTenantAuth(auth)) return auth;

  try {
    const { webhookId } = await params;
    const { searchParams } = new URL(req.url);
    const appId = searchParams.get('appId') ?? '';

    const app = await appRepo.findById(appId);
    if (!app || app.tenantId !== auth.payload.sub) return err('Not found', 'NOT_FOUND', 404);

    await deleteWebhook(webhookId, appId);
    return ok({ message: 'Webhook deleted' });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'WEBHOOK_NOT_FOUND') return err('Webhook not found', 'NOT_FOUND', 404);
    return handleError(e);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ webhookId: string }> }) {
  const auth = requireAuth(req);
  if (!isTenantAuth(auth)) return auth;

  try {
    const { webhookId } = await params;
    const body = await req.json() as { appId?: string; isActive?: boolean };

    if (!body.appId) return err('appId is required', 'VALIDATION_ERROR');

    const app = await appRepo.findById(body.appId);
    if (!app || app.tenantId !== auth.payload.sub) return err('Not found', 'NOT_FOUND', 404);

    const hook = await webhookRepo.findById(webhookId);
    if (!hook || hook.appId !== body.appId) return err('Webhook not found', 'NOT_FOUND', 404);

    const updated = await webhookRepo.update(webhookId, { isActive: body.isActive ?? !hook.isActive });
    return ok({ webhook: { ...updated, secret: updated.secret.slice(0, 10) + '...' } });
  } catch (e) {
    return handleError(e);
  }
}
