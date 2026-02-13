'use client';

import { useSessionStore } from '@/stores/session-store';
import { Card } from '@/components/ui/card';

function formatKey(key: { root: string; mode: string } | null): string {
  if (!key) return '--';
  return `${key.root} ${key.mode}`;
}

function formatTempo(tempo: number | null): string {
  if (tempo === null) return '--';
  return `${Math.round(tempo)}`;
}

function formatAccuracy(accuracy: number): string {
  return `${Math.round(accuracy)}%`;
}

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 80) return 'text-[#7CB9E8]';
  return 'text-[#D4A43C]';
}

export function DataCard() {
  const currentKey = useSessionStore((s) => s.currentKey);
  const currentTempo = useSessionStore((s) => s.currentTempo);
  const timingAccuracy = useSessionStore((s) => s.timingAccuracy);
  const detectedChords = useSessionStore((s) => s.detectedChords);

  const recentChordLabels = detectedChords
    .slice(-8)
    .map((c) => `${c.root}${c.quality === 'Major' ? '' : c.quality === 'Minor' ? 'm' : c.quality}`);

  return (
    <div className="grid grid-cols-2 gap-2 p-3" role="region" aria-label="Session metrics">
      <Card className="bg-[#141414] border-[#1A1A1A] p-3">
        <span className="block text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-1">
          Key
        </span>
        <span
          className="block font-mono text-sm text-foreground"
          aria-label={`Current key: ${formatKey(currentKey)}`}
        >
          {formatKey(currentKey)}
        </span>
      </Card>

      <Card className="bg-[#141414] border-[#1A1A1A] p-3">
        <span className="block text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-1">
          Tempo
        </span>
        <span
          className="block font-mono text-sm text-foreground"
          aria-label={`Current tempo: ${formatTempo(currentTempo)} BPM`}
        >
          {formatTempo(currentTempo)} <span className="text-muted-foreground text-[10px]">BPM</span>
        </span>
      </Card>

      <Card className="bg-[#141414] border-[#1A1A1A] p-3">
        <span className="block text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-1">
          Timing
        </span>
        <span
          className={`block font-mono text-sm ${getAccuracyColor(timingAccuracy)}`}
          aria-label={`Timing accuracy: ${formatAccuracy(timingAccuracy)}`}
        >
          {formatAccuracy(timingAccuracy)}
        </span>
      </Card>

      <Card className="bg-[#141414] border-[#1A1A1A] p-3">
        <span className="block text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-1">
          Chords
        </span>
        <span
          className="block font-mono text-xs text-foreground truncate"
          aria-label={`Recent chords: ${recentChordLabels.join(', ') || 'none'}`}
        >
          {recentChordLabels.length > 0 ? recentChordLabels.join(' ') : '--'}
        </span>
      </Card>
    </div>
  );
}
