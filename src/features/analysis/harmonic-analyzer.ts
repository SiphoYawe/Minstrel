import { NOTE_NAMES } from './analysis-types';
import type {
  DetectedNote,
  DetectedChord,
  ChordQuality,
  KeyCenter,
  KeyMode,
  HarmonicFunction,
  NoteAnalysis,
} from './analysis-types';

// --- Krumhansl-Schmuckler Key Profiles ---
// Empirical pitch-class distributions for major and minor keys (Krumhansl & Kessler, 1982)
// Index 0 = tonic, index 1 = semitone above tonic, etc.

const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];

const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

const MIN_NOTES_FOR_KEY = 5;
const MIN_CHORDS_FOR_KEY = 3;
const KEY_CONFIDENCE_THRESHOLD = 0.45;
const MODULATION_CHORD_COUNT = 3;

// --- Key Detection ---

/**
 * Detects the likely key center using Krumhansl-Schmuckler algorithm.
 * Correlates pitch-class frequency distribution against 24 key profiles.
 */
export function detectKey(pitchClasses: number[]): KeyCenter | null {
  if (pitchClasses.length < MIN_NOTES_FOR_KEY) return null;

  // Build pitch-class frequency distribution (0-11)
  const distribution = new Array(12).fill(0);
  for (const pc of pitchClasses) {
    distribution[pc % 12]++;
  }

  let bestKey: KeyCenter | null = null;
  let bestCorrelation = -Infinity;

  // Test all 24 keys (12 roots x 2 modes)
  for (let root = 0; root < 12; root++) {
    for (const mode of ['major', 'minor'] as KeyMode[]) {
      const profile = mode === 'major' ? MAJOR_PROFILE : MINOR_PROFILE;
      const rotated = rotateProfile(profile, root);
      const correlation = pearsonCorrelation(distribution, rotated);

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestKey = {
          root: NOTE_NAMES[root],
          mode,
          confidence: correlation,
        };
      }
    }
  }

  if (!bestKey || bestKey.confidence < KEY_CONFIDENCE_THRESHOLD) return null;

  return bestKey;
}

/**
 * Detects key from chord progression by extracting pitch classes from chord roots and notes.
 * Uses chord root context to disambiguate relative major/minor pairs.
 */
export function detectKeyFromChords(chords: DetectedChord[]): KeyCenter | null {
  if (chords.length < MIN_CHORDS_FOR_KEY) return null;

  // Extract pitch classes from all notes in all chords
  const pitchClasses: number[] = [];
  for (const chord of chords) {
    for (const note of chord.notes) {
      pitchClasses.push(note.midiNumber % 12);
    }
  }

  const rawKey = detectKey(pitchClasses);
  if (!rawKey) return null;

  return disambiguateWithChords(rawKey, chords);
}

/**
 * Disambiguate relative major/minor using chord quality context.
 * E.g., if K-S says C major but chords are Am, Dm, Em → actually A minor.
 */
function disambiguateWithChords(key: KeyCenter, chords: DetectedChord[]): KeyCenter {
  if (chords.length < MIN_CHORDS_FOR_KEY) return key;

  const keyIndex = NOTE_NAMES.indexOf(key.root as (typeof NOTE_NAMES)[number]);
  if (keyIndex === -1) return key;

  // Find the relative key (major ↔ minor)
  const relativeOffset = key.mode === 'major' ? 9 : 3; // relative minor is -3 (=+9), relative major is +3
  const relativeRoot = NOTE_NAMES[(keyIndex + relativeOffset) % 12];
  const relativeMode: KeyMode = key.mode === 'major' ? 'minor' : 'major';

  // Count chord roots that fall on the tonic of each key
  const rootPcs = chords.map((c) => NOTE_NAMES.indexOf(c.root as (typeof NOTE_NAMES)[number]));
  const tonicCount = rootPcs.filter((pc) => pc === keyIndex).length;
  const relativeTonicCount = rootPcs.filter((pc) => pc === (keyIndex + relativeOffset) % 12).length;

  // Count minor vs major chord qualities to determine mode
  const minorChordCount = chords.filter(
    (c) => c.quality === 'Minor' || c.quality === 'Minor7'
  ).length;
  const majorChordCount = chords.filter(
    (c) => c.quality === 'Major' || c.quality === 'Major7'
  ).length;

  // If relative tonic appears more often AND mode matches chord qualities, switch
  if (relativeTonicCount > tonicCount) {
    const modeMatchesRelative =
      (relativeMode === 'minor' && minorChordCount > majorChordCount) ||
      (relativeMode === 'major' && majorChordCount > minorChordCount);

    if (modeMatchesRelative) {
      return {
        root: relativeRoot,
        mode: relativeMode,
        confidence: key.confidence * 0.95, // Slightly reduce confidence for disambiguation
      };
    }
  }

  return key;
}

/**
 * Detects modulation by checking if recent chords fit a new key better.
 */
export function detectModulation(
  currentKey: KeyCenter,
  recentChords: DetectedChord[]
): KeyCenter | null {
  if (recentChords.length < MODULATION_CHORD_COUNT) return null;

  const recent = recentChords.slice(-MODULATION_CHORD_COUNT);
  const pitchClasses: number[] = [];
  for (const chord of recent) {
    for (const note of chord.notes) {
      pitchClasses.push(note.midiNumber % 12);
    }
  }

  // Need enough notes for meaningful detection
  if (pitchClasses.length < MIN_NOTES_FOR_KEY) return null;

  const newKey = detectKey(pitchClasses);
  if (!newKey) return null;

  // Only trigger modulation if it's actually a different key
  if (newKey.root === currentKey.root && newKey.mode === currentKey.mode) {
    return null;
  }

  // Require the new key to have reasonable confidence
  if (newKey.confidence < KEY_CONFIDENCE_THRESHOLD) return null;

  return newKey;
}

// --- Harmonic Function Analysis ---

// Scale degrees for major key (semitone intervals from tonic)
const MAJOR_SCALE_DEGREES = [0, 2, 4, 5, 7, 9, 11];
// Scale degrees for natural minor key
const MINOR_SCALE_DEGREES = [0, 2, 3, 5, 7, 8, 10];

// Roman numerals for diatonic chords
const MAJOR_KEY_NUMERALS: Record<number, { numeral: string; quality: ChordQuality }> = {
  0: { numeral: 'I', quality: 'Major' },
  2: { numeral: 'ii', quality: 'Minor' },
  4: { numeral: 'iii', quality: 'Minor' },
  5: { numeral: 'IV', quality: 'Major' },
  7: { numeral: 'V', quality: 'Major' },
  9: { numeral: 'vi', quality: 'Minor' },
  11: { numeral: 'vii°', quality: 'Diminished' },
};

const MINOR_KEY_NUMERALS: Record<number, { numeral: string; quality: ChordQuality }> = {
  0: { numeral: 'i', quality: 'Minor' },
  2: { numeral: 'ii°', quality: 'Diminished' },
  3: { numeral: 'III', quality: 'Major' },
  5: { numeral: 'iv', quality: 'Minor' },
  7: { numeral: 'v', quality: 'Minor' },
  8: { numeral: 'VI', quality: 'Major' },
  10: { numeral: 'VII', quality: 'Major' },
};

// Chromatic chord labels (for chords outside the diatonic set)
const CHROMATIC_INTERVALS = [
  'I',
  'bII',
  'II',
  'bIII',
  'III',
  'IV',
  '#IV',
  'V',
  'bVI',
  'VI',
  'bVII',
  'VII',
];

/**
 * Maps a chord to its harmonic function in the detected key.
 */
export function analyzeHarmonicFunction(chord: DetectedChord, key: KeyCenter): HarmonicFunction {
  const rootIndex = NOTE_NAMES.indexOf(chord.root as (typeof NOTE_NAMES)[number]);
  const keyIndex = NOTE_NAMES.indexOf(key.root as (typeof NOTE_NAMES)[number]);

  // Guard against unrecognized root names (e.g., enharmonic spellings like 'Db')
  if (rootIndex === -1 || keyIndex === -1) {
    return { romanNumeral: '?', quality: chord.quality, isSecondary: false };
  }

  const interval = (rootIndex - keyIndex + 12) % 12;

  const numerals = key.mode === 'major' ? MAJOR_KEY_NUMERALS : MINOR_KEY_NUMERALS;

  // Check for diatonic chord (quality must match expected diatonic quality)
  if (interval in numerals && numerals[interval].quality === chord.quality) {
    return {
      romanNumeral: numerals[interval].numeral,
      quality: numerals[interval].quality,
      isSecondary: false,
    };
  }

  // Check for secondary dominant (V/x) — major or dom7 chord whose root is a fifth above a diatonic degree
  const scaleDegrees = key.mode === 'major' ? MAJOR_SCALE_DEGREES : MINOR_SCALE_DEGREES;
  const targetDegree = (interval - 7 + 12) % 12;
  if (
    (chord.quality === 'Major' || chord.quality === 'Dominant7') &&
    scaleDegrees.includes(targetDegree)
  ) {
    const targetNumeral = numerals[targetDegree]?.numeral ?? CHROMATIC_INTERVALS[targetDegree];
    return {
      romanNumeral: `V/${targetNumeral}`,
      quality: chord.quality,
      isSecondary: true,
    };
  }

  // Chromatic / borrowed chord — label by interval from tonic
  const label = CHROMATIC_INTERVALS[interval];
  const isUpper =
    chord.quality === 'Major' ||
    chord.quality === 'Dominant7' ||
    chord.quality === 'Major7' ||
    chord.quality === 'Augmented';
  return {
    romanNumeral: isUpper ? label : label.toLowerCase(),
    quality: chord.quality,
    isSecondary: false,
  };
}

// --- Chord-Tone Classification ---

/**
 * Classifies a note as chord tone or passing tone relative to the current chord.
 */
export function classifyNote(note: DetectedNote, currentChord: DetectedChord | null): NoteAnalysis {
  if (!currentChord) {
    return { note, isChordTone: false, chordContext: null };
  }

  const notePc = note.midiNumber % 12;
  const chordPitchClasses = new Set(currentChord.notes.map((n) => n.midiNumber % 12));
  const isChordTone = chordPitchClasses.has(notePc);

  return { note, isChordTone, chordContext: currentChord };
}

// --- Math Utilities ---

function rotateProfile(profile: number[], semitones: number): number[] {
  const rotated = new Array(12);
  for (let i = 0; i < 12; i++) {
    rotated[i] = profile[(i - semitones + 12) % 12];
  }
  return rotated;
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
    sumY2 += y[i] * y[i];
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return numerator / denominator;
}
