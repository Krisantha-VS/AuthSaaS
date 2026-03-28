import { prisma } from '../client';

export interface WebhookRecord {
  id: string;
  appId: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  createdAt: Date;
}

export interface WebhookDeliveryRecord {
  id: string;
  webhookId: string;
  event: string;
  payload: unknown;
  status: number;
  response: string | null;
  attempts: number;
  deliveredAt: Date | null;
  createdAt: Date;
}

export class WebhookRepository {
  private castHook(h: Record<string, unknown>): WebhookRecord {
    return { ...h, events: h.events as string[] } as WebhookRecord;
  }

  async findByApp(appId: string): Promise<WebhookRecord[]> {
    const hooks = await prisma.webhook.findMany({
      where: { appId },
      orderBy: { createdAt: 'desc' },
    });
    return hooks.map(h => this.castHook(h as unknown as Record<string, unknown>));
  }

  async findById(id: string): Promise<WebhookRecord | null> {
    const hook = await prisma.webhook.findUnique({ where: { id } });
    return hook ? this.castHook(hook as unknown as Record<string, unknown>) : null;
  }

  async create(data: { appId: string; url: string; events: string[]; secret: string }): Promise<WebhookRecord> {
    const hook = await prisma.webhook.create({ data });
    return this.castHook(hook as unknown as Record<string, unknown>);
  }

  async update(id: string, data: Partial<Pick<WebhookRecord, 'url' | 'events' | 'isActive'>>): Promise<WebhookRecord> {
    const hook = await prisma.webhook.update({ where: { id }, data });
    return this.castHook(hook as unknown as Record<string, unknown>);
  }

  async delete(id: string): Promise<void> {
    await prisma.webhookDelivery.deleteMany({ where: { webhookId: id } });
    await prisma.webhook.delete({ where: { id } });
  }

  async findDeliveries(webhookId: string, limit = 50): Promise<WebhookDeliveryRecord[]> {
    return prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async createDelivery(data: {
    webhookId: string;
    event: string;
    payload: unknown;
    status: number;
    response?: string;
  }): Promise<WebhookDeliveryRecord> {
    return prisma.webhookDelivery.create({
      data: {
        webhookId: data.webhookId,
        event: data.event,
        payload: JSON.parse(JSON.stringify(data.payload)),
        status: data.status,
        response: data.response ?? null,
        deliveredAt: data.status >= 200 && data.status < 300 ? new Date() : null,
      },
    });
  }
}
