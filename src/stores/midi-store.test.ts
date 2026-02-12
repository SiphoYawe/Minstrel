import { useMidiStore } from '@/stores/midi-store';

describe('useMidiStore', () => {
  it('exports a Zustand store', () => {
    expect(useMidiStore).toBeDefined();
    expect(typeof useMidiStore.getState).toBe('function');
    expect(typeof useMidiStore.setState).toBe('function');
    expect(typeof useMidiStore.subscribe).toBe('function');
  });

  it('returns initial state as an object', () => {
    const state = useMidiStore.getState();
    expect(state).toEqual({});
  });
});
