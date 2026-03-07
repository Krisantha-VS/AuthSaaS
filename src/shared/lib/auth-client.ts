import { AuthClient } from '@auth-saas/client';

let client: AuthClient | null = null;

export function getAuthClient(): AuthClient {
  if (!client) {
    client = new AuthClient({
      clientId: process.env.NEXT_PUBLIC_AUTH_CLIENT_ID ?? '',
      baseUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/v1`,
    });
  }
  return client;
}
