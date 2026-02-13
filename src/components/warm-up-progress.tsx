'use client';

import { useSessionStore } from '@/stores/session-store';

/**
 * Floating indicator shown in the StatusBar area during warm-up.
 * Displays "Exercise {n} of {total}" with JetBrains Mono for the count.
 */
export function WarmUpProgress() {
  const isWarmingUp = useSessionStore((s) => s.isWarmingUp);
  const currentExercise = useSessionStore((s) => s.currentWarmupExercise);
  const warmupRoutine = useSessionStore((s) => s.warmupRoutine);

  if (!isWarmingUp || !warmupRoutine) return null;

  const total = warmupRoutine.exercises.length;
  const currentTitle = warmupRoutine.exercises[currentExercise]?.title;

  return (
    <div
      className="flex items-center gap-2"
      role="status"
      aria-label={`Warm-up exercise ${currentExercise + 1} of ${total}`}
    >
      <span className="inline-block h-2 w-2 bg-accent-warm animate-pulse" aria-hidden="true" />
      <span className="text-caption text-foreground">
        Exercise{' '}
        <span className="font-mono tabular-nums">
          {currentExercise + 1}
        </span>{' '}
        of{' '}
        <span className="font-mono tabular-nums">
          {total}
        </span>
      </span>
      {currentTitle && (
        <>
          <span className="h-3 w-px bg-surface-border" aria-hidden="true" />
          <span className="text-caption text-muted-foreground truncate max-w-[180px]">
            {currentTitle}
          </span>
        </>
      )}
    </div>
  );
}
