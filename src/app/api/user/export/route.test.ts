import { describe, it, expect, vi, beforeEach } from 'vitest';

// Build chainable Supabase query builder mocks
function createChainMock(resolvedValue: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.maybeSingle = vi.fn().mockResolvedValue(resolvedValue);
  // Make the chain itself thenable for queries without .maybeSingle()
  Object.assign(chain, {
    then: (resolve: (v: unknown) => void) => Promise.resolve(resolvedValue).then(resolve),
  });
  return chain;
}

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    }),
}));

// Import after mocks
const { GET } = await import('./route');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/user/export', () => {
  it('returns 401 when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const response = await GET();
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns JSON export with Content-Disposition header when authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null,
    });

    // Mock each table query
    const profileChain = createChainMock({
      data: { email: 'test@example.com', display_name: 'Test', created_at: '2026-01-01' },
      error: null,
    });
    const sessionsChain = createChainMock({ data: [{ id: 's1' }], error: null });
    const metricsChain = createChainMock({ data: [], error: null });
    const conversationsChain = createChainMock({ data: [], error: null });
    const apiKeysChain = createChainMock({
      data: [{ provider: 'openai', created_at: '2026-01-01', last_four: 'abcd' }],
      error: null,
    });
    const achievementsChain = createChainMock({ data: [], error: null });

    mockFrom.mockImplementation((table: string) => {
      switch (table) {
        case 'profiles':
          return profileChain;
        case 'sessions':
          return sessionsChain;
        case 'progress_metrics':
          return metricsChain;
        case 'ai_conversations':
          return conversationsChain;
        case 'user_api_keys':
          return apiKeysChain;
        case 'achievements':
          return achievementsChain;
        default:
          return createChainMock({ data: [], error: null });
      }
    });

    const response = await GET();
    expect(response.status).toBe(200);

    const contentType = response.headers.get('Content-Type');
    expect(contentType).toBe('application/json');

    const disposition = response.headers.get('Content-Disposition');
    expect(disposition).toMatch(
      /attachment; filename="minstrel-data-export-\d{4}-\d{2}-\d{2}\.json"/
    );

    const body = JSON.parse(await response.text());
    expect(body.userId).toBe('user-123');
    expect(body.email).toBe('test@example.com');
    expect(body.profile).toBeTruthy();
    expect(body.sessions).toHaveLength(1);
    expect(body.apiKeys).toHaveLength(1);
    expect(body.apiKeys[0]).not.toHaveProperty('encrypted_key');
    expect(body.apiKeys[0].provider).toBe('openai');
    expect(body.apiKeys[0].last_four).toBe('abcd');
  });

  it('never includes encrypted_key in the api keys export', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-456', email: 'safe@example.com' } },
      error: null,
    });

    const apiKeysChain = createChainMock({
      data: [{ provider: 'anthropic', created_at: '2026-02-01', last_four: 'efgh' }],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'user_api_keys') return apiKeysChain;
      return createChainMock({ data: table === 'profiles' ? null : [], error: null });
    });

    const response = await GET();
    const body = JSON.parse(await response.text());

    // Verify the select call only requested safe columns
    expect(apiKeysChain.select).toHaveBeenCalledWith('provider, created_at, last_four');

    // Double-check no encrypted_key in output
    for (const key of body.apiKeys) {
      expect(key).not.toHaveProperty('encrypted_key');
    }
  });

  it('returns empty arrays when tables have no data', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-empty', email: 'empty@example.com' } },
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      return createChainMock({ data: table === 'profiles' ? null : [], error: null });
    });

    const response = await GET();
    const body = JSON.parse(await response.text());

    expect(body.profile).toBeNull();
    expect(body.sessions).toEqual([]);
    expect(body.progressMetrics).toEqual([]);
    expect(body.aiConversations).toEqual([]);
    expect(body.apiKeys).toEqual([]);
    expect(body.achievements).toEqual([]);
    expect(body.tokenUsage).toEqual([]);
  });

  it('includes aggregated tokenUsage breakdown by provider and model', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-tokens', email: 'tokens@example.com' } },
      error: null,
    });

    const conversationsData = [
      {
        id: 'c1',
        provider: 'openai',
        model: 'gpt-4',
        token_count: 500,
        metadata: { prompt_tokens: 200, completion_tokens: 300 },
      },
      {
        id: 'c2',
        provider: 'openai',
        model: 'gpt-4',
        token_count: 300,
        metadata: { prompt_tokens: 100, completion_tokens: 200 },
      },
      {
        id: 'c3',
        provider: 'anthropic',
        model: 'claude-3',
        token_count: 1000,
        metadata: { prompt_tokens: 400, completion_tokens: 600 },
      },
      {
        id: 'c4',
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        token_count: 150,
        metadata: null,
      },
    ];

    const conversationsChain = createChainMock({ data: conversationsData, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'ai_conversations') return conversationsChain;
      return createChainMock({ data: table === 'profiles' ? null : [], error: null });
    });

    const response = await GET();
    const body = JSON.parse(await response.text());

    expect(body.tokenUsage).toBeDefined();
    expect(body.tokenUsage).toHaveLength(3);

    // Find the openai/gpt-4 aggregation
    const openaiGpt4 = body.tokenUsage.find(
      (t: Record<string, unknown>) => t.provider === 'openai' && t.model === 'gpt-4'
    );
    expect(openaiGpt4).toBeDefined();
    expect(openaiGpt4.totalTokens).toBe(800);
    expect(openaiGpt4.promptTokens).toBe(300);
    expect(openaiGpt4.completionTokens).toBe(500);
    expect(openaiGpt4.interactionCount).toBe(2);

    // Find the anthropic/claude-3 aggregation
    const anthropicClaude = body.tokenUsage.find(
      (t: Record<string, unknown>) => t.provider === 'anthropic' && t.model === 'claude-3'
    );
    expect(anthropicClaude).toBeDefined();
    expect(anthropicClaude.totalTokens).toBe(1000);
    expect(anthropicClaude.promptTokens).toBe(400);
    expect(anthropicClaude.completionTokens).toBe(600);
    expect(anthropicClaude.interactionCount).toBe(1);

    // Find the openai/gpt-3.5-turbo entry (no metadata)
    const openaiGpt35 = body.tokenUsage.find(
      (t: Record<string, unknown>) => t.provider === 'openai' && t.model === 'gpt-3.5-turbo'
    );
    expect(openaiGpt35).toBeDefined();
    expect(openaiGpt35.totalTokens).toBe(150);
    expect(openaiGpt35.promptTokens).toBe(0);
    expect(openaiGpt35.completionTokens).toBe(0);
    expect(openaiGpt35.interactionCount).toBe(1);
  });

  it('uses gzip compression when session count exceeds threshold (AI-L5)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-big', email: 'big@example.com' } },
      error: null,
    });

    // Create 150 sessions to exceed GZIP_SESSION_THRESHOLD (100)
    const manySessions = Array.from({ length: 150 }, (_, i) => ({ id: `s${i}` }));
    const sessionsChain = createChainMock({ data: manySessions, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'sessions') return sessionsChain;
      return createChainMock({ data: table === 'profiles' ? null : [], error: null });
    });

    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Encoding')).toBe('gzip');
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });

  it('does not gzip when session count is below threshold', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-small', email: 'small@example.com' } },
      error: null,
    });

    const fewSessions = Array.from({ length: 5 }, (_, i) => ({ id: `s${i}` }));
    const sessionsChain = createChainMock({ data: fewSessions, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'sessions') return sessionsChain;
      return createChainMock({ data: table === 'profiles' ? null : [], error: null });
    });

    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Encoding')).toBeNull();
  });

  it('handles conversations with missing provider/model gracefully', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-edge', email: 'edge@example.com' } },
      error: null,
    });

    const conversationsData = [
      {
        id: 'c1',
        provider: null,
        model: null,
        token_count: 100,
        metadata: null,
      },
      {
        id: 'c2',
        provider: 'openai',
        model: '',
        token_count: 200,
        metadata: { prompt_tokens: 80, completion_tokens: 120 },
      },
    ];

    const conversationsChain = createChainMock({ data: conversationsData, error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'ai_conversations') return conversationsChain;
      return createChainMock({ data: table === 'profiles' ? null : [], error: null });
    });

    const response = await GET();
    const body = JSON.parse(await response.text());

    expect(body.tokenUsage).toBeDefined();
    expect(body.tokenUsage.length).toBeGreaterThanOrEqual(1);

    // Null provider/model should fall back to 'unknown'
    const unknownEntry = body.tokenUsage.find(
      (t: Record<string, unknown>) => t.provider === 'unknown'
    );
    expect(unknownEntry).toBeDefined();
    expect(unknownEntry.totalTokens).toBe(100);
  });
});
