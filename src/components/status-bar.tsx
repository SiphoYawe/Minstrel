'use client';

import { useEffect, useState } from 'react';
import { useMidiStore } from '@/stores/midi-store';
import { useSessionStore } from '@/stores/session-store';
import { useAppStore } from '@/stores/app-store';
import { useStreak } from '@/features/engagement/use-streak';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { StreakBadge } from '@/components/streak-badge';
import { WarmUpProgress } from '@/components/warm-up-progress';
import { ModeSwitcher } from '@/features/modes/mode-switcher';
import { Button } from '@/components/ui/button';
import type { MidiConnectionStatus } from '@/features/midi/midi-types';

const statusConfig: Record<
  MidiConnectionStatus,
  { color: string; label: string; dotClass: string }
> = {
  connected: {
    color: 'text-accent-success',
    label: 'Connected',
    dotClass: 'bg-accent-success',
  },
  connecting: {
    color: 'text-primary',
    label: 'Connecting',
    dotClass: 'bg-primary animate-pulse',
  },
  disconnected: {
    color: 'text-accent-warm',
    label: 'Disconnected',
    dotClass: 'bg-accent-warm',
  },
  error: {
    color: 'text-accent-warm',
    label: 'Error',
    dotClass: 'bg-accent-warm',
  },
  unsupported: {
    color: 'text-muted-foreground',
    label: 'Unsupported',
    dotClass: 'bg-muted-foreground',
  },
};

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  if (hours > 0) {
    const hh = String(hours).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

export function StatusBar() {
  const connectionStatus = useMidiStore((s) => s.connectionStatus);
  const activeDevice = useMidiStore((s) => s.activeDevice);
  const errorMessage = useMidiStore((s) => s.errorMessage);
  const currentKey = useSessionStore((s) => s.currentKey);
  const currentTempo = useSessionStore((s) => s.currentTempo);
  const sessionStartTimestamp = useSessionStore((s) => s.sessionStartTimestamp);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const isWarmingUp = useSessionStore((s) => s.isWarmingUp);
  const { streak } = useStreak();
  const { isOnline, wasOffline } = useOnlineStatus();

  const config = statusConfig[connectionStatus];

  // Session timer — ticks every second via interval callback
  const [elapsed, setElapsed] = useState(() =>
    sessionStartTimestamp !== null ? Math.max(0, Date.now() - sessionStartTimestamp) : 0
  );
  useEffect(() => {
    if (sessionStartTimestamp === null) return;

    const interval = setInterval(() => {
      setElapsed(Math.max(0, Date.now() - sessionStartTimestamp));
    }, 1000);

    return () => {
      clearInterval(interval);
      setElapsed(0);
    };
  }, [sessionStartTimestamp]);

  return (
    <header
      className="absolute inset-x-0 top-0 z-40 h-10 border-b border-border bg-background/80 backdrop-blur-sm"
      role="status"
    >
      <div className="mx-auto flex h-full items-center justify-between px-4">
        {/* Left: MIDI status cluster */}
        <div className="flex items-center gap-3" aria-live="polite">
          <span className="relative flex items-center gap-2">
            <span
              className={`inline-block h-2 w-2 ${config.dotClass} transition-colors duration-micro`}
              aria-hidden="true"
            />
            <span
              className={`font-mono text-caption uppercase tracking-[0.08em] ${config.color} transition-colors duration-micro`}
            >
              {config.label}
            </span>
          </span>

          {activeDevice && connectionStatus === 'connected' && (
            <>
              <span className="h-3 w-px bg-surface-border" aria-hidden="true" />
              <span className="text-caption text-muted-foreground truncate max-w-[200px] sm:max-w-[300px]">
                {activeDevice.name}
              </span>
            </>
          )}

          {(connectionStatus === 'error' || connectionStatus === 'unsupported') && errorMessage && (
            <>
              <span className="h-3 w-px bg-surface-border" aria-hidden="true" />
              <span className="text-caption text-muted-foreground truncate max-w-[300px]">
                {errorMessage}
              </span>
            </>
          )}

          {(connectionStatus === 'disconnected' || connectionStatus === 'error') && (
            <Button
              variant="link"
              size="sm"
              className="text-caption h-auto p-0"
              onClick={() => useMidiStore.getState().setShowTroubleshooting(true)}
            >
              Help
            </Button>
          )}
        </div>

        {/* Center: Key + Tempo (analysis readout) */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden items-center gap-3 sm:flex"
          aria-label="Session analysis"
        >
          {currentKey && (
            <span className="font-mono text-caption tracking-[0.06em] text-primary">
              {currentKey.root} {currentKey.mode}
            </span>
          )}
          {currentKey && currentTempo !== null && (
            <span className="h-3 w-px bg-surface-border" aria-hidden="true" />
          )}
          {currentTempo !== null && (
            <span className="font-mono text-caption tracking-wider text-foreground tabular-nums">
              {Math.round(currentTempo)} BPM
            </span>
          )}
        </div>

        {/* Right: ModeSwitcher, Warm-up progress, Offline indicator, Streak, Session timer */}
        <div className="flex items-center gap-3">
          <ModeSwitcher />
          <span className="h-3 w-px bg-surface-border" aria-hidden="true" />
          {isWarmingUp && (
            <>
              <WarmUpProgress />
              <span className="h-3 w-px bg-surface-border" aria-hidden="true" />
            </>
          )}

          {/* Offline / Back-online indicator */}
          {!isOnline && (
            <span className="flex items-center gap-1.5" role="status" aria-live="polite">
              <span className="inline-block h-2 w-2 bg-accent-warm" aria-hidden="true" />
              <span className="font-mono text-caption uppercase tracking-[0.08em] text-accent-warm">
                Offline
              </span>
            </span>
          )}
          {isOnline && wasOffline && (
            <span className="flex items-center gap-1.5" role="status" aria-live="polite">
              <span className="inline-block h-2 w-2 bg-accent-success" aria-hidden="true" />
              <span className="font-mono text-caption uppercase tracking-[0.08em] text-accent-success">
                Back online
              </span>
            </span>
          )}

          {(!isOnline || wasOffline) && (
            <span className="h-3 w-px bg-surface-border" aria-hidden="true" />
          )}

          {isAuthenticated && streak.currentStreak > 0 && (
            <>
              <StreakBadge streak={streak} />
              <span className="h-3 w-px bg-surface-border" aria-hidden="true" />
            </>
          )}
          <span
            className="font-mono text-caption tracking-wider text-muted-foreground tabular-nums"
            aria-label={`Session time: ${formatElapsed(elapsed)}`}
          >
            {formatElapsed(elapsed)}
          </span>
        </div>
      </div>
    </header>
  );
}
