'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMidiStore } from '@/stores/midi-store';
import { useSessionStore } from '@/stores/session-store';
import { useAppStore } from '@/stores/app-store';

/** Days of absence before showing the warmer "been a while" message. */
const LONG_ABSENCE_DAYS = 3;

function formatSessionDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  if (m < 1) return 'under a minute';
  if (m === 1) return '1 minute';
  return `${m} minutes`;
}

function daysSince(dateIso: string): number {
  const ms = Date.now() - new Date(dateIso).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export interface ReturnSessionBannerProps {
  /** Called when user chooses "Start Fresh". */
  onStartFresh?: () => void;
  /** Called when user chooses "Continue Where I Left Off". */
  onContinue?: () => void;
}

/**
 * Return Session Welcome Experience (Story 10.3)
 *
 * Shown when a returning authenticated user starts a session.
 * Checks continuity data for last session info.
 * Shows warmer message if user has been away >3 days.
 * Auto-dismisses on MIDI input via Zustand vanilla subscribe on latestEvent.
 * Includes "Start Fresh" and "Continue Where I Left Off" buttons.
 */
export function ReturnSessionBanner({ onStartFresh, onContinue }: ReturnSessionBannerProps = {}) {
  const [dismissed, setDismissed] = useState(false);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const recentSessions = useSessionStore((s) => s.recentSessions);
  const totalNotesPlayed = useSessionStore((s) => s.totalNotesPlayed);
  const unsubRef = useRef<(() => void) | null>(null);

  // Auto-dismiss on first MIDI input via vanilla subscribe
  useEffect(() => {
    const unsub = useMidiStore.subscribe(
      (state) => state.latestEvent,
      (latestEvent) => {
        if (latestEvent && latestEvent.type === 'note-on') {
          setDismissed(true);
        }
      }
    );
    unsubRef.current = unsub;
    return () => {
      unsub();
    };
  }, []);

  const lastSession = recentSessions.length > 0 ? recentSessions[0] : null;

  const absenceDays = useMemo(() => (lastSession ? daysSince(lastSession.date) : 0), [lastSession]);
  const isLongAbsence = absenceDays >= LONG_ABSENCE_DAYS;

  // Don't show for guests, if dismissed, if playing, or if no recent sessions
  if (!isAuthenticated || dismissed || totalNotesPlayed > 0 || !lastSession) {
    return null;
  }

  const lastSessionTimestamp = new Date(lastSession.date).getTime();

  const handleStartFresh = () => {
    setDismissed(true);
    onStartFresh?.();
  };

  const handleContinue = () => {
    setDismissed(true);
    onContinue?.();
  };

  return (
    <div
      className="absolute top-12 left-1/2 z-20 -translate-x-1/2 w-full max-w-lg"
      style={{ animation: 'banner-slide-in 0.3s ease-out' }}
      role="status"
      aria-live="polite"
      data-testid="return-session-banner"
    >
      <div className="mx-4 border border-border bg-card/95 backdrop-blur-sm px-5 py-4">
        {/* Welcome message — context-sensitive */}
        <div className="mb-3">
          {isLongAbsence ? (
            <p className="text-sm text-foreground" data-testid="long-absence-message">
              It&apos;s been a while — glad you&apos;re back!
            </p>
          ) : (
            <p className="text-sm text-foreground" data-testid="welcome-back-message">
              Welcome back.
            </p>
          )}

          {/* Last session details */}
          <p className="text-xs text-muted-foreground mt-1">
            Last session: {formatSessionDate(lastSessionTimestamp)}
            {lastSession.detectedKey && (
              <span className="font-mono text-foreground"> / {lastSession.detectedKey}</span>
            )}
            {lastSession.durationMs > 0 && <span> / {formatDuration(lastSession.durationMs)}</span>}
          </p>

          {/* Key insight from last session */}
          {lastSession.keyInsight && (
            <p className="text-xs text-muted-foreground mt-1 truncate italic">
              {lastSession.keyInsight}
            </p>
          )}
        </div>

        <p className="text-xs text-muted-foreground mb-3">Pick up where you left off?</p>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleContinue}
            className="flex-1 border border-primary bg-primary/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-primary hover:bg-primary/20 transition-colors"
          >
            Continue Where I Left Off
          </button>
          <button
            onClick={handleStartFresh}
            className="flex-1 border border-border bg-card px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-foreground hover:bg-surface-light transition-colors"
          >
            Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
}
