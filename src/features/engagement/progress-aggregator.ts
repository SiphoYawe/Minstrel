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

/** Actionable suggestions per trend dimension and direction. */
const ACTION_SUGGESTIONS: Record<
  TrendDimension,
  { atBest: string; improving: string; declining: string; steady: string }
> = {
  [TrendDimension.TimingAccuracy]: {
    atBest: 'Try extending to scales or faster tempos.',
    improving: 'Keep this momentum — try a drill at the next BPM tier.',
    declining: 'Try slowing down 10 BPM and focus on accuracy first.',
    steady: 'Try a new rhythm pattern to push further.',
  },
  [TrendDimension.HarmonicComplexity]: {
    atBest: 'Explore a new genre to expand your chord vocabulary.',
    improving: 'Try adding 7th or extended chords to your practice.',
    declining: 'Revisit chord voicings — try a jazz or classical drill.',
    steady: "Try a progression you haven't played before.",
  },
  [TrendDimension.Speed]: {
    atBest: 'Try maintaining this tempo with a more complex piece.',
    improving: 'Gradually increase tempo by 5 BPM per session.',
    declining: 'Focus on clean notes at a comfortable tempo first.',
    steady: 'Try a speed drill to push your comfortable range.',
  },
  [TrendDimension.Consistency]: {
    atBest: 'Great dedication — longer sessions build muscle memory.',
    improving: 'Your practice volume is growing — keep it up.',
    declining: 'Even 10 minutes counts. Try a short warm-up drill.',
    steady: 'Try varying session length to keep practice fresh.',
  },
};

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

  const suggestion = ACTION_SUGGESTIONS[dimension];

  if (bestInPeriod === currentValue && delta > 0) {
    return `${label} at personal best: ${currentValue}${unit}. ${suggestion.atBest}`;
  }

  if (delta > 0) {
    return `${label} peaked ${bestDay} at ${bestInPeriod}${unit}. ${suggestion.improving}`;
  }

  if (delta < 0) {
    return `${label} best was ${bestInPeriod}${unit} ${bestDay}. ${suggestion.declining}`;
  }

  return `${label} steady at ${currentValue}${unit}. ${suggestion.steady}`;
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
