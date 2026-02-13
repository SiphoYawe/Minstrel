'use client';

import { useEffect, useRef, useState } from 'react';
import { useMidiStore } from '@/stores/midi-store';
import { useSessionStore } from '@/stores/session-store';

/**
 * First-Run Onboarding Empty State (Story 10.1)
 *
 * Shown when user has no active session. Displays welcome message with
 * pulsing pastel blue indicator and subtle arrow pointing to MIDI connect area.
 * Auto-dismisses on first MIDI input via Zustand vanilla subscribe on latestEvent.
 */
export function FirstRunPrompt() {
  const connectionStatus = useMidiStore((s) => s.connectionStatus);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const totalNotesPlayed = useSessionStore((s) => s.totalNotesPlayed);
  const [dismissed, setDismissed] = useState(false);
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

  // Don't show if there's an active session, notes have been played, or dismissed
  if (activeSessionId || totalNotesPlayed > 0 || dismissed) return null;

  if (connectionStatus === 'connected') {
    return (
      <div
        className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
        role="status"
        aria-live="polite"
        data-testid="first-run-connected"
      >
        <div className="text-center">
          {/* Pulsing blue indicator */}
          <div className="relative inline-flex items-center justify-center mb-5">
            <span
              className="absolute inline-flex h-4 w-4 bg-primary opacity-40"
              style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
            />
            <span className="relative inline-flex h-3 w-3 bg-primary" />
          </div>
          <p className="font-mono text-sm text-foreground tracking-wide">
            Connected — start playing whenever you&apos;re ready
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            I&apos;ll start listening the moment you play a note.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center"
      role="status"
      aria-live="polite"
      data-testid="first-run-prompt"
    >
      <div className="text-center max-w-md px-6">
        {/* MIDI instrument icon with pulsing border */}
        <div className="relative inline-flex h-14 w-14 items-center justify-center border border-border bg-card mb-6">
          <span
            className="absolute inset-0 border border-primary opacity-0"
            style={{ animation: 'pulse-border 2.5s ease-in-out infinite' }}
          />
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-primary"
            aria-hidden="true"
          >
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>

        <h2 className="text-base text-foreground mb-2">Welcome to Minstrel.</h2>
        <p className="font-mono text-sm text-primary mb-3">
          Connect your MIDI instrument and play something
        </p>
        <p className="text-xs text-muted-foreground mb-6">I&apos;ll start listening.</p>

        {/* Status line with connection indicator */}
        <div className="inline-flex items-center gap-2 border border-border bg-card px-4 py-2">
          <span
            className="inline-flex h-2 w-2"
            style={{
              backgroundColor:
                connectionStatus === 'unsupported'
                  ? 'hsl(var(--accent-warm))'
                  : connectionStatus === 'connecting'
                    ? 'hsl(var(--accent-warm))'
                    : 'hsl(var(--muted-foreground))',
              animation:
                connectionStatus === 'connecting' ? 'pulse-dot 1.5s ease-in-out infinite' : 'none',
            }}
          />
          <span className="text-xs text-muted-foreground">
            {connectionStatus === 'unsupported'
              ? 'Web MIDI not supported — use Chrome or Edge'
              : connectionStatus === 'connecting'
                ? 'Detecting MIDI devices...'
                : 'Waiting for a MIDI connection'}
          </span>
        </div>

        {/* Subtle downward arrow pointing to status bar / MIDI area */}
        {connectionStatus !== 'unsupported' && (
          <div className="mt-6 flex justify-center" aria-hidden="true">
            <svg
              width="16"
              height="24"
              viewBox="0 0 16 24"
              fill="none"
              className="text-muted-foreground"
              style={{ animation: 'arrow-bounce 2s ease-in-out infinite' }}
            >
              <path
                d="M8 0v20M2 16l6 6 6-6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="square"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
