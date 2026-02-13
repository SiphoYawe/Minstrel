import { createClient } from '@/lib/supabase/client';
import type { GuestSession, StoredMidiEvent, AnalysisSnapshot, StoredDrillRecord } from './db';
import { db } from './db';

export const BATCH_SIZE = 500;
export const MAX_RETRIES = 3;
export const BACKOFF_BASE_MS = 2000;

export interface SyncResult {
  success: boolean;
  sessionUUID: string;
  error?: string;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  baseMs = BACKOFF_BASE_MS
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      const delay = baseMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('Unreachable');
}

function generateUUID(): string {
  return crypto.randomUUID();
}

export function mapSessionToSupabase(
  session: GuestSession,
  userId: string,
  sessionUUID: string
): Record<string, unknown> {
  return {
    id: sessionUUID,
    user_id: userId,
    mode: session.sessionType ?? 'freeform',
    key_detected: session.key,
    tempo_avg: session.tempo ? Math.round(session.tempo) : null,
    timing_accuracy: null,
    duration_seconds: session.duration ? Math.round(session.duration / 1000) : null,
    started_at: new Date(session.startedAt).toISOString(),
    ended_at: session.endedAt ? new Date(session.endedAt).toISOString() : null,
  };
}

export function mapMidiEventToSupabase(
  event: StoredMidiEvent,
  userId: string,
  sessionUUID: string
): Record<string, unknown> {
  return {
    id: generateUUID(),
    session_id: sessionUUID,
    user_id: userId,
    event_type: event.type,
    note: event.note,
    velocity: event.velocity,
    channel: event.channel,
    timestamp_ms: event.timestamp,
    duration_ms: null,
  };
}

export function mapSnapshotToSupabase(
  snapshot: AnalysisSnapshot,
  userId: string,
  sessionUUID: string
): Record<string, unknown> {
  return {
    id: generateUUID(),
    session_id: sessionUUID,
    user_id: userId,
    snapshot_type: 'silence_triggered',
    tendency_data: snapshot.data,
    snapshot_at: new Date(snapshot.createdAt).toISOString(),
  };
}

export function mapDrillRecordToSupabase(
  record: StoredDrillRecord,
  userId: string
): Record<string, unknown> {
  return {
    id: record.drillId,
    user_id: userId,
    session_id: record.sessionId,
    target_skill: record.targetSkill,
    weakness_description: record.weaknessDescription,
    drill_data: record.drillData,
    difficulty_parameters: record.difficultyParameters,
    status: record.status,
    results: record.results,
    created_at: record.createdAt,
    completed_at: record.completedAt,
  };
}

/**
 * Syncs a session and its events/snapshots to Supabase.
 * Uses upsert for session to handle idempotent retries.
 * Accepts an optional existing sessionUUID for retry scenarios.
 */
export async function syncSessionToSupabase(
  session: GuestSession,
  events: StoredMidiEvent[],
  snapshots: AnalysisSnapshot[],
  userId: string,
  existingSessionUUID?: string
): Promise<SyncResult> {
  const supabase = createClient();
  const sessionUUID = existingSessionUUID ?? generateUUID();

  // 1. Upsert session record (idempotent on retry)
  await withRetry(async () => {
    const { error } = await supabase
      .from('sessions')
      .upsert(mapSessionToSupabase(session, userId, sessionUUID), { onConflict: 'id' });
    if (error) throw new Error(`Session sync failed: ${error.message}`);
  });

  // 2. Insert MIDI events in batches of BATCH_SIZE
  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE);
    const mapped = batch.map((e) => mapMidiEventToSupabase(e, userId, sessionUUID));

    await withRetry(async () => {
      const { error } = await supabase.from('midi_events').insert(mapped);
      if (error) throw new Error(`MIDI events sync failed: ${error.message}`);
    });
  }

  // 3. Insert analysis snapshots in batches
  for (let i = 0; i < snapshots.length; i += BATCH_SIZE) {
    const batch = snapshots.slice(i, i + BATCH_SIZE);
    const mapped = batch.map((s) => mapSnapshotToSupabase(s, userId, sessionUUID));

    await withRetry(async () => {
      const { error } = await supabase.from('analysis_snapshots').insert(mapped);
      if (error) throw new Error(`Snapshots sync failed: ${error.message}`);
    });
  }

  return { success: true, sessionUUID };
}

export interface PendingSyncResult {
  synced: number;
  failed: number;
  errors: string[];
}

/**
 * Sync all completed but unsynced sessions from Dexie to Supabase.
 * Called non-blocking at session start for cross-session continuity.
 * Uploads session metadata and analysis snapshots (not raw MIDI events,
 * which sync separately in the background).
 */
export async function syncPendingSessions(userId: string): Promise<PendingSyncResult> {
  if (!db) return { synced: 0, failed: 0, errors: ['IndexedDB not available'] };

  const result: PendingSyncResult = { synced: 0, failed: 0, errors: [] };

  try {
    const pendingSessions = await db.sessions
      .where('syncStatus')
      .equals('pending')
      .filter((s) => s.status === 'completed')
      .toArray();

    for (const session of pendingSessions) {
      if (!session.id) continue;

      try {
        const snapshots = await db.analysisSnapshots
          .where('sessionId')
          .equals(session.id)
          .toArray();

        // Sync session + snapshots (skip MIDI events for speed)
        const syncResult = await syncSessionToSupabase(
          session,
          [], // empty MIDI events — those sync in background
          snapshots,
          userId,
          session.supabaseId ?? undefined
        );

        // Mark session as synced in Dexie
        await db.sessions.update(session.id, {
          syncStatus: 'synced',
          supabaseId: syncResult.sessionUUID,
        });

        // Mark snapshots as synced
        const snapshotIds = snapshots
          .map((s) => s.id)
          .filter((id): id is number => id !== undefined);
        if (snapshotIds.length > 0) {
          await db.analysisSnapshots
            .where('id')
            .anyOf(snapshotIds)
            .modify({ syncStatus: 'synced' });
        }

        result.synced++;
      } catch (err) {
        result.failed++;
        result.errors.push(
          `Session ${session.id}: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
        // Mark as failed but don't block other sessions
        if (session.id) {
          await db.sessions.update(session.id, { syncStatus: 'failed' }).catch(() => {});
        }
      }
    }
  } catch (err) {
    result.errors.push(`Query failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Query recent session summaries from Dexie (local).
 * Used for guest users or as fallback when Supabase is unreachable.
 */
export async function getLocalSessionSummaries(count: number = 5): Promise<GuestSession[]> {
  if (!db) return [];

  const sessions = await db.sessions.where('status').equals('completed').toArray();
  sessions.sort((a, b) => b.startedAt - a.startedAt);
  return sessions.slice(0, count);
}

/**
 * Sync pending drill records to Supabase.
 * Upserts each drill record (idempotent on drillId).
 */
export async function syncPendingDrillRecords(userId: string): Promise<PendingSyncResult> {
  if (!db) return { synced: 0, failed: 0, errors: ['IndexedDB not available'] };

  const result: PendingSyncResult = { synced: 0, failed: 0, errors: [] };

  try {
    const pending = await db.drillRecords.where('syncStatus').equals('pending').toArray();

    const supabase = createClient();

    for (let i = 0; i < pending.length; i += BATCH_SIZE) {
      const batch = pending.slice(i, i + BATCH_SIZE);
      const mapped = batch.map((r) => mapDrillRecordToSupabase(r, userId));

      try {
        await withRetry(async () => {
          const { error } = await supabase
            .from('drill_records')
            .upsert(mapped, { onConflict: 'id' });
          if (error) throw new Error(`Drill sync failed: ${error.message}`);
        });

        const ids = batch.map((r) => r.id).filter((id): id is number => id !== undefined);
        if (ids.length > 0) {
          await db.drillRecords.where('id').anyOf(ids).modify({ syncStatus: 'synced' });
        }
        result.synced += batch.length;
      } catch (err) {
        result.failed += batch.length;
        result.errors.push(err instanceof Error ? err.message : 'Unknown error');
        const ids = batch.map((r) => r.id).filter((id): id is number => id !== undefined);
        if (ids.length > 0) {
          await db.drillRecords
            .where('id')
            .anyOf(ids)
            .modify({ syncStatus: 'failed' })
            .catch(() => {});
        }
      }
    }
  } catch (err) {
    result.errors.push(`Query failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Query drill records from Dexie (local) for a specific user.
 */
export async function getLocalDrillRecords(
  userId: string,
  limit: number = 20
): Promise<StoredDrillRecord[]> {
  if (!db) return [];

  const records = await db.drillRecords.where('userId').equals(userId).toArray();
  records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return records.slice(0, limit);
}
