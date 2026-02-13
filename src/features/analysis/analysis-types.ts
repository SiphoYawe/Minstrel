export const NOTE_NAMES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const;

export interface DetectedNote {
  name: string;
  octave: number;
  midiNumber: number;
  velocity: number;
  timestamp: number;
}

export type ChordQuality =
  | 'Major'
  | 'Minor'
  | 'Dominant7'
  | 'Minor7'
  | 'Major7'
  | 'Sus2'
  | 'Sus4'
  | 'Diminished'
  | 'Augmented';

export interface DetectedChord {
  root: string;
  quality: ChordQuality;
  notes: DetectedNote[];
  timestamp: number;
}

export interface ChordProgression {
  chords: DetectedChord[];
  startTimestamp: number;
  endTimestamp: number;
}

// --- Timing Analysis Types (Story 2.2) ---

export interface TimingEvent {
  noteTimestamp: number;
  expectedBeatTimestamp: number;
  deviationMs: number;
  beatIndex: number;
}

export interface TempoSegment {
  bpm: number;
  startTimestamp: number;
  endTimestamp: number;
  noteCount: number;
}

// --- Harmonic Analysis Types (Story 2.3) ---

export type KeyMode = 'major' | 'minor';

export interface KeyCenter {
  root: string;
  mode: KeyMode;
  confidence: number;
}

export interface HarmonicFunction {
  romanNumeral: string;
  quality: ChordQuality;
  isSecondary: boolean;
}

export interface NoteAnalysis {
  note: DetectedNote;
  isChordTone: boolean;
  chordContext: DetectedChord | null;
}

export interface KeySegment {
  key: KeyCenter;
  startTimestamp: number;
  endTimestamp: number;
  chordCount: number;
}
