'use client';

import { useMemo } from 'react';
import { useSessionStore } from '@/stores/session-store';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type SessionDisplayMode = 'live' | 'summary';

interface SessionSummary {
  predominantKey: string;
  averageTempo: string;
  tempoRange: string;
  timingTrend: { value: number; direction: 'improving' | 'stable' | 'declining' };
  totalNotes: number;
  topChordProgressions: string[];
}

function formatKey(key: { root: string; mode: string } | null): string {
  if (!key) return 'detecting...';
  return `${key.root} ${key.mode}`;
}

function formatTempo(tempo: number | null): string {
  if (tempo === null) return 'detecting...';
  return `${Math.round(tempo)}`;
}

function formatAccuracy(accuracy: number): string {
  return `${Math.round(accuracy)}%`;
}

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 80) return 'text-primary';
  return 'text-accent-warm';
}

function getTrendArrow(direction: 'improving' | 'stable' | 'declining'): string {
  if (direction === 'improving') return '\u2191';
  if (direction === 'declining') return '\u2193';
  return '\u2192';
}

function getTrendColor(direction: 'improving' | 'stable' | 'declining'): string {
  if (direction === 'improving') return 'hsl(var(--accent-success))';
  if (direction === 'declining') return 'hsl(var(--accent-warm))';
  return 'hsl(var(--muted-foreground))';
}

function useSessionSummary(): SessionSummary {
  const currentKey = useSessionStore((s) => s.currentKey);
  const currentTempo = useSessionStore((s) => s.currentTempo);
  const timingAccuracy = useSessionStore((s) => s.timingAccuracy);
  const tempoHistory = useSessionStore((s) => s.tempoHistory);
  const detectedChords = useSessionStore((s) => s.detectedChords);
  const totalNotesPlayed = useSessionStore((s) => s.totalNotesPlayed);
  const timingDeviations = useSessionStore((s) => s.timingDeviations);

  return useMemo(() => {
    // Predominant key
    const predominantKey = formatKey(currentKey);

    // Average tempo with range from tempo history
    let averageTempo = 'detecting...';
    let tempoRange = '';
    if (tempoHistory.length > 0) {
      const tempos = tempoHistory.map((s) => s.bpm);
      const avg = tempos.reduce((s, v) => s + v, 0) / tempos.length;
      const min = Math.min(...tempos);
      const max = Math.max(...tempos);
      averageTempo = `${Math.round(avg)}`;
      if (max - min > 2) {
        tempoRange = `(${Math.round(min)}-${Math.round(max)})`;
      }
    } else if (currentTempo !== null) {
      averageTempo = formatTempo(currentTempo);
    }

    // Timing accuracy trend
    let direction: 'improving' | 'stable' | 'declining' = 'stable';
    if (timingDeviations.length >= 4) {
      const half = Math.floor(timingDeviations.length / 2);
      const firstHalf = timingDeviations.slice(0, half);
      const secondHalf = timingDeviations.slice(half);
      const avgFirst =
        firstHalf.reduce((s, d) => s + Math.abs(d.deviationMs), 0) / firstHalf.length;
      const avgSecond =
        secondHalf.reduce((s, d) => s + Math.abs(d.deviationMs), 0) / secondHalf.length;
      // Lower deviation = better timing
      if (avgSecond < avgFirst * 0.9) direction = 'improving';
      else if (avgSecond > avgFirst * 1.1) direction = 'declining';
    }

    // Top chord progressions
    const chordCounts: Record<string, number> = {};
    for (const chord of detectedChords) {
      const label = `${chord.root}${chord.quality === 'Major' ? '' : chord.quality === 'Minor' ? 'm' : chord.quality}`;
      chordCounts[label] = (chordCounts[label] || 0) + 1;
    }
    const topChordProgressions = Object.entries(chordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([label]) => label);

    return {
      predominantKey,
      averageTempo,
      tempoRange,
      timingTrend: { value: timingAccuracy, direction },
      totalNotes: totalNotesPlayed,
      topChordProgressions,
    };
  }, [
    currentKey,
    currentTempo,
    timingAccuracy,
    tempoHistory,
    detectedChords,
    totalNotesPlayed,
    timingDeviations,
  ]);
}

interface DataCardProps {
  sessionMode?: SessionDisplayMode;
}

export function DataCard({ sessionMode = 'live' }: DataCardProps) {
  const summary = useSessionSummary();
  const isLive = sessionMode === 'live';

  const chordText =
    summary.topChordProgressions.length > 0
      ? summary.topChordProgressions.join(' ')
      : 'detecting...';

  return (
    <div className="grid grid-cols-2 gap-2 p-3" role="region" aria-label="Session metrics">
      {/* Key */}
      <Card className="bg-card border-surface-light p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Key</span>
          {isLive && (
            <span className="text-[8px] uppercase tracking-[0.15em] font-mono text-primary">
              LIVE
            </span>
          )}
        </div>
        <span
          className="block font-mono text-sm text-foreground"
          aria-label={`Current key: ${summary.predominantKey}`}
        >
          {summary.predominantKey}
        </span>
      </Card>

      {/* Tempo */}
      <Card className="bg-card border-surface-light p-3">
        <span className="block text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-1">
          {isLive ? 'Tempo' : 'Avg Tempo'}
        </span>
        <span
          className="block font-mono text-sm text-foreground"
          aria-label={`Tempo: ${summary.averageTempo} BPM ${summary.tempoRange}`}
        >
          {summary.averageTempo}{' '}
          <span className="text-muted-foreground text-[10px]">BPM {summary.tempoRange}</span>
        </span>
      </Card>

      {/* Timing Accuracy with Trend */}
      <Card className="bg-card border-surface-light p-3">
        <span className="block text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-1">
          Timing
        </span>
        <div className="flex items-baseline gap-1.5">
          <span
            className={`font-mono text-sm ${getAccuracyColor(summary.timingTrend.value)}`}
            aria-label={`Timing accuracy: ${formatAccuracy(summary.timingTrend.value)}, ${summary.timingTrend.direction}`}
          >
            {formatAccuracy(summary.timingTrend.value)}
          </span>
          <span
            className="font-mono text-[10px]"
            style={{ color: getTrendColor(summary.timingTrend.direction) }}
            aria-hidden="true"
          >
            {getTrendArrow(summary.timingTrend.direction)}
          </span>
        </div>
      </Card>

      {/* Chords with Tooltip */}
      <Card className="bg-card border-surface-light p-3">
        <span className="block text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-1">
          Chords
        </span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="block font-mono text-xs text-foreground truncate cursor-default"
                aria-label={`Recent chords: ${chordText}`}
              >
                {chordText}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <span className="font-mono text-xs">{chordText}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Card>

      {/* Notes Played */}
      <Card className="bg-card border-surface-light p-3 col-span-2">
        <span className="block text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-1">
          Notes Played
        </span>
        <span
          className="block font-mono text-sm text-foreground"
          aria-label={`Total notes played: ${summary.totalNotes}`}
        >
          {summary.totalNotes.toLocaleString()}
        </span>
      </Card>
    </div>
  );
}
