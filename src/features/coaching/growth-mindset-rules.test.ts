import { describe, it, expect } from 'vitest';
import {
  PROHIBITED_WORDS,
  GROWTH_REFRAMES,
  TRAJECTORY_TEMPLATES,
  validateGrowthMindset,
} from './growth-mindset-rules';

describe('constants', () => {
  it('PROHIBITED_WORDS has 10 entries', () => {
    expect(PROHIBITED_WORDS).toHaveLength(10);
  });

  it('every prohibited word has a growth reframe', () => {
    for (const word of PROHIBITED_WORDS) {
      expect(GROWTH_REFRAMES[word]).toBeDefined();
      expect(typeof GROWTH_REFRAMES[word]).toBe('string');
    }
  });

  it('TRAJECTORY_TEMPLATES has at least 3 templates', () => {
    expect(TRAJECTORY_TEMPLATES.length).toBeGreaterThanOrEqual(3);
  });
});

describe('validateGrowthMindset', () => {
  it('returns compliant for clean text', () => {
    const result = validateGrowthMindset(
      'Your timing is developing — 65% to 73% over three attempts. Closing in.'
    );
    expect(result.isCompliant).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('detects "wrong"', () => {
    const result = validateGrowthMindset('That chord voicing is wrong for this key.');
    expect(result.isCompliant).toBe(false);
    expect(result.violations.length).toBe(1);
    expect(result.violations[0]).toContain('wrong');
    expect(result.violations[0]).toContain('not yet there');
  });

  it('detects "mistake"', () => {
    const result = validateGrowthMindset('You made a mistake on beat 3.');
    expect(result.isCompliant).toBe(false);
    expect(result.violations[0]).toContain('mistake');
  });

  it('detects "failed"', () => {
    const result = validateGrowthMindset('You failed to hit the target tempo.');
    expect(result.isCompliant).toBe(false);
    expect(result.violations[0]).toContain('failed');
  });

  it('detects multiple violations', () => {
    const result = validateGrowthMindset(
      'That was a bad mistake and you got the wrong notes. Poor timing too.'
    );
    expect(result.isCompliant).toBe(false);
    expect(result.violations.length).toBe(4);
  });

  it('is case-insensitive', () => {
    const result = validateGrowthMindset('WRONG and Bad and TERRIBLE.');
    expect(result.isCompliant).toBe(false);
    expect(result.violations.length).toBe(3);
  });

  it('matches whole words only', () => {
    // "error" should not match "errorStatus" or "errors" as a substring
    // But it will match "errors" because \berror\b actually doesn't match "errors"
    // Let's test with a compound word
    const result = validateGrowthMindset('The errorMessage field needs updating.');
    expect(result.isCompliant).toBe(true);
  });

  it('detects all prohibited words', () => {
    for (const word of PROHIBITED_WORDS) {
      const result = validateGrowthMindset(`This is ${word} playing.`);
      expect(result.isCompliant).toBe(false);
    }
  });
});
