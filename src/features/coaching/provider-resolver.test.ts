import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/stores/app-store';
import { getActiveProviderId } from './provider-resolver';

describe('getActiveProviderId', () => {
  beforeEach(() => {
    useAppStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      hasApiKey: false,
      apiKeyStatus: 'none',
      apiKeyProvider: null,
      migrationStatus: 'idle',
      migrationProgress: { synced: 0, total: 0 },
    });
  });

  it('returns "openai" when apiKeyProvider is null', () => {
    expect(getActiveProviderId()).toBe('openai');
  });

  it('returns "anthropic" when apiKeyProvider is "anthropic"', () => {
    useAppStore.getState().setApiKeyProvider('anthropic');
    expect(getActiveProviderId()).toBe('anthropic');
  });

  it('returns "openai" when apiKeyProvider is "openai"', () => {
    useAppStore.getState().setApiKeyProvider('openai');
    expect(getActiveProviderId()).toBe('openai');
  });

  it('returns "other" when apiKeyProvider is "other"', () => {
    useAppStore.getState().setApiKeyProvider('other');
    expect(getActiveProviderId()).toBe('other');
  });

  it('resets to "openai" fallback after clearUser', () => {
    useAppStore.getState().setApiKeyProvider('anthropic');
    expect(getActiveProviderId()).toBe('anthropic');

    useAppStore.getState().clearUser();
    expect(getActiveProviderId()).toBe('openai');
  });
});
