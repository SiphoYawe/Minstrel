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
 * Inspects HTTP status codes and error message patterns from OpenAI and Anthropic.
 */
export function classifyAiError(error: unknown): AiError {
  if (error instanceof AiError) return error;

  const status = extractHttpStatus(error);
  const message = extractMessage(error);

  if (
    status === 401 ||
    status === 403 ||
    /invalid.*key|api.*key.*invalid|authentication/i.test(message)
  ) {
    return new AiError('INVALID_KEY', error);
  }

  if (status === 429 || /rate.?limit|too many requests/i.test(message)) {
    return new AiError('RATE_LIMITED', error);
  }

  if (
    (status !== null && status >= 500 && status !== 501) ||
    /timeout|econnrefused|unavailable|network/i.test(message)
  ) {
    return new AiError('PROVIDER_DOWN', error);
  }

  return new AiError('GENERATION_FAILED', error);
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
