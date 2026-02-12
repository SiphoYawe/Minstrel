'use client';

import { useMidiStore } from '@/stores/midi-store';

export function AudioModeBanner() {
  const inputSource = useMidiStore((s) => s.inputSource);

  if (inputSource !== 'audio') return null;

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
            d="M7 1v8M4.5 6.5a2.5 2.5 0 0 0 5 0M3 9.5C3 11.433 4.79 13 7 13s4-1.567 4-3.5"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="square"
          />
        </svg>
        <span>
          <span className="font-medium">Audio Mode</span>
          <span className="text-muted-foreground">
            {' — connect a MIDI device for full precision'}
          </span>
        </span>
      </p>
    </div>
  );
}
