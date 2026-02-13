/**
 * Achievement Engine — Layer 3 Domain Logic (Story 7.3)
 *
 * Evaluates trigger conditions against user state to determine
 * newly unlocked achievements. Pure, idempotent, no side effects.
 */

import type { TriggerContext, UnlockedAchievement } from './engagement-types';
import { achievementRegistry } from './achievement-definitions';

/**
 * Evaluate all achievements and return newly unlocked ones.
 * Skips already-unlocked IDs to prevent duplicates.
 * Idempotent: same input always produces same output.
 */
export function evaluateAchievements(
  context: TriggerContext,
  alreadyUnlocked: string[],
  userId: string,
  sessionId: string | null
): UnlockedAchievement[] {
  const unlocked = new Set(alreadyUnlocked);
  const newlyUnlocked: UnlockedAchievement[] = [];
  const now = new Date().toISOString();

  for (const [id, definition] of achievementRegistry) {
    if (unlocked.has(id)) continue;

    try {
      if (definition.triggerCondition(context)) {
        newlyUnlocked.push({
          achievementId: id,
          userId,
          unlockedAt: now,
          sessionId,
        });
      }
    } catch {
      // Skip achievements whose trigger conditions fail
      // (e.g., referencing missing optional data)
    }
  }

  return newlyUnlocked;
}

/**
 * Build a trigger context from available data sources.
 * Uses defaults for optional/missing data.
 */
export function buildTriggerContext(partial: Partial<TriggerContext>): TriggerContext {
  return {
    currentStreak: 0,
    bestStreak: 0,
    lifetimeXp: 0,
    sessionDurationMs: 0,
    totalNotesPlayed: 0,
    timingAccuracy: 0,
    drillsCompleted: 0,
    drillsPassed: 0,
    consecutivePerfectReps: 0,
    detectedGenres: [],
    chordsDetected: [],
    lifetimeSessions: 0,
    lifetimeNotesPlayed: 0,
    ...partial,
  };
}
