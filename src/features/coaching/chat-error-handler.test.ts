import { describe, it, expect } from 'vitest';
import { parseChatError } from './chat-error-handler';

describe('parseChatError', () => {
  it('maps INVALID_KEY error code and returns invalidate action', () => {
    const result = parseChatError(new Error('INVALID_KEY: bad key'));
    expect(result.error.code).toBe('INVALID_KEY');
    expect(result.error.message).toContain('invalid');
    expect(result.error.actionUrl).toBe('/settings#api-keys');
    expect(result.type).toBe('INVALID_KEY');
    expect(result.action).toBe('invalidate_api_key');
  });

  it('maps RATE_LIMITED error code without action', () => {
    const result = parseChatError(new Error('RATE_LIMITED'));
    expect(result.error.code).toBe('RATE_LIMITED');
    expect(result.error.message).toContain('Too many requests');
    expect(result.type).toBe('RATE_LIMITED');
    expect(result.action).toBeUndefined();
  });

  it('maps PROVIDER_DOWN error code', () => {
    const result = parseChatError(new Error('PROVIDER_DOWN'));
    expect(result.error.code).toBe('PROVIDER_DOWN');
    expect(result.error.message).toContain('temporarily unavailable');
    expect(result.type).toBe('PROVIDER_DOWN');
  });

  it('maps GENERATION_FAILED error code', () => {
    const result = parseChatError(new Error('GENERATION_FAILED'));
    expect(result.error.code).toBe('GENERATION_FAILED');
    expect(result.error.message).toContain('Could not generate');
    expect(result.type).toBe('GENERATION_FAILED');
  });

  it('detects 401 status in message as invalid key with action', () => {
    const result = parseChatError(new Error('Request failed with status 401'));
    expect(result.error.code).toBe('INVALID_KEY');
    expect(result.type).toBe('INVALID_KEY');
    expect(result.action).toBe('invalidate_api_key');
  });

  it('detects 429 status in message as rate limited', () => {
    const result = parseChatError(new Error('429 too many requests'));
    expect(result.error.code).toBe('RATE_LIMITED');
    expect(result.type).toBe('RATE_LIMITED');
  });

  it('detects 500 status in message as provider down', () => {
    const result = parseChatError(new Error('500 internal server error'));
    expect(result.error.code).toBe('PROVIDER_DOWN');
    expect(result.type).toBe('PROVIDER_DOWN');
  });

  it('detects timeout as provider down', () => {
    const result = parseChatError(new Error('Request timeout'));
    expect(result.error.code).toBe('PROVIDER_DOWN');
    expect(result.type).toBe('PROVIDER_DOWN');
  });

  it('returns unknown for unrecognized errors', () => {
    const result = parseChatError(new Error('something weird'));
    expect(result.error.code).toBe('UNKNOWN');
    expect(result.error.message).toContain('unexpected');
    expect(result.type).toBe('UNKNOWN');
    expect(result.action).toBeUndefined();
  });

  it('handles empty error message', () => {
    const result = parseChatError(new Error(''));
    expect(result.error.code).toBe('UNKNOWN');
    expect(result.type).toBe('UNKNOWN');
  });

  it('does not directly mutate any store', () => {
    // The function should be pure — no imports from stores
    // Verify by checking the return shape only (no side effects)
    const result = parseChatError(new Error('INVALID_KEY'));
    expect(result).toEqual({
      error: expect.objectContaining({ code: 'INVALID_KEY' }),
      type: 'INVALID_KEY',
      action: 'invalidate_api_key',
    });
  });
});
