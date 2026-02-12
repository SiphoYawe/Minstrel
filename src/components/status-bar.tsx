'use client';

import { useMidiStore } from '@/stores/midi-store';
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

export function StatusBar() {
  const connectionStatus = useMidiStore((s) => s.connectionStatus);
  const activeDevice = useMidiStore((s) => s.activeDevice);
  const errorMessage = useMidiStore((s) => s.errorMessage);

  const config = statusConfig[connectionStatus];

  return (
    <footer
      className="fixed inset-x-0 bottom-0 z-40 h-10 border-t border-border bg-surface-light"
      role="status"
    >
      <div className="mx-auto flex h-full max-w-content items-center justify-between px-4">
        {/* Left: MIDI status cluster */}
        <div className="flex items-center gap-3" aria-live="polite">
          {/* Status indicator dot */}
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

          {/* Device name */}
          {activeDevice && connectionStatus === 'connected' && (
            <>
              <span className="h-3 w-px bg-surface-border" aria-hidden="true" />
              <span className="text-caption text-muted-foreground truncate max-w-[200px] sm:max-w-[300px]">
                {activeDevice.name}
              </span>
            </>
          )}

          {/* Error / unsupported message */}
          {(connectionStatus === 'error' || connectionStatus === 'unsupported') && errorMessage && (
            <>
              <span className="h-3 w-px bg-surface-border" aria-hidden="true" />
              <span className="text-caption text-muted-foreground truncate max-w-[300px]">
                {errorMessage}
              </span>
            </>
          )}

          {/* Help link when disconnected */}
          {(connectionStatus === 'disconnected' || connectionStatus === 'error') && (
            <button
              type="button"
              className="text-caption text-primary underline underline-offset-2 transition-opacity duration-micro hover:opacity-80"
              onClick={() => useMidiStore.getState().setShowTroubleshooting(true)}
            >
              Help
            </button>
          )}
        </div>

        {/* Right: Session timer placeholder */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-caption tracking-wider text-muted-foreground tabular-nums">
            00:00
          </span>
        </div>
      </div>
    </footer>
  );
}
