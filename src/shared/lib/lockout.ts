/**
 * Distributed per-account brute-force lockout backed by Upstash Redis.
 *
 * Requires env vars: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 */

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const MAX_FAILURES    = 5;
const LOCKOUT_SEC     = 15 * 60; // 15 minutes
const FAILURE_TTL_SEC = 30 * 60; // failure counter resets after 30 min of inactivity

const fk = (key: string) => `lockout:f:${key}`;
const lk = (key: string) => `lockout:l:${key}`;

/** Increments the failure counter; locks the account after MAX_FAILURES. */
export async function recordFailedAttempt(key: string): Promise<void> {
  const count = await redis.incr(fk(key));
  if (count === 1) await redis.expire(fk(key), FAILURE_TTL_SEC);
  if (count >= MAX_FAILURES) {
    await redis.set(lk(key), '1', { ex: LOCKOUT_SEC });
  }
}

/** Returns true if the account is currently locked out. */
export async function isLockedOut(key: string): Promise<boolean> {
  return (await redis.exists(lk(key))) === 1;
}

/** Clears failure counter and lockout on successful login. */
export async function clearFailedAttempts(key: string): Promise<void> {
  await redis.del(fk(key), lk(key));
}

/** Returns seconds remaining until the lockout expires (0 if not locked). */
export async function lockoutRemainingSeconds(key: string): Promise<number> {
  const ttl = await redis.ttl(lk(key));
  return Math.max(0, ttl);
}
