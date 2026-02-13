import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  extractTokenUsage,
  recordTokenUsage,
  trackTokenUsage,
  getTokenUsageSummary,
} from './token-tracker';

// Mock Supabase client
const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockLimit = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      insert: mockInsert,
      select: mockSelect,
    }),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockInsert.mockResolvedValue({ error: null });

  // Default chain for select queries: .select().eq().limit()
  mockLimit.mockResolvedValue({ data: [], error: null });
  mockEq.mockReturnValue({ limit: mockLimit });
  mockSelect.mockReturnValue({ eq: mockEq });
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

describe('trackTokenUsage', () => {
  it('inserts a row with prompt and completion breakdown in metadata', async () => {
    await trackTokenUsage('user-abc', 'openai', 200, 100);

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-abc',
        provider: 'openai',
        token_count: 300,
        role: 'assistant',
        metadata: expect.objectContaining({
          prompt_tokens: 200,
          completion_tokens: 100,
        }),
      })
    );
  });

  it('sets total token count as sum of prompt + completion', async () => {
    await trackTokenUsage('user-xyz', 'anthropic', 500, 250);

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        token_count: 750,
      })
    );
  });

  it('logs error but does not throw on insert failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockInsert.mockResolvedValue({ error: { message: 'Insert failed' } });

    await expect(trackTokenUsage('u1', 'openai', 10, 5)).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to track token usage:', 'Insert failed');
    consoleSpy.mockRestore();
  });

  it('includes tracked_at timestamp in metadata', async () => {
    await trackTokenUsage('user-time', 'openai', 100, 50);

    const insertArg = mockInsert.mock.calls[0][0];
    expect(insertArg.metadata).toHaveProperty('tracked_at');
    expect(typeof insertArg.metadata.tracked_at).toBe('string');
  });
});

describe('getTokenUsageSummary', () => {
  it('returns zero summary when no data is found', async () => {
    mockLimit.mockResolvedValue({ data: [], error: null });

    const result = await getTokenUsageSummary('user-empty');

    expect(result).toEqual({
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalTokens: 0,
      interactionCount: 0,
      provider: null,
    });
  });

  it('returns zero summary on database error', async () => {
    mockLimit.mockResolvedValue({ data: null, error: { message: 'DB error' } });

    const result = await getTokenUsageSummary('user-err');

    expect(result.totalTokens).toBe(0);
    expect(result.interactionCount).toBe(0);
  });

  it('aggregates token usage across multiple rows', async () => {
    mockLimit.mockResolvedValue({
      data: [
        {
          token_count: 300,
          provider: 'openai',
          metadata: { prompt_tokens: 200, completion_tokens: 100 },
        },
        {
          token_count: 150,
          provider: 'openai',
          metadata: { prompt_tokens: 100, completion_tokens: 50 },
        },
      ],
      error: null,
    });

    const result = await getTokenUsageSummary('user-multi');

    expect(result.totalTokens).toBe(450);
    expect(result.totalPromptTokens).toBe(300);
    expect(result.totalCompletionTokens).toBe(150);
    expect(result.interactionCount).toBe(2);
    expect(result.provider).toBe('openai');
  });

  it('handles rows without metadata prompt/completion breakdown', async () => {
    mockLimit.mockResolvedValue({
      data: [
        { token_count: 500, provider: 'anthropic', metadata: null },
        { token_count: 200, provider: 'anthropic', metadata: {} },
      ],
      error: null,
    });

    const result = await getTokenUsageSummary('user-no-meta');

    expect(result.totalTokens).toBe(700);
    expect(result.totalPromptTokens).toBe(0);
    expect(result.totalCompletionTokens).toBe(0);
    expect(result.interactionCount).toBe(2);
    expect(result.provider).toBe('anthropic');
  });

  it('handles null token_count gracefully', async () => {
    mockLimit.mockResolvedValue({
      data: [{ token_count: null, provider: 'openai', metadata: null }],
      error: null,
    });

    const result = await getTokenUsageSummary('user-null');

    expect(result.totalTokens).toBe(0);
    expect(result.interactionCount).toBe(1);
  });
});
