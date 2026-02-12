import type { MidiDeviceInfo, MidiEvent } from './midi-types';
import { isMidiSupported } from './midi-utils';
import { parseMidiMessage } from './midi-parser';

// Module-level ref for non-serializable MIDIAccess object (AR: not in Zustand)
let midiAccess: MIDIAccess | null = null;
let initPromise: Promise<void> | null = null;
let stateChangeTimer: ReturnType<typeof setTimeout> | null = null;
let disposed = false;

export type MidiEngineCallbacks = {
  onDevicesChanged: (devices: MidiDeviceInfo[]) => void;
  onConnectionStatusChanged: (
    status: 'connected' | 'disconnected' | 'connecting' | 'error'
  ) => void;
  onActiveDeviceChanged: (device: MidiDeviceInfo | null) => void;
  onError: (message: string) => void;
  onMidiEvent?: (event: MidiEvent) => void;
};

function portToDeviceInfo(port: MIDIPort, type: 'input' | 'output'): MidiDeviceInfo {
  return {
    id: port.id,
    name: port.name ?? 'Unknown Device',
    manufacturer: port.manufacturer ?? 'Unknown',
    state: port.state as 'connected' | 'disconnected',
    type,
  };
}

function enumerateDevices(access: MIDIAccess): MidiDeviceInfo[] {
  const devices: MidiDeviceInfo[] = [];
  access.inputs.forEach((input) => {
    devices.push(portToDeviceInfo(input, 'input'));
  });
  access.outputs.forEach((output) => {
    devices.push(portToDeviceInfo(output, 'output'));
  });
  return devices;
}

function selectFirstInputDevice(devices: MidiDeviceInfo[]): MidiDeviceInfo | null {
  return devices.find((d) => d.type === 'input' && d.state === 'connected') ?? null;
}

let activeInputPort: MIDIInput | null = null;

function bindMidiInput(
  access: MIDIAccess,
  device: MidiDeviceInfo | null,
  onMidiEvent?: (event: MidiEvent) => void
): void {
  // Unbind previous listener
  if (activeInputPort) {
    activeInputPort.onmidimessage = null;
    activeInputPort = null;
  }

  if (!device || !onMidiEvent) return;

  const port = access.inputs.get(device.id);
  if (!port) return;

  activeInputPort = port;
  port.onmidimessage = (e: MIDIMessageEvent) => {
    if (!e.data) return;
    // Use the native MIDI event timestamp for higher accuracy (Issue 7 fix)
    const ts = e.timeStamp > 0 ? e.timeStamp : performance.now();
    const parsed = parseMidiMessage(e.data, ts);
    if (parsed) {
      onMidiEvent(parsed);
    }
  };
}

async function doRequestMidiAccess(callbacks: MidiEngineCallbacks): Promise<void> {
  disposed = false;

  if (!isMidiSupported()) {
    callbacks.onConnectionStatusChanged('error');
    callbacks.onError('Minstrel works best in Chrome or Edge for full MIDI support.');
    return;
  }

  callbacks.onConnectionStatusChanged('connecting');

  try {
    const access = await navigator.requestMIDIAccess({ sysex: false });

    // Bail if disconnectMidi was called while awaiting
    if (disposed) return;

    midiAccess = access;

    const devices = enumerateDevices(access);
    callbacks.onDevicesChanged(devices);

    const activeInput = selectFirstInputDevice(devices);
    callbacks.onActiveDeviceChanged(activeInput);
    callbacks.onConnectionStatusChanged(activeInput ? 'connected' : 'disconnected');
    bindMidiInput(access, activeInput, callbacks.onMidiEvent);

    // Debounced handler for hot-plug events.
    // Multi-port devices fire one event per port in rapid succession,
    // so we coalesce them into a single enumeration after 100ms.
    access.onstatechange = () => {
      if (stateChangeTimer) {
        clearTimeout(stateChangeTimer);
      }
      stateChangeTimer = setTimeout(() => {
        stateChangeTimer = null;
        const updatedDevices = enumerateDevices(access);
        callbacks.onDevicesChanged(updatedDevices);

        const newActive = selectFirstInputDevice(updatedDevices);
        callbacks.onActiveDeviceChanged(newActive);
        callbacks.onConnectionStatusChanged(newActive ? 'connected' : 'disconnected');
        bindMidiInput(access, newActive, callbacks.onMidiEvent);
      }, 100);
    };
  } catch (error) {
    callbacks.onConnectionStatusChanged('error');
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      callbacks.onError('MIDI access was not granted. Please allow MIDI access to use Minstrel.');
    } else {
      callbacks.onError('Failed to initialize MIDI. Please try again.');
    }
  }
}

export async function requestMidiAccess(callbacks: MidiEngineCallbacks): Promise<void> {
  // Guard against concurrent calls -- return existing promise if initializing
  if (initPromise) return initPromise;
  initPromise = doRequestMidiAccess(callbacks).finally(() => {
    initPromise = null;
  });
  return initPromise;
}

export function disconnectMidi(): void {
  disposed = true;
  if (activeInputPort) {
    activeInputPort.onmidimessage = null;
    activeInputPort = null;
  }
  if (stateChangeTimer) {
    clearTimeout(stateChangeTimer);
    stateChangeTimer = null;
  }
  if (midiAccess) {
    midiAccess.onstatechange = null;
    midiAccess = null;
  }
  initPromise = null;
}

export function getMidiAccess(): MIDIAccess | null {
  return midiAccess;
}

// Exported for testing
export { enumerateDevices, selectFirstInputDevice, portToDeviceInfo };
