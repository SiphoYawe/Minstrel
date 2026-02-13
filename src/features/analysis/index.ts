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
  detectKeyFromChords,
  detectModulation,
  analyzeHarmonicFunction,
  classifyNote,
} from './harmonic-analyzer';
