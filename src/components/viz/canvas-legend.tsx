'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/app-store';
import { useMidiStore } from '@/stores/midi-store';

const AUTO_HIDE_MS = 30_000;

export function CanvasLegend() {
  const legendDismissed = useAppStore((s) => s.legendDismissed);
  const setLegendDismissed = useAppStore((s) => s.setLegendDismissed);
  const [visible, setVisible] = useState(!legendDismissed);
  const [opacity, setOpacity] = useState(!legendDismissed ? 1 : 0);

  const hideLegend = useCallback(() => {
    setOpacity(0);
    setTimeout(() => setVisible(false), 300);
    setLegendDismissed(true);
  }, [setLegendDismissed]);

  // Auto-hide after 30 seconds
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(hideLegend, AUTO_HIDE_MS);
    return () => clearTimeout(timer);
  }, [visible, hideLegend]);

  // Hide on first note played
  useEffect(() => {
    if (!visible) return;
    const unsub = useMidiStore.subscribe(
      (state) => Object.keys(state.activeNotes).length,
      (noteCount) => {
        if (noteCount > 0) hideLegend();
      }
    );
    return unsub;
  }, [visible, hideLegend]);

  function showLegend() {
    setVisible(true);
    requestAnimationFrame(() => setOpacity(1));
  }

  return (
    <>
      {/* Legend overlay */}
      {visible && (
        <div
          className="absolute inset-0 pointer-events-none z-[var(--z-overlay)] flex items-center justify-center"
          style={{ opacity, transition: 'opacity 300ms ease-in-out' }}
          aria-hidden="true"
        >
          <div className="flex gap-8">
            {/* Notes area */}
            <div className="flex flex-col items-center gap-2">
              <div className="bg-[rgba(15,15,15,0.85)] px-4 py-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="8" width="16" height="4" fill="#7CB9E8" opacity={0.7} />
                  <rect x="6" y="14" width="12" height="3" fill="#7CB9E8" opacity={0.5} />
                </svg>
                <p className="text-xs text-primary font-mono mt-1 text-center">Notes</p>
                <p className="text-[9px] text-muted-foreground text-center">Piano roll</p>
              </div>
            </div>

            {/* Timing area */}
            <div className="flex flex-col items-center gap-2">
              <div className="bg-[rgba(15,15,15,0.85)] px-4 py-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <line
                    x1="12"
                    y1="2"
                    x2="12"
                    y2="22"
                    stroke="#7CB9E8"
                    strokeWidth="1"
                    opacity={0.5}
                  />
                  <circle cx="12" cy="12" r="3" fill="#7CB9E8" opacity={0.7} />
                </svg>
                <p className="text-xs text-primary font-mono mt-1 text-center">Timing</p>
                <p className="text-[9px] text-muted-foreground text-center">Beat accuracy</p>
              </div>
            </div>

            {/* Key area */}
            <div className="flex flex-col items-center gap-2">
              <div className="bg-[rgba(15,15,15,0.85)] px-4 py-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <text
                    x="12"
                    y="16"
                    textAnchor="middle"
                    fill="#B4A7D6"
                    fontSize="12"
                    fontFamily="monospace"
                  >
                    K
                  </text>
                </svg>
                <p className="text-xs text-primary font-mono mt-1 text-center">Key</p>
                <p className="text-[9px] text-muted-foreground text-center">Harmonic analysis</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info button to re-show legend */}
      {!visible && (
        <Button
          variant="ghost"
          onClick={showLegend}
          className="absolute bottom-4 right-4 z-[var(--z-overlay)] w-7 h-7 p-0 text-muted-foreground hover:text-primary"
          aria-label="Show canvas legend"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <text
              x="8"
              y="11.5"
              textAnchor="middle"
              fill="currentColor"
              fontSize="10"
              fontFamily="monospace"
            >
              i
            </text>
          </svg>
        </Button>
      )}
    </>
  );
}
