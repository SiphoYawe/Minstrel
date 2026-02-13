'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useMidiStore } from '@/stores/midi-store';
import { useSessionStore } from '@/stores/session-store';
import { useAppStore } from '@/stores/app-store';
import { daysSinceLastSession } from '@/features/session/warm-up-flow';

interface WarmUpPromptProps {
  onStartWarmUp: () => void;
  onSkip: () => void;
}

/**
 * Compact card that offers a warm-up before freeform play.
 * Auto-dismisses when MIDI input is detected (user starts playing).
 * Shows extra context when the user has been away for 3+ days.
 */
export function WarmUpPrompt({ onStartWarmUp, onSkip }: WarmUpPromptProps) {
  const [dismissed, setDismissed] = useState(false);

  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const skillProfile = useSessionStore((s) => s.skillProfile);
  const recentSessions = useSessionStore((s) => s.recentSessions);
  const totalNotesPlayed = useSessionStore((s) => s.totalNotesPlayed);
  const isWarmingUp = useSessionStore((s) => s.isWarmingUp);

  // Auto-dismiss when MIDI input detected
  useEffect(() => {
    const unsub = useMidiStore.subscribe(
      (s) => s.latestEvent,
      (event) => {
        if (event && event.type === 'note-on') {
          setDismissed(true);
        }
      }
    );
    return unsub;
  }, []);

  // Don't show for guests, if dismissed, if already playing, if no skill profile, or if warm-up active
  if (
    !isAuthenticated ||
    dismissed ||
    totalNotesPlayed > 0 ||
    !skillProfile ||
    recentSessions.length === 0 ||
    isWarmingUp
  ) {
    return null;
  }

  const daysAway = daysSinceLastSession(recentSessions);
  const showLongAbsenceMessage = daysAway !== null && daysAway >= 3;

  function handleStart() {
    setDismissed(true);
    onStartWarmUp();
  }

  function handleSkip() {
    setDismissed(true);
    onSkip();
  }

  return (
    <div className="absolute top-14 left-1/2 z-10 -translate-x-1/2 w-full max-w-sm">
      <div className="mx-4 border border-border bg-card/95 backdrop-blur-sm px-4 py-3">
        <p className="text-sm text-foreground mb-1">Warm up first?</p>
        {showLongAbsenceMessage && (
          <p className="text-xs text-muted-foreground mb-2">
            It&apos;s been a while — a warm-up can help
          </p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <Button
            onClick={handleStart}
            className="h-8 px-4 bg-primary text-background hover:brightness-90 font-mono text-xs uppercase tracking-wider"
          >
            Start warm-up
          </Button>
          <button
            onClick={handleSkip}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            type="button"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
