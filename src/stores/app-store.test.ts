import { useAppStore } from '@/stores/app-store';

describe('useAppStore', () => {
  it('exports a Zustand store', () => {
    expect(useAppStore).toBeDefined();
    expect(typeof useAppStore.getState).toBe('function');
    expect(typeof useAppStore.setState).toBe('function');
    expect(typeof useAppStore.subscribe).toBe('function');
  });

  it('returns initial state as an object', () => {
    const state = useAppStore.getState();
    expect(state).toEqual({});
  });
});
