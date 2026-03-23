/**
 * Per-account brute-force lockout.
 *
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set
 * (required for distributed / multi-instance deployments such as Vercel).
 * Falls back to an in-process Map when those vars are absent (local dev).
 */

const MAX_FAILURES    = 5;
const LOCKOUT_SEC     = 15 * 60;
const FAILURE_TTL_SEC = 30 * 60;

// ─── In-memory fallback ───────────────────────────────────────────────────────

interface LockoutEntry { failures: number; lockedUntil: number | null }
const store = new Map<string, LockoutEntry>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hasUpstash() {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

async function getRedis() {
  const { Redis } = await import('@upstash/redis');
  return new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

const fk = (key: string) => `lockout:f:${key}`;
const lk = (key: string) => `lockout:l:${key}`;

// ─── Public API ───────────────────────────────────────────────────────────────

export async function recordFailedAttempt(key: string): Promise<void> {
  if (hasUpstash()) {
    const redis = await getRedis();
    const count = await redis.incr(fk(key));
    if (count === 1) await redis.expire(fk(key), FAILURE_TTL_SEC);
    if (count >= MAX_FAILURES) await redis.set(lk(key), '1', { ex: LOCKOUT_SEC });
    return;
  }
  const entry = store.get(key) ?? { failures: 0, lockedUntil: null };
  entry.failures += 1;
  if (entry.failures >= MAX_FAILURES) entry.lockedUntil = Date.now() + LOCKOUT_SEC * 1000;
  store.set(key, entry);
}

export async function isLockedOut(key: string): Promise<boolean> {
  if (hasUpstash()) {
    const redis = await getRedis();
    return (await redis.exists(lk(key))) === 1;
  }
  const entry = store.get(key);
  if (!entry?.lockedUntil) return false;
  if (Date.now() > entry.lockedUntil) { store.delete(key); return false; }
  return true;
}

export async function clearFailedAttempts(key: string): Promise<void> {
  if (hasUpstash()) {
    const redis = await getRedis();
    await redis.del(fk(key), lk(key));
    return;
  }
  store.delete(key);
}

export async function lockoutRemainingSeconds(key: string): Promise<number> {
  if (hasUpstash()) {
    const redis = await getRedis();
    return Math.max(0, await redis.ttl(lk(key)));
  }
  const entry = store.get(key);
  if (!entry?.lockedUntil) return 0;
  return Math.ceil(Math.max(0, entry.lockedUntil - Date.now()) / 1000);
}
