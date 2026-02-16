import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/stores/app-store';
import { detectKeyExpiry } from './api-key-expiry-detector';

describe('detectKeyExpiry', () => {
  beforeEach(() => {
    useAppStore.setState({ apiKeyStatus: 'active', hasApiKey: true });
  });

  it('detects 401 status code errors', () => {
    const error = new Error('Request failed with status code 401');
    const result = detectKeyExpiry(error);

    expect(result).toBe(true);
    expect(useAppStore.getState().apiKeyStatus).toBe('invalid');
  });

  it('detects 403 status code errors', () => {
    const error = new Error('HTTP 403 Forbidden');
    const result = detectKeyExpiry(error);

    expect(result).toBe(true);
    expect(useAppStore.getState().apiKeyStatus).toBe('invalid');
  });

  it('detects "unauthorized" error messages', () => {
    const error = new Error('Unauthorized access to API');
    const result = detectKeyExpiry(error);

    expect(result).toBe(true);
    expect(useAppStore.getState().apiKeyStatus).toBe('invalid');
  });

  it('detects "expired" error messages', () => {
    const error = new Error('API key has expired');
    const result = detectKeyExpiry(error);

    expect(result).toBe(true);
    expect(useAppStore.getState().apiKeyStatus).toBe('invalid');
  });

  it('detects "invalid api key" error messages', () => {
    const error = new Error('Invalid API key provided');
    const result = detectKeyExpiry(error);

    expect(result).toBe(true);
    expect(useAppStore.getState().apiKeyStatus).toBe('invalid');
  });

  it('detects "api key invalid" error messages', () => {
    const error = new Error('The API key invalid for this request');
    const result = detectKeyExpiry(error);

    expect(result).toBe(true);
    expect(useAppStore.getState().apiKeyStatus).toBe('invalid');
  });

  it('detects "authentication failed" error messages', () => {
    const error = new Error('Authentication failed');
    const result = detectKeyExpiry(error);

    expect(result).toBe(true);
    expect(useAppStore.getState().apiKeyStatus).toBe('invalid');
  });

  it('returns false for 500 server errors', () => {
    const error = new Error('Internal server error 500');
    const result = detectKeyExpiry(error);

    expect(result).toBe(false);
    expect(useAppStore.getState().apiKeyStatus).toBe('active');
  });

  it('returns false for network errors', () => {
    const error = new Error('Network request failed');
    const result = detectKeyExpiry(error);

    expect(result).toBe(false);
    expect(useAppStore.getState().apiKeyStatus).toBe('active');
  });

  it('returns false for timeout errors', () => {
    const error = new Error('Request timeout');
    const result = detectKeyExpiry(error);

    expect(result).toBe(false);
    expect(useAppStore.getState().apiKeyStatus).toBe('active');
  });

  it('returns false for rate limit errors', () => {
    const error = new Error('Rate limit exceeded');
    const result = detectKeyExpiry(error);

    expect(result).toBe(false);
    expect(useAppStore.getState().apiKeyStatus).toBe('active');
  });

  it('handles non-Error objects', () => {
    const error = 'Unauthorized';
    const result = detectKeyExpiry(error);

    expect(result).toBe(true);
    expect(useAppStore.getState().apiKeyStatus).toBe('invalid');
  });

  it('handles null/undefined gracefully', () => {
    const result1 = detectKeyExpiry(null);
    const result2 = detectKeyExpiry(undefined);

    expect(result1).toBe(false);
    expect(result2).toBe(false);
    expect(useAppStore.getState().apiKeyStatus).toBe('active');
  });

  it('is case-insensitive for error message matching', () => {
    const error1 = new Error('UNAUTHORIZED');
    const error2 = new Error('Expired Token');
    const error3 = new Error('INVALID API KEY');

    expect(detectKeyExpiry(error1)).toBe(true);
    expect(detectKeyExpiry(error2)).toBe(true);
    expect(detectKeyExpiry(error3)).toBe(true);
  });
});
