'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';
import { WifiOff, Wifi } from 'lucide-react';

/**
 * Root-level banner that appears when the browser goes offline.
 * Rendered in document flow — pushes all content below it.
 * Shows a brief "Back online" message for 3 seconds after reconnecting.
 */
export function OfflineIndicator() {
  const { isOnline, wasOffline } = useOnlineStatus();

  if (isOnline && !wasOffline) return null;

  return (
    <div
      className={`w-full flex items-center justify-center gap-2.5 px-4 py-2 border-b ${
        !isOnline
          ? 'border-accent-warm/20 bg-accent-warm/5'
          : 'border-accent-success/20 bg-accent-success/5'
      }`}
      role="alert"
      aria-live="polite"
    >
      {!isOnline ? (
        <WifiOff
          className="w-3.5 h-3.5 text-accent-warm shrink-0"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      ) : (
        <Wifi
          className="w-3.5 h-3.5 text-accent-success shrink-0"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      )}
      <p className={`font-mono text-xs ${!isOnline ? 'text-accent-warm' : 'text-accent-success'}`}>
        {!isOnline
          ? "You're offline. MIDI analysis works. AI features will resume when connected."
          : 'Back online'}
      </p>
    </div>
  );
}
