'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { TroubleshootingStep } from '@/features/midi/troubleshooting';
import type { MidiConnectionStatus } from '@/features/midi/midi-types';

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

  // Auto-dismiss on successful connection (only when panel has content)
  useEffect(() => {
    if (steps.length > 0 && connectionStatus === 'connected') {
      onDismiss();
    }
  }, [connectionStatus, onDismiss, steps.length]);

  // Escape key to dismiss
  useEffect(() => {
    if (steps.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss, steps.length]);

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

  if (steps.length === 0) return null;

  const isConnected = connectionStatus === 'connected';

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
          <button
            type="button"
            onClick={onDismiss}
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
        <div className="divide-y divide-[#2A2A2A]" aria-live="polite">
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
                    <button
                      type="button"
                      onClick={onDismiss}
                      className="h-8 px-3 text-caption font-medium text-accent-warm border border-accent-warm/30 transition-colors duration-micro hover:bg-accent-warm/10"
                    >
                      {step.actionLabel}
                    </button>
                  ) : isAudioFallback ? (
                    <button
                      type="button"
                      onClick={handleAudioFallback}
                      disabled={audioStarting}
                      className="flex h-8 items-center gap-2 px-3 text-caption font-medium text-accent-warm border border-accent-warm/30 transition-colors duration-micro hover:bg-accent-warm/10 disabled:opacity-50"
                    >
                      {audioStarting && (
                        <span
                          className="inline-block h-1.5 w-1.5 animate-pulse bg-accent-warm"
                          aria-label="Requesting microphone access"
                        />
                      )}
                      {step.actionLabel}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRetry}
                      disabled={retrying}
                      className="flex h-8 items-center gap-2 bg-primary px-3 text-caption font-medium text-background transition-opacity duration-micro hover:opacity-90 disabled:opacity-50"
                    >
                      {retrying ? (
                        <span
                          className="inline-block h-1.5 w-1.5 animate-pulse bg-background"
                          aria-label="Scanning for devices"
                        />
                      ) : isConnected ? (
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
                    </button>
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
