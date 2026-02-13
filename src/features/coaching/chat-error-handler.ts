import { useAppStore } from '@/stores/app-store';
import type { ChatErrorInfo } from './coaching-types';

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
 * Also updates global API key status when an invalid key is detected.
 */
export function parseChatError(error: Error): ChatErrorInfo {
  const message = error.message || '';

  // Try to extract error code from structured API response
  for (const code of Object.keys(ERROR_MESSAGES)) {
    if (message.includes(code)) {
      if (code === 'INVALID_KEY') {
        useAppStore.getState().setApiKeyStatus('invalid');
      }
      return ERROR_MESSAGES[code];
    }
  }

  // Match by HTTP status patterns
  if (/401|403|invalid.*key|api.*key/i.test(message)) {
    useAppStore.getState().setApiKeyStatus('invalid');
    return ERROR_MESSAGES.INVALID_KEY;
  }
  if (/429|rate.?limit|too many/i.test(message)) {
    return ERROR_MESSAGES.RATE_LIMITED;
  }
  if (/5\d{2}|timeout|unavailable|network/i.test(message)) {
    return ERROR_MESSAGES.PROVIDER_DOWN;
  }

  return {
    code: 'UNKNOWN',
    message: 'Something unexpected happened. Try again.',
  };
}
