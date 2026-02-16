'use client';

import { use } from 'react';
import Link from 'next/link';
import { ReplayStudio } from '@/features/modes/replay-studio';

export default function ReplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const sessionId = Number(id);

  if (Number.isNaN(sessionId)) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <div className="max-w-md px-6 text-center">
          <div className="mb-4 font-mono text-lg text-accent-warm" aria-live="polite">
            Invalid session ID
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            The session ID in the URL is not valid.
          </p>
          <Link
            href="/replay"
            className="inline-block font-mono text-[11px] uppercase tracking-[0.1em]
              text-primary hover:text-white
              border border-primary/20 hover:border-primary/50
              px-4 py-2 transition-colors duration-150"
          >
            Back to Sessions
          </Link>
        </div>
      </div>
    );
  }

  return <ReplayStudio sessionId={sessionId} />;
}
