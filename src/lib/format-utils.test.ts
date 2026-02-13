import { describe, it, expect } from 'vitest';
import { formatTokenCount, formatEstimatedCost, formatTokenSummary } from './format-utils';

describe('formatTokenCount', () => {
  it('formats small numbers with ~ prefix', () => {
    expect(formatTokenCount(42)).toBe('~42');
  });

  it('formats thousands with commas', () => {
    expect(formatTokenCount(2400)).toBe('~2,400');
  });

  it('formats large numbers with commas', () => {
    expect(formatTokenCount(48200)).toBe('~48,200');
  });

  it('formats zero', () => {
    expect(formatTokenCount(0)).toBe('~0');
  });
});

describe('formatEstimatedCost', () => {
  it('formats cost with ~ prefix and 2 decimal places', () => {
    expect(formatEstimatedCost(0.03)).toBe('~$0.03');
  });

  it('formats larger costs', () => {
    expect(formatEstimatedCost(1.24)).toBe('~$1.24');
  });

  it('formats zero cost', () => {
    expect(formatEstimatedCost(0)).toBe('~$0.00');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatEstimatedCost(0.005)).toBe('~$0.01');
  });

  it('formats very small costs', () => {
    expect(formatEstimatedCost(0.001)).toBe('~$0.00');
  });
});

describe('formatTokenSummary', () => {
  it('combines token count and cost', () => {
    expect(formatTokenSummary(2400, 0.03)).toBe('~2,400 tokens, est. ~$0.03');
  });

  it('handles large numbers', () => {
    expect(formatTokenSummary(48200, 1.24)).toBe('~48,200 tokens, est. ~$1.24');
  });

  it('handles zero values', () => {
    expect(formatTokenSummary(0, 0)).toBe('~0 tokens, est. ~$0.00');
  });
});
