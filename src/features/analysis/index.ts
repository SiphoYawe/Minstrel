export { NOTE_NAMES } from './analysis-types';
export type {
  DetectedNote,
  DetectedChord,
  ChordQuality,
  ChordProgression,
  TimingEvent,
  TempoSegment,
  KeyMode,
  KeyCenter,
  HarmonicFunction,
  NoteAnalysis,
  KeySegment,
  GenreName,
  GenrePattern,
  PlayingTendencies,
  AvoidancePatterns,
  RhythmProfile,
  TempoRange,
  InsightCategory,
  SnapshotInsight,
  ChordFrequency,
  InstantSnapshot,
  AnalysisAccumulator,
} from './analysis-types';

export { detectNote, noteDisplayName } from './note-detector';
export { analyzeChord, chordDisplayName, updateProgression } from './chord-analyzer';
export {
  detectTempo,
  buildBeatGrid,
  measureDeviation,
  calculateAccuracy,
  detectTempoShift,
  createTimingAnalysis,
} from './timing-analyzer';
export type { BeatGrid, TimingAnalysisState } from './timing-analyzer';
export {
  detectKey,
  detectKeyWeighted,
  detectKeyFromChords,
  detectModulation,
  analyzeHarmonicFunction,
  classifyNote,
  KEY_DISPLAY_CONFIDENCE_THRESHOLD,
  KEY_DEBOUNCE_MS,
} from './harmonic-analyzer';
export { detectGenrePatterns } from './genre-detector';
export { trackTendencies, detectAvoidance } from './tendency-tracker';
export {
  generateSnapshot,
  generateKeyInsight,
  generateInsights,
  applyGrowthMindset,
  computeChordFrequencies,
} from './snapshot-generator';
export type { SnapshotInput } from './snapshot-generator';
