import { createClient } from '@/lib/supabase/client';
import { StreakStatus, type StreakData } from './engagement-types';

const METRIC_TYPE = 'streak';

export async function fetchStreak(userId: string): Promise<StreakData> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('progress_metrics')
    .select('current_value, best_value, last_qualified_at, metadata')
    .eq('user_id', userId)
    .eq('metric_type', METRIC_TYPE)
    .single();

  if (error || !data) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      lastQualifiedAt: null,
      streakStatus: StreakStatus.Broken,
    };
  }

  return {
    currentStreak: data.current_value ?? 0,
    bestStreak: data.best_value ?? 0,
    lastQualifiedAt: data.last_qualified_at ?? null,
    streakStatus:
      ((data.metadata as Record<string, string>)?.streakStatus as StreakStatus) ??
      StreakStatus.Broken,
  };
}

/**
 * Atomically update streak using server-side RPC.
 * Returns server-authoritative streak values to prevent lost updates
 * from concurrent operations across multiple browser tabs.
 */
export async function updateStreak(
  userId: string,
  streak: StreakData
): Promise<{ newCurrentStreak: number; newBestStreak: number } | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('increment_streak', {
    p_user_id: userId,
    p_streak_value: streak.currentStreak,
    p_best_streak: streak.bestStreak,
    p_last_qualified_at: streak.lastQualifiedAt ?? new Date().toISOString(),
    p_metadata: { streakStatus: streak.streakStatus },
  });

  if (error) {
    console.error('[streak] Failed to update streak:', error.message);
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    newCurrentStreak: row?.new_current_streak ?? streak.currentStreak,
    newBestStreak: row?.new_best_streak ?? streak.bestStreak,
  };
}
