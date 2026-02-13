'use client';

import { useState } from 'react';
import { WifiOff, X } from 'lucide-react';

interface OfflineMessageProps {
  /** Override the default message text */
  message?: string;
  /** Whether the message can be dismissed */
  dismissable?: boolean;
}

/**
 * Reusable inline message for offline state.
 * Uses amber styling (no red/destructive), informational tone.
 */
export function OfflineMessage({
  message = 'AI features require an internet connection',
  dismissable = true,
}: OfflineMessageProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className="flex items-center gap-3 border border-accent-warm/20 bg-accent-warm/5 px-4 py-3"
      role="status"
      aria-live="polite"
    >
      <WifiOff className="w-4 h-4 shrink-0 text-accent-warm" strokeWidth={1.5} aria-hidden="true" />

      <p className="flex-1 text-xs text-accent-warm">{message}</p>

      {dismissable && (
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 text-accent-warm/60 hover:text-accent-warm transition-colors"
          aria-label="Dismiss offline message"
          type="button"
        >
          <X className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}
