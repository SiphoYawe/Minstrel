'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/app-store';

/**
 * Blocking full-screen overlay shown during guest-to-account data migration.
 * Story 24.6 (MIDI-C8): Prevents interaction until migration completes.
 * Uses dark studio aesthetic with 0px border radius — matches SessionExpiredModal pattern.
 */
export function MigrationOverlay() {
  const migrationStatus = useAppStore((s) => s.migrationStatus);
  const migrationProgress = useAppStore((s) => s.migrationProgress);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (migrationStatus === 'migrating') {
      dialogRef.current?.focus();
    }
  }, [migrationStatus]);

  if (migrationStatus !== 'migrating') return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="migration-overlay-title"
      aria-describedby="migration-overlay-desc"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="mx-4 w-full max-w-sm border border-border bg-card p-8 outline-none"
      >
        <h2
          id="migration-overlay-title"
          className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary"
        >
          Migrating Data
        </h2>
        <div className="mt-2 h-px w-8 bg-primary" />

        <p
          id="migration-overlay-desc"
          className="mt-4 text-sm leading-relaxed text-muted-foreground"
        >
          Moving your practice data to your account&hellip;
        </p>

        {/* Indeterminate progress bar */}
        <div className="mt-4 h-0.5 w-full overflow-hidden bg-border">
          <div className="h-full w-1/3 animate-[shimmer_1.5s_ease-in-out_infinite] bg-primary" />
        </div>

        {migrationProgress.total > 0 && (
          <p className="mt-3 font-mono text-xs text-muted-foreground/70">
            {migrationProgress.synced} of {migrationProgress.total} sessions synced
          </p>
        )}

        <p className="mt-2 text-xs text-muted-foreground/50">Please don&apos;t close this tab.</p>
      </div>
    </div>
  );
}
