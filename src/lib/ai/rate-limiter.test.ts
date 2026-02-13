// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkRateLimit, resetRateLimits } from './rate-limiter';
import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from '@/lib/constants';

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetRateLimits();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows the first request', () => {
    const result = checkRateLimit('user-1');
    expect(result.allowed).toBe(true);
  });

  it('allows up to RATE_LIMIT_MAX requests', () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      const result = checkRateLimit('user-1');
      expect(result.allowed).toBe(true);
    }
  });

  it('rejects the (RATE_LIMIT_MAX + 1)th request', () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit('user-1');
    }
    const result = checkRateLimit('user-1');
    expect(result.allowed).toBe(false);
  });

  it('includes retryAfterMs when rejected', () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit('user-1');
    }
    const result = checkRateLimit('user-1');
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeDefined();
    expect(typeof result.retryAfterMs).toBe('number');
    expect(result.retryAfterMs).toBeGreaterThanOrEqual(0);
  });

  it('allows requests again after the window expires', () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit('user-1');
    }

    // Confirm blocked
    expect(checkRateLimit('user-1').allowed).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(RATE_LIMIT_WINDOW_MS + 1);

    // Should be allowed again
    const result = checkRateLimit('user-1');
    expect(result.allowed).toBe(true);
  });

  it('tracks different users independently', () => {
    // Exhaust user-1's limit
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit('user-1');
    }
    expect(checkRateLimit('user-1').allowed).toBe(false);

    // user-2 should still be allowed
    const result = checkRateLimit('user-2');
    expect(result.allowed).toBe(true);
  });

  it('resetRateLimits() clears all state', () => {
    // Exhaust user-1's limit
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit('user-1');
    }
    expect(checkRateLimit('user-1').allowed).toBe(false);

    // Reset and verify access is restored
    resetRateLimits();
    const result = checkRateLimit('user-1');
    expect(result.allowed).toBe(true);
  });
});
