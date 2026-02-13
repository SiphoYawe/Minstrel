'use client';

import { useMemo } from 'react';
import { capture } from '@/lib/analytics';
import { Button } from '@/components/ui/button';

// --- Types ---

interface DrillControllerProps {
  drill: {
    targetSkill: string;
    weaknessDescription: string;
    reps: number;
    instructions: string;
  };
  currentPhase: 'Setup' | 'Demonstrate' | 'Listen' | 'Attempt' | 'Analyze' | 'Complete';
  currentRep: number;
  repHistory: Array<{ timingDeviationMs: number; accuracy: number }>;
  improvementMessage: string;
  onOneMore: () => void;
  onComplete: () => void;
  onStartDrill: () => void;
  onNewDrill?: () => void;
  onDone?: () => void;
}

// --- Phase display config ---

const PHASE_LABELS: Record<string, string> = {
  Setup: 'Setup',
  Demonstrate: 'Demonstrate',
  Listen: 'Your Turn',
  Attempt: 'Playing',
  Analyze: 'Results',
  Complete: 'Complete',
};

const VISIBLE_PHASES = ['Demonstrate', 'Listen', 'Attempt', 'Analyze', 'Complete'] as const;

const PHASE_ORDER = ['Setup', 'Demonstrate', 'Listen', 'Attempt', 'Analyze', 'Complete'] as const;

function phaseIndex(phase: string): number {
  return PHASE_ORDER.indexOf(phase as (typeof PHASE_ORDER)[number]);
}

// --- Aria announcements per phase ---

function getPhaseAnnouncement(
  phase: string,
  drill: DrillControllerProps['drill'],
  currentRep: number
): string {
  switch (phase) {
    case 'Setup':
      return `Drill ready: ${drill.targetSkill}. ${drill.instructions}. Press start to begin.`;
    case 'Demonstrate':
      return `Demonstrating drill: ${drill.targetSkill}. Listen carefully.`;
    case 'Listen':
      return 'Your turn. Prepare to play.';
    case 'Attempt':
      return `Rep ${currentRep} of ${drill.reps}. Play the exercise now.`;
    case 'Analyze':
      return `Rep ${currentRep} complete. Reviewing results.`;
    case 'Complete':
      return `Drill complete. ${drill.targetSkill}.`;
    default:
      return '';
  }
}

// --- Component ---

export function DrillController({
  drill,
  currentPhase,
  currentRep,
  repHistory,
  improvementMessage,
  onOneMore,
  onComplete,
  onStartDrill,
  onNewDrill,
  onDone,
}: DrillControllerProps) {
  const timingDisplay = useMemo(() => {
    if (repHistory.length === 0) return null;
    return repHistory.map((r) => `${Math.round(r.timingDeviationMs)}ms`).join(' \u203A ');
  }, [repHistory]);

  const accuracyDisplay = useMemo(() => {
    if (repHistory.length === 0) return null;
    return repHistory.map((r) => `${Math.round(r.accuracy * 100)}%`).join(' \u203A ');
  }, [repHistory]);

  const improvementPercent = useMemo(() => {
    if (repHistory.length < 2) return null;
    const first = repHistory[0].accuracy;
    const last = repHistory[repHistory.length - 1].accuracy;
    if (first === 0) return null;
    const pct = Math.round(((last - first) / first) * 100);
    return pct;
  }, [repHistory]);

  const announcement = getPhaseAnnouncement(phase(), drill, currentRep);

  function phase() {
    return currentPhase;
  }

  function handleStartDrill() {
    capture('drill_started', {
      target_skill: drill.targetSkill,
      total_reps: drill.reps,
    });
    onStartDrill();
  }

  function handleComplete() {
    const finalAccuracy = repHistory.length > 0 ? repHistory[repHistory.length - 1].accuracy : null;
    capture('drill_completed', {
      target_skill: drill.targetSkill,
      reps_completed: repHistory.length,
      final_accuracy: finalAccuracy,
      improvement_percent: improvementPercent,
    });
    onComplete();
  }

  return (
    <div className="w-full bg-card border border-border p-4">
      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* Header: Title + Target */}
      <div className="mb-4">
        <h3 className="text-card-heading text-text-primary mb-0.5">{drill.targetSkill}</h3>
        <p className="text-caption text-text-secondary tracking-[0.01em]">
          {drill.weaknessDescription}
        </p>
      </div>

      {/* Phase Indicator */}
      <div className="flex items-center gap-1 mb-4" role="navigation" aria-label="Drill phases">
        {VISIBLE_PHASES.map((p) => {
          const isActive = currentPhase === p;
          const isPast = phaseIndex(currentPhase) > phaseIndex(p);
          return (
            <div
              key={p}
              className="flex items-center gap-1"
              aria-current={isActive ? 'step' : undefined}
            >
              <span
                className={`
                  inline-flex items-center gap-1 px-2 py-0.5 text-caption font-medium transition-colors duration-micro
                  ${isActive ? 'bg-accent-blue/15 text-accent-blue' : ''}
                  ${isPast ? 'text-text-secondary' : ''}
                  ${!isActive && !isPast ? 'text-text-tertiary' : ''}
                `}
              >
                <span
                  className={`
                    inline-block w-1.5 h-1.5
                    ${isActive ? 'bg-accent-blue' : ''}
                    ${isPast ? 'bg-text-secondary' : ''}
                    ${!isActive && !isPast ? 'bg-text-tertiary/40' : ''}
                  `}
                />
                {PHASE_LABELS[p]}
              </span>
              {p !== 'Complete' && <span className="w-3 h-px bg-border" aria-hidden="true" />}
            </div>
          );
        })}
      </div>

      {/* Phase-specific content */}
      {currentPhase === 'Setup' && (
        <div className="mb-4">
          <p className="text-ui-label text-text-secondary mb-1">{drill.instructions}</p>
          <p className="text-caption text-accent-warm tracking-[0.08em] uppercase mb-3">
            Listen first
          </p>
          <Button size="sm" onClick={handleStartDrill} className="bg-accent-blue">
            Start Drill
          </Button>
        </div>
      )}

      {currentPhase === 'Demonstrate' && (
        <div className="mb-4 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping bg-accent-blue opacity-60" />
            <span className="relative inline-flex h-2 w-2 bg-accent-blue" />
          </span>
          <span className="text-ui-label text-accent-blue tracking-[0.02em]">
            Demonstrating&hellip;
          </span>
        </div>
      )}

      {currentPhase === 'Listen' && (
        <div className="mb-4">
          <p className="text-section-heading text-accent-warm mb-0.5">Your turn</p>
          <p className="text-caption text-text-tertiary">Prepare to play the exercise</p>
        </div>
      )}

      {currentPhase === 'Attempt' && (
        <div className="mb-4 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping bg-accent-warm opacity-60" />
            <span className="relative inline-flex h-2 w-2 bg-accent-warm" />
          </span>
          <span className="text-ui-label text-accent-warm tracking-[0.02em]">
            Listening&hellip;
          </span>
        </div>
      )}

      {/* Rep counter + Metrics (visible during and after attempts) */}
      {(currentPhase === 'Attempt' ||
        currentPhase === 'Analyze' ||
        currentPhase === 'Complete') && (
        <div className="flex items-baseline gap-4 mb-4 flex-wrap">
          {/* Rep counter */}
          <span className="font-mono text-sm text-text-primary tabular-nums">
            Rep {currentRep}/{drill.reps}
          </span>

          {/* Timing delta */}
          {timingDisplay && (
            <span className="font-mono text-sm text-text-secondary tabular-nums">
              {timingDisplay}
            </span>
          )}

          {/* Improvement percent */}
          {improvementPercent !== null && (
            <span
              className={`font-mono text-sm tabular-nums ${
                improvementPercent > 0
                  ? 'text-accent-success'
                  : improvementPercent === 0
                    ? 'text-accent-warm'
                    : 'text-accent-warm'
              }`}
            >
              {improvementPercent >= 0 ? '\u2191' : '\u2193'} {Math.abs(improvementPercent)}%
            </span>
          )}
        </div>
      )}

      {/* Accuracy breakdown */}
      {accuracyDisplay && (currentPhase === 'Analyze' || currentPhase === 'Complete') && (
        <div className="mb-4">
          <span className="text-caption text-text-tertiary uppercase tracking-[0.1em] mr-2">
            Accuracy
          </span>
          <span className="font-mono text-sm text-text-secondary tabular-nums">
            {accuracyDisplay}
          </span>
        </div>
      )}

      {/* Improvement message (growth mindset) */}
      {improvementMessage && currentPhase !== 'Setup' && (
        <p className="text-caption text-accent-warm mb-4 tracking-[0.02em]">{improvementMessage}</p>
      )}

      {/* Action buttons (Analyze phase) */}
      {currentPhase === 'Analyze' && (
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onOneMore}>
            One more
          </Button>
          <Button size="sm" onClick={handleComplete} className="bg-accent-blue">
            Complete
          </Button>
        </div>
      )}

      {/* Action buttons (Complete phase) */}
      {currentPhase === 'Complete' && (
        <div className="flex items-center gap-3 mt-4">
          <Button variant="outline" size="sm" onClick={onOneMore}>
            Try Again
          </Button>
          {onNewDrill && (
            <Button variant="outline" size="sm" onClick={onNewDrill}>
              New Drill
            </Button>
          )}
          {onDone && (
            <Button size="sm" onClick={onDone} className="bg-accent-blue">
              Done
            </Button>
          )}
        </div>
      )}

      {/* Completion summary */}
      {currentPhase === 'Complete' && repHistory.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="text-caption text-text-tertiary uppercase tracking-[0.1em]">
              Session
            </span>
            <span className="font-mono text-sm text-accent-success tabular-nums">
              {repHistory.length} reps completed
            </span>
          </div>
          {improvementPercent !== null && improvementPercent > 0 && (
            <p className="text-caption text-accent-blue mt-1">
              Solid progress &mdash; {improvementPercent}% improvement across reps
            </p>
          )}
        </div>
      )}

      {/* Phase screen reader detail */}
      <div className="sr-only" aria-live="polite">
        {currentPhase === 'Analyze' && repHistory.length > 0 && (
          <span>
            Rep {currentRep} of {drill.reps}.{timingDisplay && ` Timing: ${timingDisplay}.`}
            {improvementPercent !== null &&
              ` ${improvementPercent >= 0 ? `${improvementPercent} percent improvement` : `${Math.abs(improvementPercent)} percent change`}.`}
          </span>
        )}
      </div>
    </div>
  );
}
