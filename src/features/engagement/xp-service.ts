/**
 * XP Service — Layer 4 Infrastructure (Story 7.2, 11.5)
 *
 * Handles Supabase persistence of XP data.
 * Reads/writes the progress_metrics table with metric_type = 'xp'.
 *
 * Story 11.5: awardXp() uses an atomic Supabase RPC (increment_xp) to
 * eliminate the read-modify-write race condition. The RPC performs
 * INSERT ... ON CONFLICT with current_value = current_value + delta,
 * ensuring concurrent calls never lose updates.
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
 * Award XP to a user using an atomic Supabase RPC.
 *
 * The `increment_xp` RPC performs an INSERT ... ON CONFLICT that atomically
 * increments current_value by the delta, eliminating race conditions from
 * concurrent read-modify-write cycles (e.g., session end + achievement unlock).
 *
 * Returns the server-authoritative new lifetime XP so callers can set
 * local state from the server value rather than optimistic calculation.
 */
export async function awardXp(
  userId: string,
  breakdown: XpBreakdown
): Promise<{ newLifetimeXp: number } | null> {
  if (breakdown.totalXp <= 0) return null;

  const supabase = createClient();
  const { data, error } = await supabase.rpc('increment_xp', {
    p_user_id: userId,
    p_delta: breakdown.totalXp,
    p_metadata: breakdown,
    p_last_qualified_at: new Date().toISOString(),
  });

  if (error) {
    console.error('[XP] Failed to award XP:', error.message);
    return null;
  }

  // RPC returns TABLE(new_lifetime_xp, new_best_xp) — data is an array
  const row = Array.isArray(data) ? data[0] : data;
  return {
    newLifetimeXp: row?.new_lifetime_xp ?? breakdown.totalXp,
  };
}
