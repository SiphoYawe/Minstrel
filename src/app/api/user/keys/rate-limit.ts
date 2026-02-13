import { RATE_LIMIT_WINDOW_MS } from '@/lib/constants';
import { getRedis } from '@/lib/redis';

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 10;

// In-memory fallback store
const requestLog = new Map<string, number[]>();

function cleanup(userId: string) {
  const timestamps = requestLog.get(userId);
  if (!timestamps) return;

  const now = Date.now();
  const valid = timestamps.filter((t) => now - t < WINDOW_MS);

  if (valid.length === 0) {
    requestLog.delete(userId);
  } else {
    requestLog.set(userId, valid);
  }
}

export interface KeyRateLimitResult {
  allowed: boolean;
  retryAfterMs?: number;
  limit: number;
  remaining: number;
  resetAt: number;
}

export async function checkRateLimit(userId: string): Promise<KeyRateLimitResult> {
  const redis = getRedis();
  if (redis) {
    return checkRateLimitRedis(userId);
  }
  return checkRateLimitMemory(userId);
}

async function checkRateLimitRedis(userId: string): Promise<KeyRateLimitResult> {
  const redis = getRedis()!;
  const redisKey = `ratelimit:keys:${userId}`;
  const windowSec = Math.ceil(WINDOW_MS / 1000);

  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.expire(redisKey, windowSec);
  }

  const ttl = await redis.ttl(redisKey);
  const resetAt = Math.ceil(Date.now() / 1000) + Math.max(ttl, 0);
  const remaining = Math.max(0, MAX_REQUESTS - count);

  if (count > MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterMs: Math.max(ttl, 1) * 1000,
      limit: MAX_REQUESTS,
      remaining: 0,
      resetAt,
    };
  }

  return { allowed: true, limit: MAX_REQUESTS, remaining, resetAt };
}

function checkRateLimitMemory(userId: string): KeyRateLimitResult {
  cleanup(userId);

  const timestamps = requestLog.get(userId) ?? [];
  const now = Date.now();
  const resetAt = Math.ceil((now + WINDOW_MS) / 1000);

  if (timestamps.length >= MAX_REQUESTS) {
    const oldestInWindow = timestamps[0];
    const retryAfterMs = WINDOW_MS - (now - oldestInWindow);
    return {
      allowed: false,
      retryAfterMs,
      limit: MAX_REQUESTS,
      remaining: 0,
      resetAt,
    };
  }

  return {
    allowed: true,
    limit: MAX_REQUESTS,
    remaining: MAX_REQUESTS - timestamps.length,
    resetAt,
  };
}

export function recordRequest(userId: string): void {
  // For Redis path, recording is handled by checkRateLimit (INCR)
  // This only applies to in-memory fallback
  const timestamps = requestLog.get(userId) ?? [];
  timestamps.push(Date.now());
  requestLog.set(userId, timestamps);
}

export function resetRateLimits(): void {
  requestLog.clear();
}
