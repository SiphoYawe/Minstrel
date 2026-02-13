import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitApiKey, getApiKeyMetadata, deleteApiKey } from './api-key-manager';
import type { ApiKeyMetadata } from './auth-types';

const mockMetadata: ApiKeyMetadata = {
  provider: 'openai',
  lastFour: 'ab12',
  status: 'active',
  createdAt: '2026-02-13T00:00:00Z',
  updatedAt: '2026-02-13T00:00:00Z',
};

function mockFetchResponse(body: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('submitApiKey', () => {
  it('sends POST with provider and apiKey', async () => {
    const fetchMock = mockFetchResponse({ data: mockMetadata });
    vi.stubGlobal('fetch', fetchMock);

    await submitApiKey('openai', 'sk-test-key-1234567890');

    expect(fetchMock).toHaveBeenCalledWith('/api/user/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'openai', apiKey: 'sk-test-key-1234567890' }),
    });
  });

  it('returns metadata on success', async () => {
    vi.stubGlobal('fetch', mockFetchResponse({ data: mockMetadata }));

    const result = await submitApiKey('openai', 'sk-test-key-1234567890');

    expect(result).toEqual({ data: mockMetadata, error: null });
  });

  it('returns error on non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchResponse(
        { error: { code: 'INVALID_KEY', message: 'The API key is invalid.' } },
        false,
        400
      )
    );

    const result = await submitApiKey('openai', 'bad-key-123456');

    expect(result).toEqual({
      data: null,
      error: { code: 'INVALID_KEY', message: 'The API key is invalid.' },
    });
  });

  it('returns default error when response has no error details', async () => {
    vi.stubGlobal('fetch', mockFetchResponse({}, false, 500));

    const result = await submitApiKey('openai', 'sk-test-key-1234567890');

    expect(result).toEqual({
      data: null,
      error: { code: 'SUBMIT_FAILED', message: 'Failed to save API key.' },
    });
  });

  it('returns network error on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const result = await submitApiKey('openai', 'sk-test-key-1234567890');

    expect(result).toEqual({
      data: null,
      error: { code: 'NETWORK_ERROR', message: 'Network error — please check your connection.' },
    });
  });
});

describe('getApiKeyMetadata', () => {
  it('sends GET to /api/user/keys', async () => {
    const fetchMock = mockFetchResponse({ data: mockMetadata });
    vi.stubGlobal('fetch', fetchMock);

    await getApiKeyMetadata();

    expect(fetchMock).toHaveBeenCalledWith('/api/user/keys');
  });

  it('returns metadata on success', async () => {
    vi.stubGlobal('fetch', mockFetchResponse({ data: mockMetadata }));

    const result = await getApiKeyMetadata();

    expect(result).toEqual({ data: mockMetadata, error: null });
  });

  it('returns null when no key is stored', async () => {
    vi.stubGlobal('fetch', mockFetchResponse({ data: null }));

    const result = await getApiKeyMetadata();

    expect(result).toEqual({ data: null, error: null });
  });

  it('returns error on non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchResponse(
        { error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } },
        false,
        401
      )
    );

    const result = await getApiKeyMetadata();

    expect(result).toEqual({
      data: null,
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' },
    });
  });

  it('returns default error when response has no error details', async () => {
    vi.stubGlobal('fetch', mockFetchResponse({}, false, 500));

    const result = await getApiKeyMetadata();

    expect(result).toEqual({
      data: null,
      error: { code: 'FETCH_FAILED', message: 'Failed to load API key info.' },
    });
  });

  it('returns network error on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const result = await getApiKeyMetadata();

    expect(result).toEqual({
      data: null,
      error: { code: 'NETWORK_ERROR', message: 'Network error — please check your connection.' },
    });
  });
});

describe('deleteApiKey', () => {
  it('sends DELETE with provider', async () => {
    const fetchMock = mockFetchResponse(null, true, 204);
    vi.stubGlobal('fetch', fetchMock);

    await deleteApiKey('openai');

    expect(fetchMock).toHaveBeenCalledWith('/api/user/keys', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'openai' }),
    });
  });

  it('returns success on ok response', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(null, true, 204));

    const result = await deleteApiKey('openai');

    expect(result.error).toBeNull();
  });

  it('returns error on non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchResponse(
        { error: { code: 'NOT_FOUND', message: 'No key found for this provider.' } },
        false,
        404
      )
    );

    const result = await deleteApiKey('anthropic');

    expect(result).toEqual({
      data: null,
      error: { code: 'NOT_FOUND', message: 'No key found for this provider.' },
    });
  });

  it('returns default error when response has no error details', async () => {
    vi.stubGlobal('fetch', mockFetchResponse({}, false, 500));

    const result = await deleteApiKey('openai');

    expect(result).toEqual({
      data: null,
      error: { code: 'DELETE_FAILED', message: 'Failed to remove API key.' },
    });
  });

  it('returns network error on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const result = await deleteApiKey('openai');

    expect(result).toEqual({
      data: null,
      error: { code: 'NETWORK_ERROR', message: 'Network error — please check your connection.' },
    });
  });
});
