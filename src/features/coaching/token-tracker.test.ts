import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractTokenUsage, recordTokenUsage } from './token-tracker';

// Mock Supabase client
const mockInsert = vi.fn().mockResolvedValue({ error: null });
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      insert: mockInsert,
    }),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockInsert.mockResolvedValue({ error: null });
});

describe('extractTokenUsage', () => {
  it('extracts usage from a complete AI SDK response', () => {
    const result = extractTokenUsage({
      usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
    });
    expect(result).toEqual({
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
    });
  });

  it('extracts from response with only prompt and completion tokens', () => {
    const result = extractTokenUsage({
      usage: { promptTokens: 200, completionTokens: 100 },
    });
    expect(result).toEqual({
      promptTokens: 200,
      completionTokens: 100,
      totalTokens: 300,
    });
  });

  it('falls back to text estimation when usage has zero totalTokens', () => {
    const result = extractTokenUsage({
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      text: 'Hello, world! This is a test response.',
    });
    // 38 chars / 4 = 9.5 → ceil = 10
    expect(result.totalTokens).toBe(10);
    expect(result.promptTokens).toBe(0);
    expect(result.completionTokens).toBe(10);
  });

  it('falls back to text estimation when no usage provided', () => {
    const result = extractTokenUsage({
      text: 'A short response',
    });
    // 16 chars / 4 = 4
    expect(result.totalTokens).toBe(4);
  });

  it('handles empty text in fallback', () => {
    const result = extractTokenUsage({});
    expect(result.totalTokens).toBe(0);
  });

  it('handles undefined usage fields gracefully', () => {
    const result = extractTokenUsage({
      usage: { totalTokens: 500 },
    });
    expect(result).toEqual({
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 500,
    });
  });
});

describe('recordTokenUsage', () => {
  it('inserts a row with correct column mapping', async () => {
    await recordTokenUsage({
      sessionId: 'session-123',
      userId: 'user-456',
      role: 'assistant',
      content: 'Hello!',
      tokenCount: 150,
      model: 'gpt-4o',
      provider: 'openai',
      metadata: { source: 'chat' },
    });

    expect(mockInsert).toHaveBeenCalledWith({
      session_id: 'session-123',
      user_id: 'user-456',
      role: 'assistant',
      content: 'Hello!',
      token_count: 150,
      model: 'gpt-4o',
      provider: 'openai',
      metadata: { source: 'chat' },
    });
  });

  it('defaults metadata to null when not provided', async () => {
    await recordTokenUsage({
      sessionId: 's1',
      userId: 'u1',
      role: 'user',
      content: 'test',
      tokenCount: 10,
      model: 'gpt-4o',
      provider: 'openai',
    });

    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ metadata: null }));
  });

  it('logs error but does not throw on insert failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockInsert.mockResolvedValue({ error: { message: 'DB error' } });

    await expect(
      recordTokenUsage({
        sessionId: 's1',
        userId: 'u1',
        role: 'user',
        content: 'test',
        tokenCount: 10,
        model: 'gpt-4o',
        provider: 'openai',
      })
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to record token usage:', 'DB error');
    consoleSpy.mockRestore();
  });
});
