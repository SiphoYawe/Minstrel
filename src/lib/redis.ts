import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

/**
 * Get the Upstash Redis client. Returns null when env vars are not configured
 * (local dev without Redis), allowing graceful fallback to in-memory rate limiting.
 */
export function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_URL;
  const token = process.env.UPSTASH_REDIS_TOKEN;

  if (!url || !token) return null;

  redis = new Redis({ url, token });
  return redis;
}
