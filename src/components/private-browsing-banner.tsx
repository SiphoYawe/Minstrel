'use client';

import { useAppStore } from '@/stores/app-store';

/**
 * Persistent amber banner shown when localStorage is unavailable (private browsing mode).
 * Story 24.6 (MIDI-C18): Warns users their preferences won't persist.
 * Non-dismissible — mirrors AudioModeBanner pattern.
 */
export function PrivateBrowsingBanner() {
  const isPrivateBrowsing = useAppStore((s) => s.isPrivateBrowsing);

  if (!isPrivateBrowsing) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-l-2 border-accent-warm bg-surface-light px-4 py-2"
    >
      <p className="flex items-center gap-2 text-caption text-accent-warm">
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
          className="shrink-0"
        >
          <path
            d="M7 1a6 6 0 1 0 0 12A6 6 0 0 0 7 1ZM7 4v4M7 10v.5"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="square"
          />
        </svg>
        <span>
          <span className="font-medium">Private browsing mode</span>
          <span className="text-muted-foreground">
            {' — settings won\u2019t persist between sessions'}
          </span>
        </span>
      </p>
    </div>
  );
}
