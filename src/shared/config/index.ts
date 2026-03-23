export const config = {
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    env: process.env.NODE_ENV ?? 'development',
  },
  email: {
    from: process.env.EMAIL_FROM ?? 'noreply@authsaas.dev',
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT ?? 587),
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
  },
  cookie: {
    // Set to ".royalda.com" (with leading dot) to share cookies across subdomains.
    // Leave unset for single-host deployments.
    domain: process.env.COOKIE_DOMAIN as string | undefined,
    secure: process.env.NODE_ENV === 'production',
    refreshTtlSeconds: 7 * 24 * 60 * 60, // must match REFRESH_TOKEN_TTL_DAYS in auth.service
  },
} as const;
