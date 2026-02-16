import { describe, it, expect, vi } from 'vitest';
import {
  estimateCost,
  PROVIDER_PRICING,
  PRICING_LAST_UPDATED,
  checkPricingStaleness,
} from './pricing';

describe('pricing', () => {
  it('exports PRICING_LAST_UPDATED as a date string', () => {
    expect(PRICING_LAST_UPDATED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('has pricing for openai and anthropic', () => {
    expect(PROVIDER_PRICING.openai).toBeDefined();
    expect(PROVIDER_PRICING.anthropic).toBeDefined();
  });

  describe('estimateCost', () => {
    it('calculates cost for known openai model (gpt-4o)', () => {
      // gpt-4o: $2.50/1M input, $10.00/1M output → $0.0025/1k input, $0.01/1k output
      const cost = estimateCost('openai', 'gpt-4o', 1000, 500);
      // 1000/1000 * 0.0025 + 500/1000 * 0.01 = 0.0025 + 0.005 = 0.0075
      expect(cost).toBeCloseTo(0.0075, 6);
    });

    it('calculates cost for known anthropic model', () => {
      // claude-sonnet-4: $3.00/1M input, $15.00/1M output → $0.003/1k, $0.015/1k
      const cost = estimateCost('anthropic', 'claude-sonnet-4-20250514', 2000, 1000);
      // 2000/1000 * 0.003 + 1000/1000 * 0.015 = 0.006 + 0.015 = 0.021
      expect(cost).toBeCloseTo(0.021, 6);
    });

    it('uses prefix matching for versioned models', () => {
      // "gpt-4o-2024-08-06" should match "gpt-4o" pricing
      const versionedCost = estimateCost('openai', 'gpt-4o-2024-08-06', 1000, 500);
      const baseCost = estimateCost('openai', 'gpt-4o', 1000, 500);
      expect(versionedCost).toBeCloseTo(baseCost, 6);
    });

    it('falls back to default pricing for unknown provider', () => {
      const cost = estimateCost('unknown-provider', 'some-model', 1000, 1000);
      // Default: $0.003/1k input, $0.015/1k output
      // 1000/1000 * 0.003 + 1000/1000 * 0.015 = 0.018
      expect(cost).toBeCloseTo(0.018, 6);
    });

    it('falls back to default pricing for unknown model', () => {
      const cost = estimateCost('openai', 'gpt-99-future', 1000, 1000);
      expect(cost).toBeCloseTo(0.018, 6);
    });

    it('returns 0 for zero tokens', () => {
      expect(estimateCost('openai', 'gpt-4o', 0, 0)).toBe(0);
    });

    it('handles input-only tokens', () => {
      const cost = estimateCost('openai', 'gpt-4o', 1000, 0);
      expect(cost).toBeCloseTo(0.0025, 6);
    });

    it('handles output-only tokens', () => {
      const cost = estimateCost('openai', 'gpt-4o', 0, 1000);
      expect(cost).toBeCloseTo(0.01, 6);
    });

    it('is case-insensitive for provider names', () => {
      const costLower = estimateCost('openai', 'gpt-4o', 1000, 500);
      const costUpper = estimateCost('OpenAI', 'gpt-4o', 1000, 500);
      expect(costLower).toBeCloseTo(costUpper, 6);
    });
  });

  describe('checkPricingStaleness (AI-L4)', () => {
    it('returns false when pricing is recent', () => {
      // PRICING_LAST_UPDATED is 2026-02-12, test runs near that date
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-15'));
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(checkPricingStaleness()).toBe(false);
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
      vi.useRealTimers();
    });

    it('returns true and warns when pricing is stale (>30 days)', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-04-15'));
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(checkPricingStaleness()).toBe(true);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('PROVIDER_PRICING is'));
      warnSpy.mockRestore();
      vi.useRealTimers();
    });
  });
});
