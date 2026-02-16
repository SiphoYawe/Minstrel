'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMidiStore } from '@/stores/midi-store';
import { X } from 'lucide-react';

interface QueuedError {
  id: number;
  message: string;
  timestamp: number;
}

let errorIdCounter = 0;

/**
 * Centralized error banner — renders midiStore.errorMessage as a visible
 * amber-toned notification at the top of the active mode view.
 *
 * - Subscribes to midiStore.errorMessage via vanilla subscribe
 * - Queues errors with count indicator for overlapping messages
 * - Dismiss hides the banner but preserves the error in the store
 * - Uses amber (accent-warm) per growth mindset mandate — never red
 */
export function ErrorBanner() {
  const [errors, setErrors] = useState<QueuedError[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const prevMessageRef = useRef<string | null>(null);

  // Subscribe to errorMessage changes and queue new errors
  useEffect(() => {
    const unsub = useMidiStore.subscribe(
      (state) => state.errorMessage,
      (errorMessage) => {
        if (errorMessage && errorMessage !== prevMessageRef.current) {
          prevMessageRef.current = errorMessage;
          setDismissed(false);
          setErrors((prev) => {
            // Dedupe: don't add if the same message is already the latest
            if (prev.length > 0 && prev[0].message === errorMessage) {
              return prev;
            }
            const newError: QueuedError = {
              id: ++errorIdCounter,
              message: errorMessage,
              timestamp: Date.now(),
            };
            // Keep max 10 errors in queue
            return [newError, ...prev].slice(0, 10);
          });
        }
      }
    );
    return unsub;
  }, []);

  // Seed from current state on mount
  useEffect(() => {
    const current = useMidiStore.getState().errorMessage;
    if (current) {
      prevMessageRef.current = current;
      setErrors([
        {
          id: ++errorIdCounter,
          message: current,
          timestamp: Date.now(),
        },
      ]);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    // Error stays in store for debugging — we only hide the banner
  }, []);

  const latestError = errors[0] ?? null;
  const errorCount = errors.length;

  if (!latestError || dismissed) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="relative z-30 border-b border-accent-warm/20 bg-accent-warm/[0.06]"
    >
      <div className="mx-auto flex items-center gap-3 px-4 py-2">
        {/* Amber indicator dot */}
        <span className="inline-block h-1.5 w-1.5 shrink-0 bg-accent-warm" aria-hidden="true" />

        {/* Error message */}
        <p className="flex-1 text-caption leading-relaxed text-accent-warm">
          {latestError.message}
        </p>

        {/* Count badge when multiple errors queued */}
        {errorCount > 1 && (
          <span
            className="inline-flex h-5 min-w-[20px] items-center justify-center border border-accent-warm/30 bg-accent-warm/10 px-1.5 font-mono text-[10px] tabular-nums text-accent-warm"
            aria-label={`${errorCount} notifications`}
          >
            {errorCount}
          </span>
        )}

        {/* Dismiss button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="flex h-6 w-6 shrink-0 items-center justify-center text-accent-warm/60 transition-colors duration-150 hover:text-accent-warm"
          aria-label="Dismiss notification"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
