// @vitest-environment node
import { describe, it, expect } from 'vitest';

import { AiError, classifyAiError, aiErrorToResponse } from './errors';
import type { AiErrorCode } from './errors';

/* ------------------------------------------------------------------ */
/*  1. AiError constructor                                            */
/* ------------------------------------------------------------------ */
describe('AiError', () => {
  const cases: { code: AiErrorCode; httpStatus: number; messageSnippet: string }[] = [
    { code: 'INVALID_KEY', httpStatus: 400, messageSnippet: 'API key appears to be invalid' },
    { code: 'RATE_LIMITED', httpStatus: 429, messageSnippet: 'Too many requests' },
    { code: 'PROVIDER_DOWN', httpStatus: 502, messageSnippet: 'temporarily unavailable' },
    { code: 'GENERATION_FAILED', httpStatus: 500, messageSnippet: 'Could not generate' },
  ];

  it.each(cases)(
    'sets code=$code, httpStatus=$httpStatus, and a user-friendly message',
    ({ code, httpStatus, messageSnippet }) => {
      const err = new AiError(code);

      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe('AiError');
      expect(err.code).toBe(code);
      expect(err.httpStatus).toBe(httpStatus);
      expect(err.message).toContain(messageSnippet);
    }
  );

  it('preserves the original cause when provided', () => {
    const cause = new TypeError('original');
    const err = new AiError('GENERATION_FAILED', cause);

    expect(err.cause).toBe(cause);
  });
});

/* ------------------------------------------------------------------ */
/*  2-11. classifyAiError                                             */
/* ------------------------------------------------------------------ */
describe('classifyAiError', () => {
  // 2. HTTP 401
  it('returns INVALID_KEY for { status: 401, message: "unauthorized" }', () => {
    const result = classifyAiError({ status: 401, message: 'unauthorized' });

    expect(result).toBeInstanceOf(AiError);
    expect(result.code).toBe('INVALID_KEY');
    expect(result.httpStatus).toBe(400);
  });

  // 3. HTTP 403
  it('returns INVALID_KEY for { status: 403 }', () => {
    const result = classifyAiError({ status: 403 });

    expect(result.code).toBe('INVALID_KEY');
    expect(result.httpStatus).toBe(400);
  });

  // 4. Message pattern: invalid api key
  it('returns INVALID_KEY for new Error("invalid api key provided")', () => {
    const result = classifyAiError(new Error('invalid api key provided'));

    expect(result.code).toBe('INVALID_KEY');
    expect(result.httpStatus).toBe(400);
  });

  // 5. HTTP 429
  it('returns RATE_LIMITED for { status: 429, message: "too many requests" }', () => {
    const result = classifyAiError({ status: 429, message: 'too many requests' });

    expect(result.code).toBe('RATE_LIMITED');
    expect(result.httpStatus).toBe(429);
  });

  // 6. Message pattern: rate limit
  it('returns RATE_LIMITED for new Error("rate limit exceeded")', () => {
    const result = classifyAiError(new Error('rate limit exceeded'));

    expect(result.code).toBe('RATE_LIMITED');
    expect(result.httpStatus).toBe(429);
  });

  // 7. HTTP 500
  it('returns PROVIDER_DOWN for { status: 500, message: "server error" }', () => {
    const result = classifyAiError({ status: 500, message: 'server error' });

    expect(result.code).toBe('PROVIDER_DOWN');
    expect(result.httpStatus).toBe(502);
  });

  // 8. Message pattern: ECONNREFUSED
  it('returns PROVIDER_DOWN for new Error("ECONNREFUSED")', () => {
    const result = classifyAiError(new Error('ECONNREFUSED'));

    expect(result.code).toBe('PROVIDER_DOWN');
    expect(result.httpStatus).toBe(502);
  });

  // 9. Message pattern: timeout
  it('returns PROVIDER_DOWN for new Error("timeout waiting for response")', () => {
    const result = classifyAiError(new Error('timeout waiting for response'));

    expect(result.code).toBe('PROVIDER_DOWN');
    expect(result.httpStatus).toBe(502);
  });

  // 10. Fallback to GENERATION_FAILED
  it('returns GENERATION_FAILED for new Error("unexpected token in JSON")', () => {
    const result = classifyAiError(new Error('unexpected token in JSON'));

    expect(result.code).toBe('GENERATION_FAILED');
    expect(result.httpStatus).toBe(500);
  });

  // 11. AiError passthrough
  it('returns the same AiError if already an AiError (passthrough)', () => {
    const original = new AiError('RATE_LIMITED');
    const result = classifyAiError(original);

    expect(result).toBe(original);
  });

  // 12. statusCode alias path
  it('returns INVALID_KEY for { statusCode: 401 }', () => {
    const result = classifyAiError({ statusCode: 401 });

    expect(result.code).toBe('INVALID_KEY');
  });

  // 13. nested data.status path
  it('returns PROVIDER_DOWN for { data: { status: 503 } }', () => {
    const result = classifyAiError({ data: { status: 503 } });

    expect(result.code).toBe('PROVIDER_DOWN');
  });

  // 14. HTTP 501 is not classified as PROVIDER_DOWN
  it('returns GENERATION_FAILED for { status: 501 } (Not Implemented)', () => {
    const result = classifyAiError({ status: 501 });

    expect(result.code).toBe('GENERATION_FAILED');
  });
});

/* ------------------------------------------------------------------ */
/*  12-13. aiErrorToResponse                                          */
/* ------------------------------------------------------------------ */
describe('aiErrorToResponse', () => {
  // 12. Correct HTTP status code
  it('returns a Response with the correct HTTP status code', () => {
    const err = new AiError('PROVIDER_DOWN');
    const response = aiErrorToResponse(err);

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(502);
  });

  // 13. Correct JSON body with error envelope
  it('returns JSON body with data: null and error envelope', async () => {
    const err = new AiError('INVALID_KEY');
    const response = aiErrorToResponse(err);
    const body = await response.json();

    expect(body).toEqual({
      data: null,
      error: {
        code: 'INVALID_KEY',
        message: 'Your API key appears to be invalid. Check your key in Settings.',
      },
    });
  });
});
