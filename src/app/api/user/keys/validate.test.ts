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

describe('validateApiKey', () => {
  describe('OpenAI', () => {
    it('returns valid on 200 response', async () => {
      mockFetch({ ok: true, status: 200 });
      const result = await validateApiKey('openai', 'sk-test-key');
      expect(result).toEqual({ valid: true });
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer sk-test-key',
          }),
        })
      );
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
    it('returns valid on 200 response', async () => {
      mockFetch({ ok: true, status: 200 });
      const result = await validateApiKey('anthropic', 'sk-ant-test');
      expect(result).toEqual({ valid: true });
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'sk-ant-test',
            'anthropic-version': '2023-06-01',
          }),
        })
      );
    });

    it('returns INVALID_KEY on 401', async () => {
      mockFetch({ ok: false, status: 401 });
      const result = await validateApiKey('anthropic', 'sk-ant-bad');
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('INVALID_KEY');
    });

    it('returns RATE_LIMITED on 429', async () => {
      mockFetch({ ok: false, status: 429 });
      const result = await validateApiKey('anthropic', 'sk-ant-rate');
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('RATE_LIMITED');
    });

    it('returns PROVIDER_DOWN on 503', async () => {
      mockFetch({ ok: false, status: 503 });
      const result = await validateApiKey('anthropic', 'sk-ant-down');
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('PROVIDER_DOWN');
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
