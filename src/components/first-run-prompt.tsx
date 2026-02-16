'use client';

import { useEffect, useState, useCallback } from 'react';
import { useMidiStore } from '@/stores/midi-store';
import { useSessionStore } from '@/stores/session-store';
import { Music, ChevronDown, X, Check } from 'lucide-react';

const SESSION_STARTED_DISPLAY_MS = 2500;

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
 * First-Run Onboarding (Story 10.1, updated in 22.6)
 *
 * State-driven transitions:
 * 1. MIDI not connected → "Connect your instrument to get started"
 * 2. MIDI connected → "Play your first note"
 * 3. Note played before prompt renders (race) → "Session started!" (auto-dismiss)
 */
export function FirstRunPrompt() {
  const connectionStatus = useMidiStore((s) => s.connectionStatus);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const totalNotesPlayed = useSessionStore((s) => s.totalNotesPlayed);
  const [dismissed, setDismissed] = useState(() => getFirstRunDismissed());

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
    return unsub;
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    persistFirstRunDismissed();
  }, []);

  // Already dismissed via localStorage
  if (dismissed) return null;

  // Race condition: note was played before prompt could render.
  // Show brief "Session started!" confirmation that auto-dismisses.
  if (activeSessionId || totalNotesPlayed > 0) {
    return <SessionStartedConfirmation onDone={handleDismiss} />;
  }

  // State: MIDI connected → "Play your first note"
  if (connectionStatus === 'connected') {
    return (
      <div
        className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-background/80 backdrop-blur-sm"
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
          <p className="font-mono text-sm text-foreground tracking-wide">Play your first note</p>
          <p className="text-xs text-muted-foreground mt-2">
            I&apos;ll start listening the moment you play.
          </p>
        </div>
      </div>
    );
  }

  // State: MIDI not connected → "Connect your instrument to get started"
  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-background/80 backdrop-blur-sm"
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
          Connect your instrument to get started
        </p>
        <p className="text-xs text-muted-foreground mb-6">
          Plug in a MIDI device and I&apos;ll start listening.
        </p>

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

/**
 * Brief "Session started!" confirmation shown when notes were played
 * before the prompt could render (race condition). Auto-dismisses.
 */
function SessionStartedConfirmation({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, SESSION_STARTED_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="status"
      aria-live="assertive"
      data-testid="session-started-confirmation"
    >
      <div className="text-center border border-border bg-card px-10 py-6 max-w-xs">
        <div className="relative inline-flex items-center justify-center mb-4">
          <span className="inline-flex h-8 w-8 items-center justify-center border border-accent-success/30 bg-accent-success/10">
            <Check className="w-4 h-4 text-accent-success" strokeWidth={2} />
          </span>
        </div>
        <p className="font-mono text-sm text-foreground tracking-wide">Session started</p>
        <p className="text-xs text-muted-foreground mt-1">Listening to your playing.</p>
      </div>
    </div>
  );
}
