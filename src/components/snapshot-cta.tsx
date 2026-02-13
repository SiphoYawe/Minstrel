'use client';

import { Button } from '@/components/ui/button';
import { useSessionStore } from '@/stores/session-store';
import { useAppStore } from '@/stores/app-store';

export function SnapshotCTA() {
  const currentSnapshot = useSessionStore((s) => s.currentSnapshot);
  const setCurrentMode = useSessionStore((s) => s.setCurrentMode);
  const hasApiKey = useAppStore((s) => s.hasApiKey);

  if (!currentSnapshot) return null;

  return (
    <div
      className="absolute bottom-16 left-1/2 z-20 -translate-x-1/2 flex gap-3 animate-[fadeUp_300ms_ease-out]"
      aria-live="polite"
    >
      <span className="sr-only">Snapshot ready: {currentSnapshot.keyInsight}</span>
      <Button
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
          useSessionStore.getState().setPendingDrillRequest(true);
          setCurrentMode('dashboard-chat');
        }}
        disabled={!hasApiKey}
        title={!hasApiKey ? 'Add an API key in Settings to generate drills' : undefined}
        className="font-mono text-[11px] uppercase tracking-[0.1em] backdrop-blur-sm"
      >
        Generate Drill
      </Button>
    </div>
  );
}
