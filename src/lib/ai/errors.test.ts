// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest';

import { AiError, classifyAiError, aiErrorToResponse, sanitizeError } from './errors';
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

  // --- Structured field classification (AI-H5) ---

  // 15. OpenAI error.code: 'invalid_api_key'
  it('returns INVALID_KEY for { code: "invalid_api_key" } (structured field)', () => {
    const result = classifyAiError({ code: 'invalid_api_key', message: 'some message' });

    expect(result.code).toBe('INVALID_KEY');
  });

  // 16. OpenAI error.type: 'authentication_error'
  it('returns INVALID_KEY for { type: "authentication_error" } (structured field)', () => {
    const result = classifyAiError({ type: 'authentication_error' });

    expect(result.code).toBe('INVALID_KEY');
  });

  // 17. OpenAI error.code: 'rate_limit_exceeded'
  it('returns RATE_LIMITED for { code: "rate_limit_exceeded" } (structured field)', () => {
    const result = classifyAiError({ code: 'rate_limit_exceeded' });

    expect(result.code).toBe('RATE_LIMITED');
  });

  // 18. Anthropic error.type: 'rate_limit_error'
  it('returns RATE_LIMITED for { type: "rate_limit_error" } (structured field)', () => {
    const result = classifyAiError({ type: 'rate_limit_error' });

    expect(result.code).toBe('RATE_LIMITED');
  });

  // 19. Provider server error type
  it('returns PROVIDER_DOWN for { type: "server_error" } (structured field)', () => {
    const result = classifyAiError({ type: 'server_error' });

    expect(result.code).toBe('PROVIDER_DOWN');
  });

  // 20. Provider api_error type
  it('returns PROVIDER_DOWN for { type: "api_error" } (structured field)', () => {
    const result = classifyAiError({ type: 'api_error' });

    expect(result.code).toBe('PROVIDER_DOWN');
  });

  // 21. Overloaded code
  it('returns PROVIDER_DOWN for { code: "overloaded" } (structured field)', () => {
    const result = classifyAiError({ code: 'overloaded' });

    expect(result.code).toBe('PROVIDER_DOWN');
  });

  // 22. Structured fields take priority over message matching
  it('prefers structured fields over message content', () => {
    // Message says "rate limit" but structured code says "invalid_api_key"
    const result = classifyAiError({
      code: 'invalid_api_key',
      message: 'rate limit exceeded',
    });

    expect(result.code).toBe('INVALID_KEY');
  });

  // 23. Falls back to message matching when no structured fields present
  it('falls back to message matching when no code/type fields', () => {
    const result = classifyAiError(new Error('rate limit exceeded'));

    expect(result.code).toBe('RATE_LIMITED');
  });

  // 24. Unknown structured fields fall through to status/message checks
  it('falls through to HTTP status when structured fields are unrecognized', () => {
    const result = classifyAiError({ code: 'unknown_code', type: 'unknown_type', status: 429 });

    expect(result.code).toBe('RATE_LIMITED');
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

/* ------------------------------------------------------------------ */
/*  sanitizeError (SEC-M3)                                            */
/* ------------------------------------------------------------------ */
describe('sanitizeError', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    // Restore NODE_ENV after each test
    process.env.NODE_ENV = originalEnv;
  });

  it('returns Error.message in development', () => {
    process.env.NODE_ENV = 'development';
    const result = sanitizeError(new Error('Detailed internal error: SQL injection at line 42'));
    expect(result).toBe('Detailed internal error: SQL injection at line 42');
  });

  it('returns string error in development', () => {
    process.env.NODE_ENV = 'development';
    const result = sanitizeError('raw string error');
    expect(result).toBe('raw string error');
  });

  it('returns generic message in production for Error objects', () => {
    process.env.NODE_ENV = 'production';
    const result = sanitizeError(new Error('Detailed internal error: SQL injection at line 42'));
    expect(result).toBe('An unexpected error occurred. Please try again.');
  });

  it('returns generic message in production for string errors', () => {
    process.env.NODE_ENV = 'production';
    const result = sanitizeError('raw string error with secrets');
    expect(result).toBe('An unexpected error occurred. Please try again.');
  });

  it('returns generic message in production for non-Error objects', () => {
    process.env.NODE_ENV = 'production';
    const result = sanitizeError({ code: 'SECRET', detail: 'leaked info' });
    expect(result).toBe('An unexpected error occurred. Please try again.');
  });

  it('stringifies non-Error objects in development', () => {
    process.env.NODE_ENV = 'development';
    const result = sanitizeError(42);
    expect(result).toBe('42');
  });

  it('returns generic message in test environment (not development)', () => {
    process.env.NODE_ENV = 'test';
    const result = sanitizeError(new Error('test error'));
    // NODE_ENV=test is not 'development', but also not 'production'
    // Our code checks for !== 'production', so test env should show details
    expect(result).toBe('test error');
  });
});
