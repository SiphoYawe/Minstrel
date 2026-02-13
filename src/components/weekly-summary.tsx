'use client';

import { useWeeklySummary } from '@/features/engagement/use-weekly-summary';
import { TrendDirection, type WeeklyMetricDelta } from '@/features/engagement/engagement-types';
import { formatPracticeTime } from '@/features/engagement/weekly-summary-generator';

function directionColor(direction: TrendDirection): string {
  if (direction === TrendDirection.Up) return 'hsl(var(--accent-success))';
  if (direction === TrendDirection.Down) return 'hsl(var(--accent-warm))';
  return 'hsl(var(--muted-foreground))';
}

function directionArrow(direction: TrendDirection): string {
  if (direction === TrendDirection.Up) return '\u2191';
  if (direction === TrendDirection.Down) return '\u2193';
  return '\u2192';
}

function srDeltaText(delta: WeeklyMetricDelta): string {
  if (delta.deltaPercent === null) return 'first week';
  if (delta.deltaPercent > 0) return `improved ${delta.deltaPercent} percent`;
  if (delta.deltaPercent < 0) return `declined ${Math.abs(delta.deltaPercent)} percent`;
  return 'unchanged';
}

function formatDateRange(startStr: string, endStr: string): string {
  const start = new Date(startStr + 'T12:00:00');
  const end = new Date(endStr + 'T12:00:00');
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} \u2013 ${fmt(end)}`;
}

function formatTimeDelta(deltaMs: number): string {
  const sign = deltaMs >= 0 ? '+' : '';
  return `${sign}${formatPracticeTime(Math.abs(deltaMs))} from last week`;
}

function formatSessionDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : '';
  const noun = Math.abs(delta) === 1 ? 'session' : 'sessions';
  return `${sign}${delta} ${noun}`;
}

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-card border border-surface-light px-3 py-2">
      <div className="font-mono text-lg text-white leading-tight">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
        {label}
      </div>
    </div>
  );
}

function MetricRow({ delta }: { delta: WeeklyMetricDelta }) {
  const color = directionColor(delta.direction);
  const arrow = directionArrow(delta.direction);

  return (
    <div className="flex items-center justify-between py-2 border-b border-surface-light last:border-b-0">
      <span className="text-xs text-muted-foreground flex-shrink-0 w-32">{delta.metricName}</span>

      <span className="font-mono text-sm text-white text-center flex-1">{delta.currentValue}</span>

      <span className="flex-shrink-0 w-20 text-right">
        {delta.deltaPercent !== null ? (
          <span className="font-mono text-xs" style={{ color }}>
            {arrow} {delta.deltaPercent > 0 ? '+' : ''}
            {delta.deltaPercent}%
          </span>
        ) : (
          <span className="font-mono text-[10px] text-muted-foreground">&mdash;</span>
        )}
        <span className="sr-only">{srDeltaText(delta)}</span>
      </span>
    </div>
  );
}

export function WeeklySummary() {
  const { weeklySummary, isLoading, hasData } = useWeeklySummary();

  if (isLoading) {
    return (
      <div className="max-w-[480px] flex items-center justify-center py-12">
        <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground/60">
          Loading summary...
        </p>
      </div>
    );
  }

  if (!hasData || !weeklySummary) {
    return (
      <div className="max-w-[480px] flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-8 h-px bg-surface-light" />
        <p className="text-sm text-muted-foreground text-center">
          No sessions this week yet. Your instrument is waiting.
        </p>
        <div className="w-8 h-px bg-surface-light" />
      </div>
    );
  }

  const { previousWeekComparison } = weeklySummary;

  return (
    <div className="max-w-[480px] w-full flex flex-col gap-4">
      {/* Header */}
      <div>
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          This Week
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDateRange(weeklySummary.weekStartDate, weeklySummary.weekEndDate)}
        </p>
      </div>

      {/* Top-line stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-surface-light">
        <StatCell value={formatPracticeTime(weeklySummary.totalPracticeMs)} label="Total time" />
        <StatCell value={String(weeklySummary.sessionCount)} label="Sessions" />
        <StatCell value={String(weeklySummary.drillsCompleted)} label="Drills" />
        <StatCell value={String(weeklySummary.personalRecordsSet)} label="Records" />
      </div>

      {/* Metric deltas */}
      {weeklySummary.metricDeltas.length > 0 && (
        <div className="bg-card border border-surface-light px-3 py-1">
          {!previousWeekComparison && (
            <div className="flex items-center gap-2 py-1.5 border-b border-surface-light">
              <div className="w-1.5 h-1.5 bg-primary" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                First week
              </span>
            </div>
          )}
          {weeklySummary.metricDeltas.map((delta) => (
            <MetricRow key={delta.metricName} delta={delta} />
          ))}
        </div>
      )}

      {/* Week-over-week comparison */}
      {previousWeekComparison && (
        <div className="flex items-center gap-4 px-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            vs. last week
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {formatTimeDelta(previousWeekComparison.totalTimeDeltaMs)}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {formatSessionDelta(previousWeekComparison.sessionCountDelta)}
          </span>
        </div>
      )}

      {/* Highest impact insight */}
      <div className="bg-card border border-surface-light border-l-2 border-l-primary px-3 py-2.5">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {weeklySummary.highestImpactInsight}
        </p>
      </div>
    </div>
  );
}
