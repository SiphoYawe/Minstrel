'use client';

import { useState } from 'react';

interface OfflineMessageProps {
  /** Override the default message text */
  message?: string;
  /** Whether the message can be dismissed */
  dismissable?: boolean;
}

/**
 * Reusable inline message for offline state.
 * Uses amber styling (no red/destructive), informational tone.
 * Wi-Fi-off icon with "AI features require an internet connection" text.
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
      {/* Wi-Fi off icon */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-accent-warm"
        aria-hidden="true"
      >
        <path d="M12 20h.01" />
        <path d="M8.5 16.429a5 5 0 0 1 7 0" />
        <path d="M5 12.859a10 10 0 0 1 5.17-2.69" />
        <path d="M13.83 10.17A10 10 0 0 1 19 12.86" />
        <path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
        <path d="M10.66 5c4.01-.36 8.14.93 11.34 3.82" />
        <line x1="2" y1="2" x2="22" y2="22" />
      </svg>

      <p className="flex-1 text-xs text-accent-warm">{message}</p>

      {dismissable && (
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 text-accent-warm/60 hover:text-accent-warm transition-colors text-xs"
          aria-label="Dismiss offline message"
          type="button"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
