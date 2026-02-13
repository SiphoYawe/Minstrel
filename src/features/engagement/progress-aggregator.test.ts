import { describe, it, expect } from 'vitest';
import {
  computeTrendDirection,
  filterByPeriod,
  aggregateTimingTrend,
  aggregateHarmonicComplexityTrend,
  aggregateSpeedTrend,
  aggregateConsistencyTrend,
  generateProgressSummary,
  generateInsightText,
  formatDelta,
} from './progress-aggregator';
import {
  TrendDimension,
  TrendDirection,
  TrendPeriod,
  type SessionMetric,
  type TrendDataPoint,
} from './engagement-types';

function makeSession(overrides: Partial<SessionMetric> = {}): SessionMetric {
  return {
    sessionId: 'session-1',
    date: '2026-02-10',
    timingAccuracy: 0.75,
    uniqueChords: 5,
    averageTempo: 120,
    maxCleanTempo: 140,
    durationMs: 600_000, // 10 minutes
    ...overrides,
  };
}

const REF_DATE = new Date('2026-02-13T12:00:00Z');

describe('progress-aggregator', () => {
  describe('computeTrendDirection', () => {
    it('returns Up when delta exceeds threshold', () => {
      expect(computeTrendDirection(100, 105)).toBe(TrendDirection.Up);
    });

    it('returns Down when delta below negative threshold', () => {
      expect(computeTrendDirection(100, 95)).toBe(TrendDirection.Down);
    });

    it('returns Flat when delta within threshold', () => {
      expect(computeTrendDirection(100, 101)).toBe(TrendDirection.Flat);
    });

    it('returns Flat when both values are zero', () => {
      expect(computeTrendDirection(0, 0)).toBe(TrendDirection.Flat);
    });

    it('returns Up when start is zero and end is positive', () => {
      expect(computeTrendDirection(0, 10)).toBe(TrendDirection.Up);
    });

    it('uses custom threshold', () => {
      // 1% change with 5% threshold = flat
      expect(computeTrendDirection(100, 101, 0.05)).toBe(TrendDirection.Flat);
      // 6% change with 5% threshold = up
      expect(computeTrendDirection(100, 106, 0.05)).toBe(TrendDirection.Up);
    });
  });

  describe('filterByPeriod', () => {
    const sessions: SessionMetric[] = [
      makeSession({ date: '2025-11-15', sessionId: 's1' }), // 90 days ago
      makeSession({ date: '2026-01-20', sessionId: 's2' }), // ~24 days ago
      makeSession({ date: '2026-02-08', sessionId: 's3' }), // 5 days ago
      makeSession({ date: '2026-02-12', sessionId: 's4' }), // 1 day ago
    ];

    it('filters to last 7 days', () => {
      const result = filterByPeriod(sessions, TrendPeriod.SevenDays, REF_DATE);
      expect(result.map((s) => s.sessionId)).toEqual(['s3', 's4']);
    });

    it('filters to last 30 days', () => {
      const result = filterByPeriod(sessions, TrendPeriod.ThirtyDays, REF_DATE);
      expect(result.map((s) => s.sessionId)).toEqual(['s2', 's3', 's4']);
    });

    it('filters to last 90 days', () => {
      const result = filterByPeriod(sessions, TrendPeriod.NinetyDays, REF_DATE);
      expect(result.map((s) => s.sessionId)).toEqual(['s1', 's2', 's3', 's4']);
    });

    it('returns empty for no sessions in range', () => {
      const result = filterByPeriod(
        [makeSession({ date: '2025-01-01' })],
        TrendPeriod.SevenDays,
        REF_DATE
      );
      expect(result).toEqual([]);
    });
  });

  describe('aggregateTimingTrend', () => {
    it('computes timing trend from session data', () => {
      const sessions: SessionMetric[] = [
        makeSession({ date: '2026-02-08', timingAccuracy: 0.7 }),
        makeSession({ date: '2026-02-10', timingAccuracy: 0.75 }),
        makeSession({ date: '2026-02-12', timingAccuracy: 0.82 }),
      ];

      const result = aggregateTimingTrend(sessions, TrendPeriod.ThirtyDays, REF_DATE);
      expect(result.dimension).toBe(TrendDimension.TimingAccuracy);
      expect(result.dataPoints).toHaveLength(3);
      expect(result.dataPoints[0].value).toBe(70); // 0.70 * 100
      expect(result.dataPoints[2].value).toBe(82); // 0.82 * 100
      expect(result.currentValue).toBe(82);
      expect(result.deltaFromStart).toBe(12); // 82 - 70
      expect(result.bestInPeriod).toBe(82);
      expect(result.trendDirection).toBe(TrendDirection.Up);
    });

    it('skips sessions with null timing accuracy', () => {
      const sessions: SessionMetric[] = [
        makeSession({ date: '2026-02-08', timingAccuracy: 0.7 }),
        makeSession({ date: '2026-02-10', timingAccuracy: null }),
        makeSession({ date: '2026-02-12', timingAccuracy: 0.75 }),
      ];

      const result = aggregateTimingTrend(sessions, TrendPeriod.ThirtyDays, REF_DATE);
      expect(result.dataPoints).toHaveLength(2);
    });

    it('returns empty trend for no data', () => {
      const result = aggregateTimingTrend([], TrendPeriod.ThirtyDays, REF_DATE);
      expect(result.dataPoints).toHaveLength(0);
      expect(result.currentValue).toBe(0);
      expect(result.trendDirection).toBe(TrendDirection.Flat);
      expect(result.insightText).toBe('Not enough data yet.');
    });
  });

  describe('aggregateHarmonicComplexityTrend', () => {
    it('computes chord variety trend', () => {
      const sessions: SessionMetric[] = [
        makeSession({ date: '2026-02-08', uniqueChords: 3 }),
        makeSession({ date: '2026-02-10', uniqueChords: 5 }),
        makeSession({ date: '2026-02-12', uniqueChords: 8 }),
      ];

      const result = aggregateHarmonicComplexityTrend(sessions, TrendPeriod.ThirtyDays, REF_DATE);
      expect(result.dimension).toBe(TrendDimension.HarmonicComplexity);
      expect(result.currentValue).toBe(8);
      expect(result.bestInPeriod).toBe(8);
      expect(result.trendDirection).toBe(TrendDirection.Up);
    });
  });

  describe('aggregateSpeedTrend', () => {
    it('computes tempo trend in BPM', () => {
      const sessions: SessionMetric[] = [
        makeSession({ date: '2026-02-08', averageTempo: 100 }),
        makeSession({ date: '2026-02-10', averageTempo: 110 }),
        makeSession({ date: '2026-02-12', averageTempo: 120 }),
      ];

      const result = aggregateSpeedTrend(sessions, TrendPeriod.ThirtyDays, REF_DATE);
      expect(result.dimension).toBe(TrendDimension.Speed);
      expect(result.currentValue).toBe(120);
      expect(result.deltaFromStart).toBe(20);
      expect(result.trendDirection).toBe(TrendDirection.Up);
    });

    it('skips null average tempo', () => {
      const sessions: SessionMetric[] = [
        makeSession({ date: '2026-02-08', averageTempo: 100 }),
        makeSession({ date: '2026-02-10', averageTempo: null }),
      ];

      const result = aggregateSpeedTrend(sessions, TrendPeriod.ThirtyDays, REF_DATE);
      expect(result.dataPoints).toHaveLength(1);
    });
  });

  describe('aggregateConsistencyTrend', () => {
    it('computes practice time in minutes', () => {
      const sessions: SessionMetric[] = [
        makeSession({ date: '2026-02-08', durationMs: 300_000 }), // 5 min
        makeSession({ date: '2026-02-10', durationMs: 600_000 }), // 10 min
        makeSession({ date: '2026-02-12', durationMs: 900_000 }), // 15 min
      ];

      const result = aggregateConsistencyTrend(sessions, TrendPeriod.ThirtyDays, REF_DATE);
      expect(result.dimension).toBe(TrendDimension.Consistency);
      expect(result.dataPoints[0].value).toBe(5);
      expect(result.dataPoints[2].value).toBe(15);
      expect(result.currentValue).toBe(15);
      expect(result.trendDirection).toBe(TrendDirection.Up);
    });
  });

  describe('generateInsightText', () => {
    it('returns personal best text when current equals best and improving', () => {
      const points: TrendDataPoint[] = [
        { date: '2026-02-08', value: 70 },
        { date: '2026-02-12', value: 82 },
      ];
      const result = generateInsightText(TrendDimension.TimingAccuracy, points, 82, 12, 82, '%');
      expect(result).toBe('Timing accuracy at personal best: 82%.');
    });

    it('returns peaked text when improving but not at best', () => {
      const points: TrendDataPoint[] = [
        { date: '2026-02-08', value: 70 },
        { date: '2026-02-10', value: 85 },
        { date: '2026-02-12', value: 78 },
      ];
      const result = generateInsightText(TrendDimension.TimingAccuracy, points, 78, 8, 85, '%');
      expect(result).toMatch(/Timing accuracy peaked .* at 85%\./);
    });

    it('returns declining text for negative delta', () => {
      const points: TrendDataPoint[] = [
        { date: '2026-02-08', value: 82 },
        { date: '2026-02-12', value: 70 },
      ];
      const result = generateInsightText(TrendDimension.TimingAccuracy, points, 70, -12, 82, '%');
      expect(result).toMatch(/Timing accuracy best was 82%/);
    });

    it('returns steady text for zero delta', () => {
      const points: TrendDataPoint[] = [
        { date: '2026-02-08', value: 75 },
        { date: '2026-02-12', value: 75 },
      ];
      const result = generateInsightText(TrendDimension.Speed, points, 75, 0, 75, ' BPM');
      expect(result).toBe('Speed steady at 75 BPM.');
    });

    it('returns not enough data for empty points', () => {
      const result = generateInsightText(TrendDimension.Speed, [], 0, 0, 0, ' BPM');
      expect(result).toBe('Not enough data yet.');
    });
  });

  describe('generateProgressSummary', () => {
    it('generates all four dimensions', () => {
      const sessions: SessionMetric[] = [
        makeSession({ date: '2026-02-08', sessionId: 's1' }),
        makeSession({ date: '2026-02-10', sessionId: 's2' }),
        makeSession({ date: '2026-02-12', sessionId: 's3' }),
      ];

      const result = generateProgressSummary(sessions, TrendPeriod.ThirtyDays, REF_DATE);
      expect(result.trends).toHaveLength(4);
      expect(result.trends.map((t) => t.dimension)).toEqual([
        TrendDimension.TimingAccuracy,
        TrendDimension.HarmonicComplexity,
        TrendDimension.Speed,
        TrendDimension.Consistency,
      ]);
      expect(result.period).toBe(TrendPeriod.ThirtyDays);
      expect(result.generatedAt).toBeDefined();
    });

    it('handles single session', () => {
      const sessions: SessionMetric[] = [makeSession({ date: '2026-02-12' })];

      const result = generateProgressSummary(sessions, TrendPeriod.SevenDays, REF_DATE);
      expect(result.trends).toHaveLength(4);
      result.trends.forEach((t) => {
        expect(t.dataPoints.length).toBeLessThanOrEqual(1);
        expect(t.trendDirection).toBe(TrendDirection.Flat);
      });
    });

    it('detects downward trend correctly', () => {
      const sessions: SessionMetric[] = [
        makeSession({ date: '2026-02-08', timingAccuracy: 0.9 }),
        makeSession({ date: '2026-02-10', timingAccuracy: 0.8 }),
        makeSession({ date: '2026-02-12', timingAccuracy: 0.7 }),
      ];

      const result = generateProgressSummary(sessions, TrendPeriod.ThirtyDays, REF_DATE);
      const timing = result.trends.find((t) => t.dimension === TrendDimension.TimingAccuracy);
      expect(timing!.trendDirection).toBe(TrendDirection.Down);
      expect(timing!.deltaFromStart).toBe(-20); // 70 - 90
    });

    it('detects flat trend within threshold', () => {
      const sessions: SessionMetric[] = [
        makeSession({ date: '2026-02-08', timingAccuracy: 0.8 }),
        makeSession({ date: '2026-02-10', timingAccuracy: 0.8 }),
        makeSession({ date: '2026-02-12', timingAccuracy: 0.81 }),
      ];

      const result = generateProgressSummary(sessions, TrendPeriod.ThirtyDays, REF_DATE);
      const timing = result.trends.find((t) => t.dimension === TrendDimension.TimingAccuracy);
      expect(timing!.trendDirection).toBe(TrendDirection.Flat);
    });
  });

  describe('formatDelta', () => {
    it('formats positive delta with + sign', () => {
      expect(formatDelta(12, '%')).toBe('+12%');
    });

    it('formats negative delta', () => {
      expect(formatDelta(-5, ' BPM')).toBe('-5 BPM');
    });

    it('formats zero delta without sign', () => {
      expect(formatDelta(0, '%')).toBe('0%');
    });
  });
});
