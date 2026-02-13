/**
 * Achievement Service — Layer 4 Infrastructure (Story 7.3)
 *
 * Supabase persistence for achievements.
 */

import { createClient } from '@/lib/supabase/client';
import type { UnlockedAchievement, AchievementDisplayItem } from './engagement-types';
import { achievementRegistry } from './achievement-definitions';

/**
 * Fetch all achievements unlocked by a user.
 */
export async function fetchUnlockedAchievements(userId: string): Promise<UnlockedAchievement[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('achievements')
    .select('achievement_id, user_id, unlocked_at, session_id')
    .eq('user_id', userId);

  if (error || !data) return [];

  return data.map((row) => ({
    achievementId: row.achievement_id,
    userId: row.user_id,
    unlockedAt: row.unlocked_at,
    sessionId: row.session_id,
  }));
}

/**
 * Save newly unlocked achievements. Uses upsert to prevent duplicates.
 */
export async function saveUnlockedAchievements(achievements: UnlockedAchievement[]): Promise<void> {
  if (achievements.length === 0) return;

  const supabase = createClient();
  const rows = achievements.map((a) => ({
    user_id: a.userId,
    achievement_id: a.achievementId,
    unlocked_at: a.unlockedAt,
    session_id: a.sessionId,
  }));

  const { error } = await supabase
    .from('achievements')
    .upsert(rows, { onConflict: 'user_id,achievement_id' });

  if (error) {
    throw new Error(`Failed to save achievements: ${error.message}`);
  }
}

/**
 * Fetch achievement display data: all definitions with unlock status.
 */
export async function fetchAchievementDisplay(userId: string): Promise<AchievementDisplayItem[]> {
  const unlocked = await fetchUnlockedAchievements(userId);
  const unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u.unlockedAt]));

  const items: AchievementDisplayItem[] = [];
  for (const definition of achievementRegistry.values()) {
    items.push({
      definition,
      unlocked: unlockedMap.has(definition.achievementId),
      unlockedAt: unlockedMap.get(definition.achievementId) ?? null,
    });
  }

  return items;
}
