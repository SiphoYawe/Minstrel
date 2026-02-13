'use client';

import { useMemo, useState } from 'react';
import { useSessionStore } from '@/stores/session-store';
import { calculateSessionXp, formatXpBreakdown } from '@/features/engagement/xp-calculator';

/**
 * Format milliseconds as "Xm Ys".
 */
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export interface SessionSummaryProps {
  /** Called when user dismisses the summary. */
  onDismiss: () => void;
  /** Called to continue practicing (reset and restart). */
  onContinuePracticing?: () => void;
  /** Called to view the replay of this session. */
  onViewReplay?: () => void;
  /** Called to save and navigate to replay studio. */
  onSaveAndReview?: () => void;
}

/**
 * Session Summary Screen (Story 10.2)
 *
 * Shown when a session ends. Displays: session duration, notes played,
 * timing accuracy %, key detected, XP earned. Includes "Continue Practicing",
 * "View Replay", and "Save & Review" action buttons.
 */
export function SessionSummary({
  onDismiss,
  onContinuePracticing,
  onViewReplay,
  onSaveAndReview,
}: SessionSummaryProps) {
  const sessionStartTimestamp = useSessionStore((s) => s.sessionStartTimestamp);
  const totalNotesPlayed = useSessionStore((s) => s.totalNotesPlayed);
  const currentKey = useSessionStore((s) => s.currentKey);
  const timingAccuracy = useSessionStore((s) => s.timingAccuracy);
  const snapshots = useSessionStore((s) => s.snapshots);
  const drillRepHistory = useSessionStore((s) => s.drillRepHistory);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);

  const [sessionDuration] = useState(() =>
    sessionStartTimestamp ? Date.now() - sessionStartTimestamp : 0
  );

  const latestInsight =
    snapshots.length > 0 ? snapshots[snapshots.length - 1].keyInsight : null;

  // Calculate XP breakdown for this session
  const xpBreakdown = useMemo(() => {
    const drillResults = drillRepHistory.map((r) => ({
      passed: r.accuracy >= 0.8,
    }));
    return calculateSessionXp({
      activePlayDurationMs: sessionDuration,
      currentTimingAccuracy: timingAccuracy / 100,
      rollingTimingAverage: 0.75, // Baseline rolling average
      drillResults,
      newRecordTypes: [],
    });
  }, [sessionDuration, timingAccuracy, drillRepHistory]);

  const keyDisplay = currentKey
    ? `${currentKey.root} ${currentKey.mode}`
    : '--';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      style={{ animation: 'modal-fade-in 0.2s ease-out' }}
      role="dialog"
      aria-modal="true"
      aria-label="Session summary"
    >
      <div
        className="w-full max-w-md border border-border bg-background p-8 mx-4"
        style={{ animation: 'modal-scale-in 0.25s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.15em] text-primary">
            Session Complete
          </h2>
          <button
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors text-xs"
            aria-label="Close session summary"
          >
            &#x2715;
          </button>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-3 mb-6" data-testid="session-metrics">
          <div className="border border-border bg-card p-3">
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Duration
            </span>
            <span className="block font-mono text-lg text-foreground">
              {formatDuration(sessionDuration)}
            </span>
          </div>
          <div className="border border-border bg-card p-3">
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Notes
            </span>
            <span className="block font-mono text-lg text-foreground">
              {totalNotesPlayed}
            </span>
          </div>
          <div className="border border-border bg-card p-3">
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Key
            </span>
            <span className="block font-mono text-sm text-foreground">
              {keyDisplay}
            </span>
          </div>
          <div className="border border-border bg-card p-3">
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Timing
            </span>
            <span className="block font-mono text-sm text-foreground">
              {Math.round(timingAccuracy)}%
            </span>
          </div>
        </div>

        {/* XP earned */}
        {xpBreakdown.totalXp > 0 && (
          <div
            className="border border-primary/30 bg-primary/5 px-4 py-3 mb-6"
            data-testid="xp-earned"
          >
            <span className="block text-[10px] uppercase tracking-wider text-primary mb-1">
              XP Earned
            </span>
            <span className="block font-mono text-lg text-primary">
              +{xpBreakdown.totalXp} XP
            </span>
            <span className="block text-[10px] text-muted-foreground mt-1">
              {formatXpBreakdown(xpBreakdown)}
            </span>
          </div>
        )}

        {/* Latest coaching insight */}
        {latestInsight && (
          <div className="border-l-2 border-l-primary bg-card px-4 py-3 mb-6">
            <p className="text-sm text-muted-foreground">{latestInsight}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          {onContinuePracticing && (
            <button
              onClick={onContinuePracticing}
              className="w-full border border-primary bg-primary/10 px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-primary hover:bg-primary/20 transition-colors"
            >
              Continue Practicing
            </button>
          )}
          {onViewReplay && activeSessionId && (
            <button
              onClick={onViewReplay}
              className="w-full border border-border bg-card px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-foreground hover:bg-surface-light transition-colors"
            >
              View Replay
            </button>
          )}
          {onSaveAndReview && activeSessionId && (
            <button
              onClick={onSaveAndReview}
              className="w-full border border-border bg-card px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-foreground hover:bg-surface-light transition-colors"
            >
              Save &amp; Review
            </button>
          )}
          <button
            onClick={onDismiss}
            className="w-full px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
