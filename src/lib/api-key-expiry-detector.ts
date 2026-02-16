import { useAppStore } from '@/stores/app-store';

/**
 * Detects API key expiry/auth errors from AI provider responses.
 * When an auth error is detected, automatically updates app store to mark the key as invalid.
 *
 * Detection criteria:
 * - HTTP status codes: 401, 403
 * - Error message patterns: "unauthorized", "expired", "invalid api key", "authentication"
 *
 * @param error - The error object to analyze
 * @returns true if the error indicates key expiry/auth failure, false otherwise
 */
export function detectKeyExpiry(error: unknown): boolean {
  if (!error) return false;

  const errorMessage =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  // Check for auth-related HTTP status codes
  const hasAuthStatusCode = /\b(401|403)\b/.test(errorMessage);

  // Check for auth-related error patterns
  const hasAuthKeywords =
    /unauthorized/.test(errorMessage) ||
    /\bexpired\b/.test(errorMessage) ||
    /invalid.*api.*key/.test(errorMessage) ||
    /api.*key.*invalid/.test(errorMessage) ||
    /authentication.*fail/.test(errorMessage);

  const isAuthError = hasAuthStatusCode || hasAuthKeywords;

  if (isAuthError) {
    // Update app store to mark key as invalid
    useAppStore.getState().setApiKeyStatus('invalid');
  }

  return isAuthError;
}
