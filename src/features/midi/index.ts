// Types
export type {
  MidiDeviceInfo,
  MidiConnectionStatus,
  MidiStoreState,
  MidiStoreActions,
  MidiStore,
  MidiEvent,
  MidiEventType,
  MidiEventStoreState,
  MidiEventStoreActions,
  MidiEventStore,
  InputSource,
  AudioModeStoreState,
  AudioModeStoreActions,
  TroubleshootingStoreState,
  TroubleshootingStoreActions,
} from './midi-types';

// Engine
export { requestMidiAccess, disconnectMidi, getMidiAccess } from './midi-engine';

// Parser
export { parseMidiMessage, noteNumberToName, resetRunningStatus } from './midi-parser';

// Troubleshooting
export type { TroubleshootingStep } from './troubleshooting';
export { getTroubleshootingSteps, isDrumChannel } from './troubleshooting';

// Audio
export {
  requestAudioAccess,
  stopAudioListening,
  isAudioSupported,
  calculateRMS,
  rmsToVelocity,
} from './audio-engine';
export { detectPitch, frequencyToMidiNote } from './pitch-detector';
export type { PitchResult } from './pitch-detector';
export type { DisabledFeature } from './audio-mode-limits';
export { getDisabledFeatures, isFeatureDisabledInAudioMode } from './audio-mode-limits';

// Utils
export { isMidiSupported } from './midi-utils';

// Hook
export { useMidi } from './use-midi';
