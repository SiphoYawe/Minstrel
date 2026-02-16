'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { capture } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import type { DrillSuccessCriteria } from '@/features/drills/drill-types';

// --- Types ---

export type NoteFeedback = 'on-target' | 'close' | 'off-target' | null;
export type TimingDeviation = 'early' | 'late' | null;

interface DrillControllerProps {
  drill: {
    targetSkill: string;
    weaknessDescription: string;
    reps: number;
    instructions: string;
    successCriteria?: DrillSuccessCriteria;
    targetTempo?: number;
  };
  currentPhase: 'Setup' | 'Demonstrate' | 'Listen' | 'Attempt' | 'Analyze' | 'Complete';
  currentRep: number;
  repHistory: Array<{
    timingDeviationMs: number;
    accuracy: number;
    tempoAchievedBpm?: number | null;
  }>;
  improvementMessage: string;
  /** Total attempt duration in seconds (default 15). */
  attemptDurationSec?: number;
  /** Number of notes captured so far (for no-notes detection). */
  notesCaptured?: number;
  /** Real-time note feedback: on-target (green), close (amber), off-target (none). */
  latestNoteFeedback?: NoteFeedback;
  /** Real-time timing deviation indicator. */
  latestTimingDeviation?: TimingDeviation;
  /** Whether the drill is currently paused. */
  isPaused?: boolean;
  onOneMore: () => void;
  onComplete: () => void;
  onStartDrill: () => void;
  /** End attempt early (user clicks Done or presses Enter). */
  onEndAttempt?: () => void;
  /** Pause the drill timer. */
  onPause?: () => void;
  /** Resume the drill from pause. */
  onResume?: () => void;
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

// --- Success criteria helpers ---

const METRIC_TOOLTIPS: Record<string, string> = {
  accuracy: 'Percentage of target notes you played correctly within the timing window',
  timing: 'How close your note timing is to the target beat — lower is better',
  tempo: 'The speed you need to maintain, measured in beats per minute',
};

interface CriterionStatus {
  label: string;
  target: string;
  actual: string | null;
  met: boolean | null;
  tooltipKey: string;
}

function buildCriteriaStatuses(
  criteria: DrillSuccessCriteria | undefined,
  targetTempo: number | undefined,
  latestRep: {
    timingDeviationMs: number;
    accuracy: number;
    tempoAchievedBpm?: number | null;
  } | null
): CriterionStatus[] {
  if (!criteria) return [];
  const statuses: CriterionStatus[] = [];

  statuses.push({
    label: 'Accuracy',
    target: `${Math.round(criteria.accuracyTarget * 100)}%`,
    actual: latestRep ? `${Math.round(latestRep.accuracy * 100)}%` : null,
    met: latestRep ? latestRep.accuracy >= criteria.accuracyTarget : null,
    tooltipKey: 'accuracy',
  });

  statuses.push({
    label: 'Timing',
    target: `±${criteria.timingThresholdMs}ms`,
    actual: latestRep ? `±${Math.round(latestRep.timingDeviationMs)}ms` : null,
    met: latestRep ? latestRep.timingDeviationMs <= criteria.timingThresholdMs : null,
    tooltipKey: 'timing',
  });

  if (targetTempo) {
    statuses.push({
      label: 'Tempo',
      target: `${targetTempo} BPM`,
      actual:
        latestRep?.tempoAchievedBpm != null
          ? `${Math.round(latestRep.tempoAchievedBpm)} BPM`
          : null,
      met:
        latestRep?.tempoAchievedBpm != null && criteria.tempoToleranceBpm > 0
          ? Math.abs(latestRep.tempoAchievedBpm - targetTempo) <= criteria.tempoToleranceBpm
          : null,
      tooltipKey: 'tempo',
    });
  }

  return statuses;
}

function MetricTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        className="inline-flex items-center justify-center w-3.5 h-3.5 text-[9px] border border-border text-text-tertiary hover:text-text-secondary ml-1 cursor-help"
        aria-label={text}
        tabIndex={0}
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-surface-lighter text-text-secondary text-[10px] leading-tight w-40 z-20 border border-border"
        >
          {text}
        </span>
      )}
    </span>
  );
}

function SuccessCriteriaDisplay({
  statuses,
  showActual,
}: {
  statuses: CriterionStatus[];
  showActual: boolean;
}) {
  if (statuses.length === 0) return null;

  return (
    <div className="mb-4 border border-border bg-card/50 px-3 py-2" aria-label="Success criteria">
      <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-text-tertiary mb-2">
        Target
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {statuses.map((s) => (
          <div key={s.tooltipKey} className="flex items-center gap-1">
            {showActual && s.met !== null && (
              <span
                className={`inline-block w-1.5 h-1.5 ${s.met ? 'bg-accent-success' : 'bg-accent-warm'}`}
                aria-label={s.met ? `${s.label} met` : `${s.label} not yet met`}
              />
            )}
            <span className="font-mono text-[11px] text-text-secondary">
              {s.label}: {s.target}
            </span>
            {showActual && s.actual && (
              <span
                className={`font-mono text-[11px] ${s.met ? 'text-accent-success' : 'text-accent-warm'}`}
              >
                ({s.actual})
              </span>
            )}
            <MetricTooltip text={METRIC_TOOLTIPS[s.tooltipKey]} />
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Countdown timer hook ---

const DEFAULT_ATTEMPT_DURATION_SEC = 15;
const WARNING_THRESHOLD_SEC = 5;
const NO_NOTES_TIMEOUT_SEC = 15;

function useCountdown(
  isActive: boolean,
  durationSec: number,
  onExpire: () => void
): { remaining: number; isWarning: boolean } {
  const [remaining, setRemaining] = useState(durationSec);
  const [trackedInputs, setTrackedInputs] = useState({ isActive, durationSec });
  const onExpireRef = useRef(onExpire);

  // Reset remaining when inputs change (derived state during render)
  if (trackedInputs.isActive !== isActive || trackedInputs.durationSec !== durationSec) {
    setTrackedInputs({ isActive, durationSec });
    setRemaining(durationSec);
  }

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpireRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, durationSec]);

  return { remaining, isWarning: isActive && remaining <= WARNING_THRESHOLD_SEC && remaining > 0 };
}

// --- Component ---

export function DrillController({
  drill,
  currentPhase,
  currentRep,
  repHistory,
  improvementMessage,
  attemptDurationSec = DEFAULT_ATTEMPT_DURATION_SEC,
  notesCaptured = -1,
  latestNoteFeedback = null,
  latestTimingDeviation = null,
  isPaused = false,
  onOneMore,
  onComplete,
  onStartDrill,
  onEndAttempt,
  onPause,
  onResume,
  onNewDrill,
  onDone,
}: DrillControllerProps) {
  // Collapsible instructions state
  const [instructionsExpanded, setInstructionsExpanded] = useState(false);
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

  const criteriaStatuses = useMemo(() => {
    const latestRep = repHistory.length > 0 ? repHistory[repHistory.length - 1] : null;
    return buildCriteriaStatuses(drill.successCriteria, drill.targetTempo, latestRep);
  }, [drill.successCriteria, drill.targetTempo, repHistory]);

  // Countdown timer for attempt phase
  const isAttemptActive = currentPhase === 'Attempt';
  const handleCountdownExpire = useCallback(() => {
    onEndAttempt?.();
  }, [onEndAttempt]);
  const { remaining: countdownRemaining, isWarning: countdownWarning } = useCountdown(
    isAttemptActive,
    attemptDurationSec,
    handleCountdownExpire
  );

  // Track no-notes state (notesCaptured === 0 after NO_NOTES_TIMEOUT_SEC means no input)
  // Keyed off currentPhase so it resets when phase changes
  const [noNotesElapsed, setNoNotesElapsed] = useState(false);
  const [trackedAttemptActive, setTrackedAttemptActive] = useState(isAttemptActive);

  // Reset noNotesElapsed when attempt active state changes (derived state during render)
  if (trackedAttemptActive !== isAttemptActive) {
    setTrackedAttemptActive(isAttemptActive);
    setNoNotesElapsed(false);
  }

  useEffect(() => {
    if (!isAttemptActive) return;
    const timer = setTimeout(() => {
      setNoNotesElapsed(true);
    }, NO_NOTES_TIMEOUT_SEC * 1000);
    return () => clearTimeout(timer);
  }, [isAttemptActive]);

  const showNoNotesPrompt = isAttemptActive && noNotesElapsed && notesCaptured === 0;

  // Keyboard handler: Enter to end attempt early, Escape to pause/resume
  useEffect(() => {
    if (!isAttemptActive) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Enter' && onEndAttempt && !isPaused) {
        e.preventDefault();
        onEndAttempt();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isPaused && onResume) {
          onResume();
        } else if (!isPaused && onPause) {
          onPause();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAttemptActive, onEndAttempt, isPaused, onPause, onResume]);

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

      {/* Success criteria (visible during Attempt, Analyze, Complete) */}
      {criteriaStatuses.length > 0 &&
        (currentPhase === 'Attempt' ||
          currentPhase === 'Analyze' ||
          currentPhase === 'Complete') && (
          <SuccessCriteriaDisplay
            statuses={criteriaStatuses}
            showActual={currentPhase === 'Analyze' || currentPhase === 'Complete'}
          />
        )}

      {/* Phase-specific content */}
      {currentPhase === 'Setup' && (
        <div className="mb-4">
          <p className="text-ui-label text-text-secondary mb-1">{drill.instructions}</p>
          <p className="text-caption text-accent-warm tracking-[0.08em] uppercase mb-3">
            Listen first
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleStartDrill} className="bg-accent-blue">
              Start Drill
            </Button>
            <span className="text-caption text-text-tertiary flex items-center gap-1">
              <kbd className="inline-flex h-5 items-center border border-border bg-card px-1.5 font-mono text-caption text-text-secondary">
                Enter
              </kbd>
            </span>
          </div>
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
        <div className="mb-4 relative">
          {/* Pause overlay */}
          {isPaused && (
            <div
              className="absolute inset-0 bg-card/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center"
              role="status"
              aria-label="Drill paused"
            >
              <p className="text-section-heading text-text-primary mb-3">Paused</p>
              {onResume && (
                <Button size="sm" onClick={onResume} className="bg-accent-blue">
                  Resume
                </Button>
              )}
              <p className="text-caption text-text-tertiary mt-2">
                Press{' '}
                <kbd className="inline-flex h-5 items-center border border-border bg-card px-1.5 font-mono text-caption text-text-secondary">
                  Esc
                </kbd>{' '}
                to resume
              </p>
            </div>
          )}

          {/* Collapsible instructions */}
          <div className="mb-2">
            <button
              type="button"
              onClick={() => setInstructionsExpanded((prev) => !prev)}
              className="flex items-center gap-1 text-caption text-text-tertiary hover:text-text-secondary transition-colors"
              aria-expanded={instructionsExpanded}
              aria-controls="drill-instructions-attempt"
            >
              <span
                className={`inline-block transition-transform ${instructionsExpanded ? 'rotate-90' : ''}`}
              >
                &#9656;
              </span>
              Instructions
            </button>
            {instructionsExpanded && (
              <p
                id="drill-instructions-attempt"
                className="text-caption text-text-secondary mt-1 pl-3 border-l border-border"
              >
                {drill.instructions}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping bg-accent-warm opacity-60" />
              <span className="relative inline-flex h-2 w-2 bg-accent-warm" />
            </span>
            <span className="text-ui-label text-accent-warm tracking-[0.02em]">
              Listening&hellip;
            </span>

            {/* Real-time note feedback flash */}
            {latestNoteFeedback === 'on-target' && (
              <span
                className="inline-block w-2 h-2 bg-accent-success animate-ping"
                aria-label="On target"
              />
            )}
            {latestNoteFeedback === 'close' && (
              <span
                className="inline-block w-2 h-2 bg-accent-warm animate-ping"
                aria-label="Close"
              />
            )}

            {/* Timing deviation indicator */}
            {latestTimingDeviation === 'early' && (
              <span className="font-mono text-[10px] text-accent-warm" aria-label="Early">
                Early
              </span>
            )}
            {latestTimingDeviation === 'late' && (
              <span className="font-mono text-[10px] text-accent-warm" aria-label="Late">
                Late
              </span>
            )}

            {/* Countdown timer */}
            <span
              className={`font-mono text-sm tabular-nums ml-auto ${
                countdownWarning ? 'text-accent-warm animate-pulse' : 'text-text-secondary'
              }`}
              aria-label="Time remaining"
              role="timer"
            >
              {countdownRemaining}s
            </span>
          </div>
          {/* 5-second warning */}
          {countdownWarning && (
            <p className="text-caption text-accent-warm animate-pulse mb-2">
              {countdownRemaining} seconds remaining
            </p>
          )}
          {/* No notes detected prompt */}
          {showNoNotesPrompt && (
            <div
              className="border border-accent-warm/30 bg-accent-warm/5 px-3 py-2 mb-2"
              role="alert"
            >
              <p className="text-caption text-text-secondary mb-1">No notes detected. Try again?</p>
              <Button variant="outline" size="sm" onClick={onOneMore}>
                Retry
              </Button>
            </div>
          )}
          {/* Done + Pause buttons + Enter hint */}
          {!showNoNotesPrompt && (
            <div className="flex items-center gap-2">
              {onPause && !isPaused && (
                <Button variant="outline" size="sm" onClick={onPause}>
                  Pause
                </Button>
              )}
              {onEndAttempt && !isPaused && (
                <Button variant="outline" size="sm" onClick={onEndAttempt}>
                  Done
                </Button>
              )}
              {!isPaused && onEndAttempt && (
                <span className="text-caption text-text-tertiary flex items-center gap-1">
                  <kbd className="inline-flex h-5 items-center border border-border bg-card px-1.5 font-mono text-caption text-text-secondary">
                    Enter
                  </kbd>
                </span>
              )}
            </div>
          )}
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
                    ? 'text-muted-foreground'
                    : 'text-accent-warm'
              }`}
            >
              {improvementPercent >= 0 ? '\u25B2' : '\u25BC'} {Math.abs(improvementPercent)}%
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
