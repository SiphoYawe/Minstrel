import { NOTE_NAMES } from './analysis-types';
import type {
  AnalysisAccumulator,
  PlayingTendencies,
  AvoidancePatterns,
  RhythmProfile,
  ChordQuality,
} from './analysis-types';
import {
  MIN_NOTES_FOR_TENDENCIES,
  MIN_CHORDS_FOR_TENDENCIES,
  AVOIDANCE_KEY_THRESHOLD,
  TEMPO_BUCKET_SIZE,
  TEMPO_BUCKET_MIN,
  TEMPO_BUCKET_MAX,
} from '@/lib/constants';

const TEMPO_BUCKET_COUNT = (TEMPO_BUCKET_MAX - TEMPO_BUCKET_MIN) / TEMPO_BUCKET_SIZE;

const ALL_CHORD_QUALITIES: ChordQuality[] = [
  'Major',
  'Minor',
  'Dominant7',
  'Minor7',
  'Major7',
  'Sus2',
  'Sus4',
  'Diminished',
  'Augmented',
];

/**
 * Computes playing tendencies from accumulated session data.
 */
export function trackTendencies(accumulator: AnalysisAccumulator): PlayingTendencies {
  return {
    keyDistribution: computeKeyDistribution(accumulator),
    chordTypeDistribution: computeChordTypeDistribution(accumulator),
    tempoHistogram: computeTempoHistogram(accumulator),
    intervalDistribution: computeIntervalDistribution(accumulator),
    rhythmProfile: computeRhythmProfile(accumulator),
  };
}

/**
 * Detects avoidance patterns from playing tendencies.
 * Requires minimum data thresholds to avoid false positives.
 */
export function detectAvoidance(
  tendencies: PlayingTendencies,
  accumulator: AnalysisAccumulator
): AvoidancePatterns {
  // Insufficient data — return empty patterns
  if (
    accumulator.totalNoteCount < MIN_NOTES_FOR_TENDENCIES ||
    accumulator.totalChordCount < MIN_CHORDS_FOR_TENDENCIES
  ) {
    return { avoidedKeys: [], avoidedChordTypes: [], avoidedTempoRanges: [], avoidedIntervals: [] };
  }

  return {
    avoidedKeys: detectAvoidedKeys(tendencies),
    avoidedChordTypes: detectAvoidedChordTypes(tendencies),
    avoidedTempoRanges: detectAvoidedTempoRanges(tendencies),
    avoidedIntervals: detectAvoidedIntervals(tendencies),
  };
}

// --- Key Distribution ---

function computeKeyDistribution(accumulator: AnalysisAccumulator): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const name of NOTE_NAMES) {
    dist[name] = 0;
  }

  for (const note of accumulator.notes) {
    const pc = note.midiNumber % 12;
    const name = NOTE_NAMES[pc];
    dist[name]++;
  }

  return dist;
}

// --- Chord Type Distribution ---

function computeChordTypeDistribution(accumulator: AnalysisAccumulator): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const q of ALL_CHORD_QUALITIES) {
    dist[q] = 0;
  }

  for (const chord of accumulator.chords) {
    dist[chord.quality] = (dist[chord.quality] ?? 0) + 1;
  }

  return dist;
}

// --- Tempo Histogram ---

function computeTempoHistogram(accumulator: AnalysisAccumulator): number[] {
  const histogram = new Array(TEMPO_BUCKET_COUNT).fill(0);

  for (const segment of accumulator.tempoSegments) {
    const bucketIndex = Math.floor((segment.bpm - TEMPO_BUCKET_MIN) / TEMPO_BUCKET_SIZE);
    if (bucketIndex >= 0 && bucketIndex < TEMPO_BUCKET_COUNT) {
      histogram[bucketIndex] += segment.noteCount;
    }
  }

  return histogram;
}

// --- Interval Distribution ---

function computeIntervalDistribution(accumulator: AnalysisAccumulator): Record<number, number> {
  const dist: Record<number, number> = {};

  for (let i = 1; i < accumulator.notes.length; i++) {
    const interval = Math.abs(
      accumulator.notes[i].midiNumber - accumulator.notes[i - 1].midiNumber
    );
    if (interval <= 24) {
      // Cap at 2 octaves
      dist[interval] = (dist[interval] ?? 0) + 1;
    }
  }

  return dist;
}

// --- Rhythm Profile ---

function computeRhythmProfile(accumulator: AnalysisAccumulator): RhythmProfile {
  if (accumulator.notes.length < 4) {
    return { swingRatio: 0, commonSubdivisions: [], averageDensity: 0 };
  }

  const iois: number[] = [];
  for (let i = 1; i < accumulator.notes.length; i++) {
    const ioi = accumulator.notes[i].timestamp - accumulator.notes[i - 1].timestamp;
    if (ioi > 0 && ioi < 2000) iois.push(ioi);
  }

  if (iois.length < 2) {
    return { swingRatio: 0, commonSubdivisions: [], averageDensity: 0 };
  }

  // Swing ratio: ratio of long-short beat pairs
  let longShortPairs = 0;
  let totalPairs = 0;
  for (let i = 0; i < iois.length - 1; i += 2) {
    const ratio = iois[i] / iois[i + 1];
    totalPairs++;
    if (ratio > 1.3 && ratio < 2.5) longShortPairs++;
  }
  const swingRatio = totalPairs > 0 ? longShortPairs / totalPairs : 0;

  // Common subdivisions detection
  const medianIOI = sortedMedian(iois);
  const subdivisions: string[] = [];
  if (medianIOI > 0) {
    // Check how IOIs cluster relative to common beat subdivisions
    const quarterApprox = medianIOI;
    const eighthApprox = quarterApprox / 2;
    const tripletApprox = quarterApprox / 3;

    let quarterCount = 0;
    let eighthCount = 0;
    let tripletCount = 0;

    for (const ioi of iois) {
      if (Math.abs(ioi - quarterApprox) / quarterApprox < 0.2) quarterCount++;
      if (Math.abs(ioi - eighthApprox) / eighthApprox < 0.2) eighthCount++;
      if (Math.abs(ioi - tripletApprox) / tripletApprox < 0.2) tripletCount++;
    }

    if (quarterCount > iois.length * 0.15) subdivisions.push('quarter');
    if (eighthCount > iois.length * 0.15) subdivisions.push('eighth');
    if (tripletCount > iois.length * 0.15) subdivisions.push('triplet');
  }

  // Average density: notes per second (use buffer length for accurate density)
  const duration = accumulator.lastTimestamp - accumulator.startTimestamp;
  const averageDensity = duration > 0 ? (accumulator.notes.length / duration) * 1000 : 0;

  return { swingRatio, commonSubdivisions: subdivisions, averageDensity };
}

function sortedMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

// --- Avoidance Detection ---

function detectAvoidedKeys(tendencies: PlayingTendencies): string[] {
  const total = Object.values(tendencies.keyDistribution).reduce((s, v) => s + v, 0);
  if (total === 0) return [];

  const avoided: string[] = [];
  for (const [key, count] of Object.entries(tendencies.keyDistribution)) {
    if (count / total < AVOIDANCE_KEY_THRESHOLD) {
      avoided.push(key);
    }
  }
  return avoided;
}

function detectAvoidedChordTypes(tendencies: PlayingTendencies): ChordQuality[] {
  const avoided: ChordQuality[] = [];
  for (const [type, count] of Object.entries(tendencies.chordTypeDistribution)) {
    if (count === 0) avoided.push(type as ChordQuality);
  }
  return avoided;
}

function detectAvoidedTempoRanges(
  tendencies: PlayingTendencies
): { minBpm: number; maxBpm: number }[] {
  const avoided: { minBpm: number; maxBpm: number }[] = [];
  const h = tendencies.tempoHistogram;

  for (let i = 0; i < h.length; i++) {
    // Gap: zero activity with at least one adjacent bucket having activity
    const prevActive = i > 0 && h[i - 1] > 0;
    const nextActive = i < h.length - 1 && h[i + 1] > 0;
    if (h[i] === 0 && (prevActive || nextActive)) {
      avoided.push({
        minBpm: TEMPO_BUCKET_MIN + i * TEMPO_BUCKET_SIZE,
        maxBpm: TEMPO_BUCKET_MIN + (i + 1) * TEMPO_BUCKET_SIZE,
      });
    }
  }

  return avoided;
}

function detectAvoidedIntervals(tendencies: PlayingTendencies): number[] {
  const avoided: number[] = [];
  const totalIntervals = Object.values(tendencies.intervalDistribution).reduce((s, v) => s + v, 0);
  if (totalIntervals === 0) return [];

  // Check intervals 1-12 (within an octave)
  for (let i = 1; i <= 12; i++) {
    if ((tendencies.intervalDistribution[i] ?? 0) === 0) {
      avoided.push(i);
    }
  }
  return avoided;
}
