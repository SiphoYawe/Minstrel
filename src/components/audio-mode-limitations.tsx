'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMidiStore } from '@/stores/midi-store';
import { getDisabledFeatures } from '@/features/midi/audio-mode-limits';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const STORAGE_KEY = 'minstrel:audio-mode-explained';

function wasExplained(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function markExplained(): void {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    /* noop */
  }
}

/**
 * Overlay shown when user switches to audio mode.
 * Lists which features are limited/degraded and why.
 * Dismissible, remembers that user has seen it via localStorage.
 */
export function AudioModeLimitations() {
  const inputSource = useMidiStore((s) => s.inputSource);
  const [showOverlay, setShowOverlay] = useState(false);

  // Subscribe to inputSource transitions via vanilla subscribe.
  // Fires callback only when inputSource changes TO 'audio'.
  useEffect(() => {
    const unsub = useMidiStore.subscribe(
      (state) => state.inputSource,
      (source, prevSource) => {
        if (source === 'audio' && prevSource !== 'audio' && !wasExplained()) {
          setShowOverlay(true);
        }
      }
    );
    return unsub;
  }, []);

  const handleDismiss = useCallback(() => {
    setShowOverlay(false);
    markExplained();
  }, []);

  if (!showOverlay || inputSource !== 'audio') return null;

  const features = getDisabledFeatures();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audio-limits-title"
    >
      <div className="relative mx-4 w-full max-w-sm border border-border bg-card p-6">
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-3 top-3 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>

        {/* Microphone icon */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-accent-warm/30 bg-accent-warm/10">
            <svg
              width="18"
              height="18"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
              className="text-accent-warm"
            >
              <path
                d="M7 1v8M4.5 6.5a2.5 2.5 0 0 0 5 0M3 9.5C3 11.433 4.79 13 7 13s4-1.567 4-3.5"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="square"
              />
            </svg>
          </div>
          <div>
            <h2
              id="audio-limits-title"
              className="font-mono text-[11px] uppercase tracking-[0.15em] text-accent-warm"
            >
              Audio Mode
            </h2>
            <p className="text-caption text-muted-foreground">Some features are limited</p>
          </div>
        </div>

        {/* Feature list */}
        <div className="mb-5 space-y-2">
          {features.map((f) => (
            <div key={f.featureId} className="flex items-start gap-2.5">
              <span
                className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 bg-accent-warm/60"
                aria-hidden="true"
              />
              <div>
                <p className="text-caption font-medium text-foreground">{f.label}</p>
                <p className="text-caption text-muted-foreground">{f.reason}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mb-4 text-caption leading-relaxed text-muted-foreground">
          Connect a MIDI device anytime for full precision. Audio mode still tracks pitch and basic
          dynamics.
        </p>

        <Button className="w-full" onClick={handleDismiss}>
          Got it
        </Button>
      </div>
    </div>
  );
}
