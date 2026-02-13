/**
 * Progress Service — Layer 4 Infrastructure (Story 7.4)
 *
 * Supabase queries for progress trend data.
 */

import { createClient } from '@/lib/supabase/client';
import type { SessionMetric } from './engagement-types';

/**
 * Fetch session metrics for a user within a date range.
 * Queries the sessions table for columns needed by aggregation.
 */
export async function fetchSessionMetrics(
  userId: string,
  fromDate: Date,
  toDate: Date
): Promise<SessionMetric[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('sessions')
    .select(
      'id, created_at, timing_accuracy, unique_chords, average_tempo, max_clean_tempo, duration_ms'
    )
    .eq('user_id', userId)
    .gte('created_at', fromDate.toISOString())
    .lte('created_at', toDate.toISOString())
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    sessionId: row.id,
    date: (row.created_at as string).split('T')[0],
    timingAccuracy: row.timing_accuracy,
    uniqueChords: row.unique_chords ?? 0,
    averageTempo: row.average_tempo,
    maxCleanTempo: row.max_clean_tempo,
    durationMs: row.duration_ms ?? 0,
  }));
}

/**
 * Fetch the total session count for a user (for minimum data check).
 */
export async function fetchSessionCount(userId: string): Promise<number> {
  const supabase = createClient();

  const { count, error } = await supabase
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error || count === null) return 0;
  return count;
}
