import { createClient } from '@/lib/supabase/client';
import type { GuestSession, StoredMidiEvent, AnalysisSnapshot } from './db';

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
