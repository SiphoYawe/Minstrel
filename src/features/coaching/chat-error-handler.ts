import type { ChatErrorInfo } from './coaching-types';

export interface ParsedChatError {
  error: ChatErrorInfo;
  /** Indicates the error type for caller-side handling */
  type: string;
  /** Optional action hint the caller should perform (e.g. 'invalidate_api_key') */
  action?: string;
}

const ERROR_MESSAGES: Record<string, ChatErrorInfo> = {
  INVALID_KEY: {
    code: 'INVALID_KEY',
    message: 'Your API key appears to be invalid. Check your key in Settings.',
    actionUrl: '/settings#api-keys',
  },
  RATE_LIMITED: {
    code: 'RATE_LIMITED',
    message: 'Too many requests right now. Give it a moment and try again.',
  },
  PROVIDER_DOWN: {
    code: 'PROVIDER_DOWN',
    message:
      'The AI service is temporarily unavailable. Your MIDI features still work perfectly. Try again in a moment.',
  },
  GENERATION_FAILED: {
    code: 'GENERATION_FAILED',
    message: 'Could not generate a response right now. Try again in a moment.',
  },
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    message: 'Request could not be processed. Try sending your message again.',
  },
};

/**
 * Parse an error from the chat API into a user-friendly message.
 * Returns a structured result with an optional action hint.
 * The caller is responsible for performing side effects (e.g. store mutations).
 */
export function parseChatError(error: Error): ParsedChatError {
  const message = error.message || '';

  // Try to extract error code from structured API response
  for (const code of Object.keys(ERROR_MESSAGES)) {
    if (message.includes(code)) {
      return {
        error: ERROR_MESSAGES[code],
        type: code,
        ...(code === 'INVALID_KEY' ? { action: 'invalidate_api_key' } : {}),
      };
    }
  }

  // Match by HTTP status patterns
  if (/401|403|invalid.*key|api.*key/i.test(message)) {
    return {
      error: ERROR_MESSAGES.INVALID_KEY,
      type: 'INVALID_KEY',
      action: 'invalidate_api_key',
    };
  }
  if (/429|rate.?limit|too many/i.test(message)) {
    return { error: ERROR_MESSAGES.RATE_LIMITED, type: 'RATE_LIMITED' };
  }
  if (/5\d{2}|timeout|unavailable|network/i.test(message)) {
    return { error: ERROR_MESSAGES.PROVIDER_DOWN, type: 'PROVIDER_DOWN' };
  }

  return {
    error: {
      code: 'UNKNOWN',
      message: 'Something unexpected happened. Try again.',
    },
    type: 'UNKNOWN',
  };
}
