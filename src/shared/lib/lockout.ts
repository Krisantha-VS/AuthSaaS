/**
 * In-process per-account brute-force lockout.
 *
 * Works per serverless instance (best-effort). For a distributed / multi-region
 * deployment upgrade to Redis and swap the implementation here.
 */

interface LockoutEntry {
  failures: number;
  lockedUntil: number | null; // epoch ms, null = not locked
}

const store = new Map<string, LockoutEntry>();

const MAX_FAILURES  = 5;
const LOCKOUT_MS    = 15 * 60 * 1000; // 15 minutes

// Prune expired entries every 5 minutes to prevent unbounded memory growth
let lastPrune = Date.now();
function maybePrune() {
  const now = Date.now();
  if (now - lastPrune < 5 * 60 * 1000) return;
  lastPrune = now;
  for (const [k, v] of store) {
    // Safe to remove if not locked and no failures, or lockout has expired
    if (v.lockedUntil !== null && now > v.lockedUntil) {
      store.delete(k);
    } else if (v.lockedUntil === null && v.failures === 0) {
      store.delete(k);
    }
  }
}

/** Increments the failure counter for the key; locks the account after MAX_FAILURES. */
export function recordFailedAttempt(key: string): void {
  maybePrune();
  const entry = store.get(key) ?? { failures: 0, lockedUntil: null };
  entry.failures += 1;
  if (entry.failures >= MAX_FAILURES) {
    entry.lockedUntil = Date.now() + LOCKOUT_MS;
  }
  store.set(key, entry);
}

/** Returns true if the key is currently locked out. */
export function isLockedOut(key: string): boolean {
  maybePrune();
  const entry = store.get(key);
  if (!entry || entry.lockedUntil === null) return false;
  if (Date.now() > entry.lockedUntil) {
    // Lockout expired — clean up
    store.delete(key);
    return false;
  }
  return true;
}

/** Resets the failure counter on successful login. */
export function clearFailedAttempts(key: string): void {
  store.delete(key);
}

/** Returns seconds remaining until the lockout expires (0 if not locked). */
export function lockoutRemainingSeconds(key: string): number {
  const entry = store.get(key);
  if (!entry || entry.lockedUntil === null) return 0;
  return Math.ceil(Math.max(0, entry.lockedUntil - Date.now()) / 1000);
}
