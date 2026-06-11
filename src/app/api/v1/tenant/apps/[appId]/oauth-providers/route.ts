import { ok, err, handleError } from '@/shared/lib/api';
import { requireAuth, isTenantAuth } from '@/shared/lib/middleware';
import { prisma } from '@/infrastructure/db/client';
import { encryptSecret } from '@/shared/lib/crypto';

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
      return {
        provider,
        enabled:          found?.enabled ?? false,
        hasKeys:          !!(found?.providerClientId && found?.providerSecret),
        providerClientId: found?.providerClientId ?? null,
        // Never return providerSecret — only indicate if one is stored
      };
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

    const body = await req.json() as {
      provider?: string;
      enabled?: boolean;
      providerClientId?: string;
      providerSecret?: string;
    };
    const { provider, enabled, providerClientId, providerSecret } = body;

    if (typeof provider !== 'string' || !KNOWN_PROVIDERS.includes(provider as typeof KNOWN_PROVIDERS[number])) {
      return err('Invalid provider', 'VALIDATION_ERROR', 400);
    }

    const updateData: Record<string, unknown> = {};
    if (typeof enabled === 'boolean') updateData.enabled = enabled;
    if (providerClientId !== undefined) updateData.providerClientId = providerClientId.trim() || null;
    if (providerSecret !== undefined && providerSecret.trim()) {
      updateData.providerSecret = encryptSecret(providerSecret.trim());
    }

    const existing = await prisma.appOAuthProvider.findUnique({
      where: { appId_provider: { appId, provider } },
    });

    const record = existing
      ? await prisma.appOAuthProvider.update({
          where: { appId_provider: { appId, provider } },
          data:  updateData,
        })
      : await prisma.appOAuthProvider.create({
          data: {
            appId,
            provider,
            enabled:          (updateData.enabled as boolean) ?? false,
            providerClientId: (updateData.providerClientId as string) ?? null,
            providerSecret:   (updateData.providerSecret as string) ?? null,
          },
        });

    return ok({
      provider:         record.provider,
      enabled:          record.enabled,
      hasKeys:          !!(record.providerClientId && record.providerSecret),
      providerClientId: record.providerClientId ?? null,
    });
  } catch (e) {
    return handleError(e);
  }
}
