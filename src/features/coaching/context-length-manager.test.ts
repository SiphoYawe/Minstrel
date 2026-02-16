import { describe, it, expect } from 'vitest';
import {
  estimateTokenCount,
  getContextLimit,
  trimMessagesToFit,
  PROVIDER_CONTEXT_LIMITS,
} from './context-length-manager';

// ---------------------------------------------------------------------------
// estimateTokenCount
// ---------------------------------------------------------------------------

describe('estimateTokenCount', () => {
  it('estimates ~4 chars per token for plain text', () => {
    // 20 plain alpha chars / 4 = 5 tokens
    expect(estimateTokenCount('abcdefghijklmnopqrst')).toBe(5);
  });

  it('rounds up for non-exact multiples', () => {
    // 7 plain chars / 4 = 1.75 → ceil = 2
    expect(estimateTokenCount('abcdefg')).toBe(2);
  });

  it('returns 0 for empty string', () => {
    expect(estimateTokenCount('')).toBe(0);
  });

  it('handles single character', () => {
    // 1 char / 4 = 0.25 → ceil = 1
    expect(estimateTokenCount('x')).toBe(1);
  });

  it('handles long plain text', () => {
    const text = 'a'.repeat(4000);
    expect(estimateTokenCount(text)).toBe(1000);
  });

  // --- Adaptive estimation: content-type multipliers ---

  it('applies code multiplier (1.2x) for code-heavy text', () => {
    // Code tokens use fewer chars per token (more tokens per char)
    const code = 'const x = () => { return []; };';
    const plain = 'this is just plain english text';
    // Code-heavy text should produce more tokens than plain text of similar length
    expect(estimateTokenCount(code)).toBeGreaterThan(estimateTokenCount(plain));
  });

  it('applies number multiplier (0.8x) for number-heavy text', () => {
    // Numbers compress well — fewer tokens per char
    const numbers = '1234567890 9876543210 1111222233';
    const plain = 'abcdefghij klmnopqrst uvwxabcdef';
    // Number-heavy text should produce fewer tokens than plain text of similar length
    expect(estimateTokenCount(numbers)).toBeLessThan(estimateTokenCount(plain));
  });

  it('handles mixed content with code and numbers', () => {
    const mixed = 'const val = 12345; let arr = [1, 2, 3];';
    const count = estimateTokenCount(mixed);
    // Should still produce a reasonable positive token count
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(mixed.length); // never more tokens than chars
  });

  it('plain text baseline is still ~4 chars per token', () => {
    // Pure plain text with no code patterns or numbers
    const text = 'hello world this is a test sentence with only words';
    // 51 chars / 4 = 12.75 → ceil = 13
    expect(estimateTokenCount(text)).toBe(13);
  });
});

// ---------------------------------------------------------------------------
// getContextLimit
// ---------------------------------------------------------------------------

describe('getContextLimit', () => {
  it('returns 128_000 for openai', () => {
    expect(getContextLimit('openai')).toBe(128_000);
  });

  it('returns 200_000 for anthropic', () => {
    expect(getContextLimit('anthropic')).toBe(200_000);
  });

  it('returns default limit for unknown provider', () => {
    expect(getContextLimit('some-other-provider')).toBe(8_000);
  });
});

// ---------------------------------------------------------------------------
// PROVIDER_CONTEXT_LIMITS
// ---------------------------------------------------------------------------

describe('PROVIDER_CONTEXT_LIMITS', () => {
  it('has entries for openai and anthropic', () => {
    expect(PROVIDER_CONTEXT_LIMITS).toHaveProperty('openai');
    expect(PROVIDER_CONTEXT_LIMITS).toHaveProperty('anthropic');
  });

  it('openai limit is a positive number', () => {
    expect(PROVIDER_CONTEXT_LIMITS.openai).toBeGreaterThan(0);
  });

  it('anthropic limit is a positive number', () => {
    expect(PROVIDER_CONTEXT_LIMITS.anthropic).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// trimMessagesToFit
// ---------------------------------------------------------------------------

describe('trimMessagesToFit', () => {
  const shortMsg = (role: string, content: string) => ({ role, content });

  it('returns messages unchanged when under the context limit', () => {
    const messages = [shortMsg('user', 'Hello'), shortMsg('assistant', 'Hi there')];

    const result = trimMessagesToFit(messages, 100, 100_000);

    expect(result.trimmedMessages).toEqual(messages);
    expect(result.wasTruncated).toBe(false);
    expect(result.truncationSummary).toBeNull();
  });

  it('trims oldest messages when total exceeds context limit', () => {
    // Each message is 400 chars = 100 tokens
    const longContent = 'x'.repeat(400);
    const messages = [
      shortMsg('user', longContent), // oldest — should be trimmed
      shortMsg('assistant', longContent), // should be trimmed
      shortMsg('user', longContent), // kept
      shortMsg('assistant', longContent), // kept (most recent)
    ];

    // System prompt = 100 tokens, max context = 500 tokens
    // Available = 500 - 100 - 200 (summary budget) = 200 tokens
    // Each message = 100 tokens, so only 2 fit
    const result = trimMessagesToFit(messages, 100, 500);

    expect(result.trimmedMessages).toHaveLength(2);
    expect(result.wasTruncated).toBe(true);
    // Should keep the last 2 messages (most recent)
    expect(result.trimmedMessages[0]).toEqual(messages[2]);
    expect(result.trimmedMessages[1]).toEqual(messages[3]);
  });

  it('keeps most recent messages, discards oldest', () => {
    const messages = [
      shortMsg('user', 'a'.repeat(400)), // 100 tokens — oldest
      shortMsg('assistant', 'b'.repeat(400)), // 100 tokens
      shortMsg('user', 'c'.repeat(400)), // 100 tokens
      shortMsg('assistant', 'd'.repeat(400)), // 100 tokens — newest
    ];

    // Available = 350 - 50 - 200 = 100 tokens → only 1 message fits
    const result = trimMessagesToFit(messages, 50, 350);

    expect(result.trimmedMessages).toHaveLength(1);
    expect(result.trimmedMessages[0].content).toBe('d'.repeat(400));
    expect(result.wasTruncated).toBe(true);
  });

  it('truncation summary includes removed message count', () => {
    const messages = [
      shortMsg('user', 'a'.repeat(400)), // trimmed
      shortMsg('assistant', 'b'.repeat(400)), // trimmed
      shortMsg('user', 'c'.repeat(400)), // trimmed
      shortMsg('assistant', 'd'.repeat(40)), // kept
    ];

    // system=50 tokens, max=300, available = 300 - 50 - 200 = 50 tokens
    // Last message = 10 tokens (40 chars / 4), fits
    // Third message = 100 tokens, does not fit → cut at index 3
    const result = trimMessagesToFit(messages, 50, 300);

    expect(result.wasTruncated).toBe(true);
    expect(result.truncationSummary).toContain('3 earlier messages were trimmed');
  });

  it('truncation summary says "1 earlier message was trimmed" for singular', () => {
    const messages = [
      shortMsg('user', 'a'.repeat(400)), // trimmed (100 tokens)
      shortMsg('assistant', 'b'.repeat(40)), // kept (10 tokens)
    ];

    // Available = 200 - 50 - 200 = -50 → edge: negative budget
    // With negative budget the function keeps at least the last message
    // Let us use a budget that makes exactly 1 trimmed.
    // system=50, max=310, available = 310 - 50 - 200 = 60 tokens
    // Last message = 10 tokens, fits. First = 100 tokens, does not fit.
    const result = trimMessagesToFit(messages, 50, 310);

    expect(result.wasTruncated).toBe(true);
    expect(result.truncationSummary).toContain('1 earlier message was trimmed');
  });

  it('accounts for system prompt tokens in the budget', () => {
    // 1 message of 100 tokens (400 chars)
    const messages = [shortMsg('user', 'x'.repeat(400))];

    // With a small system prompt (50), available = 500 - 50 - 200 = 250 → fits
    const resultFits = trimMessagesToFit(messages, 50, 500);
    expect(resultFits.wasTruncated).toBe(false);

    // With a large system prompt (350), available = 500 - 350 - 200 = -50 → does not fit
    // But single message: should keep it (edge case / at-least-one)
    const resultDoesNotFit = trimMessagesToFit(messages, 350, 500);
    // Even the last message can't fit in -50 tokens, but the function
    // keeps at least the last message through the negative-budget path
    expect(resultDoesNotFit.trimmedMessages).toHaveLength(1);
  });

  it('returns empty array for empty messages', () => {
    const result = trimMessagesToFit([], 100, 100_000);

    expect(result.trimmedMessages).toEqual([]);
    expect(result.wasTruncated).toBe(false);
    expect(result.truncationSummary).toBeNull();
  });

  it('handles edge case where all messages fit exactly', () => {
    // 2 messages of exactly 50 tokens each (200 chars)
    const messages = [shortMsg('user', 'a'.repeat(200)), shortMsg('assistant', 'b'.repeat(200))];

    // system=0, summary=200, available = 300 - 0 - 200 = 100 tokens
    // 2 messages * 50 tokens = 100 tokens → fits exactly
    const result = trimMessagesToFit(messages, 0, 300);

    expect(result.trimmedMessages).toEqual(messages);
    expect(result.wasTruncated).toBe(false);
  });

  it('includes topic previews in truncation summary', () => {
    const messages = [
      shortMsg('user', 'How do I play a C major chord on piano?'), // trimmed
      shortMsg('assistant', 'Place your fingers on C, E, and G keys'), // trimmed
      shortMsg('user', 'What about F major?'), // kept
    ];

    // Make budget tight enough to trim 2 messages
    // system=0, max=220, available = 220 - 0 - 200 = 20 tokens (80 chars)
    // Last message = 5 tokens (20 chars) → fits
    // Second message ~11 tokens → does not fit
    const result = trimMessagesToFit(messages, 0, 220);

    expect(result.wasTruncated).toBe(true);
    expect(result.truncationSummary).toContain('Topics discussed:');
    expect(result.truncationSummary).toContain('How do I play a C major chord');
  });

  it('handles negative available budget by keeping at least the last message', () => {
    const messages = [shortMsg('user', 'hello'), shortMsg('assistant', 'world')];

    // system prompt is larger than max context — yields negative available
    const result = trimMessagesToFit(messages, 10_000, 5_000);

    expect(result.trimmedMessages).toHaveLength(1);
    expect(result.trimmedMessages[0].content).toBe('world');
    expect(result.wasTruncated).toBe(true);
  });
});
