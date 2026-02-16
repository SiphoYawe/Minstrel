'use client';

import { useEffect, useState } from 'react';
import { useMidiStore } from '@/stores/midi-store';

const CONNECTION_TIMEOUT_MS = 15_000;

/**
 * Inline loading indicator shown during MIDI connection.
 *
 * Displays a "Connecting to your instrument..." message with a pulsing
 * progress bar when connectionStatus is 'connecting'. After 15 seconds,
 * switches to a timeout message with troubleshooting suggestions.
 *
 * Permission denial is handled by midi-engine → errorMessage → ErrorBanner.
 */
export function MidiConnectionLoading() {
  const connectionStatus = useMidiStore((s) => s.connectionStatus);

  // Only render the loading indicator when connecting.
  // Unmount/remount resets the timeout state automatically.
  if (connectionStatus !== 'connecting') return null;

  return <ConnectionLoadingInner />;
}

/**
 * Inner component — mounted only while connectionStatus is 'connecting'.
 * Unmounting resets all local state including the timeout flag.
 */
function ConnectionLoadingInner() {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const current = useMidiStore.getState().connectionStatus;
      if (current === 'connecting') {
        setTimedOut(true);
      }
    }, CONNECTION_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative z-[var(--z-banner)] border-b border-primary/20 bg-primary/[0.04]"
    >
      <div className="mx-auto px-4 py-3">
        {!timedOut ? (
          /* Normal connecting state */
          <div className="flex items-center gap-3">
            {/* Pulsing progress indicator */}
            <div className="relative h-1 w-12 overflow-hidden bg-surface-light" aria-hidden="true">
              <div className="absolute inset-y-0 left-0 w-1/2 bg-primary animate-[shimmer_1.2s_ease-in-out_infinite]" />
            </div>
            <p className="font-mono text-caption tracking-wide text-primary/80">
              Connecting to your instrument...
            </p>
          </div>
        ) : (
          /* Timeout state — more urgent, with suggestions */
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span
                className="inline-block h-1.5 w-1.5 shrink-0 bg-accent-warm"
                aria-hidden="true"
              />
              <p className="text-caption font-medium text-accent-warm">
                Taking longer than expected to find your device
              </p>
            </div>
            <ul className="ml-[21px] space-y-1 text-caption leading-relaxed text-muted-foreground">
              <li>Check that your MIDI device is powered on and connected via USB</li>
              <li>Try a different USB port or cable</li>
              <li>Make sure your browser has permission to access MIDI devices</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
