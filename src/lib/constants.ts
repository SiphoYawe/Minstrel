export const APP_NAME = 'Minstrel';
export const APP_DESCRIPTION = 'AI-powered real-time MIDI practice companion';

// Analysis constants (Story 2.1)
export const SIMULTANEITY_WINDOW_MS = 50;
export const SILENCE_THRESHOLD_MS = 3000;

// Timing analysis constants (Story 2.2)
export const ON_BEAT_TOLERANCE_MS = 30;
export const TEMPO_SHIFT_THRESHOLD = 0.1;
export const MIN_NOTES_FOR_TEMPO = 4;
export const MIN_BEATS_FOR_SHIFT = 8;
export const TIMING_ROLLING_WINDOW = 32;
export const TIMING_UPDATE_INTERVAL_MS = 500;
export const TIMING_UPDATE_NOTE_COUNT = 4;

// Harmonic analysis constants (Story 2.3)
export const PITCH_CLASS_ROLLING_WINDOW = 64;
export const KEY_DETECTION_CHORD_WINDOW = 8;
