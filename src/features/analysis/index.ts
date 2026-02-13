export { NOTE_NAMES } from './analysis-types';
export type { DetectedNote, DetectedChord, ChordQuality, ChordProgression } from './analysis-types';

export { detectNote, noteDisplayName } from './note-detector';
export { analyzeChord, chordDisplayName, updateProgression } from './chord-analyzer';
