/**
 * XP Service — Layer 4 Infrastructure (Story 7.2)
 *
 * Handles Supabase persistence of XP data.
 * Reads/writes the progress_metrics table with metric_type = 'xp'.
 */

import { createClient } from '@/lib/supabase/client';
import type { XpBreakdown } from './engagement-types';

/**
 * Fetch lifetime cumulative XP for a user.
 * Returns 0 if no XP record exists.
 */
export async function fetchLifetimeXp(userId: string): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('progress_metrics')
    .select('current_value')
    .eq('user_id', userId)
    .eq('metric_type', 'xp')
    .maybeSingle();

  if (error || !data) return 0;
  return data.current_value ?? 0;
}

/**
 * Award XP to a user: atomically increment lifetime total
 * and store the per-session breakdown in metadata.
 */
export async function awardXp(
  userId: string,
  breakdown: XpBreakdown,
  sessionId: string
): Promise<void> {
  const supabase = createClient();

  // Fetch current XP
  const current = await fetchLifetimeXp(userId);
  const newTotal = current + breakdown.totalXp;

  // Upsert the progress_metrics row
  const { error } = await supabase.from('progress_metrics').upsert(
    {
      user_id: userId,
      metric_type: 'xp',
      current_value: newTotal,
      best_value: newTotal, // XP only goes up
      metadata: {
        lastSessionId: sessionId,
        lastBreakdown: breakdown,
        lastAwardedAt: new Date().toISOString(),
      },
      last_qualified_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,metric_type' }
  );

  if (error) {
    throw new Error(`Failed to award XP: ${error.message}`);
  }
}
