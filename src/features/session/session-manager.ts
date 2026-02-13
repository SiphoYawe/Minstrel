import { useSessionStore } from '@/stores/session-store';
import { useAppStore } from '@/stores/app-store';
import type { SessionType, ContinuitySessionSummary } from './session-types';
import { mergeSessionSummaries } from './continuity-service';
import { createClient } from '@/lib/supabase/client';
import { getLocalSessionSummaries, syncPendingSessions } from '@/lib/dexie/sync';
import { db } from '@/lib/dexie/db';
import type { GuestSession } from '@/lib/dexie/db';

/**
 * Starts a freeform session. Called on the first MIDI note-on event
 * when no structured activity has been selected.
 * Sets session type to 'freeform' and marks interruptions as disallowed.
 */
export function startFreeformSession(): void {
  const store = useSessionStore.getState();
  // Only start if no session type is set yet
  if (store.sessionType !== null) return;

  store.setSessionType('freeform');
  store.setInterruptionsAllowed(false);
}

/**
 * Transitions to a structured session type.
 * Called when the user explicitly requests a drill, micro-session, or warmup.
 * Requires an active session (sessionType must not be null).
 * Preserves all existing session data.
 */
export function transitionSessionType(newType: SessionType): void {
  const store = useSessionStore.getState();
  // Guard: cannot transition if no session is active
  if (store.sessionType === null) return;

  store.setSessionType(newType);
  // Structured sessions allow interruptions (drill prompts, coaching suggestions)
  store.setInterruptionsAllowed(newType !== 'freeform');
}

/**
 * Resets session type and interruption state.
 * Called when the session ends or the component unmounts.
 */
export function resetSessionManager(): void {
  const store = useSessionStore.getState();
  store.setSessionType(null);
  store.setInterruptionsAllowed(false);
}

/**
 * Convert a Dexie GuestSession to a ContinuitySessionSummary.
 */
function guestSessionToSummary(
  session: GuestSession,
  snapshotCount: number
): ContinuitySessionSummary {
  return {
    id: session.id ?? 0,
    date: new Date(session.startedAt).toISOString(),
    durationMs: session.duration ?? 0,
    detectedKey: session.key,
    averageTempo: session.tempo,
    timingAccuracy: null,
    chordsUsed: [],
    drillsCompleted: 0,
    keyInsight: null,
    weaknessAreas: [],
    snapshotCount,
  };
}

/**
 * Query session summaries from Supabase for an authenticated user.
 */
async function getSupabaseSessionSummaries(
  userId: string,
  count: number = 5
): Promise<ContinuitySessionSummary[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('sessions')
    .select('id, started_at, duration_seconds, key_detected, tempo_avg, timing_accuracy')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(count);

  if (error || !data) return [];

  return data.map((row) => ({
    id: typeof row.id === 'string' ? parseInt(row.id, 10) || 0 : row.id,
    date: row.started_at,
    durationMs: (row.duration_seconds ?? 0) * 1000,
    detectedKey: row.key_detected ?? null,
    averageTempo: row.tempo_avg ?? null,
    timingAccuracy: row.timing_accuracy ?? null,
    chordsUsed: [],
    drillsCompleted: 0,
    keyInsight: null,
    weaknessAreas: [],
    snapshotCount: 0,
  }));
}

/**
 * Load cross-session continuity data on session start.
 * Non-blocking: fires sync in parallel with context assembly.
 * Caches result in sessionStore.recentSessions.
 *
 * For authenticated users: queries Supabase + Dexie, merges and deduplicates.
 * For guest users: queries Dexie only.
 */
export async function loadContinuityContext(): Promise<void> {
  const sessionStore = useSessionStore.getState();
  const appStore = useAppStore.getState();

  // Skip if already cached for this session
  if (sessionStore.recentSessions.length > 0) return;

  const isAuthenticated = appStore.isAuthenticated;
  const userId = appStore.user?.id;

  let merged: ContinuitySessionSummary[] = [];

  if (isAuthenticated && userId) {
    // Non-blocking sync of pending sessions
    syncPendingSessions(userId).catch((err) => {
      console.warn('[continuity] sync failed, using local data:', err);
    });

    // Query both sources in parallel
    const [supabaseSessions, localSessions] = await Promise.all([
      getSupabaseSessionSummaries(userId).catch(() => [] as ContinuitySessionSummary[]),
      getLocalSummaries(),
    ]);

    merged = mergeSessionSummaries(supabaseSessions, localSessions);
  } else {
    // Guest: Dexie only
    merged = await getLocalSummaries();
  }

  useSessionStore.getState().setRecentSessions(merged);
}

/**
 * Get local session summaries from Dexie, converting to ContinuitySessionSummary.
 */
async function getLocalSummaries(): Promise<ContinuitySessionSummary[]> {
  const localSessions = await getLocalSessionSummaries(5);

  const summaries: ContinuitySessionSummary[] = [];
  for (const session of localSessions) {
    let snapshotCount = 0;
    if (db && session.id) {
      snapshotCount = await db.analysisSnapshots.where('sessionId').equals(session.id).count();
    }
    summaries.push(guestSessionToSummary(session, snapshotCount));
  }

  return summaries;
}
