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

export async function updateStreak(userId: string, streak: StreakData): Promise<void> {
  const supabase = createClient();
  await supabase.from('progress_metrics').upsert(
    {
      user_id: userId,
      metric_type: METRIC_TYPE,
      current_value: streak.currentStreak,
      best_value: streak.bestStreak,
      last_qualified_at: streak.lastQualifiedAt,
      metadata: { streakStatus: streak.streakStatus },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,metric_type' }
  );
}
