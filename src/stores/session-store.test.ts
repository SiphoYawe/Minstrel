import { useSessionStore } from '@/stores/session-store';

describe('useSessionStore', () => {
  it('exports a Zustand store', () => {
    expect(useSessionStore).toBeDefined();
    expect(typeof useSessionStore.getState).toBe('function');
    expect(typeof useSessionStore.setState).toBe('function');
    expect(typeof useSessionStore.subscribe).toBe('function');
  });

  it('returns initial state as an object', () => {
    const state = useSessionStore.getState();
    expect(state).toEqual({});
  });
});
