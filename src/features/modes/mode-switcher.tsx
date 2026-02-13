'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSessionStore } from '@/stores/session-store';
import { capture } from '@/lib/analytics';
import type { SessionMode } from '@/features/modes/mode-types';
import { MODE_CONFIGS } from '@/features/modes/mode-types';

const MODE_ORDER: SessionMode[] = ['silent-coach', 'dashboard-chat', 'replay-studio'];

/** Responsive label parts: [prefix (hidden on small screens), always-visible suffix] */
const RESPONSIVE_LABELS: Record<SessionMode, [prefix: string, suffix: string]> = {
  'silent-coach': ['Silent ', 'Coach'],
  'dashboard-chat': ['Dash', 'board'],
  'replay-studio': ['Re', 'play'],
};

export function ModeSwitcher() {
  const currentMode = useSessionStore((s) => s.currentMode);
  const announceRef = useRef<HTMLSpanElement>(null);

  const switchMode = useCallback(
    (mode: SessionMode, source: 'click' | 'keyboard' = 'click') => {
      if (mode === currentMode) return;
      capture('mode_switched', {
        from_mode: currentMode,
        to_mode: mode,
        source,
      });
      useSessionStore.getState().setCurrentMode(mode);
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

  // Announce mode changes to screen readers
  useEffect(() => {
    if (announceRef.current) {
      announceRef.current.textContent = `${MODE_CONFIGS[currentMode].name} mode active`;
    }
  }, [currentMode]);

  return (
    <>
      {/* Screen reader announcement */}
      <span ref={announceRef} className="sr-only" aria-live="polite" role="status" />

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
                ${isActive ? 'text-foreground' : 'text-muted-foreground hover:text-secondary'}
              `}
            >
              {/* Active indicator — bottom edge line */}
              {isActive && (
                <span className="absolute inset-x-0 bottom-0 h-px bg-primary" aria-hidden="true" />
              )}

              {/* Shortcut number + label with responsive abbreviation */}
              <span className="flex items-center gap-1.5">
                <span className={`text-[10px] ${isActive ? 'text-primary' : 'text-text-tertiary'}`}>
                  {config.shortcut}
                </span>
                <span aria-label={config.label}>
                  <span className="hidden sm:inline">{RESPONSIVE_LABELS[mode][0]}</span>
                  {RESPONSIVE_LABELS[mode][1]}
                </span>
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
