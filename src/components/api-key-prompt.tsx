'use client';

import Link from 'next/link';

interface ApiKeyPromptProps {
  message?: string;
  linkHref?: string;
  linkLabel?: string;
}

export function ApiKeyPrompt({
  message = 'Connect your API key to unlock AI coaching',
  linkHref = '/settings',
  linkLabel = 'Go to Settings',
}: ApiKeyPromptProps) {
  return (
    <div
      role="region"
      aria-label="AI feature information"
      className="border border-border bg-card p-6"
    >
      <div className="flex items-start gap-4">
        {/* Key icon — etched hardware aesthetic */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-surface-border bg-surface-light">
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
            className="text-primary"
          >
            <circle cx="6" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.25" />
            <path
              d="M8.5 9.5L15 3M15 3v3M15 3h-3"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="square"
            />
          </svg>
        </div>

        <div className="space-y-3">
          <p className="text-ui-label leading-relaxed text-muted-foreground">{message}</p>
          <Link
            href={linkHref}
            className="group inline-flex items-center gap-1.5 text-caption font-medium text-primary transition-opacity duration-micro hover:opacity-80"
          >
            {linkLabel}
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
              className="transition-transform duration-micro group-hover:translate-x-0.5"
            >
              <path
                d="M4.5 2.5L8.5 6L4.5 9.5"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="square"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
