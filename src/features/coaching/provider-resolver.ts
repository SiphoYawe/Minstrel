import { useAppStore } from '@/stores/app-store';

/**
 * Returns the active AI provider ID from the app store.
 * Falls back to 'openai' when no provider is explicitly set.
 */
export function getActiveProviderId(): string {
  return useAppStore.getState().apiKeyProvider ?? 'openai';
}
