import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from '@/lib/constants';
import { getRedis } from '@/lib/redis';

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs?: number;
  /** Total requests allowed in the window */
  limit: number;
  /** Remaining requests in the current window */
  remaining: number;
  /** Unix timestamp (seconds) when the window resets */
  resetAt: number;
}

// In-memory fallback store (used when Redis is not configured)
const requestLog = new Map<string, number[]>();

/**
 * Check whether a request identified by `key` is within the rate limit.
 * Uses Upstash Redis when available, falling back to in-memory Map.
 *
 * @param key - Composite key (e.g. "ai:chat:userId" or "ai:drill:userId")
 * @param maxRequests - Max requests per window (defaults to RATE_LIMIT_MAX)
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number = RATE_LIMIT_MAX
): Promise<RateLimitResult> {
  const redis = getRedis();
  if (redis) {
    return checkRateLimitRedis(key, maxRequests);
  }
  return checkRateLimitMemory(key, maxRequests);
}

/**
 * Distributed rate limiting via Upstash Redis using INCR + EXPIRE.
 * Atomic: the key auto-expires after the window, ensuring no stale state.
 */
async function checkRateLimitRedis(key: string, maxRequests: number): Promise<RateLimitResult> {
  const redis = getRedis()!;
  const redisKey = `ratelimit:${key}`;
  const windowSec = Math.ceil(RATE_LIMIT_WINDOW_MS / 1000);

  // Atomic increment — sets TTL only on the first request in a window
  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.expire(redisKey, windowSec);
  }

  const ttl = await redis.ttl(redisKey);
  const resetAt = Math.ceil(Date.now() / 1000) + Math.max(ttl, 0);
  const remaining = Math.max(0, maxRequests - count);

  if (count > maxRequests) {
    return {
      allowed: false,
      retryAfterMs: Math.max(ttl, 1) * 1000,
      limit: maxRequests,
      remaining: 0,
      resetAt,
    };
  }

  return { allowed: true, limit: maxRequests, remaining, resetAt };
}

/**
 * In-memory sliding window rate limit (fallback for local dev / tests).
 */
function checkRateLimitMemory(key: string, maxRequests: number): RateLimitResult {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  let timestamps = requestLog.get(key);
  if (!timestamps) {
    timestamps = [];
    requestLog.set(key, timestamps);
  }

  // Prune expired entries
  const validIndex = timestamps.findIndex((t) => t > windowStart);
  if (validIndex > 0) {
    timestamps.splice(0, validIndex);
  } else if (validIndex === -1) {
    timestamps.length = 0;
  }

  const resetAt = Math.ceil((now + RATE_LIMIT_WINDOW_MS) / 1000);

  if (timestamps.length >= maxRequests) {
    const oldestInWindow = timestamps[0];
    const retryAfterMs = oldestInWindow + RATE_LIMIT_WINDOW_MS - now;
    return {
      allowed: false,
      retryAfterMs: Math.max(0, retryAfterMs),
      limit: maxRequests,
      remaining: 0,
      resetAt,
    };
  }

  timestamps.push(now);
  return {
    allowed: true,
    limit: maxRequests,
    remaining: maxRequests - timestamps.length,
    resetAt,
  };
}

/** Build rate limit headers from a RateLimitResult for HTTP responses. */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetAt),
  };
  if (!result.allowed && result.retryAfterMs !== undefined) {
    headers['Retry-After'] = String(Math.ceil(result.retryAfterMs / 1000));
  }
  return headers;
}

/** Clear all rate limit state. Intended for testing only. */
export function resetRateLimits(): void {
  requestLog.clear();
}
