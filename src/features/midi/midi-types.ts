export interface MidiDeviceInfo {
  id: string;
  name: string;
  manufacturer: string;
  state: 'connected' | 'disconnected';
  type: 'input' | 'output';
}

export type MidiConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'unsupported';

export interface MidiStoreState {
  connectionStatus: MidiConnectionStatus;
  activeDevice: MidiDeviceInfo | null;
  availableDevices: MidiDeviceInfo[];
  errorMessage: string | null;
}

export interface MidiStoreActions {
  setConnectionStatus: (status: MidiConnectionStatus) => void;
  setActiveDevice: (device: MidiDeviceInfo | null) => void;
  setAvailableDevices: (devices: MidiDeviceInfo[]) => void;
  setErrorMessage: (message: string | null) => void;
  reset: () => void;
}

export type MidiStore = MidiStoreState & MidiStoreActions;
