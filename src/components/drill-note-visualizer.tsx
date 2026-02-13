'use client';

import { useMemo } from 'react';
import type { DrillNote } from '@/features/drills/drill-types';
import type { PreviewState } from '@/hooks/use-drill-preview';

interface DrillNoteVisualizerProps {
  notes: DrillNote[];
  activeNoteIndex: number;
  previewState: PreviewState;
}

/**
 * Compact horizontal note strip showing the drill sequence.
 * Notes are rectangular blocks positioned by startBeat and sized by duration.
 * Active note pulses with primary color; played notes fade; upcoming notes are dim.
 */
export function DrillNoteVisualizer({
  notes,
  activeNoteIndex,
  previewState,
}: DrillNoteVisualizerProps) {
  const totalBeats = useMemo(() => {
    if (notes.length === 0) return 1;
    return Math.max(...notes.map((n) => n.startBeat + n.duration));
  }, [notes]);

  if (notes.length === 0) return null;

  const isPlaying = previewState === 'playing';

  return (
    <div className="w-full">
      {/* Status line */}
      {isPlaying && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping bg-primary opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 bg-primary" />
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-primary">
            Preview playing&hellip;
          </span>
        </div>
      )}
      {previewState === 'finished' && (
        <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground mb-1.5">
          Preview complete
        </p>
      )}

      {/* Note strip */}
      <div
        className="relative w-full h-5 bg-surface-lighter/30"
        role="img"
        aria-label={`Drill sequence: ${notes.length} notes`}
      >
        {notes.map((note, i) => {
          const left = (note.startBeat / totalBeats) * 100;
          const width = Math.max((note.duration / totalBeats) * 100, 1);

          const isActive = isPlaying && i === activeNoteIndex;
          const isPlayed = isPlaying && i < activeNoteIndex;
          const isFinishedAll = previewState === 'finished';

          let bgClass = 'bg-muted-foreground/20';
          if (isActive) {
            bgClass = 'bg-primary';
          } else if (isPlayed || isFinishedAll) {
            bgClass = 'bg-primary/30';
          }

          return (
            <span
              key={`${note.midiNote}-${note.startBeat}-${i}`}
              className={`absolute top-0.5 bottom-0.5 transition-colors duration-150 ${bgClass} ${
                isActive ? 'animate-pulse' : ''
              }`}
              style={{
                left: `${left}%`,
                width: `${width}%`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
