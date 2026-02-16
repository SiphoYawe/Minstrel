'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { DrillNoteVisualizer } from '@/components/drill-note-visualizer';
import { useDrillPreview } from '@/hooks/use-drill-preview';
import type { GeneratedDrill } from '@/features/drills/drill-types';

interface DrillPanelProps {
  drill: GeneratedDrill | null;
  isGenerating: boolean;
  error: string | null;
  onRetry: () => void;
  onDismiss: () => void;
  onStart?: () => void;
  difficultyExplanation?: string | null;
  difficultyTriggers?: string[];
}

function DifficultyDots({ level }: { level: number }) {
  const clamped = Math.max(1, Math.min(5, Math.round(level)));
  return (
    <div className="flex items-center gap-1" aria-label={`Difficulty: ${clamped} of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`inline-block h-1.5 w-1.5 ${
            i < clamped ? 'bg-primary' : 'bg-surface-lighter'
          }`}
        />
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="border border-border bg-card p-5 animate-pulse" aria-busy="true">
      <div className="flex items-center justify-between mb-4">
        <div className="h-3 w-28 bg-surface-lighter" />
        <div className="h-3 w-16 bg-surface-lighter" />
      </div>
      <div className="space-y-3">
        <div className="h-2.5 w-full bg-surface-lighter" />
        <div className="h-2.5 w-3/4 bg-surface-lighter" />
        <div className="h-2.5 w-1/2 bg-surface-lighter" />
      </div>
      <div className="mt-5 flex items-center gap-3">
        <div className="h-1.5 w-12 bg-surface-lighter" />
        <div className="flex gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-1.5 w-1.5 bg-surface-lighter" />
          ))}
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <div className="h-8 flex-1 bg-surface-lighter" />
        <div className="h-8 flex-1 bg-surface-lighter" />
      </div>
      <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        Crafting your drill...
      </p>
    </div>
  );
}

function ErrorCard({
  message,
  onRetry,
  onDismiss,
}: {
  message: string;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="border border-accent-warm/30 bg-card p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent-warm mb-3">
        Drill Generation Failed
      </p>
      <p className="font-sans text-[13px] leading-relaxed text-muted-foreground">{message}</p>
      <div className="mt-4 flex gap-2">
        <Button
          size="sm"
          onClick={onRetry}
          className="flex-1 font-mono text-[11px] uppercase tracking-[0.1em]"
        >
          Retry
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDismiss}
          className="flex-1 font-mono text-[11px] uppercase tracking-[0.1em]"
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}

function DifficultyExplanation({
  explanation,
  triggers,
}: {
  explanation: string;
  triggers?: string[];
}) {
  return (
    <div
      className="border border-accent-blue/20 bg-accent-blue/5 px-3 py-2 mb-3"
      aria-label="Difficulty adjustment"
    >
      <p className="font-sans text-[11px] leading-relaxed text-text-secondary">{explanation}</p>
      {triggers && triggers.length > 0 && (
        <ul className="mt-1 list-none space-y-0.5">
          {triggers.map((t, i) => (
            <li key={i} className="font-mono text-[10px] text-text-tertiary">
              {t}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DrillCard({
  drill,
  onStart,
  difficultyExplanation,
  difficultyTriggers,
}: {
  drill: GeneratedDrill;
  onStart?: () => void;
  difficultyExplanation?: string | null;
  difficultyTriggers?: string[];
}) {
  const preview = useDrillPreview(drill);
  const autoStartedRef = useRef(false);

  // Auto-start preview when drill card mounts (streamlined flow: generate → auto-preview)
  useEffect(() => {
    if (!autoStartedRef.current && drill) {
      autoStartedRef.current = true;
      preview.start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only auto-start once on mount
  }, [drill]);

  const difficultyLevel = Math.round(
    ((drill.difficultyLevel.harmonicComplexity +
      drill.difficultyLevel.rhythmicDensity +
      drill.difficultyLevel.keyDifficulty) /
      3) *
      5
  );

  const isPreviewPlaying = preview.state === 'playing';
  const isPreviewFinished = preview.state === 'finished';

  return (
    <div className="border border-primary/20 bg-card p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className="font-mono text-[12px] uppercase tracking-[0.1em] text-foreground leading-tight">
          {drill.targetSkill}
        </h3>
        <span className="shrink-0 border border-primary/30 bg-primary/5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-primary">
          drill
        </span>
      </div>

      {/* Difficulty explanation (when difficulty changed) */}
      {difficultyExplanation && (
        <DifficultyExplanation explanation={difficultyExplanation} triggers={difficultyTriggers} />
      )}

      {/* Instructions */}
      <p className="mt-2 font-sans text-[12px] leading-relaxed text-muted-foreground line-clamp-3">
        {drill.instructions}
      </p>

      {/* Note visualizer strip */}
      <div className="mt-3">
        <DrillNoteVisualizer
          notes={drill.sequence.notes}
          activeNoteIndex={preview.activeNoteIndex}
          previewState={preview.state}
        />
      </div>

      {/* Preview status */}
      {isPreviewPlaying && (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-primary animate-pulse">
          Previewing&hellip;
        </p>
      )}

      {/* Metadata row */}
      <div className="mt-3 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            Tempo
          </span>
          <span className="font-mono text-[11px] text-foreground">{drill.targetTempo}</span>
          <span className="font-mono text-[9px] text-muted-foreground">BPM</span>
        </div>

        <div className="h-3 w-px bg-border" />

        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            Reps
          </span>
          <span className="font-mono text-[11px] text-foreground">{drill.reps}</span>
        </div>

        <div className="h-3 w-px bg-border" />

        <DifficultyDots level={difficultyLevel} />
      </div>

      {/* Sequence summary */}
      <div className="mt-3 border-t border-border pt-3">
        <div className="flex items-center gap-3 text-[10px]">
          <span className="font-mono uppercase tracking-[0.1em] text-muted-foreground">
            {drill.sequence.notes.length} notes
          </span>
          <span className="font-mono uppercase tracking-[0.1em] text-muted-foreground">
            {drill.sequence.measures} measures
          </span>
          <span className="font-mono uppercase tracking-[0.1em] text-muted-foreground">
            {drill.sequence.timeSignature[0]}/{drill.sequence.timeSignature[1]}
          </span>
        </div>
      </div>

      {/* Streamlined action: single Start button (preview auto-plays above) */}
      <div className="mt-4 flex gap-2">
        {isPreviewPlaying ? (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 font-mono text-[11px] uppercase tracking-[0.1em]"
            onClick={preview.stop}
            aria-label="Stop preview"
          >
            Stop
          </Button>
        ) : (
          <Button
            size="sm"
            className="flex-1 font-mono text-[11px] uppercase tracking-[0.1em]"
            onClick={() => {
              preview.stop();
              onStart?.();
            }}
          >
            Start
          </Button>
        )}
      </div>

      {/* Replay preview link (shown after preview finishes) */}
      {isPreviewFinished && (
        <button
          onClick={preview.repeat}
          className="mt-3 w-full text-center font-mono text-[10px] uppercase tracking-[0.15em] text-primary/70 hover:text-primary transition-colors duration-150"
        >
          Replay Preview
        </button>
      )}
    </div>
  );
}

export function DrillPanel({
  drill,
  isGenerating,
  error,
  onRetry,
  onDismiss,
  onStart,
  difficultyExplanation,
  difficultyTriggers,
}: DrillPanelProps) {
  if (isGenerating) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorCard message={error} onRetry={onRetry} onDismiss={onDismiss} />;
  }

  if (drill) {
    return (
      <DrillCard
        drill={drill}
        onStart={onStart}
        difficultyExplanation={difficultyExplanation}
        difficultyTriggers={difficultyTriggers}
      />
    );
  }

  return null;
}
