import { describe, it, expect } from 'vitest';
import { parseChatError } from './chat-error-handler';

describe('parseChatError', () => {
  it('maps INVALID_KEY error code', () => {
    const result = parseChatError(new Error('INVALID_KEY: bad key'));
    expect(result.code).toBe('INVALID_KEY');
    expect(result.message).toContain('invalid');
    expect(result.actionUrl).toBe('/settings');
  });

  it('maps RATE_LIMITED error code', () => {
    const result = parseChatError(new Error('RATE_LIMITED'));
    expect(result.code).toBe('RATE_LIMITED');
    expect(result.message).toContain('Too many requests');
  });

  it('maps PROVIDER_DOWN error code', () => {
    const result = parseChatError(new Error('PROVIDER_DOWN'));
    expect(result.code).toBe('PROVIDER_DOWN');
    expect(result.message).toContain('temporarily unavailable');
  });

  it('maps GENERATION_FAILED error code', () => {
    const result = parseChatError(new Error('GENERATION_FAILED'));
    expect(result.code).toBe('GENERATION_FAILED');
    expect(result.message).toContain('Could not generate');
  });

  it('detects 401 status in message as invalid key', () => {
    const result = parseChatError(new Error('Request failed with status 401'));
    expect(result.code).toBe('INVALID_KEY');
  });

  it('detects 429 status in message as rate limited', () => {
    const result = parseChatError(new Error('429 too many requests'));
    expect(result.code).toBe('RATE_LIMITED');
  });

  it('detects 500 status in message as provider down', () => {
    const result = parseChatError(new Error('500 internal server error'));
    expect(result.code).toBe('PROVIDER_DOWN');
  });

  it('detects timeout as provider down', () => {
    const result = parseChatError(new Error('Request timeout'));
    expect(result.code).toBe('PROVIDER_DOWN');
  });

  it('returns unknown for unrecognized errors', () => {
    const result = parseChatError(new Error('something weird'));
    expect(result.code).toBe('UNKNOWN');
    expect(result.message).toContain('unexpected');
  });

  it('handles empty error message', () => {
    const result = parseChatError(new Error(''));
    expect(result.code).toBe('UNKNOWN');
  });
});
