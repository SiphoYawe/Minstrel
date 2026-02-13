import type { ApiResult } from '@/types/api';
import type { ApiKeyMetadata, ApiKeyProvider } from './auth-types';

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
      return {
        data: null,
        error: {
          code: json.error?.code ?? 'SUBMIT_FAILED',
          message: json.error?.message ?? 'Failed to save API key.',
        },
      };
    }
    return { data: json.data, error: null };
  } catch {
    return {
      data: null,
      error: { code: 'NETWORK_ERROR', message: 'Network error — please check your connection.' },
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
