import { ok, err, handleError } from '@/shared/lib/api';
import { prisma } from '@/infrastructure/db/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('client_id');
    if (!clientId) return err('client_id is required', 'VALIDATION_ERROR', 400);

    const app = await prisma.tenantApp.findUnique({
      where:  { clientId },
      select: { id: true, isActive: true },
    });
    if (!app || !app.isActive) return err('Unknown application', 'INVALID_CLIENT', 401);

    const records = await prisma.appOAuthProvider.findMany({
      where:  { appId: app.id, enabled: true },
      select: { provider: true },
    });

    return ok({ providers: records.map(r => r.provider) });
  } catch (e) {
    return handleError(e);
  }
}
