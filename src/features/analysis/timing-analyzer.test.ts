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
    const ts = generateTimestamps(60, 8);
    const bpm = detectTempo(ts);
    expect(bpm).not.toBeNull();
    expect(bpm!).toBeCloseTo(60, 0);
  });

  it('detects 120 BPM (500ms intervals)', () => {
    const ts = generateTimestamps(120, 8);
    const bpm = detectTempo(ts);
    expect(bpm).not.toBeNull();
    expect(bpm!).toBeCloseTo(120, 0);
  });

  it('detects 180 BPM (~333ms intervals)', () => {
    const ts = generateTimestamps(180, 8);
    const bpm = detectTempo(ts);
    expect(bpm).not.toBeNull();
    expect(bpm!).toBeCloseTo(180, 0);
  });

  it('detects tempo with small jitter', () => {
    const ts = addJitter(generateTimestamps(120, 8), 15);
    const bpm = detectTempo(ts);
    expect(bpm).not.toBeNull();
    expect(bpm!).toBeGreaterThan(110);
    expect(bpm!).toBeLessThan(130);
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

  it('detects shift from 80 BPM to 120 BPM', () => {
    // 120 BPM = 500ms intervals
    const intervals = [500, 500, 500, 500, 500, 500, 500, 500];
    const result = detectTempoShift(80, intervals);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(120, 0);
  });

  it('detects shift from 120 BPM to 80 BPM (deceleration)', () => {
    // 80 BPM = 750ms intervals
    const intervals = [750, 750, 750, 750, 750, 750, 750, 750];
    const result = detectTempoShift(120, intervals);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(80, 0);
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

  it('detects tempo after MIN_NOTES_FOR_TEMPO notes at 120 BPM', () => {
    const analysis = createTimingAnalysis();
    const timestamps = generateTimestamps(120, 6);
    for (const t of timestamps) {
      analysis.processNoteOn(t);
    }
    expect(analysis.getCurrentTempo()).not.toBeNull();
    expect(analysis.getCurrentTempo()!).toBeCloseTo(120, 0);
  });

  it('produces timing events after tempo is detected', () => {
    const analysis = createTimingAnalysis();
    const timestamps = generateTimestamps(120, 8);
    for (const t of timestamps) {
      analysis.processNoteOn(t);
    }
    const deviations = analysis.getDeviations();
    expect(deviations.length).toBeGreaterThan(0);
  });

  it('reports 100% accuracy for perfectly timed notes', () => {
    const analysis = createTimingAnalysis();
    const timestamps = generateTimestamps(120, 12);
    for (const t of timestamps) {
      analysis.processNoteOn(t);
    }
    expect(analysis.getAccuracy()).toBe(100);
  });

  it('reports reduced accuracy for imprecise notes', () => {
    const analysis = createTimingAnalysis();
    // First 4 notes establish tempo at 120 BPM
    const timestamps = generateTimestamps(120, 4);
    for (const t of timestamps) {
      analysis.processNoteOn(t);
    }
    // Then play 4 notes that are 50ms late each
    for (let i = 4; i < 8; i++) {
      analysis.processNoteOn(i * 500 + 50);
    }
    expect(analysis.getAccuracy()).toBeLessThan(100);
  });

  it('detects tempo shift (accelerando 80 -> 120 BPM)', () => {
    const analysis = createTimingAnalysis();
    // 10 notes at 80 BPM
    const slow = generateTimestamps(80, 10);
    for (const t of slow) {
      analysis.processNoteOn(t);
    }
    expect(analysis.getCurrentTempo()!).toBeCloseTo(80, 0);

    // 10 notes at 120 BPM continuing from last timestamp
    const lastTime = slow[slow.length - 1];
    const fast = generateTimestamps(120, 10, lastTime + 500);
    for (const t of fast) {
      analysis.processNoteOn(t);
    }

    // After shift, tempo should be closer to 120
    const tempo = analysis.getCurrentTempo();
    expect(tempo).not.toBeNull();
    expect(tempo!).toBeGreaterThan(100);

    // Should have at least one segment in history
    expect(analysis.getTempoHistory().length).toBeGreaterThanOrEqual(1);
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
    const timestamps = generateTimestamps(120, 8);
    for (const t of timestamps) {
      analysis.processNoteOn(t);
    }
    expect(analysis.getCurrentTempo()).not.toBeNull();

    analysis.reset();
    expect(analysis.getCurrentTempo()).toBeNull();
    expect(analysis.getDeviations()).toHaveLength(0);
    expect(analysis.getTempoHistory()).toHaveLength(0);
    expect(analysis.getAccuracy()).toBe(100);
  });
});
