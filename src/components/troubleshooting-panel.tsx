'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { TroubleshootingStep } from '@/features/midi/troubleshooting';
import type { MidiConnectionStatus } from '@/features/midi/midi-types';
import { Button } from '@/components/ui/button';

const DEBOUNCE_MS = 2000;
const SUCCESS_DISPLAY_MS = 3000;

interface TroubleshootingPanelProps {
  steps: TroubleshootingStep[];
  onRetry: () => Promise<void>;
  onDismiss: () => void;
  onAudioFallback?: () => Promise<void>;
  connectionStatus: MidiConnectionStatus;
}

export function TroubleshootingPanel({
  steps,
  onRetry,
  onDismiss,
  onAudioFallback,
  connectionStatus,
}: TroubleshootingPanelProps) {
  const [retrying, setRetrying] = useState(false);
  const retryingRef = useRef(false);
  const [audioStarting, setAudioStarting] = useState(false);
  const audioStartingRef = useRef(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevStatusRef = useRef<MidiConnectionStatus>(connectionStatus);

  // Debounced auto-dismiss: show success for 3 seconds before closing
  useEffect(() => {
    // Clean up any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (connectionStatus === 'connected' && prevStatusRef.current !== 'connected') {
      // Connection succeeded — debounce then show success state
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        setShowSuccess(true);
        // After 3 seconds of success, auto-close
        successTimerRef.current = setTimeout(() => {
          successTimerRef.current = null;
          setShowSuccess(false);
          onDismiss();
        }, SUCCESS_DISPLAY_MS);
      }, DEBOUNCE_MS);
    }

    prevStatusRef.current = connectionStatus;

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [connectionStatus, onDismiss]);

  // Clean up success timer on unmount
  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  // Escape key to dismiss
  useEffect(() => {
    if (steps.length === 0 && !showSuccess) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSuccess(false);
        if (successTimerRef.current) {
          clearTimeout(successTimerRef.current);
          successTimerRef.current = null;
        }
        onDismiss();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss, steps.length, showSuccess]);

  const handleRetry = useCallback(async () => {
    if (retryingRef.current) return;
    retryingRef.current = true;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      retryingRef.current = false;
      setRetrying(false);
    }
  }, [onRetry]);

  const handleAudioFallback = useCallback(async () => {
    if (audioStartingRef.current || !onAudioFallback) return;
    audioStartingRef.current = true;
    setAudioStarting(true);
    try {
      await onAudioFallback();
    } finally {
      audioStartingRef.current = false;
      setAudioStarting(false);
    }
  }, [onAudioFallback]);

  const handleDismiss = useCallback(() => {
    setShowSuccess(false);
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
    onDismiss();
  }, [onDismiss]);

  // Show success state
  if (showSuccess) {
    return (
      <div
        role="complementary"
        aria-label="MIDI connected"
        className="fixed inset-x-0 bottom-12 z-[var(--z-panel)] flex justify-center px-4 pb-2"
      >
        <div className="w-full max-w-[480px] border border-border bg-card">
          <div className="flex items-center gap-3 px-4 py-4">
            <span className="inline-block h-2 w-2 bg-accent-success" aria-hidden="true" />
            <p className="text-ui-label font-medium text-accent-success">
              Connected — you&apos;re all set
            </p>
            <button
              type="button"
              onClick={handleDismiss}
              className="ml-auto flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors duration-150 hover:text-foreground"
              aria-label="Dismiss"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="M1 1L13 13M13 1L1 13"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="square"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (steps.length === 0) return null;

  return (
    <div
      role="complementary"
      aria-label="MIDI troubleshooting"
      className="fixed inset-x-0 bottom-12 z-50 flex justify-center px-4 pb-2"
    >
      <div className="w-full max-w-[480px] border border-border bg-card">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-ui-label font-medium tracking-wide text-foreground">
            Let&apos;s get connected
          </h2>
          {/* Raw <button> retained: tiny 7x7 dismiss icon with custom sizing */}
          <button
            type="button"
            onClick={handleDismiss}
            className="flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors duration-micro hover:text-foreground"
            aria-label="Dismiss troubleshooting"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path
                d="M1 1L13 13M13 1L1 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="square"
              />
            </svg>
          </button>
        </div>

        {/* Steps */}
        <div className="divide-y divide-surface-border" aria-live="polite">
          {steps.map((step, i) => {
            const isChannel = step.id === 'channel-mismatch';
            const isAudioFallback = step.id === 'audio-fallback';

            return (
              <div key={step.id} className="flex gap-3 px-4 py-3">
                {/* Step number */}
                <span
                  className={`mt-px font-mono text-caption tabular-nums ${
                    isChannel || isAudioFallback ? 'text-accent-warm' : 'text-muted-foreground'
                  }`}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <p
                    className={`text-ui-label font-medium ${
                      isChannel || isAudioFallback ? 'text-accent-warm' : 'text-foreground'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-caption leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>

                {/* Action */}
                <div className="flex shrink-0 items-start pt-0.5">
                  {isChannel ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDismiss}
                      className="text-accent-warm border-accent-warm/30 hover:bg-accent-warm/10"
                    >
                      {step.actionLabel}
                    </Button>
                  ) : isAudioFallback ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAudioFallback}
                      disabled={audioStarting}
                      className="text-accent-warm border-accent-warm/30 hover:bg-accent-warm/10"
                    >
                      {audioStarting && (
                        <span
                          className="inline-block h-1.5 w-1.5 animate-pulse bg-accent-warm"
                          aria-label="Requesting microphone access"
                        />
                      )}
                      {step.actionLabel}
                    </Button>
                  ) : (
                    <Button size="sm" onClick={handleRetry} disabled={retrying}>
                      {retrying ? (
                        <span
                          className="inline-block h-1.5 w-1.5 animate-pulse bg-background"
                          aria-label="Scanning for devices"
                        />
                      ) : connectionStatus === 'connected' ? (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M2 6L5 9L10 3"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="square"
                          />
                        </svg>
                      ) : null}
                      {step.actionLabel}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
