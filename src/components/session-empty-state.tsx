'use client';

import { useEffect, useState } from 'react';
import { Music } from 'lucide-react';
import { useMidiStore } from '@/stores/midi-store';
import { useSessionStore } from '@/stores/session-store';

/**
 * Subtle empty state shown on the session canvas when:
 * - FirstRunPrompt has been dismissed but no notes played yet
 * - MIDI is connected but nothing has been played
 *
 * Auto-hides on first note-on event via Zustand subscription.
 * Non-modal, non-blocking — just a gentle centered cue.
 */
export function SessionEmptyState() {
  const connectionStatus = useMidiStore((s) => s.connectionStatus);
  const totalNotesPlayed = useSessionStore((s) => s.totalNotesPlayed);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const [hidden, setHidden] = useState(false);

  // Auto-hide on first note-on
  useEffect(() => {
    const unsub = useMidiStore.subscribe(
      (state) => state.latestEvent,
      (event) => {
        if (event && event.type === 'note-on') {
          setHidden(true);
        }
      }
    );
    return unsub;
  }, []);

  // Don't show if notes have been played, session is active, or manually hidden
  if (hidden || totalNotesPlayed > 0 || activeSessionId) return null;

  const isConnected = connectionStatus === 'connected';

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-[var(--z-overlay)]"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3 opacity-[0.35]">
        <div className="relative">
          <Music className="w-6 h-6 text-primary" strokeWidth={1} aria-hidden="true" />
          {isConnected && (
            <span
              className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 bg-accent-success"
              aria-hidden="true"
            />
          )}
        </div>
        <p className="font-mono text-[11px] tracking-[0.1em] text-foreground/70">
          {isConnected ? 'Play something to begin' : 'Connect a MIDI device to start'}
        </p>
      </div>
    </div>
  );
}
