'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';

/**
 * Root-level banner that appears when the browser goes offline.
 * Shows a brief "Back online" message for 3 seconds after reconnecting.
 * Uses the shared useOnlineStatus hook for consistent state.
 */
export function OfflineIndicator() {
  const { isOnline, wasOffline } = useOnlineStatus();

  if (isOnline && !wasOffline) return null;

  return (
    <div
      className={`fixed inset-x-0 top-0 z-[60] flex items-center justify-center border-b px-4 py-2 ${
        !isOnline
          ? 'border-accent-warm/20 bg-accent-warm/10'
          : 'border-accent-success/20 bg-accent-success/10'
      }`}
      role="alert"
      aria-live="polite"
    >
      <p
        className={`font-mono text-xs ${
          !isOnline ? 'text-accent-warm' : 'text-accent-success'
        }`}
      >
        {!isOnline
          ? "You're offline. MIDI analysis works. AI features will resume when connected."
          : 'Back online'}
      </p>
    </div>
  );
}
