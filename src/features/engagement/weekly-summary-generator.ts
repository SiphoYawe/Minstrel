/**
 * Weekly Summary Generator — Layer 3 Domain Logic (Story 7.5)
 *
 * Pure functions that compute weekly progress summaries from session data.
 * No framework imports, no side effects.
 */

import {
  TrendDirection,
  type SessionMetric,
  type WeeklySummary,
  type WeeklyMetricDelta,
  type WeeklyComparison,
} from './engagement-types';
import { TREND_FLAT_THRESHOLD, WEEK_START_DAY } from '@/lib/constants';

/**
 * Get ISO week bounds (Monday 00:00 to Sunday 23:59:59) for the week
 * containing the given date.
 */
export function getISOWeekBounds(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diffToMonday = day === 0 ? -6 : WEEK_START_DAY - day;

  const start = new Date(d);
  start.setDate(d.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Calculate total practice time in milliseconds.
 */
export function calculateTotalPracticeTime(sessions: SessionMetric[]): number {
  return sessions.reduce((sum, s) => sum + s.durationMs, 0);
}

/**
 * Format milliseconds as human-readable time string (e.g., "2h 47m" or "32m").
 */
export function formatPracticeTime(ms: number): string {
  const totalMinutes = Math.round(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/**
 * Calculate the average of a numeric metric across sessions, ignoring nulls.
 */
function averageMetric(
  sessions: SessionMetric[],
  accessor: (s: SessionMetric) => number | null
): number | null {
  const values = sessions.map(accessor).filter((v): v is number => v !== null);
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Calculate max of a numeric metric across sessions, ignoring nulls.
 */
function maxMetric(
  sessions: SessionMetric[],
  accessor: (s: SessionMetric) => number | null
): number | null {
  const values = sessions.map(accessor).filter((v): v is number => v !== null);
  if (values.length === 0) return null;
  return Math.max(...values);
}

/**
 * Compute delta direction from current and previous values.
 */
function deltaDirection(current: number, previous: number | null): TrendDirection {
  if (previous === null) return TrendDirection.Flat;
  if (previous === 0 && current === 0) return TrendDirection.Flat;

  const delta = previous === 0 ? (current > 0 ? 1 : 0) : (current - previous) / Math.abs(previous);

  if (delta > TREND_FLAT_THRESHOLD) return TrendDirection.Up;
  if (delta < -TREND_FLAT_THRESHOLD) return TrendDirection.Down;
  return TrendDirection.Flat;
}

/**
 * Compute delta percentage between current and previous value.
 */
function deltaPercent(current: number, previous: number | null): number | null {
  if (previous === null) return null;
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

/**
 * Calculate week-over-week metric deltas.
 */
export function calculateMetricDeltas(
  currentWeek: SessionMetric[],
  previousWeek: SessionMetric[]
): WeeklyMetricDelta[] {
  const hasPrev = previousWeek.length > 0;
  const deltas: WeeklyMetricDelta[] = [];

  // Timing accuracy (average)
  const curTiming = averageMetric(currentWeek, (s) => s.timingAccuracy);
  const prevTiming = hasPrev ? averageMetric(previousWeek, (s) => s.timingAccuracy) : null;
  if (curTiming !== null) {
    const curPct = Math.round(curTiming * 100);
    const prevPct = prevTiming !== null ? Math.round(prevTiming * 100) : null;
    deltas.push({
      metricName: 'Timing accuracy',
      currentValue: curPct,
      previousValue: prevPct,
      deltaPercent: prevPct !== null ? curPct - prevPct : null,
      direction: deltaDirection(curPct, prevPct),
    });
  }

  // Harmonic complexity (average unique chords)
  const curChords = averageMetric(currentWeek, (s) => s.uniqueChords);
  const prevChords = hasPrev ? averageMetric(previousWeek, (s) => s.uniqueChords) : null;
  if (curChords !== null) {
    const cur = Math.round(curChords);
    const prev = prevChords !== null ? Math.round(prevChords) : null;
    deltas.push({
      metricName: 'Harmonic complexity',
      currentValue: cur,
      previousValue: prev,
      deltaPercent: deltaPercent(cur, prev),
      direction: deltaDirection(cur, prev),
    });
  }

  // Max clean tempo
  const curTempo = maxMetric(currentWeek, (s) => s.maxCleanTempo);
  const prevTempo = hasPrev ? maxMetric(previousWeek, (s) => s.maxCleanTempo) : null;
  if (curTempo !== null) {
    const cur = Math.round(curTempo);
    const prev = prevTempo !== null ? Math.round(prevTempo) : null;
    deltas.push({
      metricName: 'Max tempo',
      currentValue: cur,
      previousValue: prev,
      deltaPercent: deltaPercent(cur, prev),
      direction: deltaDirection(cur, prev),
    });
  }

  // Practice consistency (total minutes)
  const curMinutes = Math.round(calculateTotalPracticeTime(currentWeek) / 60_000);
  const prevMinutes = hasPrev
    ? Math.round(calculateTotalPracticeTime(previousWeek) / 60_000)
    : null;
  deltas.push({
    metricName: 'Practice time',
    currentValue: curMinutes,
    previousValue: prevMinutes,
    deltaPercent: deltaPercent(curMinutes, prevMinutes),
    direction: deltaDirection(curMinutes, prevMinutes),
  });

  return deltas;
}

/**
 * Identify the highest-impact insight of the week.
 * Selects the metric with the largest absolute delta percentage.
 */
export function identifyHighestImpactInsight(deltas: WeeklyMetricDelta[]): string {
  const withDelta = deltas.filter((d) => d.deltaPercent !== null);
  if (withDelta.length === 0) {
    return 'First week of data. Baseline established.';
  }

  const sorted = [...withDelta].sort(
    (a, b) => Math.abs(b.deltaPercent!) - Math.abs(a.deltaPercent!)
  );
  const top = sorted[0];

  if (top.deltaPercent! > 0) {
    return `Biggest improvement: ${top.metricName.toLowerCase()} up ${top.deltaPercent}% this week.`;
  }

  if (top.deltaPercent! < 0) {
    return `Focus area: ${top.metricName.toLowerCase()} dipped ${Math.abs(top.deltaPercent!)}% this week.`;
  }

  return 'All metrics steady this week.';
}

/**
 * Compute a full weekly summary from session data.
 */
export function computeWeeklySummary(
  currentWeekSessions: SessionMetric[],
  previousWeekSessions: SessionMetric[],
  personalRecordsCount: number,
  referenceDate?: Date
): WeeklySummary {
  const ref = referenceDate ?? new Date();
  const { start, end } = getISOWeekBounds(ref);

  const totalPracticeMs = calculateTotalPracticeTime(currentWeekSessions);
  const sessionCount = currentWeekSessions.length;
  const drillsCompleted = currentWeekSessions.reduce((sum, s) => sum + (s.drillsCompleted ?? 0), 0);

  const metricDeltas = calculateMetricDeltas(currentWeekSessions, previousWeekSessions);
  const highestImpactInsight = identifyHighestImpactInsight(metricDeltas);

  const hasPrevious = previousWeekSessions.length > 0;
  const previousWeekComparison: WeeklyComparison | null = hasPrevious
    ? {
        totalTimeDeltaMs: totalPracticeMs - calculateTotalPracticeTime(previousWeekSessions),
        sessionCountDelta: sessionCount - previousWeekSessions.length,
        metricDeltas,
      }
    : null;

  return {
    weekStartDate: formatDateISO(start),
    weekEndDate: formatDateISO(end),
    totalPracticeMs,
    sessionCount,
    drillsCompleted,
    personalRecordsSet: personalRecordsCount,
    metricDeltas,
    highestImpactInsight,
    previousWeekComparison,
  };
}

function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}
