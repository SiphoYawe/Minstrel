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

// --- MIDI Event Types (Story 1.4) ---

export type MidiEventType = 'note-on' | 'note-off' | 'control-change';

export type InputSource = 'midi' | 'audio' | 'none';

export interface MidiEvent {
  type: MidiEventType;
  note: number;
  noteName: string;
  velocity: number;
  channel: number;
  timestamp: number;
  source: InputSource;
}

export interface MidiEventStoreState {
  currentEvents: MidiEvent[];
  latestEvent: MidiEvent | null;
  activeNotes: Record<number, MidiEvent>;
}

export interface MidiEventStoreActions {
  addEvent: (event: MidiEvent) => void;
  removeNote: (noteNumber: number) => void;
  clearSourceNotes: (source: InputSource) => void;
  clearEvents: () => void;
}

// --- Audio Mode State (Story 1.6) ---

export interface AudioModeStoreState {
  inputSource: InputSource;
}

export interface AudioModeStoreActions {
  setInputSource: (source: InputSource) => void;
}

// --- Troubleshooting State (Story 1.5) ---

export interface TroubleshootingStoreState {
  showTroubleshooting: boolean;
  detectedChannel: number | null;
}

export interface TroubleshootingStoreActions {
  setShowTroubleshooting: (show: boolean) => void;
  setDetectedChannel: (channel: number | null) => void;
}

// --- MIDI Output State (Story 5.5) ---

export interface DemonstrationNote {
  midiNote: number;
  index: number;
  total: number;
}

export interface MidiOutputStoreState {
  outputPort: MIDIOutput | null;
  hasOutputCapability: boolean;
  demonstrationNote: DemonstrationNote | null;
}

export interface MidiOutputStoreActions {
  setOutputPort: (port: MIDIOutput | null) => void;
  setHasOutputCapability: (has: boolean) => void;
  setDemonstrationNote: (note: DemonstrationNote | null) => void;
}

export type MidiEventStore = MidiStoreState &
  MidiStoreActions &
  MidiEventStoreState &
  MidiEventStoreActions &
  AudioModeStoreState &
  AudioModeStoreActions &
  TroubleshootingStoreState &
  TroubleshootingStoreActions &
  MidiOutputStoreState &
  MidiOutputStoreActions;
