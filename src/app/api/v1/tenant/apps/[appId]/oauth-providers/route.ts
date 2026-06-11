import { ok, err, handleError } from '@/shared/lib/api';
import { requireAuth, isTenantAuth } from '@/shared/lib/middleware';
import { prisma } from '@/infrastructure/db/client';

const KNOWN_PROVIDERS = ['google', 'microsoft'] as const;

export async function GET(req: Request, { params }: { params: Promise<{ appId: string }> }) {
  const auth = requireAuth(req);
  if (!isTenantAuth(auth)) return auth;

  try {
    const { appId } = await params;
    const app = await prisma.tenantApp.findUnique({ where: { id: appId }, select: { tenantId: true } });
    if (!app || app.tenantId !== auth.payload.sub) return err('Not found', 'NOT_FOUND', 404);

    const records = await prisma.appOAuthProvider.findMany({ where: { appId } });
    const result = KNOWN_PROVIDERS.map(provider => {
      const found = records.find(r => r.provider === provider);
      return { provider, enabled: found?.enabled ?? false };
    });

    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ appId: string }> }) {
  const auth = requireAuth(req);
  if (!isTenantAuth(auth)) return auth;

  try {
    const { appId } = await params;
    const app = await prisma.tenantApp.findUnique({ where: { id: appId }, select: { tenantId: true } });
    if (!app || app.tenantId !== auth.payload.sub) return err('Not found', 'NOT_FOUND', 404);

    const body = await req.json() as { provider?: string; enabled?: boolean };
    const { provider, enabled } = body;

    if (typeof provider !== 'string' || !KNOWN_PROVIDERS.includes(provider as typeof KNOWN_PROVIDERS[number])) {
      return err('Invalid provider', 'VALIDATION_ERROR', 400);
    }
    if (typeof enabled !== 'boolean') {
      return err('enabled must be a boolean', 'VALIDATION_ERROR', 400);
    }

    const record = await prisma.appOAuthProvider.upsert({
      where:  { appId_provider: { appId, provider } },
      update: { enabled },
      create: { appId, provider, enabled },
    });

    return ok({ provider: record.provider, enabled: record.enabled });
  } catch (e) {
    return handleError(e);
  }
}
