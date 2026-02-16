import type { ApiErrorResponse } from '@/types/api';

export type AiErrorCode = 'INVALID_KEY' | 'RATE_LIMITED' | 'PROVIDER_DOWN' | 'GENERATION_FAILED';

const ERROR_HTTP_STATUS: Record<AiErrorCode, number> = {
  INVALID_KEY: 400,
  RATE_LIMITED: 429,
  PROVIDER_DOWN: 502,
  GENERATION_FAILED: 500,
};

const ERROR_MESSAGES: Record<AiErrorCode, string> = {
  INVALID_KEY: 'Your API key appears to be invalid. Check your key in Settings.',
  RATE_LIMITED: 'Too many requests right now. Give it a moment and try again.',
  PROVIDER_DOWN:
    'The AI service is temporarily unavailable. Your MIDI features still work perfectly.',
  GENERATION_FAILED: 'Could not generate a response right now. Try again in a moment.',
};

export class AiError extends Error {
  readonly code: AiErrorCode;
  readonly httpStatus: number;

  constructor(code: AiErrorCode, cause?: unknown) {
    super(ERROR_MESSAGES[code]);
    this.name = 'AiError';
    this.code = code;
    this.httpStatus = ERROR_HTTP_STATUS[code];
    if (cause) this.cause = cause;
  }
}

/**
 * Classify an unknown error thrown during AI processing into an AiError.
 *
 * Classification strategy (AI-H5):
 * 1. Check structured fields first: `error.code`, `error.type` — these are
 *    stable, documented fields from provider SDKs (OpenAI, Anthropic).
 * 2. Fall back to HTTP status codes.
 * 3. Fall back to message-pattern matching only when structured fields are absent.
 */
export function classifyAiError(error: unknown): AiError {
  if (error instanceof AiError) return error;

  // --- 1. Structured field classification (preferred) ---
  const structuredResult = classifyByStructuredFields(error);
  if (structuredResult) return new AiError(structuredResult, error);

  // --- 2. HTTP status code classification ---
  const status = extractHttpStatus(error);
  if (status === 401 || status === 403) {
    return new AiError('INVALID_KEY', error);
  }
  if (status === 429) {
    return new AiError('RATE_LIMITED', error);
  }
  if (status !== null && status >= 500 && status !== 501) {
    return new AiError('PROVIDER_DOWN', error);
  }

  // --- 3. Message-pattern fallback (only if no structured fields matched) ---
  const message = extractMessage(error);
  if (/invalid.*key|api.*key.*invalid|authentication/i.test(message)) {
    return new AiError('INVALID_KEY', error);
  }
  if (/rate.?limit|too many requests/i.test(message)) {
    return new AiError('RATE_LIMITED', error);
  }
  if (/timeout|econnrefused|unavailable|network/i.test(message)) {
    return new AiError('PROVIDER_DOWN', error);
  }

  return new AiError('GENERATION_FAILED', error);
}

/**
 * Attempt classification using structured error fields from provider SDKs.
 *
 * OpenAI errors expose `error.code` (e.g. 'invalid_api_key', 'rate_limit_exceeded')
 * and `error.type` (e.g. 'authentication_error', 'rate_limit_error').
 * Anthropic errors expose similar `error.type` values.
 *
 * Returns an AiErrorCode if a match is found, null otherwise.
 */
function classifyByStructuredFields(error: unknown): AiErrorCode | null {
  if (typeof error !== 'object' || error === null) return null;

  const e = error as Record<string, unknown>;
  const code = typeof e.code === 'string' ? e.code.toLowerCase() : '';
  const type = typeof e.type === 'string' ? e.type.toLowerCase() : '';

  // No structured fields available — return null to fall through
  if (!code && !type) return null;

  // Authentication / invalid key
  if (
    code === 'invalid_api_key' ||
    code === 'invalid_key' ||
    type === 'authentication_error' ||
    (type === 'invalid_request_error' && code.includes('key'))
  ) {
    return 'INVALID_KEY';
  }

  // Rate limiting
  if (
    code === 'rate_limit_exceeded' ||
    type === 'rate_limit_error' ||
    type === 'tokens' ||
    code === 'rate_limited'
  ) {
    return 'RATE_LIMITED';
  }

  // Provider down / server errors
  if (
    type === 'server_error' ||
    type === 'api_error' ||
    code === 'service_unavailable' ||
    code === 'internal_error' ||
    code === 'overloaded'
  ) {
    return 'PROVIDER_DOWN';
  }

  return null;
}

/**
 * Convert an AiError into a JSON Response with the correct HTTP status.
 */
export function aiErrorToResponse(error: AiError): Response {
  const body: ApiErrorResponse = {
    data: null,
    error: { code: error.code, message: error.message },
  };

  return Response.json(body, { status: error.httpStatus });
}

/** Generic message used in production to avoid leaking implementation details. */
const GENERIC_ERROR_MESSAGE = 'An unexpected error occurred. Please try again.';

/**
 * Sanitize an error for client-facing responses (SEC-M3).
 * In production, returns a generic message. In development, returns the
 * original error details for easier debugging.
 */
export function sanitizeError(error: unknown): string {
  if (process.env.NODE_ENV !== 'production') {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return String(error);
  }
  return GENERIC_ERROR_MESSAGE;
}

function extractHttpStatus(error: unknown): number | null {
  if (typeof error === 'object' && error !== null) {
    const e = error as Record<string, unknown>;
    if (typeof e.status === 'number') return e.status;
    if (typeof e.statusCode === 'number') return e.statusCode;
    // Vercel AI SDK wraps provider errors with a statusCode
    if (typeof e.data === 'object' && e.data !== null) {
      const d = e.data as Record<string, unknown>;
      if (typeof d.status === 'number') return d.status;
    }
  }
  return null;
}

function extractMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return '';
}
