import { NOTE_NAMES } from './analysis-types';
import type { AnalysisAccumulator, GenrePattern, GenreName, ChordQuality } from './analysis-types';

// --- Genre Templates ---

interface GenreTemplate {
  genre: GenreName;
  progressions: string[][];
  scaleProfile: number[];
  preferredQualities: ChordQuality[];
  swingExpected: boolean;
}

// Pentatonic scale: C D E G A (pitch class intervals from root)
const PENTATONIC_PROFILE = [1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0];
// Blues scale: C Eb E F Gb G Bb
const BLUES_PROFILE = [1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 0];
// Chromatic profile (jazz chromaticism — all notes roughly equal)
const CHROMATIC_PROFILE = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
// Major scale profile
const MAJOR_SCALE_PROFILE = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1];

const GENRE_TEMPLATES: GenreTemplate[] = [
  {
    genre: 'Blues',
    progressions: [
      ['I', 'IV', 'V'],
      ['I', 'I', 'IV', 'IV', 'V', 'IV', 'I'],
    ],
    scaleProfile: BLUES_PROFILE,
    preferredQualities: ['Dominant7', 'Minor', 'Minor7'],
    swingExpected: true,
  },
  {
    genre: 'Jazz',
    progressions: [
      ['ii', 'V', 'I'],
      ['ii', 'V', 'I', 'vi'],
    ],
    scaleProfile: CHROMATIC_PROFILE,
    preferredQualities: ['Dominant7', 'Minor7', 'Major7'],
    swingExpected: true,
  },
  {
    genre: 'Pop',
    progressions: [
      ['I', 'V', 'vi', 'IV'],
      ['I', 'IV', 'V', 'I'],
      ['vi', 'IV', 'I', 'V'],
    ],
    scaleProfile: MAJOR_SCALE_PROFILE,
    preferredQualities: ['Major', 'Minor'],
    swingExpected: false,
  },
  {
    genre: 'Rock',
    progressions: [
      ['I', 'IV', 'V'],
      ['I', 'bVII', 'IV'],
    ],
    scaleProfile: PENTATONIC_PROFILE,
    preferredQualities: ['Major', 'Sus4', 'Sus2'],
    swingExpected: false,
  },
  {
    genre: 'Classical',
    progressions: [
      ['IV', 'V', 'I'],
      ['ii', 'V', 'I'],
      ['IV', 'vii°', 'I'],
    ],
    scaleProfile: MAJOR_SCALE_PROFILE,
    preferredQualities: ['Major', 'Minor', 'Diminished'],
    swingExpected: false,
  },
];

// Weight factors for genre scoring
const PROGRESSION_WEIGHT = 0.4;
const SCALE_WEIGHT = 0.3;
const RHYTHM_WEIGHT = 0.2;
const VOICING_WEIGHT = 0.1;
const GENRE_CONFIDENCE_THRESHOLD = 0.25;

/**
 * Detects genre patterns from accumulated analysis data.
 * Returns genre matches sorted by confidence (descending).
 */
export function detectGenrePatterns(accumulator: AnalysisAccumulator): GenrePattern[] {
  if (accumulator.chords.length < 3 && accumulator.notes.length < 8) return [];

  const results: GenrePattern[] = [];

  for (const template of GENRE_TEMPLATES) {
    const matchedPatterns: string[] = [];
    let score = 0;

    // 1. Chord progression matching (40%)
    const progScore = scoreProgressions(accumulator, template.progressions);
    if (progScore > 0) matchedPatterns.push('chord-progression');
    score += progScore * PROGRESSION_WEIGHT;

    // 2. Scale usage matching (30%)
    const scaleScore = scoreScaleUsage(accumulator, template.scaleProfile);
    if (scaleScore > 0.3) matchedPatterns.push('scale-usage');
    score += scaleScore * SCALE_WEIGHT;

    // 3. Rhythm matching (20%)
    const rhythmScore = scoreRhythm(accumulator, template.swingExpected);
    if (rhythmScore > 0.3) matchedPatterns.push('rhythm');
    score += rhythmScore * RHYTHM_WEIGHT;

    // 4. Chord voicing/quality matching (10%)
    const voicingScore = scoreVoicing(accumulator, template.preferredQualities);
    if (voicingScore > 0.3) matchedPatterns.push('chord-voicing');
    score += voicingScore * VOICING_WEIGHT;

    if (score >= GENRE_CONFIDENCE_THRESHOLD && matchedPatterns.length > 0) {
      results.push({
        genre: template.genre,
        confidence: Math.min(score, 1),
        matchedPatterns,
      });
    }
  }

  results.sort((a, b) => b.confidence - a.confidence);
  return results;
}

// --- Scoring Functions ---

function scoreProgressions(
  accumulator: AnalysisAccumulator,
  targetProgressions: string[][]
): number {
  if (accumulator.chords.length < 3) return 0;

  // Build a simplified roman numeral sequence from chords
  const roots: (number | null)[] = accumulator.chords.map((c) => {
    const idx = NOTE_NAMES.indexOf(c.root as (typeof NOTE_NAMES)[number]);
    return idx >= 0 ? idx : null;
  });

  // For each target progression, check if it appears as a subsequence
  let bestMatch = 0;
  for (const target of targetProgressions) {
    const matchScore = findProgressionMatch(roots, accumulator.chords, target);
    if (matchScore > bestMatch) bestMatch = matchScore;
  }

  return bestMatch;
}

function findProgressionMatch(
  roots: (number | null)[],
  chords: AnalysisAccumulator['chords'],
  target: string[]
): number {
  if (roots.length < target.length) return 0;

  // Simple: check interval patterns between consecutive chord roots
  // Map target numerals to semitone intervals from first chord
  const targetIntervals = romanNumeralsToIntervals(target);
  if (!targetIntervals) return 0;

  let matches = 0;
  const windowSize = target.length;

  for (let i = 0; i <= roots.length - windowSize; i++) {
    const window = roots.slice(i, i + windowSize);
    // Skip windows containing unrecognized roots
    if (window.some((r) => r === null)) continue;
    const baseRoot = window[0]!;
    const intervals = window.map((r) => (r! - baseRoot + 12) % 12);

    if (intervalsMatch(intervals, targetIntervals)) {
      matches++;
    }
  }

  // Normalize: more matches = higher score, capped at 1
  const possibleWindows = roots.length - windowSize + 1;
  return possibleWindows > 0 ? Math.min(matches / Math.max(possibleWindows * 0.3, 1), 1) : 0;
}

const NUMERAL_TO_SEMITONE: Record<string, number> = {
  I: 0,
  bII: 1,
  II: 2,
  ii: 2,
  bIII: 3,
  III: 4,
  iii: 4,
  IV: 5,
  iv: 5,
  '#IV': 6,
  V: 7,
  v: 7,
  bVI: 8,
  VI: 9,
  vi: 9,
  bVII: 10,
  VII: 11,
  'vii°': 11,
};

function romanNumeralsToIntervals(numerals: string[]): number[] | null {
  const result: number[] = [];
  for (const n of numerals) {
    const semitone = NUMERAL_TO_SEMITONE[n];
    if (semitone === undefined) return null;
    result.push(semitone);
  }
  return result;
}

function intervalsMatch(actual: number[], target: number[]): boolean {
  if (actual.length !== target.length) return false;
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== target[i]) return false;
  }
  return true;
}

function scoreScaleUsage(accumulator: AnalysisAccumulator, targetProfile: number[]): number {
  if (accumulator.notes.length === 0) return 0;

  // Build pitch-class distribution from notes
  const distribution = new Array(12).fill(0);
  for (const note of accumulator.notes) {
    distribution[note.midiNumber % 12]++;
  }

  // Normalize against actual notes in the buffer (not totalNoteCount)
  const total = accumulator.notes.length;
  const normalized = distribution.map((c: number) => c / total);

  // Find best rotation correlation (key-agnostic)
  let bestCorr = 0;
  for (let rotation = 0; rotation < 12; rotation++) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < 12; i++) {
      const a = normalized[(i + rotation) % 12];
      const b = targetProfile[i];
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }
    const denom = Math.sqrt(normA * normB);
    const corr = denom > 0 ? dotProduct / denom : 0;
    if (corr > bestCorr) bestCorr = corr;
  }

  return bestCorr;
}

function scoreRhythm(accumulator: AnalysisAccumulator, swingExpected: boolean): number {
  if (accumulator.notes.length < 4) return 0;

  // Compute IOIs (inter-onset intervals) between consecutive notes
  const iois: number[] = [];
  for (let i = 1; i < accumulator.notes.length; i++) {
    const ioi = accumulator.notes[i].timestamp - accumulator.notes[i - 1].timestamp;
    if (ioi > 0 && ioi < 2000) iois.push(ioi);
  }

  if (iois.length < 2) return 0;

  // Detect swing: ratio of long-short pairs
  let longShortPairs = 0;
  let straightPairs = 0;
  for (let i = 0; i < iois.length - 1; i += 2) {
    const ratio = iois[i] / iois[i + 1];
    if (ratio > 1.3 && ratio < 2.5) longShortPairs++;
    else if (ratio > 0.7 && ratio < 1.3) straightPairs++;
  }

  const totalPairs = longShortPairs + straightPairs;
  if (totalPairs === 0) return 0.5;

  const swingRatio = longShortPairs / totalPairs;
  const isSwing = swingRatio > 0.4;

  // Score: match if swing expectation aligns
  if (swingExpected === isSwing) return 0.8;
  if (swingExpected && swingRatio > 0.2) return 0.4;
  if (!swingExpected && swingRatio < 0.3) return 0.6;
  return 0.2;
}

function scoreVoicing(
  accumulator: AnalysisAccumulator,
  preferredQualities: ChordQuality[]
): number {
  if (accumulator.chords.length === 0) return 0;

  const preferredSet = new Set(preferredQualities);
  let matchCount = 0;

  for (const chord of accumulator.chords) {
    if (preferredSet.has(chord.quality)) matchCount++;
  }

  return matchCount / accumulator.chords.length;
}
