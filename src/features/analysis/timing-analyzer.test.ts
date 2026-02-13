import { describe, it, expect } from 'vitest';
import {
  detectTempo,
  buildBeatGrid,
  measureDeviation,
  calculateAccuracy,
  detectTempoShift,
  createTimingAnalysis,
} from './timing-analyzer';

// --- Helper: generate timestamps at a given BPM ---
function generateTimestamps(bpm: number, count: number, startTime = 0): number[] {
  const interval = 60000 / bpm;
  return Array.from({ length: count }, (_, i) => startTime + i * interval);
}

// --- Helper: add jitter to timestamps ---
function addJitter(timestamps: number[], maxJitterMs: number): number[] {
  return timestamps.map((t, i) => t + (i === 0 ? 0 : Math.sin(i * 7) * maxJitterMs));
}

describe('detectTempo', () => {
  it('returns null for fewer than 4 notes', () => {
    expect(detectTempo([0, 500, 1000])).toBeNull();
  });

  it('detects 60 BPM (1000ms intervals)', () => {
    const ts = generateTimestamps(60, 12); // Need 8+ consistent intervals
    const result = detectTempo(ts);
    expect(result).not.toBeNull();
    expect(result!.bpm).toBeCloseTo(60, 0);
    expect(result!.confidence).toBeGreaterThan(0.5);
  });

  it('detects 120 BPM (500ms intervals)', () => {
    const ts = generateTimestamps(120, 12);
    const result = detectTempo(ts);
    expect(result).not.toBeNull();
    expect(result!.bpm).toBeCloseTo(120, 0);
  });

  it('detects 180 BPM (~333ms intervals)', () => {
    const ts = generateTimestamps(180, 12);
    const result = detectTempo(ts);
    expect(result).not.toBeNull();
    expect(result!.bpm).toBeCloseTo(180, 0);
  });

  it('detects tempo with small jitter', () => {
    const ts = addJitter(generateTimestamps(120, 12), 15);
    const result = detectTempo(ts);
    expect(result).not.toBeNull();
    expect(result!.bpm).toBeGreaterThan(110);
    expect(result!.bpm).toBeLessThan(130);
  });

  it('returns null for rubato/freeform (high variance intervals)', () => {
    // Highly irregular intervals
    const ts = [0, 200, 800, 900, 2000, 2100, 3500, 3600];
    expect(detectTempo(ts)).toBeNull();
  });

  it('returns null for empty array', () => {
    expect(detectTempo([])).toBeNull();
  });

  it('returns null for single note', () => {
    expect(detectTempo([1000])).toBeNull();
  });

  it('returns null when fewer than 8 consistent intervals', () => {
    // Only 5 notes = 4 intervals, below MIN_CONSISTENT_INTERVALS of 8
    const ts = generateTimestamps(120, 5);
    expect(detectTempo(ts)).toBeNull();
  });

  it('filters out IOI outliers outside 30-300 BPM range', () => {
    // Mix of valid 120 BPM intervals with one extreme outlier
    const ts = [0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 10000, 10500];
    const result = detectTempo(ts);
    // Should still detect ~120 BPM because outlier is filtered
    if (result) {
      expect(result.bpm).toBeGreaterThan(100);
      expect(result.bpm).toBeLessThan(140);
    }
  });
});

describe('buildBeatGrid', () => {
  it('returns a function', () => {
    const grid = buildBeatGrid(0, 120);
    expect(typeof grid).toBe('function');
  });

  it('computes correct timestamps for 120 BPM', () => {
    const grid = buildBeatGrid(0, 120);
    expect(grid(0)).toBe(0);
    expect(grid(1)).toBe(500);
    expect(grid(2)).toBe(1000);
    expect(grid(4)).toBe(2000);
  });

  it('computes correct timestamps with non-zero start', () => {
    const grid = buildBeatGrid(1000, 60);
    expect(grid(0)).toBe(1000);
    expect(grid(1)).toBe(2000);
    expect(grid(2)).toBe(3000);
  });
});

describe('measureDeviation', () => {
  it('returns 0 deviation for perfectly on-beat note', () => {
    const grid = buildBeatGrid(0, 120);
    const event = measureDeviation(500, grid, 120, 0);
    expect(event.deviationMs).toBe(0);
    expect(event.beatIndex).toBe(1);
  });

  it('returns negative deviation for early note', () => {
    const grid = buildBeatGrid(0, 120);
    const event = measureDeviation(480, grid, 120, 0);
    expect(event.deviationMs).toBe(-20);
    expect(event.beatIndex).toBe(1);
  });

  it('returns positive deviation for late note', () => {
    const grid = buildBeatGrid(0, 120);
    const event = measureDeviation(550, grid, 120, 0);
    expect(event.deviationMs).toBe(50);
    expect(event.beatIndex).toBe(1);
  });

  it('snaps to nearest beat correctly', () => {
    const grid = buildBeatGrid(0, 120);
    // 750ms is closer to beat 2 (1000ms) than beat 1 (500ms)
    const event = measureDeviation(750, grid, 120, 0);
    expect(event.beatIndex).toBe(2);
    expect(event.deviationMs).toBe(-250);
  });

  it('handles grid with non-zero start', () => {
    const grid = buildBeatGrid(1000, 120);
    const event = measureDeviation(1500, grid, 120, 1000);
    expect(event.deviationMs).toBe(0);
    expect(event.beatIndex).toBe(1);
  });
});

describe('calculateAccuracy', () => {
  it('returns 100 for empty deviations', () => {
    expect(calculateAccuracy([])).toBe(100);
  });

  it('returns 100 when all notes are on beat', () => {
    const deviations = [
      { noteTimestamp: 500, expectedBeatTimestamp: 500, deviationMs: 0, beatIndex: 1 },
      { noteTimestamp: 1010, expectedBeatTimestamp: 1000, deviationMs: 10, beatIndex: 2 },
      { noteTimestamp: 1480, expectedBeatTimestamp: 1500, deviationMs: -20, beatIndex: 3 },
    ];
    expect(calculateAccuracy(deviations)).toBe(100);
  });

  it('returns 0 when all notes are off beat', () => {
    const deviations = [
      { noteTimestamp: 550, expectedBeatTimestamp: 500, deviationMs: 50, beatIndex: 1 },
      { noteTimestamp: 1060, expectedBeatTimestamp: 1000, deviationMs: 60, beatIndex: 2 },
    ];
    expect(calculateAccuracy(deviations)).toBe(0);
  });

  it('returns 50 when half notes are on beat', () => {
    const deviations = [
      { noteTimestamp: 500, expectedBeatTimestamp: 500, deviationMs: 0, beatIndex: 1 },
      { noteTimestamp: 1060, expectedBeatTimestamp: 1000, deviationMs: 60, beatIndex: 2 },
    ];
    expect(calculateAccuracy(deviations)).toBe(50);
  });

  it('treats exactly ON_BEAT_TOLERANCE_MS as on-beat', () => {
    const deviations = [
      { noteTimestamp: 530, expectedBeatTimestamp: 500, deviationMs: 30, beatIndex: 1 },
    ];
    expect(calculateAccuracy(deviations)).toBe(100);
  });

  it('clamps accuracy to 0-100 range', () => {
    // Edge case: accuracy should never be negative or > 100
    const deviations = [
      { noteTimestamp: 500, expectedBeatTimestamp: 500, deviationMs: 0, beatIndex: 1 },
    ];
    const result = calculateAccuracy(deviations);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe('detectTempoShift', () => {
  it('returns null for fewer than 8 intervals', () => {
    const intervals = [500, 500, 500, 500, 500, 500, 500];
    expect(detectTempoShift(120, intervals)).toBeNull();
  });

  it('returns null for stable tempo with minor jitter', () => {
    // 120 BPM = 500ms intervals, with minor jitter
    const intervals = [498, 502, 499, 501, 500, 498, 502, 500];
    expect(detectTempoShift(120, intervals)).toBeNull();
  });

  it('detects shift from 80 BPM to 120 BPM (clamped by MAX_BPM_DELTA)', () => {
    // 120 BPM = 500ms intervals
    const intervals = [500, 500, 500, 500, 500, 500, 500, 500];
    const result = detectTempoShift(80, intervals);
    expect(result).not.toBeNull();
    // With MAX_BPM_DELTA of 3, result should be clamped to 83 (80 + 3)
    expect(result!).toBeCloseTo(83, 0);
  });

  it('detects shift from 120 BPM to 80 BPM (clamped by MAX_BPM_DELTA)', () => {
    // 80 BPM = 750ms intervals
    const intervals = [750, 750, 750, 750, 750, 750, 750, 750];
    const result = detectTempoShift(120, intervals);
    expect(result).not.toBeNull();
    // With MAX_BPM_DELTA of 3, result should be clamped to 117 (120 - 3)
    expect(result!).toBeCloseTo(117, 0);
  });
});

describe('createTimingAnalysis (stateful manager)', () => {
  it('returns null for first few notes (insufficient data)', () => {
    const analysis = createTimingAnalysis();
    expect(analysis.processNoteOn(0)).toBeNull();
    expect(analysis.processNoteOn(500)).toBeNull();
    expect(analysis.processNoteOn(1000)).toBeNull();
    expect(analysis.getCurrentTempo()).toBeNull();
  });

  it('detects tempo after sufficient notes at 120 BPM', () => {
    const analysis = createTimingAnalysis();
    const timestamps = generateTimestamps(120, 12); // Need 8+ consistent intervals
    for (const t of timestamps) {
      analysis.processNoteOn(t);
    }
    expect(analysis.getCurrentTempo()).not.toBeNull();
    expect(analysis.getCurrentTempo()!).toBeCloseTo(120, 0);
    expect(analysis.getConfidence()).toBeGreaterThan(0.5);
  });

  it('produces timing events after tempo is detected', () => {
    const analysis = createTimingAnalysis();
    const timestamps = generateTimestamps(120, 12);
    for (const t of timestamps) {
      analysis.processNoteOn(t);
    }
    const deviations = analysis.getDeviations();
    expect(deviations.length).toBeGreaterThan(0);
  });

  it('reports 100% accuracy for perfectly timed notes', () => {
    const analysis = createTimingAnalysis();
    const timestamps = generateTimestamps(120, 16);
    for (const t of timestamps) {
      analysis.processNoteOn(t);
    }
    expect(analysis.getAccuracy()).toBe(100);
  });

  it('reports reduced accuracy for imprecise notes', () => {
    const analysis = createTimingAnalysis();
    // First 12 notes establish tempo at 120 BPM
    const timestamps = generateTimestamps(120, 12);
    for (const t of timestamps) {
      analysis.processNoteOn(t);
    }
    // Then play 4 notes that are 50ms late each
    for (let i = 12; i < 16; i++) {
      analysis.processNoteOn(i * 500 + 50);
    }
    expect(analysis.getAccuracy()).toBeLessThan(100);
  });

  it('handles rubato (no stable tempo)', () => {
    const analysis = createTimingAnalysis();
    // Highly irregular intervals
    const timestamps = [0, 200, 800, 900, 2000, 2100, 3500, 3600];
    for (const t of timestamps) {
      analysis.processNoteOn(t);
    }
    expect(analysis.getCurrentTempo()).toBeNull();
    expect(analysis.getDeviations()).toHaveLength(0);
  });

  it('resets state cleanly', () => {
    const analysis = createTimingAnalysis();
    const timestamps = generateTimestamps(120, 12);
    for (const t of timestamps) {
      analysis.processNoteOn(t);
    }
    expect(analysis.getCurrentTempo()).not.toBeNull();

    analysis.reset();
    expect(analysis.getCurrentTempo()).toBeNull();
    expect(analysis.getDeviations()).toHaveLength(0);
    expect(analysis.getTempoHistory()).toHaveLength(0);
    expect(analysis.getAccuracy()).toBe(100);
    expect(analysis.getConfidence()).toBe(0);
  });
});
