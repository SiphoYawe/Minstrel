import { describe, it, expect } from 'vitest';
import {
  getISOWeekBounds,
  calculateTotalPracticeTime,
  formatPracticeTime,
  calculateMetricDeltas,
  identifyHighestImpactInsight,
  computeWeeklySummary,
} from './weekly-summary-generator';
import { TrendDirection, type SessionMetric } from './engagement-types';

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

describe('weekly-summary-generator', () => {
  describe('getISOWeekBounds', () => {
    it('returns Monday-Sunday for a Wednesday', () => {
      const date = new Date('2026-02-11T15:00:00Z'); // Wednesday
      const { start, end } = getISOWeekBounds(date);
      expect(start.getDay()).toBe(1); // Monday
      expect(end.getDay()).toBe(0); // Sunday
      expect(start.getDate()).toBe(9); // Feb 9
      expect(end.getDate()).toBe(15); // Feb 15
    });

    it('returns correct bounds for a Monday', () => {
      const date = new Date('2026-02-09T10:00:00Z'); // Monday
      const { start, end } = getISOWeekBounds(date);
      expect(start.getDate()).toBe(9);
      expect(end.getDate()).toBe(15);
    });

    it('returns correct bounds for a Sunday', () => {
      const date = new Date('2026-02-15T10:00:00Z'); // Sunday
      const { start, end } = getISOWeekBounds(date);
      expect(start.getDate()).toBe(9); // Previous Monday
      expect(end.getDate()).toBe(15); // This Sunday
    });

    it('start is at midnight', () => {
      const { start } = getISOWeekBounds(new Date('2026-02-11T15:00:00'));
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);
    });

    it('end is at 23:59:59', () => {
      const { end } = getISOWeekBounds(new Date('2026-02-11T15:00:00'));
      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
      expect(end.getSeconds()).toBe(59);
    });
  });

  describe('calculateTotalPracticeTime', () => {
    it('sums all session durations', () => {
      const sessions = [
        makeSession({ durationMs: 300_000 }),
        makeSession({ durationMs: 600_000 }),
        makeSession({ durationMs: 150_000 }),
      ];
      expect(calculateTotalPracticeTime(sessions)).toBe(1_050_000);
    });

    it('returns 0 for empty array', () => {
      expect(calculateTotalPracticeTime([])).toBe(0);
    });
  });

  describe('formatPracticeTime', () => {
    it('formats minutes only', () => {
      expect(formatPracticeTime(300_000)).toBe('5m');
    });

    it('formats hours and minutes', () => {
      expect(formatPracticeTime(10_020_000)).toBe('2h 47m');
    });

    it('formats exact hours', () => {
      expect(formatPracticeTime(3_600_000)).toBe('1h');
    });

    it('formats zero as 0m', () => {
      expect(formatPracticeTime(0)).toBe('0m');
    });
  });

  describe('calculateMetricDeltas', () => {
    it('computes deltas between current and previous week', () => {
      const current = [
        makeSession({
          timingAccuracy: 0.8,
          uniqueChords: 8,
          maxCleanTempo: 150,
          durationMs: 600_000,
        }),
      ];
      const previous = [
        makeSession({
          timingAccuracy: 0.7,
          uniqueChords: 5,
          maxCleanTempo: 130,
          durationMs: 300_000,
        }),
      ];

      const deltas = calculateMetricDeltas(current, previous);

      const timing = deltas.find((d) => d.metricName === 'Timing accuracy');
      expect(timing).toBeDefined();
      expect(timing!.currentValue).toBe(80);
      expect(timing!.previousValue).toBe(70);
      expect(timing!.deltaPercent).toBe(10); // 80 - 70
      expect(timing!.direction).toBe(TrendDirection.Up);
    });

    it('returns null deltas when no previous week', () => {
      const current = [makeSession({ timingAccuracy: 0.8 })];
      const deltas = calculateMetricDeltas(current, []);

      const timing = deltas.find((d) => d.metricName === 'Timing accuracy');
      expect(timing).toBeDefined();
      expect(timing!.previousValue).toBeNull();
      expect(timing!.deltaPercent).toBeNull();
    });

    it('detects downward trend', () => {
      const current = [makeSession({ timingAccuracy: 0.65 })];
      const previous = [makeSession({ timingAccuracy: 0.8 })];
      const deltas = calculateMetricDeltas(current, previous);

      const timing = deltas.find((d) => d.metricName === 'Timing accuracy');
      expect(timing!.direction).toBe(TrendDirection.Down);
    });

    it('detects flat trend within threshold', () => {
      const current = [makeSession({ timingAccuracy: 0.8 })];
      const previous = [makeSession({ timingAccuracy: 0.8 })];
      const deltas = calculateMetricDeltas(current, previous);

      const timing = deltas.find((d) => d.metricName === 'Timing accuracy');
      expect(timing!.direction).toBe(TrendDirection.Flat);
    });

    it('includes practice time metric', () => {
      const current = [makeSession({ durationMs: 600_000 })];
      const previous = [makeSession({ durationMs: 300_000 })];
      const deltas = calculateMetricDeltas(current, previous);

      const time = deltas.find((d) => d.metricName === 'Practice time');
      expect(time).toBeDefined();
      expect(time!.currentValue).toBe(10);
      expect(time!.previousValue).toBe(5);
    });
  });

  describe('identifyHighestImpactInsight', () => {
    it('picks the metric with the largest positive delta', () => {
      const deltas = [
        {
          metricName: 'Timing accuracy',
          currentValue: 80,
          previousValue: 70,
          deltaPercent: 10,
          direction: TrendDirection.Up,
        },
        {
          metricName: 'Max tempo',
          currentValue: 150,
          previousValue: 130,
          deltaPercent: 15,
          direction: TrendDirection.Up,
        },
      ];

      const insight = identifyHighestImpactInsight(deltas);
      expect(insight).toContain('max tempo');
      expect(insight).toContain('15%');
      expect(insight).toContain('Biggest improvement');
    });

    it('picks the metric with the largest negative delta as focus area', () => {
      const deltas = [
        {
          metricName: 'Timing accuracy',
          currentValue: 65,
          previousValue: 80,
          deltaPercent: -15,
          direction: TrendDirection.Down,
        },
        {
          metricName: 'Max tempo',
          currentValue: 130,
          previousValue: 125,
          deltaPercent: 5,
          direction: TrendDirection.Up,
        },
      ];

      const insight = identifyHighestImpactInsight(deltas);
      expect(insight).toContain('timing accuracy');
      expect(insight).toContain('15%');
      expect(insight).toContain('Focus area');
    });

    it('returns first week message when no deltas have values', () => {
      const deltas = [
        {
          metricName: 'Timing accuracy',
          currentValue: 80,
          previousValue: null,
          deltaPercent: null,
          direction: TrendDirection.Flat,
        },
      ];

      const insight = identifyHighestImpactInsight(deltas);
      expect(insight).toBe('First week of data. Baseline established.');
    });

    it('returns steady message when all deltas are zero', () => {
      const deltas = [
        {
          metricName: 'Timing accuracy',
          currentValue: 80,
          previousValue: 80,
          deltaPercent: 0,
          direction: TrendDirection.Flat,
        },
      ];

      const insight = identifyHighestImpactInsight(deltas);
      expect(insight).toBe('All metrics steady this week.');
    });

    it('does not use celebratory language', () => {
      const deltas = [
        {
          metricName: 'Timing accuracy',
          currentValue: 95,
          previousValue: 50,
          deltaPercent: 45,
          direction: TrendDirection.Up,
        },
      ];

      const insight = identifyHighestImpactInsight(deltas);
      expect(insight).not.toMatch(/great|amazing|awesome|fantastic|well done|keep it up|congrat/i);
    });
  });

  describe('computeWeeklySummary', () => {
    it('computes a full summary with previous week', () => {
      const current = [
        makeSession({ sessionId: 's1', durationMs: 600_000, drillsCompleted: 3 }),
        makeSession({ sessionId: 's2', durationMs: 900_000, drillsCompleted: 2 }),
      ];
      const previous = [makeSession({ sessionId: 's3', durationMs: 300_000 })];

      const summary = computeWeeklySummary(current, previous, 1, new Date('2026-02-12T10:00:00'));

      expect(summary.sessionCount).toBe(2);
      expect(summary.totalPracticeMs).toBe(1_500_000);
      expect(summary.drillsCompleted).toBe(5);
      expect(summary.personalRecordsSet).toBe(1);
      expect(summary.metricDeltas.length).toBeGreaterThan(0);
      expect(summary.highestImpactInsight).toBeTruthy();
      expect(summary.previousWeekComparison).not.toBeNull();
      expect(summary.previousWeekComparison!.sessionCountDelta).toBe(1);
    });

    it('computes summary without previous week', () => {
      const current = [makeSession({ sessionId: 's1' })];

      const summary = computeWeeklySummary(current, [], 0, new Date('2026-02-12T10:00:00'));

      expect(summary.sessionCount).toBe(1);
      expect(summary.previousWeekComparison).toBeNull();
      expect(summary.highestImpactInsight).toBe('First week of data. Baseline established.');
    });

    it('includes valid week start/end dates', () => {
      const current = [makeSession()];
      const summary = computeWeeklySummary(current, [], 0, new Date('2026-02-12T10:00:00'));

      expect(summary.weekStartDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(summary.weekEndDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
