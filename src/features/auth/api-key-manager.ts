import type { ApiResult } from '@/types/api';
import type { ApiKeyMetadata, ApiKeyProvider } from './auth-types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ValidationStage = 'format' | 'provider' | 'complete';
export type StageStatus = 'pending' | 'active' | 'error';
export type StageCallback = (stage: ValidationStage, status: StageStatus, message?: string) => void;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROVIDER_KEY_PREFIXES: Record<ApiKeyProvider, string> = {
  openai: 'sk-',
  anthropic: 'sk-ant-',
  other: '',
};

const PROVIDER_DISPLAY_NAMES: Record<ApiKeyProvider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  other: 'Other Provider',
};

// ---------------------------------------------------------------------------
// Format Validation
// ---------------------------------------------------------------------------

interface FormatValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates API key format for the specified provider.
 * This is a client-side check that happens before making a network request.
 */
export function validateApiKeyFormat(
  provider: ApiKeyProvider,
  apiKey: string
): FormatValidationResult {
  // Minimum length check for all providers
  if (apiKey.length < 10) {
    return {
      valid: false,
      error: 'API key seems too short — check you copied the full key.',
    };
  }

  const prefix = PROVIDER_KEY_PREFIXES[provider];
  const providerName = PROVIDER_DISPLAY_NAMES[provider];

  // Provider-specific prefix validation
  if (prefix && !apiKey.startsWith(prefix)) {
    return {
      valid: false,
      error: `API keys from ${providerName} start with '${prefix}'. Check you copied the full key.`,
    };
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// Error Classification
// ---------------------------------------------------------------------------

/**
 * Maps error codes from the API to user-friendly messages.
 * Provides specific guidance based on the type of error.
 */
export function classifyProviderError(errorCode: string, provider: ApiKeyProvider): string {
  const providerName = PROVIDER_DISPLAY_NAMES[provider];

  switch (errorCode) {
    case 'INVALID_KEY':
      return `Key not recognized by ${providerName}. Double-check you copied the correct key.`;

    case 'KEY_EXPIRED':
      return `This key has expired. Generate a new key from your ${providerName} dashboard.`;

    case 'INSUFFICIENT_PERMISSIONS':
      return `This key lacks required permissions. Ensure your key has model access enabled.`;

    case 'RATE_LIMITED':
      return `Too many requests to ${providerName}. Wait a moment and try again.`;

    case 'PROVIDER_DOWN':
      return `Cannot reach ${providerName} right now. Try again in a moment.`;

    case 'NETWORK_ERROR':
      return 'Network error — please check your connection.';

    case 'VALIDATION_ERROR':
      return 'The key format is invalid. Check you copied the full key.';

    default:
      return `Could not validate key with ${providerName}. Please try again.`;
  }
}

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

export async function submitApiKey(
  provider: ApiKeyProvider,
  apiKey: string
): Promise<ApiResult<ApiKeyMetadata>> {
  try {
    const res = await fetch('/api/user/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey }),
    });
    const json = await res.json();
    if (!res.ok) {
      const errorCode = json.error?.code ?? 'SUBMIT_FAILED';
      return {
        data: null,
        error: {
          code: errorCode,
          message: classifyProviderError(errorCode, provider),
        },
      };
    }
    return { data: json.data, error: null };
  } catch {
    return {
      data: null,
      error: {
        code: 'NETWORK_ERROR',
        message: classifyProviderError('NETWORK_ERROR', provider),
      },
    };
  }
}

export async function getApiKeyMetadata(): Promise<ApiResult<ApiKeyMetadata | null>> {
  try {
    const res = await fetch('/api/user/keys');
    const json = await res.json();
    if (!res.ok) {
      return {
        data: null,
        error: {
          code: json.error?.code ?? 'FETCH_FAILED',
          message: json.error?.message ?? 'Failed to load API key info.',
        },
      };
    }
    return { data: json.data ?? null, error: null };
  } catch {
    return {
      data: null,
      error: { code: 'NETWORK_ERROR', message: 'Network error — please check your connection.' },
    };
  }
}

export async function deleteApiKey(provider: ApiKeyProvider): Promise<ApiResult<void>> {
  try {
    const res = await fetch('/api/user/keys', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider }),
    });
    if (!res.ok) {
      const json = await res.json();
      return {
        data: null,
        error: {
          code: json.error?.code ?? 'DELETE_FAILED',
          message: json.error?.message ?? 'Failed to remove API key.',
        },
      };
    }
    return { data: undefined as unknown as void, error: null };
  } catch {
    return {
      data: null,
      error: { code: 'NETWORK_ERROR', message: 'Network error — please check your connection.' },
    };
  }
}
