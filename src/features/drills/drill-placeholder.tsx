'use client';

import { ApiKeyRequired } from '@/features/auth/api-key-required';

function DrillReadyState() {
  return (
    <div className="border border-border bg-card p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
        Personalized Drills
      </p>
      <p className="mt-3 font-sans text-[13px] leading-relaxed text-foreground">
        Personalized drills ready &mdash; play to discover your growth areas.
      </p>
    </div>
  );
}

export function DrillPlaceholder() {
  return (
    <ApiKeyRequired feature="drills">
      <DrillReadyState />
    </ApiKeyRequired>
  );
}
