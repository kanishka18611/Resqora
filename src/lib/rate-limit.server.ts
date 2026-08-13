/**
 * Best-effort server-side rate limiting for public server functions.
 *
 * Workers are stateless and can be recycled, so this is a per-instance sliding
 * window: it stops bursts and scripted abuse cheaply without a database round
 * trip, layered on top of the client-side throttles and platform limits.
 */
const buckets = new Map<string, number[]>();
const MAX_KEYS = 5_000;

export type ServerRateLimit = { allowed: true } | { allowed: false; retryAfter: number };

export function limitByKey(key: string, max: number, windowMs: number): ServerRateLimit {
  const now = Date.now();
  if (buckets.size > MAX_KEYS) buckets.clear();
  const hits = (buckets.get(key) ?? []).filter((at) => now - at < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return { allowed: false, retryAfter: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { allowed: true };
}

/** Caller identity for limiting: proxy client IP, falling back to a shared bucket. */
export function callerKey(request: Request, scope: string) {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  return `${scope}:${ip}`;
}

/** Throws a user-safe error when the caller is over the limit. */
export function enforceLimit(request: Request, scope: string, max: number, windowMs: number) {
  const result = limitByKey(callerKey(request, scope), max, windowMs);
  if (!result.allowed) {
    throw new Error(
      `Too many requests — please wait ${result.retryAfter} second(s) before trying again.`,
    );
  }
}
