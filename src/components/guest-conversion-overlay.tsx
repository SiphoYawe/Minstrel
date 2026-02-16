'use client';

import { useAppStore } from '@/stores/app-store';
import { Loader2 } from 'lucide-react';

/**
 * Full-screen overlay shown during guest-to-authenticated user conversion.
 * Displays reassuring message about account creation and data migration.
 */
export function GuestConversionOverlay() {
  const migrationStatus = useAppStore((s) => s.migrationStatus);

  if (migrationStatus !== 'migrating') {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-sm"
      role="alert"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-6 px-6 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">
            Migration in Progress
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Creating your account and migrating your practice data...
          </p>
        </div>
      </div>
    </div>
  );
}
