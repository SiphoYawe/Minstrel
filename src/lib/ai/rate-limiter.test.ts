// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkRateLimit, rateLimitHeaders, resetRateLimits } from './rate-limiter';
import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from '@/lib/constants';
import { getRedis } from '@/lib/redis';

// Mock Redis — defaults to null (in-memory fallback), overridden per-test for Redis suite
vi.mock('@/lib/redis', () => ({
  getRedis: vi.fn(() => null),
}));

describe('checkRateLimit (in-memory fallback)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetRateLimits();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows the first request', async () => {
    const result = await checkRateLimit('user-1');
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(RATE_LIMIT_MAX);
    expect(result.remaining).toBe(RATE_LIMIT_MAX - 1);
    expect(typeof result.resetAt).toBe('number');
  });

  it('allows up to RATE_LIMIT_MAX requests', async () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      const result = await checkRateLimit('user-1');
      expect(result.allowed).toBe(true);
    }
  });

  it('rejects the (RATE_LIMIT_MAX + 1)th request', async () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      await checkRateLimit('user-1');
    }
    const result = await checkRateLimit('user-1');
    expect(result.allowed).toBe(false);
  });

  it('includes retryAfterMs and metadata when rejected', async () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      await checkRateLimit('user-1');
    }
    const result = await checkRateLimit('user-1');
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeDefined();
    expect(typeof result.retryAfterMs).toBe('number');
    expect(result.retryAfterMs).toBeGreaterThanOrEqual(0);
    expect(result.limit).toBe(RATE_LIMIT_MAX);
    expect(result.remaining).toBe(0);
    expect(typeof result.resetAt).toBe('number');
  });

  it('allows requests again after the window expires', async () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      await checkRateLimit('user-1');
    }

    expect((await checkRateLimit('user-1')).allowed).toBe(false);

    vi.advanceTimersByTime(RATE_LIMIT_WINDOW_MS + 1);

    const result = await checkRateLimit('user-1');
    expect(result.allowed).toBe(true);
  });

  it('tracks different users independently', async () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      await checkRateLimit('user-1');
    }
    expect((await checkRateLimit('user-1')).allowed).toBe(false);

    const result = await checkRateLimit('user-2');
    expect(result.allowed).toBe(true);
  });

  it('resetRateLimits() clears all state', async () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      await checkRateLimit('user-1');
    }
    expect((await checkRateLimit('user-1')).allowed).toBe(false);

    resetRateLimits();
    const result = await checkRateLimit('user-1');
    expect(result.allowed).toBe(true);
  });

  it('separate buckets: chat limit exhausted does not block drill', async () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      await checkRateLimit('ai:chat:user1');
    }
    expect((await checkRateLimit('ai:chat:user1')).allowed).toBe(false);

    const result = await checkRateLimit('ai:drill:user1', 10);
    expect(result.allowed).toBe(true);
  });

  it('separate buckets: drill has stricter limit', async () => {
    for (let i = 0; i < 10; i++) {
      await checkRateLimit('ai:drill:user1', 10);
    }
    expect((await checkRateLimit('ai:drill:user1', 10)).allowed).toBe(false);

    const chatResult = await checkRateLimit('ai:chat:user1');
    expect(chatResult.allowed).toBe(true);
  });
});

describe('rateLimitHeaders', () => {
  it('includes standard headers for allowed request', () => {
    const headers = rateLimitHeaders({
      allowed: true,
      limit: 100,
      remaining: 99,
      resetAt: 1700000000,
    });
    expect(headers['X-RateLimit-Limit']).toBe('100');
    expect(headers['X-RateLimit-Remaining']).toBe('99');
    expect(headers['X-RateLimit-Reset']).toBe('1700000000');
    expect(headers['Retry-After']).toBeUndefined();
  });

  it('includes Retry-After header for rejected request', () => {
    const headers = rateLimitHeaders({
      allowed: false,
      retryAfterMs: 30000,
      limit: 100,
      remaining: 0,
      resetAt: 1700000030,
    });
    expect(headers['X-RateLimit-Limit']).toBe('100');
    expect(headers['X-RateLimit-Remaining']).toBe('0');
    expect(headers['X-RateLimit-Reset']).toBe('1700000030');
    expect(headers['Retry-After']).toBe('30');
  });
});

describe('checkRateLimit with Redis', () => {
  let mockRedis: {
    incr: ReturnType<typeof vi.fn>;
    expire: ReturnType<typeof vi.fn>;
    ttl: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    resetRateLimits();

    mockRedis = {
      incr: vi.fn().mockResolvedValue(1),
      expire: vi.fn().mockResolvedValue(true),
      ttl: vi.fn().mockResolvedValue(60),
    };

    vi.mocked(getRedis).mockReturnValue(mockRedis as never);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.mocked(getRedis).mockReturnValue(null);
  });

  it('uses Redis INCR for distributed limiting', async () => {
    const result = await checkRateLimit('user-1');
    expect(result.allowed).toBe(true);
    expect(mockRedis.incr).toHaveBeenCalledWith('ratelimit:user-1');
  });

  it('sets TTL on first request (count === 1)', async () => {
    mockRedis.incr.mockResolvedValue(1);
    await checkRateLimit('user-1');
    expect(mockRedis.expire).toHaveBeenCalledWith('ratelimit:user-1', expect.any(Number));
  });

  it('does not set TTL on subsequent requests', async () => {
    mockRedis.incr.mockResolvedValue(5);
    await checkRateLimit('user-1');
    expect(mockRedis.expire).not.toHaveBeenCalled();
  });

  it('rejects when count exceeds max', async () => {
    mockRedis.incr.mockResolvedValue(RATE_LIMIT_MAX + 1);
    mockRedis.ttl.mockResolvedValue(30);

    const result = await checkRateLimit('user-1');
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBe(30000);
    expect(result.remaining).toBe(0);
  });
});
