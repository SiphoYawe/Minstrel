import { NOTE_NAMES } from './analysis-types';
import type { DetectedNote, DetectedChord, ChordQuality, ChordProgression } from './analysis-types';

/** Chord quality display labels (short form) */
const QUALITY_LABELS: Record<ChordQuality, string> = {
  Major: 'maj',
  Minor: 'm',
  Dominant7: '7',
  Minor7: 'm7',
  Major7: 'maj7',
  Sus2: 'sus2',
  Sus4: 'sus4',
  Diminished: 'dim',
  Augmented: 'aug',
};

/**
 * Chord templates as sorted interval sets from root.
 * Order matters — first match wins, so more specific chords (7ths) come before triads.
 */
const CHORD_TEMPLATES: { quality: ChordQuality; intervals: number[] }[] = [
  // 7th chords first (more specific)
  { quality: 'Major7', intervals: [0, 4, 7, 11] },
  { quality: 'Dominant7', intervals: [0, 4, 7, 10] },
  { quality: 'Minor7', intervals: [0, 3, 7, 10] },
  // Triads
  { quality: 'Major', intervals: [0, 4, 7] },
  { quality: 'Minor', intervals: [0, 3, 7] },
  { quality: 'Diminished', intervals: [0, 3, 6] },
  { quality: 'Augmented', intervals: [0, 4, 8] },
  { quality: 'Sus2', intervals: [0, 2, 7] },
  { quality: 'Sus4', intervals: [0, 5, 7] },
];

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Analyzes a set of simultaneous notes and identifies the chord quality.
 * Requires 3+ notes. Returns null if no recognized chord pattern is found.
 *
 * Algorithm:
 * 1. Extract unique pitch classes (0-11)
 * 2. For each pitch class as potential root, compute intervals
 * 3. Match against known chord templates
 * 4. Prefer the lowest note as root (root position) when multiple matches
 */
export function analyzeChord(notes: DetectedNote[]): DetectedChord | null {
  if (notes.length < 3) return null;

  // Extract unique pitch classes, preserving order by first occurrence
  const pitchClasses: number[] = [];
  for (const note of notes) {
    const pc = note.midiNumber % 12;
    if (!pitchClasses.includes(pc)) {
      pitchClasses.push(pc);
    }
  }

  if (pitchClasses.length < 3) return null;

  // Sort notes by midiNumber to find lowest (bass) note
  const sortedNotes = [...notes].sort((a, b) => a.midiNumber - b.midiNumber);
  const bassPC = sortedNotes[0].midiNumber % 12;

  // Try each pitch class as root, prefer bass note (root position)
  let bestMatch: { root: number; quality: ChordQuality } | null = null;

  const orderedRoots = [bassPC, ...pitchClasses.filter((pc) => pc !== bassPC)];

  for (const root of orderedRoots) {
    const intervals = pitchClasses.map((pc) => (pc - root + 12) % 12).sort((a, b) => a - b);

    for (const template of CHORD_TEMPLATES) {
      if (arraysEqual(intervals, template.intervals)) {
        // Bass note as root = root position — ideal, return immediately
        if (root === bassPC) {
          return buildChord(root, template.quality, notes);
        }
        // Keep first non-bass match, continue looking for better
        if (!bestMatch) {
          bestMatch = { root, quality: template.quality };
        }
        break;
      }
    }
  }

  if (bestMatch) {
    return buildChord(bestMatch.root, bestMatch.quality, notes);
  }

  return null;
}

function buildChord(rootPC: number, quality: ChordQuality, notes: DetectedNote[]): DetectedChord {
  return {
    root: NOTE_NAMES[rootPC],
    quality,
    notes: [...notes],
    timestamp: Math.min(...notes.map((n) => n.timestamp)),
  };
}

/**
 * Returns the display label for a chord (e.g., "Cmaj7", "Am", "Gsus4").
 */
export function chordDisplayName(chord: DetectedChord): string {
  return `${chord.root}${QUALITY_LABELS[chord.quality]}`;
}

/**
 * Appends a new chord to a progression. Creates a new progression if null.
 */
export function updateProgression(
  chord: DetectedChord,
  progression: ChordProgression | null
): ChordProgression {
  if (!progression) {
    return {
      chords: [chord],
      startTimestamp: chord.timestamp,
      endTimestamp: chord.timestamp,
    };
  }

  return {
    chords: [...progression.chords, chord],
    startTimestamp: progression.startTimestamp,
    endTimestamp: chord.timestamp,
  };
}
