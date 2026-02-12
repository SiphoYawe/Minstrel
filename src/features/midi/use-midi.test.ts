import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMidi } from './use-midi';
import { useMidiStore } from '@/stores/midi-store';
import * as midiEngine from './midi-engine';
import * as midiUtils from './midi-utils';

vi.mock('./midi-engine', () => ({
  requestMidiAccess: vi.fn(),
  disconnectMidi: vi.fn(),
}));

vi.mock('./midi-utils', () => ({
  isMidiSupported: vi.fn(() => true),
}));

describe('useMidi', () => {
  beforeEach(() => {
    useMidiStore.getState().reset();
    vi.mocked(midiUtils.isMidiSupported).mockReset().mockReturnValue(true);
    vi.mocked(midiEngine.requestMidiAccess).mockReset().mockResolvedValue(undefined);
    vi.mocked(midiEngine.disconnectMidi).mockReset();
  });

  it('calls requestMidiAccess on mount when supported', () => {
    renderHook(() => useMidi());
    expect(midiEngine.requestMidiAccess).toHaveBeenCalledTimes(1);
  });

  it('passes callbacks that write to the store', () => {
    renderHook(() => useMidi());

    const callbacks = vi.mocked(midiEngine.requestMidiAccess).mock.calls[0][0];

    act(() => {
      callbacks.onConnectionStatusChanged('connected');
    });
    expect(useMidiStore.getState().connectionStatus).toBe('connected');

    act(() => {
      callbacks.onActiveDeviceChanged({
        id: 'i1',
        name: 'Yamaha P-125',
        manufacturer: 'Yamaha',
        state: 'connected',
        type: 'input',
      });
    });
    expect(useMidiStore.getState().activeDevice?.name).toBe('Yamaha P-125');

    act(() => {
      callbacks.onDevicesChanged([
        {
          id: 'i1',
          name: 'Yamaha P-125',
          manufacturer: 'Yamaha',
          state: 'connected',
          type: 'input',
        },
      ]);
    });
    expect(useMidiStore.getState().availableDevices).toHaveLength(1);

    act(() => {
      callbacks.onError('Something went wrong');
    });
    expect(useMidiStore.getState().errorMessage).toBe('Something went wrong');
  });

  it('calls disconnectMidi and resets store on unmount', () => {
    const { unmount } = renderHook(() => useMidi());

    // Set some state before unmount
    useMidiStore.getState().setConnectionStatus('connected');
    useMidiStore.getState().setActiveDevice({
      id: 'i1',
      name: 'Test',
      manufacturer: 'X',
      state: 'connected',
      type: 'input',
    });

    unmount();

    expect(midiEngine.disconnectMidi).toHaveBeenCalled();
    expect(useMidiStore.getState().connectionStatus).toBe('disconnected');
    expect(useMidiStore.getState().activeDevice).toBeNull();
  });

  it('sets unsupported status when MIDI is not supported', () => {
    vi.mocked(midiUtils.isMidiSupported).mockReturnValue(false);

    renderHook(() => useMidi());

    expect(midiEngine.requestMidiAccess).not.toHaveBeenCalled();
    expect(useMidiStore.getState().connectionStatus).toBe('unsupported');
    expect(useMidiStore.getState().errorMessage).toContain('Chrome or Edge');
  });

  it('returns current store values', () => {
    const { result } = renderHook(() => useMidi());

    // Update store after mount (simulating what requestMidiAccess callbacks do)
    act(() => {
      useMidiStore.getState().setConnectionStatus('connected');
      useMidiStore.getState().setActiveDevice({
        id: 'i1',
        name: 'Keys',
        manufacturer: 'Y',
        state: 'connected',
        type: 'input',
      });
    });

    expect(result.current.connectionStatus).toBe('connected');
    expect(result.current.activeDevice?.name).toBe('Keys');
    expect(result.current.isSupported).toBe(true);
  });

  it('works correctly across Strict Mode double-mount', () => {
    // React Strict Mode mounts → unmounts → re-mounts in dev
    // The hook should work correctly on re-mount
    const { unmount } = renderHook(() => useMidi());
    unmount();

    // After unmount, store should be reset
    expect(useMidiStore.getState().connectionStatus).toBe('disconnected');

    // Re-mount should call requestMidiAccess again
    vi.mocked(midiEngine.requestMidiAccess).mockClear();
    renderHook(() => useMidi());
    expect(midiEngine.requestMidiAccess).toHaveBeenCalledTimes(1);
  });
});
