import { ok, err, handleError } from '@/shared/lib/api';
import { requireAuth, isTenantAuth } from '@/shared/lib/middleware';
import { TenantAppRepository } from '@/infrastructure/db/repositories/tenant-app.repository';
import { listWebhooks, createWebhook, WEBHOOK_EVENTS } from '@/domain/services/webhook.service';

const appRepo = new TenantAppRepository();

export async function GET(req: Request) {
  const auth = requireAuth(req);
  if (!isTenantAuth(auth)) return auth;

  try {
    const appId = new URL(req.url).searchParams.get('appId') ?? '';
    const app = await appRepo.findById(appId);
    if (!app || app.tenantId !== auth.payload.sub) return err('Not found', 'NOT_FOUND', 404);

    const webhooks = await listWebhooks(appId);
    return ok({ webhooks, availableEvents: WEBHOOK_EVENTS });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  const auth = requireAuth(req);
  if (!isTenantAuth(auth)) return auth;

  try {
    const body = await req.json() as { appId?: string; url?: string; events?: unknown };

    if (!body.appId) return err('appId is required', 'VALIDATION_ERROR');
    if (!body.url || !/^https?:\/\/.+/.test(body.url)) return err('url must be a valid URL', 'VALIDATION_ERROR');
    if (!Array.isArray(body.events) || body.events.length === 0) {
      return err('events must be a non-empty array', 'VALIDATION_ERROR');
    }

    const app = await appRepo.findById(body.appId);
    if (!app || app.tenantId !== auth.payload.sub) return err('Not found', 'NOT_FOUND', 404);

    const webhook = await createWebhook(body.appId, body.url, body.events as string[]);
    return ok({ webhook }, 201);
  } catch (e: unknown) {
    if (e instanceof Error && e.message.startsWith('INVALID_EVENTS:')) {
      return err(`Invalid events: ${e.message.split(':')[1]}`, 'VALIDATION_ERROR');
    }
    return handleError(e);
  }
}
