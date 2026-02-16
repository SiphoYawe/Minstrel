'use client';

import { useAppStore } from '@/stores/app-store';

export function MigrationIndicator() {
  const migrationStatus = useAppStore((s) => s.migrationStatus);
  const migrationProgress = useAppStore((s) => s.migrationProgress);

  if (migrationStatus === 'idle') return null;

  const progressFraction =
    migrationProgress.total > 0 ? migrationProgress.synced / migrationProgress.total : 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[var(--z-critical)] pointer-events-none animate-in fade-in slide-in-from-bottom duration-300">
      {/* Progress track — thin accent line */}
      {migrationStatus === 'migrating' && (
        <div className="h-px w-full bg-surface-border">
          <div
            className="h-full bg-primary"
            style={{
              width: `${progressFraction * 100}%`,
              transition: 'width 400ms ease-out',
            }}
          />
        </div>
      )}

      {/* Status bar */}
      <div className="flex h-8 items-center justify-between border-t border-surface-border bg-background px-4">
        <div className="flex items-center gap-3">
          {/* Status LED */}
          <span
            className={
              migrationStatus === 'migrating'
                ? 'inline-block h-1.5 w-1.5 bg-primary animate-pulse'
                : migrationStatus === 'complete'
                  ? 'inline-block h-1.5 w-1.5 bg-accent-success'
                  : 'inline-block h-1.5 w-1.5 bg-accent-warm'
            }
          />

          {/* Status text */}
          <span
            className="font-mono text-[11px] uppercase tracking-[0.15em]"
            style={{
              color:
                migrationStatus === 'migrating'
                  ? 'hsl(var(--primary))'
                  : migrationStatus === 'complete'
                    ? 'hsl(var(--accent-success))'
                    : 'hsl(var(--accent-warm))',
            }}
          >
            {migrationStatus === 'migrating' && 'Syncing your practice history'}
            {migrationStatus === 'complete' && 'All practice data synced to your account'}
            {migrationStatus === 'partial-failure' &&
              "Some sessions are still syncing \u2014 we'll keep trying"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Counter — only during active migration */}
          {migrationStatus === 'migrating' && migrationProgress.total > 0 && (
            <span className="font-mono text-[11px] tabular-nums tracking-wider text-muted-foreground">
              {migrationProgress.synced}/{migrationProgress.total}
            </span>
          )}

          {/* Dismiss — only for partial-failure */}
          {migrationStatus === 'partial-failure' && (
            <button
              type="button"
              className="pointer-events-auto flex h-5 w-5 items-center justify-center text-muted-foreground transition-colors duration-150 hover:text-accent-warm"
              onClick={() => useAppStore.getState().setMigrationStatus('idle')}
              aria-label="Dismiss sync notification"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="square"
              >
                <path d="M1 1l8 8M9 1l-8 8" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
