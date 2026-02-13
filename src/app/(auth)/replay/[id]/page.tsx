'use client';

import { use } from 'react';
import { ReplayStudio } from '@/features/modes/replay-studio';

export default function ReplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const sessionId = Number(id);

  if (Number.isNaN(sessionId)) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <p className="font-mono text-sm text-muted-foreground">Invalid session ID.</p>
      </div>
    );
  }

  return <ReplayStudio sessionId={sessionId} />;
}
