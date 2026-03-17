import crypto from 'crypto';
import { WebhookRepository } from '@/infrastructure/db/repositories/webhook.repository';

const webhookRepo = new WebhookRepository();

/** All event types the system can emit */
export const WEBHOOK_EVENTS = [
  'user.registered',
  'user.login',
  'user.verified',
  'user.password_reset',
  'user.deleted',
] as const;

export type WebhookEvent = typeof WEBHOOK_EVENTS[number];

function generateSecret(): string {
  return 'whsec_' + crypto.randomBytes(24).toString('hex');
}

function sign(payload: string, secret: string): string {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export async function listWebhooks(appId: string) {
  const hooks = await webhookRepo.findByApp(appId);
  // Never expose the raw secret
  return hooks.map(h => ({ ...h, secret: h.secret.slice(0, 10) + '...' }));
}

export async function createWebhook(appId: string, url: string, events: string[]) {
  const invalidEvents = events.filter(e => !WEBHOOK_EVENTS.includes(e as WebhookEvent));
  if (invalidEvents.length > 0) throw new Error(`INVALID_EVENTS:${invalidEvents.join(',')}`);

  const secret = generateSecret();
  const hook = await webhookRepo.create({ appId, url, events, secret });
  return { ...hook }; // Return full secret only on creation
}

export async function deleteWebhook(id: string, appId: string): Promise<void> {
  const hook = await webhookRepo.findById(id);
  if (!hook || hook.appId !== appId) throw new Error('WEBHOOK_NOT_FOUND');
  await webhookRepo.delete(id);
}

export async function getWebhookDeliveries(id: string, appId: string, limit = 50) {
  const hook = await webhookRepo.findById(id);
  if (!hook || hook.appId !== appId) throw new Error('WEBHOOK_NOT_FOUND');
  return webhookRepo.findDeliveries(id, limit);
}

/**
 * Dispatch an event to all matching webhooks for an app.
 * Fire-and-forget — never throws; logs errors only.
 */
export async function dispatchWebhookEvent(
  appId: string,
  event: WebhookEvent,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    const hooks = await webhookRepo.findByApp(appId);
    const targets = hooks.filter(h => h.isActive && h.events.includes(event));
    if (targets.length === 0) return;

    const payload = JSON.stringify({
      event,
      appId,
      timestamp: new Date().toISOString(),
      data,
    });

    await Promise.allSettled(
      targets.map(async hook => {
        const sig = sign(payload, hook.secret);
        let status = 0;
        let response: string | undefined;

        try {
          const res = await fetch(hook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-AuthSaas-Signature': sig,
              'X-AuthSaas-Event': event,
            },
            body: payload,
            signal: AbortSignal.timeout(10_000),
          });
          status = res.status;
          response = await res.text().catch(() => undefined);
        } catch (e: unknown) {
          status = 0;
          response = e instanceof Error ? e.message : 'Unknown error';
        }

        await webhookRepo.createDelivery({
          webhookId: hook.id,
          event,
          payload: JSON.parse(payload),
          status,
          response,
        });
      }),
    );
  } catch (e) {
    console.error('[webhook] dispatch error:', e);
  }
}
