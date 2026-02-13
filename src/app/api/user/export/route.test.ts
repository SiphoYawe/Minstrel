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
    expect(disposition).toMatch(/attachment; filename="minstrel-data-export-\d{4}-\d{2}-\d{2}\.json"/);

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
  });
});
