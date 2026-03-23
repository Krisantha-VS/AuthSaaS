/**
 * Sliding-window rate limiter.
 *
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set
 * (required for distributed / multi-instance deployments such as Vercel).
 * Falls back to an in-process Map when those vars are absent (local dev).
 */

// ─── Upstash (distributed) ────────────────────────────────────────────────────

async function checkUpstash(
  key: string,
  max: number,
  windowMs: number,
): Promise<{ allowed: boolean; retryAfter: number }> {
  const { Ratelimit } = await import('@upstash/ratelimit');
  const { Redis }     = await import('@upstash/redis');

  const redis = new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  const windowSec = Math.floor(windowMs / 1000);
  const limiter   = new Ratelimit({
    redis,
    limiter:   Ratelimit.slidingWindow(max, `${windowSec} s`),
    analytics: false,
  });

  const { success, reset } = await limiter.limit(key);
  const retryAfter = success ? 0 : Math.ceil((reset - Date.now()) / 1000);
  return { allowed: success, retryAfter };
}

// ─── In-memory fallback (single-instance / dev) ───────────────────────────────

interface Window { count: number; resetAt: number }
const store = new Map<string, Window>();

function checkMemory(
  key: string,
  max: number,
  windowMs: number,
): { allowed: boolean; retryAfter: number } {
  const now   = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  if (entry.count >= max) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { allowed: true, retryAfter: 0 };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<{ allowed: boolean; retryAfter: number }> {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return checkUpstash(key, max, windowMs);
  }
  return checkMemory(key, max, windowMs);
}
