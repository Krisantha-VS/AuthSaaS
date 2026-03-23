/**
 * Distributed sliding-window rate limiter backed by Upstash Redis.
 *
 * Requires env vars: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 * Get a free instance at https://upstash.com
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache Ratelimit instances so we don't create one per request
const limiters = new Map<string, Ratelimit>();

function getLimiter(max: number, windowMs: number): Ratelimit {
  const windowSec = Math.floor(windowMs / 1000);
  const key = `${max}:${windowSec}`;
  if (!limiters.has(key)) {
    limiters.set(key, new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, `${windowSec} s`),
      analytics: false,
    }));
  }
  return limiters.get(key)!;
}

/**
 * Check whether the request is within the rate limit.
 * @returns `{ allowed: true }` or `{ allowed: false, retryAfter }` (seconds until reset)
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<{ allowed: boolean; retryAfter: number }> {
  const { success, reset } = await getLimiter(max, windowMs).limit(key);
  const retryAfter = success ? 0 : Math.ceil((reset - Date.now()) / 1000);
  return { allowed: success, retryAfter };
}
