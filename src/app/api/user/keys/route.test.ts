// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies before importing route handlers
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/crypto', () => ({
  encrypt: vi.fn().mockReturnValue('mock-iv:mock-tag:mock-cipher'),
}));

vi.mock('./validate', () => ({
  validateApiKey: vi.fn().mockResolvedValue({ valid: true }),
}));

vi.mock('./rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true }),
  recordRequest: vi.fn(),
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

import { POST, GET, DELETE } from './route';
import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/crypto';
import { validateApiKey } from './validate';
import { checkRateLimit, recordRequest } from './rate-limit';
import * as Sentry from '@sentry/nextjs';

// Helper to create mock Supabase client
function createMockSupabase(user: { id: string } | null = { id: 'user-123' }) {
  const queryBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
  };

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue(queryBuilder),
    _queryBuilder: queryBuilder,
  };
}

function makeRequest(method: string, body?: Record<string, unknown>) {
  const init: RequestInit = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  return new NextRequest('http://localhost/api/user/keys', init);
}

async function parseResponse(response: Response) {
  return response.json();
}

beforeEach(() => {
  vi.clearAllMocks();
  // Re-establish default mock return values after clearAllMocks
  vi.mocked(checkRateLimit).mockReturnValue({ allowed: true });
  vi.mocked(validateApiKey).mockResolvedValue({ valid: true });
  vi.mocked(encrypt).mockReturnValue('mock-iv:mock-tag:mock-cipher');
  process.env.ENCRYPTION_KEY = 'test-encryption-key-at-least-32-chars!';
});

describe('POST /api/user/keys', () => {
  it('creates a key on valid submission', async () => {
    const mockSb = createMockSupabase();
    mockSb._queryBuilder.single.mockResolvedValue({
      data: { created_at: '2026-02-13T00:00:00Z', updated_at: '2026-02-13T00:00:00Z' },
      error: null,
    });
    vi.mocked(createClient).mockResolvedValue(mockSb as never);

    const req = makeRequest('POST', { provider: 'openai', apiKey: 'sk-test-key-1234567890' });
    const res = await POST(req);
    const json = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(json.data.provider).toBe('openai');
    expect(json.data.lastFour).toBe('7890');
    expect(json.data.status).toBe('active');
    expect(json.error).toBeNull();
    expect(encrypt).toHaveBeenCalledWith(
      'sk-test-key-1234567890',
      'test-encryption-key-at-least-32-chars!'
    );
  });

  it('replaces existing key via upsert', async () => {
    const mockSb = createMockSupabase();
    mockSb._queryBuilder.single.mockResolvedValue({
      data: { created_at: '2026-02-13T00:00:00Z', updated_at: '2026-02-13T01:00:00Z' },
      error: null,
    });
    vi.mocked(createClient).mockResolvedValue(mockSb as never);

    const req = makeRequest('POST', { provider: 'openai', apiKey: 'sk-new-key-9876543210' });
    const res = await POST(req);
    const json = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(json.data.lastFour).toBe('3210');
    expect(mockSb.from).toHaveBeenCalledWith('user_api_keys');
    expect(mockSb._queryBuilder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        provider: 'openai',
        encrypted_key: 'mock-iv:mock-tag:mock-cipher',
        key_last_four: '3210',
        status: 'active',
      }),
      { onConflict: 'user_id,provider' }
    );
  });

  it('returns 401 when unauthenticated', async () => {
    const mockSb = createMockSupabase(null);
    vi.mocked(createClient).mockResolvedValue(mockSb as never);

    const req = makeRequest('POST', { provider: 'openai', apiKey: 'sk-test-key-1234567890' });
    const res = await POST(req);
    const json = await parseResponse(res);

    expect(res.status).toBe(401);
    expect(json.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 400 for invalid body', async () => {
    const mockSb = createMockSupabase();
    vi.mocked(createClient).mockResolvedValue(mockSb as never);

    const req = makeRequest('POST', { provider: 'invalid-provider', apiKey: 'short' });
    const res = await POST(req);
    const json = await parseResponse(res);

    expect(res.status).toBe(400);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when API key validation fails', async () => {
    const mockSb = createMockSupabase();
    vi.mocked(createClient).mockResolvedValue(mockSb as never);
    vi.mocked(validateApiKey).mockResolvedValue({
      valid: false,
      error: {
        code: 'INVALID_KEY',
        message: "This API key doesn't appear to be valid",
      },
    });

    const req = makeRequest('POST', { provider: 'openai', apiKey: 'sk-invalid-key-12345' });
    const res = await POST(req);
    const json = await parseResponse(res);

    expect(res.status).toBe(400);
    expect(json.error.code).toBe('INVALID_KEY');
  });

  it('returns 429 when rate limited', async () => {
    const mockSb = createMockSupabase();
    vi.mocked(createClient).mockResolvedValue(mockSb as never);
    vi.mocked(checkRateLimit).mockReturnValue({ allowed: false, retryAfterMs: 3600000 });

    const req = makeRequest('POST', { provider: 'openai', apiKey: 'sk-test-key-1234567890' });
    const res = await POST(req);
    const json = await parseResponse(res);

    expect(res.status).toBe(429);
    expect(json.error.code).toBe('RATE_LIMITED');
    expect(validateApiKey).not.toHaveBeenCalled();
  });

  it('records rate limit hit before validation', async () => {
    const mockSb = createMockSupabase();
    mockSb._queryBuilder.single.mockResolvedValue({
      data: { created_at: '2026-02-13T00:00:00Z', updated_at: '2026-02-13T00:00:00Z' },
      error: null,
    });
    vi.mocked(createClient).mockResolvedValue(mockSb as never);

    const req = makeRequest('POST', { provider: 'openai', apiKey: 'sk-test-key-1234567890' });
    await POST(req);

    expect(recordRequest).toHaveBeenCalledWith('user-123');
  });

  it('returns 500 when ENCRYPTION_KEY is missing', async () => {
    delete process.env.ENCRYPTION_KEY;
    const mockSb = createMockSupabase();
    vi.mocked(createClient).mockResolvedValue(mockSb as never);

    const req = makeRequest('POST', { provider: 'openai', apiKey: 'sk-test-key-1234567890' });
    const res = await POST(req);
    const json = await parseResponse(res);

    expect(res.status).toBe(500);
    expect(json.error.code).toBe('SERVER_ERROR');
    expect(Sentry.captureMessage).toHaveBeenCalled();
  });

  it('returns 500 on database error', async () => {
    const mockSb = createMockSupabase();
    mockSb._queryBuilder.single.mockResolvedValue({
      data: null,
      error: { message: 'DB error', code: 'PGRST' },
    });
    vi.mocked(createClient).mockResolvedValue(mockSb as never);

    const req = makeRequest('POST', { provider: 'openai', apiKey: 'sk-test-key-1234567890' });
    const res = await POST(req);
    const json = await parseResponse(res);

    expect(res.status).toBe(500);
    expect(json.error.code).toBe('DB_ERROR');
    expect(Sentry.captureException).toHaveBeenCalled();
  });

  it('never includes API key in Sentry context', async () => {
    const mockSb = createMockSupabase();
    mockSb._queryBuilder.single.mockResolvedValue({
      data: null,
      error: { message: 'DB error', code: 'PGRST' },
    });
    vi.mocked(createClient).mockResolvedValue(mockSb as never);

    const req = makeRequest('POST', { provider: 'openai', apiKey: 'sk-secret-key-12345' });
    await POST(req);

    expect(Sentry.captureException).toHaveBeenCalled();
    const calls = vi.mocked(Sentry.captureException).mock.calls;
    const serialized = JSON.stringify(calls);
    expect(serialized).not.toContain('sk-secret-key-12345');
  });
});

describe('GET /api/user/keys', () => {
  it('returns metadata for existing key', async () => {
    const mockSb = createMockSupabase();
    // The chain is: from().select().eq().order() — order is the terminal awaited call
    mockSb._queryBuilder.order.mockResolvedValue({
      data: [
        {
          provider: 'openai',
          key_last_four: 'a1B2',
          status: 'active',
          created_at: '2026-02-13T00:00:00Z',
          updated_at: '2026-02-13T00:00:00Z',
        },
      ],
      error: null,
    });
    vi.mocked(createClient).mockResolvedValue(mockSb as never);

    const res = await GET();
    const json = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(json.data.provider).toBe('openai');
    expect(json.data.lastFour).toBe('a1B2');
    expect(json.data.status).toBe('active');
    expect(json.error).toBeNull();
  });

  it('returns null when no keys configured', async () => {
    const mockSb = createMockSupabase();
    mockSb._queryBuilder.order.mockResolvedValue({ data: [], error: null });
    vi.mocked(createClient).mockResolvedValue(mockSb as never);

    const res = await GET();
    const json = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(json.data).toBeNull();
    expect(json.error).toBeNull();
  });

  it('never returns encrypted_key in response', async () => {
    const mockSb = createMockSupabase();
    mockSb._queryBuilder.order.mockResolvedValue({ data: [], error: null });
    vi.mocked(createClient).mockResolvedValue(mockSb as never);

    await GET();

    // Verify the select query does NOT include encrypted_key
    const selectCall = mockSb._queryBuilder.select.mock.calls[0]?.[0];
    expect(selectCall).not.toContain('encrypted_key');
  });

  it('returns 401 when unauthenticated', async () => {
    const mockSb = createMockSupabase(null);
    vi.mocked(createClient).mockResolvedValue(mockSb as never);

    const res = await GET();
    const json = await parseResponse(res);

    expect(res.status).toBe(401);
    expect(json.error.code).toBe('UNAUTHORIZED');
  });
});

describe('DELETE /api/user/keys', () => {
  it('deletes key for provider', async () => {
    const mockSb = createMockSupabase();
    mockSb._queryBuilder.select.mockResolvedValue({
      data: [{ id: 'key-uuid' }],
      error: null,
    });
    vi.mocked(createClient).mockResolvedValue(mockSb as never);

    const req = makeRequest('DELETE', { provider: 'openai' });
    const res = await DELETE(req);
    const json = await parseResponse(res);

    expect(res.status).toBe(200);
    expect(json.data).toEqual({ deleted: true });
    expect(json.error).toBeNull();
  });

  it('returns 404 when no key found for provider', async () => {
    const mockSb = createMockSupabase();
    mockSb._queryBuilder.select.mockResolvedValue({
      data: [],
      error: null,
    });
    vi.mocked(createClient).mockResolvedValue(mockSb as never);

    const req = makeRequest('DELETE', { provider: 'anthropic' });
    const res = await DELETE(req);
    const json = await parseResponse(res);

    expect(res.status).toBe(404);
    expect(json.error.code).toBe('NOT_FOUND');
  });

  it('returns 401 when unauthenticated', async () => {
    const mockSb = createMockSupabase(null);
    vi.mocked(createClient).mockResolvedValue(mockSb as never);

    const req = makeRequest('DELETE', { provider: 'openai' });
    const res = await DELETE(req);
    const json = await parseResponse(res);

    expect(res.status).toBe(401);
    expect(json.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 400 for invalid body', async () => {
    const mockSb = createMockSupabase();
    vi.mocked(createClient).mockResolvedValue(mockSb as never);

    const req = makeRequest('DELETE', {});
    const res = await DELETE(req);
    const json = await parseResponse(res);

    expect(res.status).toBe(400);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 500 on database error', async () => {
    const mockSb = createMockSupabase();
    mockSb._queryBuilder.select.mockResolvedValue({
      data: null,
      error: { message: 'DB error' },
    });
    vi.mocked(createClient).mockResolvedValue(mockSb as never);

    const req = makeRequest('DELETE', { provider: 'openai' });
    const res = await DELETE(req);
    const json = await parseResponse(res);

    expect(res.status).toBe(500);
    expect(json.error.code).toBe('DB_ERROR');
  });
});
