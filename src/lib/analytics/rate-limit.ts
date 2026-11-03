/**
 * Best-effort in-memory rate limit (per server instance).
 * Suitable for abuse dampening, not a hard distributed guarantee.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const MAX_KEYS = 5_000;

export function allowRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): boolean {
  if (buckets.size > MAX_KEYS) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
      if (buckets.size <= MAX_KEYS * 0.8) break;
    }
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (existing.count >= limit) return false;
  existing.count += 1;
  return true;
}

/** Test helper */
export function resetRateLimitsForTests(): void {
  buckets.clear();
}
