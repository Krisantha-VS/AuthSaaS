/**
 * In-process sliding-window rate limiter.
 *
 * Works per serverless instance (best-effort). For a distributed / multi-region
 * deployment upgrade to @upstash/ratelimit + Redis and swap the implementation here.
 */

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

// Prune expired entries every 5 minutes to prevent unbounded memory growth
let lastPrune = Date.now();
function maybePrune() {
  const now = Date.now();
  if (now - lastPrune < 5 * 60 * 1000) return;
  lastPrune = now;
  for (const [k, v] of store) {
    if (now > v.resetAt) store.delete(k);
  }
}

/**
 * Returns true if the request is allowed, false if it should be blocked.
 * @param key      Unique identifier — e.g. `login:1.2.3.4` or `register:email@x.com`
 * @param max      Maximum hits allowed in the window
 * @param windowMs Window duration in milliseconds
 */
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  maybePrune();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

/** Returns seconds until the window resets (for Retry-After header). */
export function retryAfterSeconds(key: string): number {
  const entry = store.get(key);
  if (!entry) return 0;
  return Math.ceil(Math.max(0, entry.resetAt - Date.now()) / 1000);
}
