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
  async findByApp(appId: string): Promise<WebhookRecord[]> {
    return prisma.webhook.findMany({
      where: { appId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<WebhookRecord | null> {
    return prisma.webhook.findUnique({ where: { id } });
  }

  async create(data: { appId: string; url: string; events: string[]; secret: string }): Promise<WebhookRecord> {
    return prisma.webhook.create({ data });
  }

  async update(id: string, data: Partial<Pick<WebhookRecord, 'url' | 'events' | 'isActive'>>): Promise<WebhookRecord> {
    return prisma.webhook.update({ where: { id }, data });
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
