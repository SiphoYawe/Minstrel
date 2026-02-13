import type { TimingEvent, TempoSegment } from './analysis-types';
import {
  ON_BEAT_TOLERANCE_MS,
  TEMPO_SHIFT_THRESHOLD,
  MIN_NOTES_FOR_TEMPO,
  MIN_BEATS_FOR_SHIFT,
  TIMING_ROLLING_WINDOW,
} from '@/lib/constants';

// --- Pure Functions ---

/**
 * Detects tempo (BPM) from a list of note-on timestamps using
 * inter-onset interval (IOI) analysis with median filtering.
 * Returns null if insufficient data or no stable tempo.
 *
 * Accepts either raw timestamps (computes intervals internally)
 * or pre-computed intervals via the second parameter.
 */
export function detectTempo(
  noteTimestamps: number[],
  precomputedIntervals?: number[]
): number | null {
  if (noteTimestamps.length < MIN_NOTES_FOR_TEMPO) return null;

  const intervals = precomputedIntervals ?? computeIntervals(noteTimestamps);

  if (intervals.length < MIN_NOTES_FOR_TEMPO - 1) return null;

  const median = medianValue(intervals);
  if (median <= 0) return null;

  // Reject if variance is too high (rubato/freeform)
  const mad = medianAbsoluteDeviation(intervals, median);
  if (mad / median > 0.25) return null;

  const bpm = 60000 / median;
  // Reject unreasonable tempos
  if (bpm < 20 || bpm > 300) return null;

  return Math.round(bpm * 10) / 10;
}

function computeIntervals(timestamps: number[]): number[] {
  const result: number[] = [];
  for (let i = 1; i < timestamps.length; i++) {
    const interval = timestamps[i] - timestamps[i - 1];
    if (interval > 0) result.push(interval);
  }
  return result;
}

/**
 * Returns a function that computes the expected timestamp for any beat index
 * given a start time and BPM.
 */
export type BeatGrid = (beatIndex: number) => number;

export function buildBeatGrid(startTime: number, bpm: number): BeatGrid {
  const beatIntervalMs = 60000 / bpm;
  return (beatIndex: number) => startTime + beatIndex * beatIntervalMs;
}

/**
 * Snaps a note to the nearest beat position and computes signed deviation.
 * Negative = early, positive = late.
 */
export function measureDeviation(
  noteTimestamp: number,
  grid: BeatGrid,
  bpm: number,
  gridStartTime: number
): TimingEvent {
  const beatIntervalMs = 60000 / bpm;
  // Estimate the closest beat index
  const rawIndex = (noteTimestamp - gridStartTime) / beatIntervalMs;
  const nearestIndex = Math.round(rawIndex);
  const expectedTimestamp = grid(nearestIndex);
  const deviationMs = noteTimestamp - expectedTimestamp;

  return {
    noteTimestamp,
    expectedBeatTimestamp: expectedTimestamp,
    deviationMs,
    beatIndex: nearestIndex,
  };
}

/**
 * Returns timing accuracy as a percentage (0-100).
 * 100% = all notes within ON_BEAT_TOLERANCE_MS of the beat grid.
 */
export function calculateAccuracy(deviations: TimingEvent[]): number {
  if (deviations.length === 0) return 100;

  const onBeat = deviations.filter((d) => Math.abs(d.deviationMs) <= ON_BEAT_TOLERANCE_MS).length;
  return Math.round((onBeat / deviations.length) * 100);
}

/**
 * Detects if BPM has shifted >TEMPO_SHIFT_THRESHOLD over the last
 * MIN_BEATS_FOR_SHIFT+ beats. Returns new BPM or null.
 */
export function detectTempoShift(currentBpm: number, recentIntervals: number[]): number | null {
  if (recentIntervals.length < MIN_BEATS_FOR_SHIFT) return null;

  const recent = recentIntervals.slice(-MIN_BEATS_FOR_SHIFT);
  const median = medianValue(recent);
  if (median <= 0) return null;

  const newBpm = 60000 / median;
  if (newBpm < 20 || newBpm > 300) return null;

  const shift = Math.abs(newBpm - currentBpm) / currentBpm;
  if (shift > TEMPO_SHIFT_THRESHOLD) {
    return Math.round(newBpm * 10) / 10;
  }

  return null;
}

// --- Stateful Timing Analysis Manager ---

export interface TimingAnalysisState {
  processNoteOn: (timestamp: number) => TimingEvent | null;
  getCurrentTempo: () => number | null;
  getAccuracy: () => number;
  getDeviations: () => TimingEvent[];
  getTempoHistory: () => TempoSegment[];
  reset: () => void;
}

export function createTimingAnalysis(): TimingAnalysisState {
  let noteTimestamps: number[] = [];
  let intervals: number[] = [];
  let currentBpm: number | null = null;
  let gridStartTime: number | null = null;
  let grid: BeatGrid | null = null;
  let deviations: TimingEvent[] = [];
  let tempoHistory: TempoSegment[] = [];
  let currentSegmentStart: number | null = null;
  let currentSegmentNoteCount = 0;

  function processNoteOn(timestamp: number): TimingEvent | null {
    // Track timestamps in rolling window
    noteTimestamps.push(timestamp);
    if (noteTimestamps.length > TIMING_ROLLING_WINDOW) {
      noteTimestamps = noteTimestamps.slice(-TIMING_ROLLING_WINDOW);
    }

    // Compute interval from previous note
    if (noteTimestamps.length >= 2) {
      const interval =
        noteTimestamps[noteTimestamps.length - 1] - noteTimestamps[noteTimestamps.length - 2];
      if (interval > 0) {
        intervals.push(interval);
        if (intervals.length > TIMING_ROLLING_WINDOW) {
          intervals = intervals.slice(-TIMING_ROLLING_WINDOW);
        }
      }
    }

    // If no tempo yet, try to detect one
    let justEstablished = false;
    if (currentBpm === null) {
      const detected = detectTempo(noteTimestamps, intervals);
      if (detected === null) {
        return null;
      }
      currentBpm = detected;
      gridStartTime = noteTimestamps[0];
      grid = buildBeatGrid(gridStartTime, currentBpm);
      currentSegmentStart = gridStartTime;
      currentSegmentNoteCount = noteTimestamps.length;
      justEstablished = true;
      // Fall through to measure deviation for this note
    }

    // We have a tempo — check for shift
    if (!justEstablished) {
      currentSegmentNoteCount++;
    }
    const shifted = detectTempoShift(currentBpm, intervals);
    if (shifted !== null) {
      // Finalize previous segment
      if (currentSegmentStart !== null) {
        tempoHistory.push({
          bpm: currentBpm,
          startTimestamp: currentSegmentStart,
          endTimestamp: timestamp,
          noteCount: currentSegmentNoteCount,
        });
      }

      // Start new segment
      currentBpm = shifted;
      gridStartTime = timestamp;
      grid = buildBeatGrid(gridStartTime, currentBpm);
      currentSegmentStart = timestamp;
      currentSegmentNoteCount = 1;
    }

    // Measure deviation against current grid
    if (grid !== null && gridStartTime !== null) {
      const event = measureDeviation(timestamp, grid, currentBpm, gridStartTime);
      deviations.push(event);

      // Cap deviations to rolling window
      if (deviations.length > TIMING_ROLLING_WINDOW * 2) {
        deviations = deviations.slice(-TIMING_ROLLING_WINDOW);
      }

      return event;
    }

    return null;
  }

  function getCurrentTempo(): number | null {
    return currentBpm;
  }

  function getAccuracy(): number {
    return calculateAccuracy(deviations);
  }

  function getDeviations(): TimingEvent[] {
    return [...deviations];
  }

  function getTempoHistory(): TempoSegment[] {
    return [...tempoHistory];
  }

  function reset(): void {
    noteTimestamps = [];
    intervals = [];
    currentBpm = null;
    gridStartTime = null;
    grid = null;
    deviations = [];
    tempoHistory = [];
    currentSegmentStart = null;
    currentSegmentNoteCount = 0;
  }

  return {
    processNoteOn,
    getCurrentTempo,
    getAccuracy,
    getDeviations,
    getTempoHistory,
    reset,
  };
}

// --- Math Utilities ---

function medianValue(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function medianAbsoluteDeviation(values: number[], median: number): number {
  const deviations = values.map((v) => Math.abs(v - median));
  return medianValue(deviations);
}
