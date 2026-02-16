'use client';

import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useSessionStore } from '@/stores/session-store';
import { useAppStore } from '@/stores/app-store';

interface SnapshotCTAProps {
  onGenerateDrill?: () => void;
  isDrillGenerating?: boolean;
}

export function SnapshotCTA({ onGenerateDrill, isDrillGenerating = false }: SnapshotCTAProps) {
  const currentSnapshot = useSessionStore((s) => s.currentSnapshot);
  const setCurrentMode = useSessionStore((s) => s.setCurrentMode);
  const hasApiKey = useAppStore((s) => s.hasApiKey);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (currentSnapshot && firstButtonRef.current) {
      firstButtonRef.current.focus();
    }
  }, [currentSnapshot]);

  if (!currentSnapshot) return null;

  return (
    <div
      className="absolute bottom-16 left-1/2 z-[var(--z-overlay)] -translate-x-1/2 flex gap-3 animate-[fadeUp_300ms_ease-out]"
      aria-live="polite"
    >
      <span className="sr-only">
        Snapshot ready:{' '}
        {currentSnapshot.insights?.length > 0
          ? currentSnapshot.insights.map((i) => i.text).join('. ')
          : currentSnapshot.keyInsight}
      </span>
      <Button
        ref={firstButtonRef}
        variant="outline"
        size="sm"
        onClick={() => setCurrentMode('dashboard-chat')}
        className="font-mono text-[11px] uppercase tracking-[0.1em] backdrop-blur-sm"
      >
        View Dashboard
      </Button>
      <Button
        size="sm"
        onClick={() => {
          if (onGenerateDrill) {
            onGenerateDrill();
          }
          setCurrentMode('dashboard-chat');
        }}
        disabled={!hasApiKey || isDrillGenerating}
        title={!hasApiKey ? 'Add an API key in Settings to generate drills' : undefined}
        className="font-mono text-[11px] uppercase tracking-[0.1em] backdrop-blur-sm"
      >
        {isDrillGenerating ? 'Generating...' : 'Generate Drill'}
      </Button>
    </div>
  );
}
