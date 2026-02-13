import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { validateCsrf } from './csrf';

describe('validateCsrf', () => {
  const originalEnv = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://minstrel.app';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalEnv;
  });

  function makeRequest(method: string, headers: Record<string, string> = {}): Request {
    return new Request('https://minstrel.app/api/ai/chat', {
      method,
      headers,
    });
  }

  it('allows GET requests without origin check', () => {
    const result = validateCsrf(makeRequest('GET'));
    expect(result).toBeNull();
  });

  it('allows same-origin POST requests', () => {
    const result = validateCsrf(makeRequest('POST', { Origin: 'https://minstrel.app' }));
    expect(result).toBeNull();
  });

  it('allows same-origin DELETE requests', () => {
    const result = validateCsrf(makeRequest('DELETE', { Origin: 'https://minstrel.app' }));
    expect(result).toBeNull();
  });

  it('rejects cross-origin POST requests with 403', async () => {
    const result = validateCsrf(makeRequest('POST', { Origin: 'https://evil.com' }));
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
    const body = await result!.json();
    expect(body.error.code).toBe('CSRF_ERROR');
  });

  it('rejects cross-origin DELETE requests with 403', async () => {
    const result = validateCsrf(makeRequest('DELETE', { Origin: 'https://evil.com' }));
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
  });

  it('rejects POST requests with missing Origin and Referer', async () => {
    const result = validateCsrf(makeRequest('POST'));
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
    const body = await result!.json();
    expect(body.error.message).toBe('Missing Origin header.');
  });

  it('accepts Referer fallback when Origin is absent', () => {
    const result = validateCsrf(makeRequest('POST', { Referer: 'https://minstrel.app/session' }));
    expect(result).toBeNull();
  });

  it('rejects cross-origin Referer when Origin is absent', async () => {
    const result = validateCsrf(makeRequest('POST', { Referer: 'https://evil.com/phish' }));
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
  });

  it('allows Vercel preview URLs', () => {
    const result = validateCsrf(
      makeRequest('POST', {
        Origin: 'https://minstrel-abc123-team.vercel.app',
      })
    );
    expect(result).toBeNull();
  });

  it('allows localhost development', () => {
    const result = validateCsrf(makeRequest('POST', { Origin: 'http://localhost:3000' }));
    expect(result).toBeNull();
  });

  it('allows 127.0.0.1 development', () => {
    const result = validateCsrf(makeRequest('POST', { Origin: 'http://127.0.0.1:3000' }));
    expect(result).toBeNull();
  });

  it('rejects Vercel-like URLs that do not match pattern', async () => {
    const result = validateCsrf(
      makeRequest('POST', { Origin: 'https://evil.vercel.app.attacker.com' })
    );
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
  });
});
