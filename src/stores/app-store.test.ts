import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/stores/app-store';

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      hasApiKey: false,
      migrationStatus: 'idle',
      migrationProgress: { synced: 0, total: 0 },
    });
  });

  it('exports a Zustand store', () => {
    expect(useAppStore).toBeDefined();
    expect(typeof useAppStore.getState).toBe('function');
    expect(typeof useAppStore.setState).toBe('function');
    expect(typeof useAppStore.subscribe).toBe('function');
  });

  it('returns initial state', () => {
    const state = useAppStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(true);
    expect(state.hasApiKey).toBe(false);
  });

  it('setUser updates user and sets isAuthenticated to true', () => {
    useAppStore.getState().setUser({
      id: 'user-123',
      email: 'test@example.com',
      displayName: 'Test',
    });
    const state = useAppStore.getState();
    expect(state.user).toEqual({
      id: 'user-123',
      email: 'test@example.com',
      displayName: 'Test',
    });
    expect(state.isAuthenticated).toBe(true);
  });

  it('clearUser resets user and isAuthenticated', () => {
    useAppStore.getState().setUser({
      id: 'user-123',
      email: 'test@example.com',
      displayName: null,
    });
    useAppStore.getState().clearUser();
    const state = useAppStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('setLoading updates loading state', () => {
    useAppStore.getState().setLoading(false);
    expect(useAppStore.getState().isLoading).toBe(false);
    useAppStore.getState().setLoading(true);
    expect(useAppStore.getState().isLoading).toBe(true);
  });

  it('setHasApiKey updates API key state', () => {
    useAppStore.getState().setHasApiKey(true);
    expect(useAppStore.getState().hasApiKey).toBe(true);
    useAppStore.getState().setHasApiKey(false);
    expect(useAppStore.getState().hasApiKey).toBe(false);
  });

  it('has initial migration state', () => {
    const state = useAppStore.getState();
    expect(state.migrationStatus).toBe('idle');
    expect(state.migrationProgress).toEqual({ synced: 0, total: 0 });
  });

  it('setMigrationStatus updates migration status', () => {
    useAppStore.getState().setMigrationStatus('migrating');
    expect(useAppStore.getState().migrationStatus).toBe('migrating');
    useAppStore.getState().setMigrationStatus('complete');
    expect(useAppStore.getState().migrationStatus).toBe('complete');
    useAppStore.getState().setMigrationStatus('partial-failure');
    expect(useAppStore.getState().migrationStatus).toBe('partial-failure');
  });

  it('setMigrationProgress updates progress', () => {
    useAppStore.getState().setMigrationProgress({ synced: 3, total: 5 });
    expect(useAppStore.getState().migrationProgress).toEqual({ synced: 3, total: 5 });
  });
});
