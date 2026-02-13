/**
 * Progress Aggregator — Layer 3 Domain Logic (Story 7.4)
 *
 * Pure functions that compute trend lines from session metric data.
 * No framework imports, no side effects.
 */

import {
  TrendDimension,
  TrendDirection,
  TrendPeriod,
  type TrendDataPoint,
  type TrendLine,
  type ProgressSummary,
  type SessionMetric,
} from './engagement-types';
import { TREND_PERIODS, TREND_FLAT_THRESHOLD } from '@/lib/constants';

/**
 * Compute trend direction from a delta value relative to its start.
 * Delta as a fraction (e.g., 0.08 = 8% improvement).
 */
export function computeTrendDirection(
  startValue: number,
  endValue: number,
  threshold: number = TREND_FLAT_THRESHOLD
): TrendDirection {
  if (startValue === 0 && endValue === 0) return TrendDirection.Flat;

  const delta =
    startValue === 0 ? (endValue > 0 ? 1 : 0) : (endValue - startValue) / Math.abs(startValue);

  if (delta > threshold) return TrendDirection.Up;
  if (delta < -threshold) return TrendDirection.Down;
  return TrendDirection.Flat;
}

/**
 * Filter sessions to those within the specified period from today.
 */
export function filterByPeriod(
  sessions: SessionMetric[],
  period: TrendPeriod,
  referenceDate?: Date
): SessionMetric[] {
  const ref = referenceDate ?? new Date();
  const days = TREND_PERIODS[period];
  const cutoff = new Date(ref);
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  return sessions.filter((s) => s.date >= cutoffStr);
}

/**
 * Aggregate timing accuracy trend from session metrics.
 */
export function aggregateTimingTrend(
  sessions: SessionMetric[],
  period: TrendPeriod,
  referenceDate?: Date
): TrendLine {
  const filtered = filterByPeriod(sessions, period, referenceDate)
    .filter((s) => s.timingAccuracy !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  const dataPoints: TrendDataPoint[] = filtered.map((s) => ({
    date: s.date,
    value: Math.round((s.timingAccuracy as number) * 100),
  }));

  return buildTrendLine(TrendDimension.TimingAccuracy, dataPoints, '%');
}

/**
 * Aggregate harmonic complexity trend (unique chord count per session).
 */
export function aggregateHarmonicComplexityTrend(
  sessions: SessionMetric[],
  period: TrendPeriod,
  referenceDate?: Date
): TrendLine {
  const filtered = filterByPeriod(sessions, period, referenceDate).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const dataPoints: TrendDataPoint[] = filtered.map((s) => ({
    date: s.date,
    value: s.uniqueChords,
  }));

  return buildTrendLine(TrendDimension.HarmonicComplexity, dataPoints, ' chords');
}

/**
 * Aggregate speed trend (average clean tempo BPM).
 */
export function aggregateSpeedTrend(
  sessions: SessionMetric[],
  period: TrendPeriod,
  referenceDate?: Date
): TrendLine {
  const filtered = filterByPeriod(sessions, period, referenceDate)
    .filter((s) => s.averageTempo !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  const dataPoints: TrendDataPoint[] = filtered.map((s) => ({
    date: s.date,
    value: Math.round(s.averageTempo as number),
  }));

  return buildTrendLine(TrendDimension.Speed, dataPoints, ' BPM');
}

/**
 * Aggregate practice consistency trend (active minutes per session).
 */
export function aggregateConsistencyTrend(
  sessions: SessionMetric[],
  period: TrendPeriod,
  referenceDate?: Date
): TrendLine {
  const filtered = filterByPeriod(sessions, period, referenceDate).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const dataPoints: TrendDataPoint[] = filtered.map((s) => ({
    date: s.date,
    value: Math.round(s.durationMs / 60_000),
  }));

  return buildTrendLine(TrendDimension.Consistency, dataPoints, ' min');
}

/**
 * Build a TrendLine from data points with computed delta, direction, and insight.
 */
function buildTrendLine(
  dimension: TrendDimension,
  dataPoints: TrendDataPoint[],
  unit: string
): TrendLine {
  if (dataPoints.length === 0) {
    return {
      dimension,
      dataPoints: [],
      deltaFromStart: 0,
      currentValue: 0,
      bestInPeriod: 0,
      trendDirection: TrendDirection.Flat,
      insightText: 'Not enough data yet.',
    };
  }

  const startValue = dataPoints[0].value;
  const currentValue = dataPoints[dataPoints.length - 1].value;
  const bestInPeriod = Math.max(...dataPoints.map((p) => p.value));
  const deltaFromStart = currentValue - startValue;
  const trendDirection = computeTrendDirection(startValue, currentValue);
  const insightText = generateInsightText(
    dimension,
    dataPoints,
    currentValue,
    deltaFromStart,
    bestInPeriod,
    unit
  );

  return {
    dimension,
    dataPoints,
    deltaFromStart,
    currentValue,
    bestInPeriod,
    trendDirection,
    insightText,
  };
}

/**
 * Generate factual, Strava-style insight text for a trend dimension.
 */
export function generateInsightText(
  dimension: TrendDimension,
  dataPoints: TrendDataPoint[],
  currentValue: number,
  delta: number,
  bestInPeriod: number,
  unit: string
): string {
  if (dataPoints.length === 0) return 'Not enough data yet.';

  const label = DIMENSION_LABELS[dimension];
  const bestPoint = dataPoints.reduce(
    (best, p) => (p.value > best.value ? p : best),
    dataPoints[0]
  );
  const bestDay = formatDayName(bestPoint.date);

  if (bestInPeriod === currentValue && delta > 0) {
    return `${label} at personal best: ${currentValue}${unit}.`;
  }

  if (delta > 0) {
    return `${label} peaked ${bestDay} at ${bestInPeriod}${unit}.`;
  }

  if (delta < 0) {
    return `${label} best was ${bestInPeriod}${unit} ${bestDay}.`;
  }

  return `${label} steady at ${currentValue}${unit}.`;
}

const DIMENSION_LABELS: Record<TrendDimension, string> = {
  [TrendDimension.TimingAccuracy]: 'Timing accuracy',
  [TrendDimension.HarmonicComplexity]: 'Harmonic complexity',
  [TrendDimension.Speed]: 'Speed',
  [TrendDimension.Consistency]: 'Practice time',
};

/**
 * Format date as a day name (e.g., "Tuesday") or "today".
 */
function formatDayName(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  if (dateStr === todayStr) return 'today';

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === yesterday.toISOString().split('T')[0]) return 'yesterday';

  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Generate a complete progress summary across all four dimensions.
 */
export function generateProgressSummary(
  sessions: SessionMetric[],
  period: TrendPeriod,
  referenceDate?: Date
): ProgressSummary {
  return {
    trends: [
      aggregateTimingTrend(sessions, period, referenceDate),
      aggregateHarmonicComplexityTrend(sessions, period, referenceDate),
      aggregateSpeedTrend(sessions, period, referenceDate),
      aggregateConsistencyTrend(sessions, period, referenceDate),
    ],
    period,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Format a delta value as a human-readable string with direction.
 */
export function formatDelta(delta: number, unit: string): string {
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta}${unit}`;
}
