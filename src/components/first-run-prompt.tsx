'use client';

import { useEffect, useRef, useState } from 'react';
import { useMidiStore } from '@/stores/midi-store';
import { useSessionStore } from '@/stores/session-store';
import { Music, ChevronDown, X } from 'lucide-react';

function getFirstRunDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('minstrel:first-run-dismissed') === 'true';
  } catch {
    return false;
  }
}

function persistFirstRunDismissed() {
  try {
    localStorage.setItem('minstrel:first-run-dismissed', 'true');
  } catch {
    /* noop */
  }
}

/**
 * First-Run Onboarding Empty State (Story 10.1)
 *
 * Shown as a centered modal with backdrop blur when user has no active session.
 * Auto-dismisses on first MIDI input via Zustand vanilla subscribe on latestEvent.
 * Persists dismissed state to localStorage so it doesn't re-render on reload.
 */
export function FirstRunPrompt() {
  const connectionStatus = useMidiStore((s) => s.connectionStatus);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const totalNotesPlayed = useSessionStore((s) => s.totalNotesPlayed);
  const [dismissed, setDismissed] = useState(() => getFirstRunDismissed());
  const unsubRef = useRef<(() => void) | null>(null);

  // Auto-dismiss on first MIDI input via vanilla subscribe
  useEffect(() => {
    const unsub = useMidiStore.subscribe(
      (state) => state.latestEvent,
      (latestEvent) => {
        if (latestEvent && latestEvent.type === 'note-on') {
          setDismissed(true);
          persistFirstRunDismissed();
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

  function handleDismiss() {
    setDismissed(true);
    persistFirstRunDismissed();
  }

  if (connectionStatus === 'connected') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        role="status"
        aria-live="polite"
        data-testid="first-run-connected"
      >
        <div className="relative text-center border border-border bg-card px-10 py-8 max-w-sm">
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      data-testid="first-run-prompt"
    >
      <div className="relative text-center max-w-sm border border-border bg-card px-10 py-8">
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>
        {/* MIDI instrument icon with pulsing border */}
        <div className="relative inline-flex h-14 w-14 items-center justify-center border border-border bg-background mb-6">
          <span
            className="absolute inset-0 border border-primary opacity-0"
            style={{ animation: 'pulse-border 2.5s ease-in-out infinite' }}
          />
          <Music className="w-6 h-6 text-primary" strokeWidth={1.5} aria-hidden="true" />
        </div>

        <h2 className="text-base text-foreground mb-2">Welcome to Minstrel.</h2>
        <p className="font-mono text-sm text-primary mb-3">
          Connect your MIDI instrument and play something
        </p>
        <p className="text-xs text-muted-foreground mb-6">I&apos;ll start listening.</p>

        {/* Status line with connection indicator */}
        <div className="inline-flex items-center gap-2 border border-border bg-background px-4 py-2">
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

        {/* Subtle downward arrow */}
        {connectionStatus !== 'unsupported' && (
          <div className="mt-6 flex justify-center" aria-hidden="true">
            <ChevronDown
              className="w-5 h-5 text-muted-foreground"
              strokeWidth={1.5}
              style={{ animation: 'arrow-bounce 2s ease-in-out infinite' }}
            />
          </div>
        )}

        {/* Skip link */}
        <button
          type="button"
          onClick={handleDismiss}
          className="mt-4 text-[10px] text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
