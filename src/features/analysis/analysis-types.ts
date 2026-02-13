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
