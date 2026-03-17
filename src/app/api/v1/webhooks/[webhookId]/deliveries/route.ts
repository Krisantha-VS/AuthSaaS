import { ok, err, handleError } from '@/shared/lib/api';
import { requireAuth, isTenantAuth } from '@/shared/lib/middleware';
import { TenantAppRepository } from '@/infrastructure/db/repositories/tenant-app.repository';
import { getWebhookDeliveries } from '@/domain/services/webhook.service';

const appRepo = new TenantAppRepository();

export async function GET(req: Request, { params }: { params: Promise<{ webhookId: string }> }) {
  const auth = requireAuth(req);
  if (!isTenantAuth(auth)) return auth;

  try {
    const { webhookId } = await params;
    const { searchParams } = new URL(req.url);
    const appId = searchParams.get('appId') ?? '';
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);

    const app = await appRepo.findById(appId);
    if (!app || app.tenantId !== auth.payload.sub) return err('Not found', 'NOT_FOUND', 404);

    const deliveries = await getWebhookDeliveries(webhookId, appId, limit);
    return ok({ deliveries });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'WEBHOOK_NOT_FOUND') return err('Webhook not found', 'NOT_FOUND', 404);
    return handleError(e);
  }
}
