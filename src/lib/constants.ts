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

// Genre & tendency analysis constants (Story 2.4)
export const PATTERN_ANALYSIS_INTERVAL_MS = 30_000;
export const MIN_NOTES_FOR_TENDENCIES = 200;
export const MIN_CHORDS_FOR_TENDENCIES = 50;
export const AVOIDANCE_KEY_THRESHOLD = 0.02;
export const TEMPO_BUCKET_SIZE = 10;
export const TEMPO_BUCKET_MIN = 40;
export const TEMPO_BUCKET_MAX = 200;
export const ACCUMULATOR_MAX_NOTES = 2000;
export const ACCUMULATOR_MAX_CHORDS = 500;

// Snapshot overlay constants (Story 2.5)
export const SNAPSHOT_FADE_IN_MS = 300;
export const SNAPSHOT_FADE_OUT_MS = 200;

// Session recording constants (Story 2.8)
export const MAX_BUFFER_SIZE = 10_000;
export const AUTOSAVE_INTERVAL_MS = 30_000;
export const METADATA_UPDATE_INTERVAL_MS = 10_000;
