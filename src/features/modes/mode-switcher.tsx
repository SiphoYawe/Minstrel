'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSessionStore } from '@/stores/session-store';
import { capture } from '@/lib/analytics';
import type { SessionMode } from '@/features/modes/mode-types';
import { MODE_CONFIGS } from '@/features/modes/mode-types';

const MODE_ORDER: SessionMode[] = ['silent-coach', 'dashboard-chat', 'replay-studio'];

/** Short labels for each mode */
const MODE_LABELS: Record<SessionMode, string> = {
  'silent-coach': 'Play',
  'dashboard-chat': 'Coach',
  'replay-studio': 'Replay',
};

/** Descriptive subtitles */
const MODE_SUBTITLES: Record<SessionMode, string> = {
  'silent-coach': 'Live visualization',
  'dashboard-chat': 'AI-assisted practice',
  'replay-studio': 'Session review',
};

function getTooltipDismissed(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem('minstrel:mode-tooltip-dismissed') === 'true';
  } catch {
    return true;
  }
}

export function ModeSwitcher() {
  const currentMode = useSessionStore((s) => s.currentMode);
  const announceRef = useRef<HTMLSpanElement>(null);
  const [showTooltip, setShowTooltip] = useState(() => !getTooltipDismissed());

  function dismissTooltip() {
    setShowTooltip(false);
    try {
      localStorage.setItem('minstrel:mode-tooltip-dismissed', 'true');
    } catch {
      /* noop */
    }
  }

  const switchMode = useCallback(
    (mode: SessionMode, source: 'click' | 'keyboard' = 'click') => {
      if (mode === currentMode) return;
      capture('mode_switched', {
        from_mode: currentMode,
        to_mode: mode,
        source,
      });
      useSessionStore.getState().setCurrentMode(mode);
      dismissTooltip();
    },
    [currentMode]
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!e.altKey) return;

      const modeByKey: Record<string, SessionMode> = {
        '1': 'silent-coach',
        '2': 'dashboard-chat',
        '3': 'replay-studio',
      };

      const mode = modeByKey[e.key];
      if (mode) {
        e.preventDefault();
        switchMode(mode, 'keyboard');
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [switchMode]);

  // Announce mode changes to screen readers and focus main content (Story 13.5)
  useEffect(() => {
    if (announceRef.current) {
      announceRef.current.textContent = `${MODE_CONFIGS[currentMode].name} mode active`;
    }
    // Move focus to main content area after mode switch
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus({ preventScroll: true });
    }
  }, [currentMode]);

  return (
    <>
      {/* Screen reader announcement */}
      <span ref={announceRef} className="sr-only" aria-live="polite" role="status" />

      <div className="relative">
        <nav
          role="tablist"
          aria-label="Session mode"
          className="flex items-center gap-px bg-card/90 backdrop-blur-sm border border-border"
        >
          {MODE_ORDER.map((mode) => {
            const config = MODE_CONFIGS[mode];
            const isActive = mode === currentMode;

            return (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-keyshortcuts={`Alt+${config.shortcut}`}
                onClick={() => switchMode(mode)}
                className={`
                  relative px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em]
                  transition-all duration-150
                  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
                  ${isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70'}
                `}
              >
                {isActive && (
                  <span
                    className="absolute inset-x-0 bottom-0 h-px bg-primary"
                    aria-hidden="true"
                  />
                )}

                <span className="flex flex-col items-center gap-0.5">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] ${isActive ? 'text-primary' : 'text-text-tertiary'}`}
                    >
                      {config.shortcut}
                    </span>
                    <span aria-label={config.label}>{MODE_LABELS[mode]}</span>
                  </span>
                  <span className="text-[9px] text-muted-foreground normal-case tracking-normal hidden sm:block">
                    {MODE_SUBTITLES[mode]}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* Onboarding tooltip */}
        {showTooltip && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[var(--z-overlay)]">
            <div className="bg-card border border-border px-3 py-2 max-w-[240px] text-center">
              <p className="text-xs text-foreground mb-1">
                Switch between modes to visualize, get coaching, or replay your sessions
              </p>
              <button
                onClick={dismissTooltip}
                className="text-[10px] text-primary hover:text-primary/80"
                type="button"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
