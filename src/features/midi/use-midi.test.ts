import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

  describe('troubleshooting', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('shows troubleshooting after 3 seconds if not connected', () => {
      renderHook(() => useMidi());
      expect(useMidiStore.getState().showTroubleshooting).toBe(false);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(useMidiStore.getState().showTroubleshooting).toBe(true);
    });

    it('does not show troubleshooting if connected within timeout', () => {
      renderHook(() => useMidi());

      act(() => {
        useMidiStore.getState().setConnectionStatus('connected');
        vi.advanceTimersByTime(3000);
      });

      expect(useMidiStore.getState().showTroubleshooting).toBe(false);
    });

    it('detects unexpected drum channel on first note-on', () => {
      renderHook(() => useMidi());

      const callbacks = vi.mocked(midiEngine.requestMidiAccess).mock.calls[0][0];

      act(() => {
        callbacks.onMidiEvent!({
          type: 'note-on',
          note: 60,
          noteName: 'C4',
          velocity: 100,
          channel: 9,
          timestamp: 1000,
        });
      });

      expect(useMidiStore.getState().detectedChannel).toBe(9);
      expect(useMidiStore.getState().showTroubleshooting).toBe(true);
    });

    it('does not flag normal channels', () => {
      renderHook(() => useMidi());

      const callbacks = vi.mocked(midiEngine.requestMidiAccess).mock.calls[0][0];

      act(() => {
        callbacks.onMidiEvent!({
          type: 'note-on',
          note: 60,
          noteName: 'C4',
          velocity: 100,
          channel: 0,
          timestamp: 1000,
        });
      });

      expect(useMidiStore.getState().detectedChannel).toBeNull();
      expect(useMidiStore.getState().showTroubleshooting).toBe(false);
    });

    it('only checks channel on first note-on event', () => {
      renderHook(() => useMidi());

      const callbacks = vi.mocked(midiEngine.requestMidiAccess).mock.calls[0][0];

      // First note: normal channel
      act(() => {
        callbacks.onMidiEvent!({
          type: 'note-on',
          note: 60,
          noteName: 'C4',
          velocity: 100,
          channel: 0,
          timestamp: 1000,
        });
      });

      // Second note: drum channel — should be ignored since first was checked
      act(() => {
        callbacks.onMidiEvent!({
          type: 'note-on',
          note: 36,
          noteName: 'C2',
          velocity: 80,
          channel: 9,
          timestamp: 1001,
        });
      });

      expect(useMidiStore.getState().detectedChannel).toBeNull();
    });
  });

  describe('retryConnection', () => {
    it('calls disconnectMidi before retrying', async () => {
      const { result } = renderHook(() => useMidi());

      vi.mocked(midiEngine.disconnectMidi).mockClear();
      vi.mocked(midiEngine.requestMidiAccess).mockClear();

      await act(async () => {
        await result.current.retryConnection();
      });

      // disconnectMidi should be called before requestMidiAccess
      const disconnectOrder = vi.mocked(midiEngine.disconnectMidi).mock.invocationCallOrder[0];
      const requestOrder = vi.mocked(midiEngine.requestMidiAccess).mock.invocationCallOrder[0];
      expect(disconnectOrder).toBeLessThan(requestOrder);
    });

    it('calls requestMidiAccess again with connecting status', async () => {
      const { result } = renderHook(() => useMidi());

      vi.mocked(midiEngine.requestMidiAccess).mockClear();

      await act(async () => {
        await result.current.retryConnection();
      });

      expect(midiEngine.requestMidiAccess).toHaveBeenCalledTimes(1);
      expect(useMidiStore.getState().connectionStatus).toBe('connecting');
    });

    it('resets detectedChannel on retry', async () => {
      const { result } = renderHook(() => useMidi());

      act(() => {
        useMidiStore.getState().setDetectedChannel(9);
      });
      expect(useMidiStore.getState().detectedChannel).toBe(9);

      vi.mocked(midiEngine.requestMidiAccess).mockClear();

      await act(async () => {
        await result.current.retryConnection();
      });

      expect(useMidiStore.getState().detectedChannel).toBeNull();
    });

    it('dismisses troubleshooting on successful retry', async () => {
      vi.mocked(midiEngine.requestMidiAccess).mockImplementation(async (callbacks) => {
        callbacks.onConnectionStatusChanged('connected');
      });

      const { result } = renderHook(() => useMidi());

      // Show troubleshooting first
      act(() => {
        useMidiStore.getState().setShowTroubleshooting(true);
      });

      vi.mocked(midiEngine.requestMidiAccess).mockClear();
      vi.mocked(midiEngine.requestMidiAccess).mockImplementation(async (callbacks) => {
        callbacks.onConnectionStatusChanged('connected');
      });

      await act(async () => {
        await result.current.retryConnection();
      });

      expect(useMidiStore.getState().showTroubleshooting).toBe(false);
    });

    it('passes channel detection callbacks to retry', async () => {
      vi.mocked(midiEngine.requestMidiAccess).mockResolvedValue(undefined);
      const { result } = renderHook(() => useMidi());

      vi.mocked(midiEngine.requestMidiAccess).mockClear();
      vi.mocked(midiEngine.requestMidiAccess).mockResolvedValue(undefined);

      await act(async () => {
        await result.current.retryConnection();
      });

      // Verify the retry callbacks include onMidiEvent with channel detection
      const callbacks = vi.mocked(midiEngine.requestMidiAccess).mock.calls[0][0];
      expect(callbacks.onMidiEvent).toBeDefined();

      // Simulate a drum channel note to verify channel detection works post-retry
      act(() => {
        callbacks.onMidiEvent!({
          type: 'note-on',
          note: 36,
          noteName: 'C2',
          velocity: 80,
          channel: 9,
          timestamp: 1000,
        });
      });

      expect(useMidiStore.getState().detectedChannel).toBe(9);
    });
  });

  describe('dismissTroubleshooting', () => {
    it('hides the troubleshooting panel', () => {
      const { result } = renderHook(() => useMidi());

      act(() => {
        useMidiStore.getState().setShowTroubleshooting(true);
      });
      expect(useMidiStore.getState().showTroubleshooting).toBe(true);

      act(() => {
        result.current.dismissTroubleshooting();
      });
      expect(useMidiStore.getState().showTroubleshooting).toBe(false);
    });
  });

  it('returns troubleshooting-related values', () => {
    const { result } = renderHook(() => useMidi());

    expect(result.current.showTroubleshooting).toBe(false);
    expect(result.current.detectedChannel).toBeNull();
    expect(typeof result.current.retryConnection).toBe('function');
    expect(typeof result.current.dismissTroubleshooting).toBe('function');
  });
});
