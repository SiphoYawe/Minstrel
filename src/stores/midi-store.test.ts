import { describe, it, expect, beforeEach } from 'vitest';
import { useMidiStore } from './midi-store';

describe('midiStore', () => {
  beforeEach(() => {
    useMidiStore.getState().reset();
  });

  it('has correct initial state', () => {
    const state = useMidiStore.getState();
    expect(state.connectionStatus).toBe('disconnected');
    expect(state.activeDevice).toBeNull();
    expect(state.availableDevices).toEqual([]);
    expect(state.errorMessage).toBeNull();
  });

  it('setConnectionStatus updates connection status', () => {
    useMidiStore.getState().setConnectionStatus('connected');
    expect(useMidiStore.getState().connectionStatus).toBe('connected');
  });

  it('setActiveDevice updates active device', () => {
    const device = {
      id: 'test-1',
      name: 'Test Piano',
      manufacturer: 'Yamaha',
      state: 'connected' as const,
      type: 'input' as const,
    };
    useMidiStore.getState().setActiveDevice(device);
    expect(useMidiStore.getState().activeDevice).toEqual(device);
  });

  it('setAvailableDevices updates available devices', () => {
    const devices = [
      {
        id: 'i1',
        name: 'Input',
        manufacturer: 'A',
        state: 'connected' as const,
        type: 'input' as const,
      },
      {
        id: 'o1',
        name: 'Output',
        manufacturer: 'B',
        state: 'connected' as const,
        type: 'output' as const,
      },
    ];
    useMidiStore.getState().setAvailableDevices(devices);
    expect(useMidiStore.getState().availableDevices).toHaveLength(2);
  });

  it('setErrorMessage updates error message', () => {
    useMidiStore.getState().setErrorMessage('Something went wrong');
    expect(useMidiStore.getState().errorMessage).toBe('Something went wrong');
  });

  it('reset clears all state to initial values', () => {
    useMidiStore.getState().setConnectionStatus('connected');
    useMidiStore.getState().setActiveDevice({
      id: 'x',
      name: 'X',
      manufacturer: 'Y',
      state: 'connected',
      type: 'input',
    });
    useMidiStore.getState().setErrorMessage('err');

    useMidiStore.getState().reset();

    const state = useMidiStore.getState();
    expect(state.connectionStatus).toBe('disconnected');
    expect(state.activeDevice).toBeNull();
    expect(state.availableDevices).toEqual([]);
    expect(state.errorMessage).toBeNull();
  });
});
