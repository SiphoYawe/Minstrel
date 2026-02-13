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

// --- Genre & Tendency Analysis Types (Story 2.4) ---

export type GenreName =
  | 'Blues'
  | 'Jazz'
  | 'Pop'
  | 'Rock'
  | 'Classical'
  | 'Funk'
  | 'Soul/R&B'
  | 'Latin/Bossa Nova'
  | 'Country'
  | 'Folk'
  | 'Reggae'
  | 'Metal'
  | 'Electronic';

export interface GenrePattern {
  genre: GenreName;
  confidence: number;
  matchedPatterns: string[];
}

export interface RhythmProfile {
  swingRatio: number;
  commonSubdivisions: string[];
  averageDensity: number;
}

export interface PlayingTendencies {
  keyDistribution: Record<string, number>;
  chordTypeDistribution: Record<string, number>;
  tempoHistogram: number[];
  intervalDistribution: Record<number, number>;
  rhythmProfile: RhythmProfile;
}

export interface TempoRange {
  minBpm: number;
  maxBpm: number;
}

export interface AvoidancePatterns {
  avoidedKeys: string[];
  avoidedChordTypes: ChordQuality[];
  avoidedTempoRanges: TempoRange[];
  avoidedIntervals: number[];
}

// --- Snapshot Types (Story 2.5 + Story 14.5 enrichment) ---

export type InsightCategory = 'TIMING' | 'HARMONIC' | 'TENDENCY' | 'GENERAL';

export interface SnapshotInsight {
  category: InsightCategory;
  text: string;
  confidence: number; // 0-1
}

export interface ChordFrequency {
  label: string;
  count: number;
}

export interface InstantSnapshot {
  id: string;
  key: KeyCenter | null;
  chordsUsed: DetectedChord[];
  timingAccuracy: number;
  averageTempo: number | null;
  /** @deprecated Use insights array instead. Kept for backward compatibility. */
  keyInsight: string;
  insightCategory: InsightCategory;
  insights: SnapshotInsight[];
  chordFrequencies: ChordFrequency[];
  isLimitedData: boolean;
  genrePatterns: GenrePattern[];
  timestamp: number;
}

export interface AnalysisAccumulator {
  notes: DetectedNote[];
  chords: DetectedChord[];
  tempoSegments: TempoSegment[];
  keySegments: KeySegment[];
  totalNoteCount: number;
  totalChordCount: number;
  startTimestamp: number;
  lastTimestamp: number;
}
