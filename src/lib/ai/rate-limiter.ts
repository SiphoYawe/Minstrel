import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from '@/lib/constants';

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs?: number;
}

// In-memory sliding window store. Each user has an array of request timestamps.
// Sufficient for MVP (Vercel serverless). Upgrade to Redis/Upstash at scale.
const requestLog = new Map<string, number[]>();

/**
 * Check whether a request from `userId` is within the rate limit.
 * Uses a sliding window of RATE_LIMIT_WINDOW_MS with a max of RATE_LIMIT_MAX requests.
 */
export function checkRateLimit(userId: string): RateLimitResult {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  let timestamps = requestLog.get(userId);
  if (!timestamps) {
    timestamps = [];
    requestLog.set(userId, timestamps);
  }

  // Prune expired entries
  const validIndex = timestamps.findIndex((t) => t > windowStart);
  if (validIndex > 0) {
    timestamps.splice(0, validIndex);
  } else if (validIndex === -1) {
    timestamps.length = 0;
  }

  if (timestamps.length >= RATE_LIMIT_MAX) {
    const oldestInWindow = timestamps[0];
    const retryAfterMs = oldestInWindow + RATE_LIMIT_WINDOW_MS - now;
    return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs) };
  }

  timestamps.push(now);
  return { allowed: true };
}

/** Clear all rate limit state. Intended for testing only. */
export function resetRateLimits(): void {
  requestLog.clear();
}
