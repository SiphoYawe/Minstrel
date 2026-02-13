'use client';

import { useProgressTrends } from '@/features/engagement/use-progress-trends';
import {
  TrendPeriod,
  TrendDirection,
  TrendDimension,
  type TrendLine,
  type TrendDataPoint,
} from '@/features/engagement/engagement-types';
import { formatDelta } from '@/features/engagement/progress-aggregator';

const PERIODS: { value: TrendPeriod; label: string }[] = [
  { value: TrendPeriod.SevenDays, label: '7d' },
  { value: TrendPeriod.ThirtyDays, label: '30d' },
  { value: TrendPeriod.NinetyDays, label: '90d' },
];

const DIMENSION_META: Record<TrendDimension, { label: string; unit: string; shortUnit: string }> = {
  [TrendDimension.TimingAccuracy]: { label: 'Timing Accuracy', unit: '%', shortUnit: '%' },
  [TrendDimension.HarmonicComplexity]: {
    label: 'Harmonic Complexity',
    unit: ' chords',
    shortUnit: 'chords',
  },
  [TrendDimension.Speed]: { label: 'Speed', unit: ' BPM', shortUnit: 'BPM' },
  [TrendDimension.Consistency]: { label: 'Practice Time', unit: ' min', shortUnit: 'min' },
};

const CHART_W = 320;
const CHART_H = 120;
const PAD_X = 28;
const PAD_Y = 16;
const INNER_W = CHART_W - PAD_X * 2;
const INNER_H = CHART_H - PAD_Y * 2;

function trendColor(direction: TrendDirection): string {
  if (direction === TrendDirection.Up) return 'hsl(var(--accent-success))';
  if (direction === TrendDirection.Down) return 'hsl(var(--accent-warm))';
  return 'hsl(var(--muted-foreground))';
}

function directionArrow(direction: TrendDirection): string {
  if (direction === TrendDirection.Up) return '\u2191';
  if (direction === TrendDirection.Down) return '\u2193';
  return '\u2192';
}

function directionWord(direction: TrendDirection): string {
  if (direction === TrendDirection.Up) return 'up';
  if (direction === TrendDirection.Down) return 'down';
  return 'steady';
}

/** Map data points to SVG coordinate space. */
function toSvgPoints(dataPoints: TrendDataPoint[]): { x: number; y: number }[] {
  if (dataPoints.length === 0) return [];
  if (dataPoints.length === 1) {
    return [{ x: PAD_X + INNER_W / 2, y: PAD_Y + INNER_H / 2 }];
  }

  const values = dataPoints.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return dataPoints.map((point, i) => ({
    x: PAD_X + (i / (dataPoints.length - 1)) * INNER_W,
    y: PAD_Y + INNER_H - ((point.value - min) / range) * INNER_H,
  }));
}

/** Format a date string as short month/day (e.g., "2/13"). */
function shortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function TrendChart({ trend, period }: { trend: TrendLine; period: TrendPeriod }) {
  const meta = DIMENSION_META[trend.dimension];
  const color = trendColor(trend.trendDirection);
  const points = toSvgPoints(trend.dataPoints);
  const polylineStr = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Build gradient area path (fill under curve)
  const areaPath =
    points.length > 1
      ? `M${points[0].x},${CHART_H - PAD_Y} ` +
        points.map((p) => `L${p.x},${p.y}`).join(' ') +
        ` L${points[points.length - 1].x},${CHART_H - PAD_Y} Z`
      : '';

  // Grid lines — 3 horizontal
  const gridYs = [PAD_Y, PAD_Y + INNER_H / 2, PAD_Y + INNER_H];

  // Value range for Y-axis labels
  const values = trend.dataPoints.map((p) => p.value);
  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 0;
  const mid = Math.round((min + max) / 2);

  // X-axis date labels — first, middle, last
  const xLabels: { x: number; text: string }[] = [];
  if (points.length >= 2) {
    xLabels.push({ x: points[0].x, text: shortDate(trend.dataPoints[0].date) });
    if (points.length >= 3) {
      const midIdx = Math.floor(points.length / 2);
      xLabels.push({
        x: points[midIdx].x,
        text: shortDate(trend.dataPoints[midIdx].date),
      });
    }
    xLabels.push({
      x: points[points.length - 1].x,
      text: shortDate(trend.dataPoints[trend.dataPoints.length - 1].date),
    });
  }

  const ariaLabel = `${meta.label}: ${trend.currentValue}${meta.unit}, ${directionWord(trend.trendDirection)} ${formatDelta(trend.deltaFromStart, meta.unit)} over ${period}`;

  return (
    <div className="flex flex-col">
      {/* Dimension header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
          {meta.label}
        </span>
        <span className="font-mono text-[10px] tracking-wider" style={{ color }}>
          {directionArrow(trend.trendDirection)} {formatDelta(trend.deltaFromStart, meta.shortUnit)}
        </span>
      </div>

      {/* SVG chart */}
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="w-full bg-card border border-surface-light"
        style={{ height: '120px' }}
        role="img"
        aria-label={ariaLabel}
      >
        <defs>
          <linearGradient id={`grad-${trend.dimension}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridYs.map((y) => (
          <line
            key={y}
            x1={PAD_X}
            y1={y}
            x2={CHART_W - PAD_X}
            y2={y}
            stroke="#1A1A1A"
            strokeWidth="1"
          />
        ))}

        {/* Y-axis labels */}
        {values.length > 0 && (
          <>
            <text
              x={PAD_X - 4}
              y={gridYs[0] + 3}
              textAnchor="end"
              fill="#505050"
              fontSize="8"
              fontFamily="monospace"
            >
              {max}
            </text>
            <text
              x={PAD_X - 4}
              y={gridYs[1] + 3}
              textAnchor="end"
              fill="#505050"
              fontSize="8"
              fontFamily="monospace"
            >
              {mid}
            </text>
            <text
              x={PAD_X - 4}
              y={gridYs[2] + 3}
              textAnchor="end"
              fill="#505050"
              fontSize="8"
              fontFamily="monospace"
            >
              {min}
            </text>
          </>
        )}

        {/* Area fill */}
        {areaPath && <path d={areaPath} fill={`url(#grad-${trend.dimension})`} />}

        {/* Trend polyline */}
        {points.length > 1 && (
          <polyline
            points={polylineStr}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data point circles */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="2.5"
            fill="#0F0F0F"
            stroke={color}
            strokeWidth="1.5"
          />
        ))}

        {/* X-axis date labels */}
        {xLabels.map((lbl, i) => (
          <text
            key={i}
            x={lbl.x}
            y={CHART_H - 2}
            textAnchor="middle"
            fill="#505050"
            fontSize="8"
            fontFamily="monospace"
          >
            {lbl.text}
          </text>
        ))}
      </svg>

      {/* Summary card */}
      <div className="mt-2 bg-card border border-surface-light px-3 py-2.5">
        <div className="flex items-baseline gap-3">
          {/* Current value — dominant */}
          <span className="font-mono text-xl font-semibold text-white leading-none">
            {trend.currentValue}
            <span className="text-xs font-normal text-muted-foreground ml-0.5">
              {meta.shortUnit}
            </span>
          </span>

          {/* Delta pill */}
          <span className="font-mono text-xs leading-none" style={{ color }}>
            {directionArrow(trend.trendDirection)}{' '}
            {formatDelta(trend.deltaFromStart, meta.shortUnit)}
          </span>

          {/* Best in period — right-aligned */}
          <span className="ml-auto font-mono text-[10px] text-muted-foreground leading-none">
            best: {trend.bestInPeriod}
            {meta.shortUnit}
          </span>
        </div>

        {/* Insight text */}
        <p className="mt-1.5 text-xs text-muted-foreground italic leading-snug">
          {trend.insightText}
        </p>
      </div>
    </div>
  );
}

export function ProgressTrends() {
  const { progressSummary, selectedPeriod, setSelectedPeriod, isLoading, hasMinimumData } =
    useProgressTrends();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground/60">
          Loading trends...
        </p>
      </div>
    );
  }

  if (!hasMinimumData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-8 h-px bg-surface-light" />
        <p className="text-sm text-muted-foreground text-center">
          Keep practicing. Trends appear after 3 sessions.
        </p>
        <div className="w-8 h-px bg-surface-light" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Period selector — segmented control */}
      <div className="flex items-center gap-0 border border-surface-light w-fit mb-6">
        {PERIODS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setSelectedPeriod(value)}
            aria-pressed={selectedPeriod === value}
            className={`px-4 py-1.5 font-mono text-xs tracking-wider transition-colors duration-150 ${
              selectedPeriod === value
                ? 'bg-surface-light text-white'
                : 'bg-transparent text-muted-foreground hover:text-muted-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Trend charts grid */}
      {progressSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {progressSummary.trends.map((trend) => (
            <TrendChart key={trend.dimension} trend={trend} period={selectedPeriod} />
          ))}
        </div>
      )}
    </div>
  );
}
