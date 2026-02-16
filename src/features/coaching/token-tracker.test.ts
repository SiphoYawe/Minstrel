import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  extractTokenUsage,
  recordTokenUsage,
  getTokenUsageSummary,
  getTokenFallbackQueueSize,
} from './token-tracker';

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));
import * as Sentry from '@sentry/nextjs';

// Mock Supabase server client (async createClient)
const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockLimit = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: () => ({
      insert: mockInsert,
      select: mockSelect,
    }),
  }),
}));

// Mock validation — allow tests to control UUID validation behavior
const mockIsValidUUID = vi.fn().mockReturnValue(true);
vi.mock('@/lib/validation', () => ({
  isValidUUID: (...args: unknown[]) => mockIsValidUUID(...args),
}));

// Valid UUID for test params
const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

beforeEach(() => {
  vi.clearAllMocks();
  mockInsert.mockResolvedValue({ error: null });
  mockIsValidUUID.mockReturnValue(true);

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

  it('extracts AI SDK v6 usage format (inputTokens/outputTokens)', () => {
    const result = extractTokenUsage({
      usage: { inputTokens: 800, outputTokens: 200 },
    });
    expect(result).toEqual({
      promptTokens: 800,
      completionTokens: 200,
      totalTokens: 1000,
    });
  });

  it('prefers inputTokens over promptTokens when both present', () => {
    const result = extractTokenUsage({
      usage: { inputTokens: 500, outputTokens: 100, promptTokens: 1, completionTokens: 1 },
    });
    expect(result.promptTokens).toBe(500);
    expect(result.completionTokens).toBe(100);
    expect(result.totalTokens).toBe(600);
  });
});

describe('recordTokenUsage', () => {
  it('inserts a row with correct column mapping', async () => {
    await recordTokenUsage({
      sessionId: VALID_UUID,
      userId: 'user-456',
      role: 'assistant',
      content: 'Hello!',
      tokenCount: 150,
      model: 'gpt-4o',
      provider: 'openai',
      metadata: { source: 'chat' },
    });

    expect(mockInsert).toHaveBeenCalledWith({
      session_id: VALID_UUID,
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
      sessionId: VALID_UUID,
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
        sessionId: VALID_UUID,
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

  it('allows empty sessionId (skips UUID validation)', async () => {
    await recordTokenUsage({
      sessionId: '',
      userId: 'u1',
      role: 'user',
      content: 'test',
      tokenCount: 10,
      model: 'gpt-4o',
      provider: 'openai',
    });

    // Empty sessionId should bypass UUID check and proceed to insert
    expect(mockInsert).toHaveBeenCalled();
  });

  it('rejects invalid non-empty sessionId (SEC-M4)', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockIsValidUUID.mockReturnValue(false);

    await recordTokenUsage({
      sessionId: 'not-a-valid-uuid',
      userId: 'u1',
      role: 'user',
      content: 'test',
      tokenCount: 10,
      model: 'gpt-4o',
      provider: 'openai',
    });

    // Should NOT attempt insert
    expect(mockInsert).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Invalid sessionId format (not a UUID):',
      'not-a-valid-uuid'
    );
    consoleSpy.mockRestore();
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

describe('recordTokenUsage Sentry & fallback queue', () => {
  const validParams = {
    sessionId: '',
    userId: 'u1',
    role: 'user' as const,
    content: 'test',
    tokenCount: 10,
    model: 'gpt-4o',
    provider: 'openai',
  };

  /**
   * Drain the fallback queue by calling recordTokenUsage with a successful insert.
   * This ensures test isolation for the queue.
   */
  async function drainQueue() {
    mockInsert.mockResolvedValue({ error: null });
    // A successful call drains any queued entries
    await recordTokenUsage(validParams);
  }

  beforeEach(async () => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
    mockIsValidUUID.mockReturnValue(true);
    // Drain any leftover queue items from prior tests
    await drainQueue();
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
    mockIsValidUUID.mockReturnValue(true);
  });

  it('reports to Sentry when recording fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockInsert.mockResolvedValue({ error: { message: 'DB error' } });

    await recordTokenUsage(validParams);

    expect(Sentry.captureException).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('queues failed record for retry', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockInsert.mockResolvedValue({ error: { message: 'DB error' } });

    await recordTokenUsage(validParams);

    expect(getTokenFallbackQueueSize()).toBe(1);
    consoleSpy.mockRestore();
  });

  it('drains fallback queue on next successful call', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // First call fails — queues the entry
    mockInsert.mockResolvedValue({ error: { message: 'DB error' } });
    await recordTokenUsage(validParams);
    expect(getTokenFallbackQueueSize()).toBe(1);

    // Second call succeeds — should drain the queue
    mockInsert.mockResolvedValue({ error: null });
    await recordTokenUsage(validParams);
    expect(getTokenFallbackQueueSize()).toBe(0);

    consoleSpy.mockRestore();
  });
});
