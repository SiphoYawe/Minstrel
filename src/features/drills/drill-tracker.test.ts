// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  comparePerformance,
  measureTimingAccuracy,
  measureNoteAccuracy,
  measureTempoAdherence,
  calculateImprovementDelta,
  formatTimingDelta,
  formatAccuracyDelta,
  formatImprovementPercent,
  getDrillMessage,
  generateKeyInsight,
  toRepPerformance,
  TIMING_WINDOW_MS,
  DRILL_MESSAGES,
} from './drill-tracker';
import type { DrillRepResult } from './drill-tracker';
import type { MidiEvent } from '@/features/midi/midi-types';
import type { DrillNote } from './drill-types';
import type { SessionPerformanceData } from '@/features/difficulty/difficulty-types';

// --- Helpers ---

function makeNoteOn(note: number, timestamp: number): MidiEvent {
  return {
    type: 'note-on',
    note,
    noteName: `N${note}`,
    velocity: 80,
    channel: 0,
    timestamp,
    source: 'midi',
  };
}

function makeDrillNotes(): DrillNote[] {
  return [
    { midiNote: 60, duration: 1, velocity: 80, startBeat: 0 },
    { midiNote: 64, duration: 1, velocity: 80, startBeat: 1 },
    { midiNote: 67, duration: 1, velocity: 80, startBeat: 2 },
  ];
}

function makeRepResult(overrides: Partial<DrillRepResult> = {}): DrillRepResult {
  return {
    repNumber: 1,
    accuracy: 0.8,
    timingDeviationMs: 40,
    notesCorrect: 2,
    notesTotal: 3,
    tempoAchievedBpm: 120,
    completedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeSessionData(overrides: Partial<SessionPerformanceData> = {}): SessionPerformanceData {
  return {
    timingEvents: [],
    tempoSegments: [],
    detectedChords: [],
    genrePatterns: [],
    playingTendencies: null,
    avoidancePatterns: null,
    noteCount: 50,
    uniqueNoteRange: 24,
    maxCleanTempoBpm: 100,
    timingAccuracy: 75,
    ...overrides,
  };
}

// --- Tests ---

describe('comparePerformance', () => {
  it('returns correct accuracy when all notes match', () => {
    const targetTempo = 120; // 500ms per beat
    const start = 1000;
    const userNotes = [
      makeNoteOn(60, start), // beat 0
      makeNoteOn(64, start + 500), // beat 1
      makeNoteOn(67, start + 1000), // beat 2
    ];
    const drillNotes = makeDrillNotes();

    const result = comparePerformance(userNotes, drillNotes, targetTempo, start, 1);
    expect(result.accuracy).toBe(1);
    expect(result.notesCorrect).toBe(3);
    expect(result.notesTotal).toBe(3);
    expect(result.repNumber).toBe(1);
  });

  it('handles partial matches within timing window', () => {
    const targetTempo = 120;
    const start = 1000;
    const userNotes = [
      makeNoteOn(60, start + 50), // within window
      makeNoteOn(64, start + 500 + 150), // outside window (> 100ms)
      makeNoteOn(67, start + 1000 + 80), // within window
    ];
    const drillNotes = makeDrillNotes();

    const result = comparePerformance(userNotes, drillNotes, targetTempo, start, 1);
    expect(result.notesCorrect).toBe(2);
    expect(result.accuracy).toBeCloseTo(2 / 3, 5);
  });

  it('handles wrong pitches', () => {
    const targetTempo = 120;
    const start = 1000;
    const userNotes = [
      makeNoteOn(61, start), // wrong pitch
      makeNoteOn(64, start + 500), // correct
      makeNoteOn(68, start + 1000), // wrong pitch
    ];
    const drillNotes = makeDrillNotes();

    const result = comparePerformance(userNotes, drillNotes, targetTempo, start, 1);
    expect(result.notesCorrect).toBe(1);
    expect(result.accuracy).toBeCloseTo(1 / 3, 5);
  });

  it('calculates timing deviation for matched notes', () => {
    const targetTempo = 120;
    const start = 1000;
    const userNotes = [
      makeNoteOn(60, start + 30), // 30ms off
      makeNoteOn(64, start + 500 + 50), // 50ms off
      makeNoteOn(67, start + 1000 + 20), // 20ms off
    ];
    const drillNotes = makeDrillNotes();

    const result = comparePerformance(userNotes, drillNotes, targetTempo, start, 1);
    expect(result.timingDeviationMs).toBeCloseTo((30 + 50 + 20) / 3, 1);
  });

  it('returns zero deviation when no notes match', () => {
    const targetTempo = 120;
    const start = 1000;
    const userNotes: MidiEvent[] = [];
    const drillNotes = makeDrillNotes();

    const result = comparePerformance(userNotes, drillNotes, targetTempo, start, 1);
    expect(result.timingDeviationMs).toBe(0);
    expect(result.accuracy).toBe(0);
  });

  it('filters out note-off events from user input', () => {
    const targetTempo = 120;
    const start = 1000;
    const userNotes: MidiEvent[] = [
      makeNoteOn(60, start),
      { ...makeNoteOn(60, start + 200), type: 'note-off' }, // note-off, should be ignored
      makeNoteOn(64, start + 500),
    ];
    const drillNotes = makeDrillNotes();

    const result = comparePerformance(userNotes, drillNotes, targetTempo, start, 1);
    expect(result.notesCorrect).toBe(2); // Only note-ons count
  });
});

describe('measureTimingAccuracy', () => {
  it('calculates per-note deviations', () => {
    const targetTempo = 120;
    const start = 1000;
    const drillNotes = makeDrillNotes();
    const userNotes = [
      makeNoteOn(60, start + 20),
      makeNoteOn(64, start + 500 + 40),
      makeNoteOn(67, start + 1000 + 60),
    ];

    const result = measureTimingAccuracy(userNotes, drillNotes, targetTempo, start);
    expect(result.perNoteDeviations).toEqual([20, 40, 60]);
    expect(result.avgDeviationMs).toBe(40);
  });

  it('returns zero when no notes match', () => {
    const result = measureTimingAccuracy([], makeDrillNotes(), 120, 1000);
    expect(result.avgDeviationMs).toBe(0);
    expect(result.perNoteDeviations).toHaveLength(0);
  });
});

describe('measureNoteAccuracy', () => {
  it('counts correct notes within timing window', () => {
    const targetTempo = 120;
    const start = 1000;
    const userNotes = [makeNoteOn(60, start), makeNoteOn(64, start + 500)];

    const result = measureNoteAccuracy(userNotes, makeDrillNotes(), targetTempo, start);
    expect(result.correct).toBe(2);
    expect(result.total).toBe(3);
    expect(result.accuracyPercent).toBeCloseTo(2 / 3, 5);
  });

  it('returns zero accuracy for empty user notes', () => {
    const result = measureNoteAccuracy([], makeDrillNotes(), 120, 1000);
    expect(result.correct).toBe(0);
    expect(result.accuracyPercent).toBe(0);
  });

  it('returns zero accuracy for empty drill notes', () => {
    const result = measureNoteAccuracy([makeNoteOn(60, 1000)], [], 120, 1000);
    expect(result.total).toBe(0);
    expect(result.accuracyPercent).toBe(0);
  });
});

describe('measureTempoAdherence', () => {
  it('calculates actual BPM from note intervals', () => {
    // 120 BPM = 500ms between beats
    const userNotes = [makeNoteOn(60, 1000), makeNoteOn(64, 1500), makeNoteOn(67, 2000)];

    const result = measureTempoAdherence(userNotes, 120);
    expect(result.actualBpm).toBeCloseTo(120, 0);
    expect(result.deviationBpm).toBeCloseTo(0, 0);
  });

  it('detects faster tempo', () => {
    // Playing at 240 BPM = 250ms between beats
    const userNotes = [makeNoteOn(60, 1000), makeNoteOn(64, 1250), makeNoteOn(67, 1500)];

    const result = measureTempoAdherence(userNotes, 120);
    expect(result.actualBpm).toBeCloseTo(240, 0);
    expect(result.deviationBpm).toBeCloseTo(120, 0);
  });

  it('returns null for fewer than 2 notes', () => {
    const result = measureTempoAdherence([makeNoteOn(60, 1000)], 120);
    expect(result.actualBpm).toBeNull();
    expect(result.deviationBpm).toBeNull();
  });

  it('returns null for empty notes', () => {
    const result = measureTempoAdherence([], 120);
    expect(result.actualBpm).toBeNull();
  });
});

describe('calculateImprovementDelta', () => {
  it('shows improving trend when accuracy increases', () => {
    const reps = [
      makeRepResult({ repNumber: 1, accuracy: 0.5, timingDeviationMs: 80 }),
      makeRepResult({ repNumber: 2, accuracy: 0.7, timingDeviationMs: 60 }),
      makeRepResult({ repNumber: 3, accuracy: 0.85, timingDeviationMs: 40 }),
    ];

    const delta = calculateImprovementDelta(reps);
    expect(delta.trend).toBe('improving');
    expect(delta.overallImprovement).toBeGreaterThan(0);
    expect(delta.accuracyTrend).toEqual([0.5, 0.7, 0.85]);
    expect(delta.timingTrend).toEqual([80, 60, 40]);
  });

  it('shows declining trend when accuracy decreases', () => {
    const reps = [
      makeRepResult({ repNumber: 1, accuracy: 0.85 }),
      makeRepResult({ repNumber: 2, accuracy: 0.7 }),
      makeRepResult({ repNumber: 3, accuracy: 0.5 }),
    ];

    const delta = calculateImprovementDelta(reps);
    expect(delta.trend).toBe('declining');
    expect(delta.overallImprovement).toBeLessThan(0);
  });

  it('shows stable trend when accuracy stays flat', () => {
    const reps = [
      makeRepResult({ repNumber: 1, accuracy: 0.75 }),
      makeRepResult({ repNumber: 2, accuracy: 0.77 }),
      makeRepResult({ repNumber: 3, accuracy: 0.76 }),
    ];

    const delta = calculateImprovementDelta(reps);
    expect(delta.trend).toBe('stable');
  });

  it('returns null improvement for single rep', () => {
    const reps = [makeRepResult()];
    const delta = calculateImprovementDelta(reps);
    expect(delta.overallImprovement).toBeNull();
    expect(delta.trend).toBe('stable');
  });

  it('returns empty trends for no reps', () => {
    const delta = calculateImprovementDelta([]);
    expect(delta.timingTrend).toHaveLength(0);
    expect(delta.accuracyTrend).toHaveLength(0);
  });
});

describe('formatTimingDelta', () => {
  it('formats timing values across reps', () => {
    const reps = [
      makeRepResult({ timingDeviationMs: 400 }),
      makeRepResult({ timingDeviationMs: 280 }),
      makeRepResult({ timingDeviationMs: 180 }),
    ];
    expect(formatTimingDelta(reps)).toBe('400ms \u2192 280ms \u2192 180ms');
  });

  it('rounds to integers', () => {
    const reps = [
      makeRepResult({ timingDeviationMs: 45.7 }),
      makeRepResult({ timingDeviationMs: 32.3 }),
    ];
    expect(formatTimingDelta(reps)).toBe('46ms \u2192 32ms');
  });

  it('handles single rep', () => {
    expect(formatTimingDelta([makeRepResult({ timingDeviationMs: 50 })])).toBe('50ms');
  });
});

describe('formatAccuracyDelta', () => {
  it('formats accuracy as percentages', () => {
    const reps = [
      makeRepResult({ accuracy: 0.65 }),
      makeRepResult({ accuracy: 0.78 }),
      makeRepResult({ accuracy: 0.88 }),
    ];
    expect(formatAccuracyDelta(reps)).toBe('65% \u2192 78% \u2192 88%');
  });
});

describe('formatImprovementPercent', () => {
  it('formats positive improvement', () => {
    expect(formatImprovementPercent(0.5, 0.85)).toBe('\u2191 70%');
  });

  it('formats negative change', () => {
    expect(formatImprovementPercent(0.85, 0.5)).toBe('\u2193 41%');
  });

  it('returns null for zero baseline', () => {
    expect(formatImprovementPercent(0, 0.5)).toBeNull();
  });
});

describe('getDrillMessage', () => {
  it('returns FIRST_REP for empty history', () => {
    expect(getDrillMessage([])).toBe(DRILL_MESSAGES.FIRST_REP);
  });

  it('returns FIRST_REP for single rep', () => {
    expect(getDrillMessage([makeRepResult()])).toBe(DRILL_MESSAGES.FIRST_REP);
  });

  it('returns IMPROVING when accuracy goes up', () => {
    const reps = [
      makeRepResult({ accuracy: 0.5 }),
      makeRepResult({ accuracy: 0.7 }),
      makeRepResult({ accuracy: 0.85 }),
    ];
    expect(getDrillMessage(reps)).toBe(DRILL_MESSAGES.IMPROVING);
  });

  it('returns DECLINING when accuracy goes down', () => {
    const reps = [makeRepResult({ accuracy: 0.85 }), makeRepResult({ accuracy: 0.6 })];
    expect(getDrillMessage(reps)).toBe(DRILL_MESSAGES.DECLINING);
  });

  it('returns STABLE when accuracy stays flat', () => {
    const reps = [makeRepResult({ accuracy: 0.75 }), makeRepResult({ accuracy: 0.77 })];
    expect(getDrillMessage(reps)).toBe(DRILL_MESSAGES.STABLE);
  });
});

describe('generateKeyInsight', () => {
  it('identifies slow chord transitions as weakness', () => {
    const data = makeSessionData({
      detectedChords: [
        { root: 'C', quality: 'Major', notes: [], timestamp: 1000 },
        { root: 'A', quality: 'Minor', notes: [], timestamp: 1800 },
      ],
    });

    const insight = generateKeyInsight(data);
    expect(insight).not.toBeNull();
    expect(insight!.weakness).toBe('Chord transitions');
    expect(insight!.description).toContain('C to Am');
    expect(insight!.description).toContain('800ms');
    expect(insight!.canGenerateDrill).toBe(true);
  });

  it('identifies timing issues when accuracy is low', () => {
    const data = makeSessionData({
      timingAccuracy: 60,
      timingEvents: [
        { noteTimestamp: 1000, expectedBeatTimestamp: 1000, deviationMs: 50, beatIndex: 0 },
        { noteTimestamp: 1550, expectedBeatTimestamp: 1500, deviationMs: 50, beatIndex: 1 },
        { noteTimestamp: 2100, expectedBeatTimestamp: 2000, deviationMs: 100, beatIndex: 2 },
      ],
    });

    const insight = generateKeyInsight(data);
    expect(insight).not.toBeNull();
    expect(insight!.weakness).toBe('Timing consistency');
    expect(insight!.canGenerateDrill).toBe(true);
  });

  it('identifies key avoidance patterns', () => {
    const data = makeSessionData({
      timingAccuracy: 90,
      avoidancePatterns: {
        avoidedKeys: ['F# major', 'Bb major'],
        avoidedChordTypes: [],
        commonIntervals: [3, 5],
      },
    });

    const insight = generateKeyInsight(data);
    expect(insight).not.toBeNull();
    expect(insight!.weakness).toBe('Unfamiliar keys');
    expect(insight!.description).toContain('F# major');
  });

  it('identifies speed ceiling', () => {
    const data = makeSessionData({
      timingAccuracy: 90,
      maxCleanTempoBpm: 85,
    });

    const insight = generateKeyInsight(data);
    expect(insight).not.toBeNull();
    expect(insight!.weakness).toBe('Speed ceiling');
    expect(insight!.description).toContain('85 BPM');
  });

  it('returns null when no weaknesses found', () => {
    const data = makeSessionData({
      timingAccuracy: 95,
      maxCleanTempoBpm: 150,
      detectedChords: [],
      avoidancePatterns: null,
    });

    const insight = generateKeyInsight(data);
    expect(insight).toBeNull();
  });

  it('prioritizes highest-impact insight', () => {
    const data = makeSessionData({
      timingAccuracy: 60,
      maxCleanTempoBpm: 80,
      timingEvents: [
        { noteTimestamp: 1000, expectedBeatTimestamp: 1000, deviationMs: 80, beatIndex: 0 },
        { noteTimestamp: 1550, expectedBeatTimestamp: 1500, deviationMs: 80, beatIndex: 1 },
      ],
      detectedChords: [
        { root: 'C', quality: 'Major', notes: [], timestamp: 1000 },
        { root: 'G', quality: 'Major', notes: [], timestamp: 2500 },
      ],
    });

    const insight = generateKeyInsight(data);
    expect(insight).not.toBeNull();
    // Chord transitions should win because 1500ms gap * 2 = 3000 impact
    // vs timing 80ms * 1.5 = 120 impact
    expect(insight!.weakness).toBe('Chord transitions');
  });

  it('uses growth mindset language (no negative framing)', () => {
    const data = makeSessionData({
      timingAccuracy: 60,
      timingEvents: [
        { noteTimestamp: 1000, expectedBeatTimestamp: 1000, deviationMs: 80, beatIndex: 0 },
      ],
    });

    const insight = generateKeyInsight(data);
    expect(insight).not.toBeNull();
    expect(insight!.description).not.toContain('fail');
    expect(insight!.description).not.toContain('wrong');
    expect(insight!.description).not.toContain('bad');
    expect(insight!.description).not.toContain('error');
  });

  it('ignores very fast chord transitions (< 200ms)', () => {
    const data = makeSessionData({
      timingAccuracy: 90,
      maxCleanTempoBpm: 150,
      detectedChords: [
        { root: 'C', quality: 'Major', notes: [], timestamp: 1000 },
        { root: 'G', quality: 'Major', notes: [], timestamp: 1100 },
      ],
    });

    const insight = generateKeyInsight(data);
    expect(insight).toBeNull();
  });
});

describe('toRepPerformance', () => {
  it('converts DrillRepResult to RepPerformance', () => {
    const result = makeRepResult({
      repNumber: 2,
      accuracy: 0.75,
      timingDeviationMs: 45,
      completedAt: '2026-01-01T00:00:00Z',
    });

    const perf = toRepPerformance(result);
    expect(perf.repNumber).toBe(2);
    expect(perf.accuracy).toBe(0.75);
    expect(perf.timingDeviation).toBe(45);
    expect(perf.completedAt).toBe('2026-01-01T00:00:00Z');
  });
});
