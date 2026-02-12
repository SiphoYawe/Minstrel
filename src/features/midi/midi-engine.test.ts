import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  requestMidiAccess,
  disconnectMidi,
  getMidiAccess,
  portToDeviceInfo,
  enumerateDevices,
  selectFirstInputDevice,
} from './midi-engine';
import type { MidiEngineCallbacks } from './midi-engine';
import type { MidiDeviceInfo } from './midi-types';

// --- Mock helpers ---

function createMockPort(
  overrides: Partial<MIDIPort> & { id: string; type: 'input' | 'output' }
): MIDIPort {
  return {
    id: overrides.id,
    name: overrides.name ?? 'Test Device',
    manufacturer: overrides.manufacturer ?? 'Test Mfg',
    state: overrides.state ?? 'connected',
    type: overrides.type,
    connection: 'open',
    version: '1.0',
    open: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onstatechange: null,
  } as unknown as MIDIPort;
}

function createMockMIDIAccess(inputs: MIDIPort[] = [], outputs: MIDIPort[] = []): MIDIAccess {
  const inputMap = new Map<string, MIDIInput>();
  inputs.forEach((p) => inputMap.set(p.id, p as unknown as MIDIInput));

  const outputMap = new Map<string, MIDIOutput>();
  outputs.forEach((p) => outputMap.set(p.id, p as unknown as MIDIOutput));

  return {
    inputs: inputMap,
    outputs: outputMap,
    onstatechange: null,
    sysexEnabled: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MIDIAccess;
}

function createCallbacks(): MidiEngineCallbacks & {
  calls: Record<string, unknown[]>;
} {
  const calls: Record<string, unknown[]> = {
    onDevicesChanged: [],
    onConnectionStatusChanged: [],
    onActiveDeviceChanged: [],
    onError: [],
  };
  return {
    calls,
    onDevicesChanged: (devices) => calls.onDevicesChanged.push(devices),
    onConnectionStatusChanged: (status) => calls.onConnectionStatusChanged.push(status),
    onActiveDeviceChanged: (device) => calls.onActiveDeviceChanged.push(device),
    onError: (message) => calls.onError.push(message),
  };
}

describe('midi-engine', () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    disconnectMidi();
  });

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  describe('portToDeviceInfo', () => {
    it('converts a MIDIPort to MidiDeviceInfo', () => {
      const port = createMockPort({
        id: 'p1',
        name: 'Piano',
        manufacturer: 'Yamaha',
        state: 'connected',
        type: 'input',
      });
      const info = portToDeviceInfo(port, 'input');
      expect(info).toEqual({
        id: 'p1',
        name: 'Piano',
        manufacturer: 'Yamaha',
        state: 'connected',
        type: 'input',
      });
    });

    it('handles null name and manufacturer', () => {
      const port = createMockPort({ id: 'p2', type: 'output' });
      (port as { name: null }).name = null as unknown as string;
      (port as { manufacturer: null }).manufacturer = null as unknown as string;
      const info = portToDeviceInfo(port, 'output');
      expect(info.name).toBe('Unknown Device');
      expect(info.manufacturer).toBe('Unknown');
    });
  });

  describe('enumerateDevices', () => {
    it('returns all input and output devices', () => {
      const access = createMockMIDIAccess(
        [createMockPort({ id: 'i1', type: 'input' })],
        [createMockPort({ id: 'o1', type: 'output' })]
      );
      const devices = enumerateDevices(access);
      expect(devices).toHaveLength(2);
      expect(devices[0].type).toBe('input');
      expect(devices[1].type).toBe('output');
    });

    it('returns empty array when no devices', () => {
      const access = createMockMIDIAccess();
      expect(enumerateDevices(access)).toHaveLength(0);
    });
  });

  describe('selectFirstInputDevice', () => {
    it('selects the first connected input device', () => {
      const devices: MidiDeviceInfo[] = [
        {
          id: 'o1',
          name: 'Out',
          manufacturer: 'X',
          state: 'connected',
          type: 'output',
        },
        {
          id: 'i1',
          name: 'In1',
          manufacturer: 'Y',
          state: 'connected',
          type: 'input',
        },
        {
          id: 'i2',
          name: 'In2',
          manufacturer: 'Z',
          state: 'connected',
          type: 'input',
        },
      ];
      const result = selectFirstInputDevice(devices);
      expect(result?.id).toBe('i1');
    });

    it('returns null when no connected input devices', () => {
      const devices: MidiDeviceInfo[] = [
        {
          id: 'i1',
          name: 'In1',
          manufacturer: 'Y',
          state: 'disconnected',
          type: 'input',
        },
      ];
      expect(selectFirstInputDevice(devices)).toBeNull();
    });
  });

  describe('requestMidiAccess', () => {
    it('succeeds and populates devices', async () => {
      const mockAccess = createMockMIDIAccess(
        [
          createMockPort({
            id: 'i1',
            name: 'Keys',
            type: 'input',
            state: 'connected',
          }),
        ],
        []
      );
      Object.defineProperty(global, 'navigator', {
        value: { requestMIDIAccess: vi.fn().mockResolvedValue(mockAccess) },
        writable: true,
        configurable: true,
      });

      const cb = createCallbacks();
      await requestMidiAccess(cb);

      expect(cb.calls.onConnectionStatusChanged).toContain('connecting');
      expect(cb.calls.onConnectionStatusChanged).toContain('connected');
      expect(cb.calls.onDevicesChanged).toHaveLength(1);
      expect((cb.calls.onActiveDeviceChanged[0] as MidiDeviceInfo)?.name).toBe('Keys');
      expect(getMidiAccess()).toBe(mockAccess);
    });

    it('handles permission denied gracefully', async () => {
      const error = new DOMException('Not allowed', 'NotAllowedError');
      Object.defineProperty(global, 'navigator', {
        value: { requestMIDIAccess: vi.fn().mockRejectedValue(error) },
        writable: true,
        configurable: true,
      });

      const cb = createCallbacks();
      await requestMidiAccess(cb);

      expect(cb.calls.onConnectionStatusChanged).toContain('error');
      expect(cb.calls.onError[0]).toContain('MIDI access was not granted');
    });

    it('sets error when MIDI API is not supported', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      });

      const cb = createCallbacks();
      await requestMidiAccess(cb);

      expect(cb.calls.onConnectionStatusChanged).toContain('error');
      expect(cb.calls.onError[0]).toContain('Chrome or Edge');
    });

    it('handles statechange events for hot-plug (debounced)', async () => {
      vi.useFakeTimers();

      const inputPort = createMockPort({
        id: 'i1',
        name: 'Keys',
        type: 'input',
        state: 'connected',
      });
      const mockAccess = createMockMIDIAccess([inputPort], []);
      Object.defineProperty(global, 'navigator', {
        value: { requestMIDIAccess: vi.fn().mockResolvedValue(mockAccess) },
        writable: true,
        configurable: true,
      });

      const cb = createCallbacks();
      await requestMidiAccess(cb);

      // Simulate device disconnect
      (inputPort as { state: string }).state = 'disconnected';
      mockAccess.onstatechange?.({} as MIDIConnectionEvent);

      // Callbacks should NOT have fired yet (debounced)
      const devicesBeforeTimer = cb.calls.onDevicesChanged.length;

      // Advance past debounce timer
      vi.advanceTimersByTime(100);

      // Now callbacks should have fired
      expect(cb.calls.onDevicesChanged.length).toBeGreaterThan(devicesBeforeTimer);
      const lastActiveDevice =
        cb.calls.onActiveDeviceChanged[cb.calls.onActiveDeviceChanged.length - 1];
      expect(lastActiveDevice).toBeNull();
      expect(cb.calls.onConnectionStatusChanged).toContain('disconnected');

      vi.useRealTimers();
    });

    it('coalesces rapid statechange events into single enumeration', async () => {
      vi.useFakeTimers();

      const inputPort = createMockPort({
        id: 'i1',
        name: 'Keys',
        type: 'input',
        state: 'connected',
      });
      const mockAccess = createMockMIDIAccess([inputPort], []);
      Object.defineProperty(global, 'navigator', {
        value: { requestMIDIAccess: vi.fn().mockResolvedValue(mockAccess) },
        writable: true,
        configurable: true,
      });

      const cb = createCallbacks();
      await requestMidiAccess(cb);

      const devicesCountBefore = cb.calls.onDevicesChanged.length;

      // Fire 3 rapid statechange events (multi-port device)
      mockAccess.onstatechange?.({} as MIDIConnectionEvent);
      vi.advanceTimersByTime(30);
      mockAccess.onstatechange?.({} as MIDIConnectionEvent);
      vi.advanceTimersByTime(30);
      mockAccess.onstatechange?.({} as MIDIConnectionEvent);

      // Advance past debounce
      vi.advanceTimersByTime(100);

      // Should only enumerate once, not three times
      expect(cb.calls.onDevicesChanged.length - devicesCountBefore).toBe(1);

      vi.useRealTimers();
    });

    it('guards against concurrent requestMidiAccess calls', async () => {
      const mockAccess = createMockMIDIAccess([], []);
      const requestFn = vi.fn().mockResolvedValue(mockAccess);
      Object.defineProperty(global, 'navigator', {
        value: { requestMIDIAccess: requestFn },
        writable: true,
        configurable: true,
      });

      const cb = createCallbacks();
      const p1 = requestMidiAccess(cb);
      const p2 = requestMidiAccess(cb);

      await Promise.all([p1, p2]);

      // navigator.requestMIDIAccess should only be called once
      expect(requestFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('disconnectMidi', () => {
    it('clears the midi access reference', async () => {
      const mockAccess = createMockMIDIAccess([], []);
      Object.defineProperty(global, 'navigator', {
        value: { requestMIDIAccess: vi.fn().mockResolvedValue(mockAccess) },
        writable: true,
        configurable: true,
      });

      const cb = createCallbacks();
      await requestMidiAccess(cb);
      expect(getMidiAccess()).not.toBeNull();

      disconnectMidi();
      expect(getMidiAccess()).toBeNull();
    });
  });
});
