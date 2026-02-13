import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSessionTokenUsage, getTotalTokenUsage, getRecentSessionUsage } from './token-usage';

// Build a chainable query builder mock
function createQueryBuilder(resolvedValue: { data: unknown; error: unknown }) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};

  const terminal = vi.fn().mockResolvedValue(resolvedValue);

  builder.select = vi.fn().mockReturnValue(builder);
  builder.eq = vi.fn().mockReturnValue(builder);
  builder.order = vi.fn().mockReturnValue(builder);
  builder.limit = vi.fn().mockImplementation(() => terminal());

  // Allow the builder itself to resolve (for queries without .limit())
  // Use Object.assign to make the builder thenable
  const thenableBuilder = Object.assign(builder, {
    then: (resolve: (v: unknown) => void) => Promise.resolve(resolvedValue).then(resolve),
  });

  return thenableBuilder;
}

let mockQueryBuilder: ReturnType<typeof createQueryBuilder>;

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => mockQueryBuilder,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getSessionTokenUsage', () => {
  it('aggregates token usage for a session', async () => {
    mockQueryBuilder = createQueryBuilder({
      data: [
        { token_count: 100, model: 'gpt-4o', provider: 'openai', metadata: null },
        { token_count: 200, model: 'gpt-4o', provider: 'openai', metadata: null },
      ],
      error: null,
    });

    const result = await getSessionTokenUsage('session-1');
    expect(result.totalTokens).toBe(300);
    expect(result.interactionCount).toBe(2);
    expect(result.estimatedCost).toBeGreaterThan(0);
    expect(result.provider).toBe('openai');
    expect(result.model).toBe('gpt-4o');
  });

  it('returns empty summary when no data', async () => {
    mockQueryBuilder = createQueryBuilder({ data: [], error: null });

    const result = await getSessionTokenUsage('session-empty');
    expect(result.totalTokens).toBe(0);
    expect(result.interactionCount).toBe(0);
    expect(result.estimatedCost).toBe(0);
  });

  it('returns empty summary on error', async () => {
    mockQueryBuilder = createQueryBuilder({ data: null, error: { message: 'DB error' } });

    const result = await getSessionTokenUsage('session-err');
    expect(result.totalTokens).toBe(0);
  });

  it('handles null token_count gracefully', async () => {
    mockQueryBuilder = createQueryBuilder({
      data: [{ token_count: null, model: 'gpt-4o', provider: 'openai', metadata: null }],
      error: null,
    });

    const result = await getSessionTokenUsage('session-null');
    expect(result.totalTokens).toBe(0);
    expect(result.interactionCount).toBe(1);
  });
});

describe('getTotalTokenUsage', () => {
  it('aggregates all user token usage', async () => {
    mockQueryBuilder = createQueryBuilder({
      data: [
        { token_count: 500, model: 'gpt-4o', provider: 'openai', metadata: null },
        {
          token_count: 300,
          model: 'claude-sonnet-4-20250514',
          provider: 'anthropic',
          metadata: null,
        },
      ],
      error: null,
    });

    const result = await getTotalTokenUsage('user-1');
    expect(result.totalTokens).toBe(800);
    expect(result.interactionCount).toBe(2);
  });
});

describe('getRecentSessionUsage', () => {
  it('returns null when no conversations exist', async () => {
    mockQueryBuilder = createQueryBuilder({ data: [], error: null });

    const result = await getRecentSessionUsage('user-none');
    expect(result).toBeNull();
  });

  it('returns null on error', async () => {
    mockQueryBuilder = createQueryBuilder({ data: null, error: { message: 'fail' } });

    const result = await getRecentSessionUsage('user-err');
    expect(result).toBeNull();
  });

  it('returns usage summary for the most recent session', async () => {
    // The mock returns the same data for both the session_id lookup and the
    // subsequent token aggregation query. This exercises the happy path where
    // getRecentSessionUsage finds a session and delegates to getSessionTokenUsage.
    mockQueryBuilder = createQueryBuilder({
      data: [{ session_id: 'sess-abc', token_count: 150, model: 'gpt-4o', provider: 'openai' }],
      error: null,
    });

    const result = await getRecentSessionUsage('user-happy');
    expect(result).not.toBeNull();
    expect(result!.totalTokens).toBe(150);
    expect(result!.interactionCount).toBe(1);
  });
});
