import { NOTE_NAMES } from './analysis-types';
import type { DetectedNote } from './analysis-types';

/**
 * Maps a MIDI note number (0-127) to a DetectedNote.
 * Uses sharps for enharmonic spelling (C#, not Db).
 * Standard mapping: C4 = 60.
 */
export function detectNote(midiNumber: number, velocity: number, timestamp: number): DetectedNote {
  const name = NOTE_NAMES[midiNumber % 12];
  const octave = Math.floor(midiNumber / 12) - 1;

  return {
    name,
    octave,
    midiNumber,
    velocity,
    timestamp,
  };
}

/**
 * Returns the display name for a MIDI note (e.g., "C4", "G#3").
 */
export function noteDisplayName(midiNumber: number): string {
  const name = NOTE_NAMES[midiNumber % 12];
  const octave = Math.floor(midiNumber / 12) - 1;
  return `${name}${octave}`;
}
