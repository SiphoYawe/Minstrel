// MVP: In-memory rate limiting. State is per-isolate and resets on cold starts.
// On Vercel, each serverless invocation may get a fresh Map. Upgrade to Redis
// or Upstash if stricter cross-instance enforcement is needed.
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 10;

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

export function checkRateLimit(userId: string): { allowed: boolean; retryAfterMs?: number } {
  cleanup(userId);

  const timestamps = requestLog.get(userId) ?? [];

  if (timestamps.length >= MAX_REQUESTS) {
    const oldestInWindow = timestamps[0];
    const retryAfterMs = WINDOW_MS - (Date.now() - oldestInWindow);
    return { allowed: false, retryAfterMs };
  }

  return { allowed: true };
}

export function recordRequest(userId: string): void {
  const timestamps = requestLog.get(userId) ?? [];
  timestamps.push(Date.now());
  requestLog.set(userId, timestamps);
}

export function resetRateLimits(): void {
  requestLog.clear();
}
