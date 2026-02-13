// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest';
import { validateApiKey } from './validate';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function mockFetch(response: { ok: boolean; status: number }) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status,
    json: () => Promise.resolve({}),
  });
}

function mockFetchReject(error: Error) {
  globalThis.fetch = vi.fn().mockRejectedValue(error);
}

// Valid Anthropic key format for tests
const VALID_ANTHROPIC_KEY = 'sk-ant-abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG';

describe('validateApiKey', () => {
  describe('OpenAI', () => {
    it('returns valid on 200 response from GET /v1/models', async () => {
      mockFetch({ ok: true, status: 200 });
      const result = await validateApiKey('openai', 'sk-test-key');
      expect(result).toEqual({ valid: true });
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer sk-test-key',
          }),
        })
      );
    });

    it('uses GET method (non-charging endpoint)', async () => {
      mockFetch({ ok: true, status: 200 });
      await validateApiKey('openai', 'sk-test-key');
      const call = vi.mocked(globalThis.fetch).mock.calls[0];
      expect(call[0]).toBe('https://api.openai.com/v1/models');
      expect((call[1] as RequestInit).method).toBe('GET');
      // No body should be sent
      expect((call[1] as RequestInit).body).toBeUndefined();
    });

    it('returns INVALID_KEY on 401', async () => {
      mockFetch({ ok: false, status: 401 });
      const result = await validateApiKey('openai', 'sk-bad-key');
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('INVALID_KEY');
    });

    it('returns INVALID_KEY on 403', async () => {
      mockFetch({ ok: false, status: 403 });
      const result = await validateApiKey('openai', 'sk-forbidden');
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('INVALID_KEY');
    });

    it('returns RATE_LIMITED on 429', async () => {
      mockFetch({ ok: false, status: 429 });
      const result = await validateApiKey('openai', 'sk-rate-limited');
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('RATE_LIMITED');
    });

    it('returns PROVIDER_DOWN on 500', async () => {
      mockFetch({ ok: false, status: 500 });
      const result = await validateApiKey('openai', 'sk-server-error');
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('PROVIDER_DOWN');
    });

    it('returns PROVIDER_DOWN on 502', async () => {
      mockFetch({ ok: false, status: 502 });
      const result = await validateApiKey('openai', 'sk-bad-gateway');
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('PROVIDER_DOWN');
    });

    it('returns PROVIDER_DOWN on network error', async () => {
      mockFetchReject(new Error('Network error'));
      const result = await validateApiKey('openai', 'sk-network-fail');
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('PROVIDER_DOWN');
    });

    it('returns PROVIDER_DOWN on abort (timeout)', async () => {
      mockFetchReject(new DOMException('The operation was aborted', 'AbortError'));
      const result = await validateApiKey('openai', 'sk-timeout');
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('PROVIDER_DOWN');
    });
  });

  describe('Anthropic', () => {
    it('returns valid on 200 response from count_tokens endpoint', async () => {
      mockFetch({ ok: true, status: 200 });
      const result = await validateApiKey('anthropic', VALID_ANTHROPIC_KEY);
      expect(result).toEqual({ valid: true });
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages/count_tokens',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': VALID_ANTHROPIC_KEY,
            'anthropic-version': '2023-06-01',
          }),
        })
      );
    });

    it('rejects invalid format without making network call', async () => {
      const fetchSpy = vi.fn();
      globalThis.fetch = fetchSpy;
      const result = await validateApiKey('anthropic', 'not-a-valid-key');
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('INVALID_KEY');
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('returns INVALID_KEY on 401', async () => {
      mockFetch({ ok: false, status: 401 });
      const result = await validateApiKey('anthropic', VALID_ANTHROPIC_KEY);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('INVALID_KEY');
    });

    it('returns RATE_LIMITED on 429', async () => {
      mockFetch({ ok: false, status: 429 });
      const result = await validateApiKey('anthropic', VALID_ANTHROPIC_KEY);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('RATE_LIMITED');
    });

    it('returns PROVIDER_DOWN on 503', async () => {
      mockFetch({ ok: false, status: 503 });
      const result = await validateApiKey('anthropic', VALID_ANTHROPIC_KEY);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('PROVIDER_DOWN');
    });

    it('falls back to format-only validation on 404 (endpoint unavailable)', async () => {
      mockFetch({ ok: false, status: 404 });
      const result = await validateApiKey('anthropic', VALID_ANTHROPIC_KEY);
      expect(result.valid).toBe(true);
    });

    it('accepts key on network error if format is valid', async () => {
      mockFetchReject(new Error('Network error'));
      const result = await validateApiKey('anthropic', VALID_ANTHROPIC_KEY);
      expect(result.valid).toBe(true);
    });
  });

  describe('Other provider', () => {
    it('skips validation and returns valid', async () => {
      const fetchSpy = vi.fn();
      globalThis.fetch = fetchSpy;
      const result = await validateApiKey('other', 'some-random-key');
      expect(result).toEqual({ valid: true });
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe('Unknown provider', () => {
    it('skips validation and returns valid', async () => {
      const result = await validateApiKey('unknown-provider', 'some-key');
      expect(result).toEqual({ valid: true });
    });
  });
});
