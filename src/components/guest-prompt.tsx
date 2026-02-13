'use client';

import { useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'minstrel-guest-prompt-dismissed';

function isDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function GuestPrompt() {
  const [dismissed, setDismissed] = useState(isDismissed);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // Ignore storage errors
    }
  };

  return (
    <div role="status" className="border-l-2 border-primary bg-surface-light px-4 py-2">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-caption text-muted-foreground">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
            className="shrink-0 text-primary"
          >
            <path
              d="M7 1.5v5M7 9.5v1"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="square"
            />
            <rect x="1.5" y="1.5" width="11" height="11" stroke="currentColor" strokeWidth="1.25" />
          </svg>
          <span>
            Create an account to save your progress
            <span className="mx-1.5 text-surface-border" aria-hidden="true">
              /
            </span>
            <Link
              href="/auth/sign-up"
              className="font-medium text-primary underline underline-offset-2 transition-opacity duration-micro hover:opacity-80"
            >
              Sign Up
            </Link>
          </span>
        </p>

        <button
          type="button"
          onClick={handleDismiss}
          className="flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground transition-colors duration-micro hover:text-foreground"
          aria-label="Dismiss"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path
              d="M1 1l8 8M9 1l-8 8"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="square"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
