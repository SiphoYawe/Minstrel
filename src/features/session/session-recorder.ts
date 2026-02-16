import { db } from '@/lib/dexie/db';
import type { StoredMidiEvent } from '@/lib/dexie/db';
import type { MidiEvent } from '@/features/midi/midi-types';
import type { SessionType } from './session-types';
import type { InstantSnapshot } from '@/features/analysis/analysis-types';
import { capture } from '@/lib/analytics';
import * as Sentry from '@sentry/nextjs';
import {
  MAX_BUFFER_SIZE,
  AUTOSAVE_INTERVAL_MS,
  METADATA_UPDATE_INTERVAL_MS,
} from '@/lib/constants';

let activeSessionId: number | null = null;
let recordingRequested = false;
let pendingBuffer: MidiEvent[] = [];
let eventBuffer: Omit<StoredMidiEvent, 'id'>[] = [];
let retryQueue: Omit<StoredMidiEvent, 'id'>[] = [];
let autosaveTimer: ReturnType<typeof setInterval> | null = null;
let metadataTimer: ReturnType<typeof setInterval> | null = null;
let flushPromise: Promise<void> | null = null;
let startPromise: Promise<number> | null = null;

/**
 * Starts recording a session. Creates a session record in Dexie.
 * Returns the session ID.
 * Uses an async lock (startPromise) to prevent double-start race conditions (STATE-M7).
 */
export async function startRecording(
  sessionType: SessionType,
  inputSource: MidiEvent['source'] = 'midi'
): Promise<number> {
  if (activeSessionId !== null) return activeSessionId;

  // Async lock: if a start is already in progress, return the existing promise (STATE-M7)
  if (startPromise !== null) return startPromise;

  // Mark recording as requested so recordEvent buffers events before ID is assigned
  recordingRequested = true;

  startPromise = (async () => {
    // Atomic transaction: session creation + any pending events written together.
    // If the transaction fails, neither the session nor events are persisted.
    const id = await db.transaction('rw', db.sessions, db.midiEvents, async () => {
      const sessionId = await db.sessions.add({
        startedAt: Date.now(),
        endedAt: null,
        duration: null,
        inputSource,
        sessionType,
        status: 'recording',
        key: null,
        tempo: null,
        userId: null,
        syncStatus: 'pending',
        supabaseId: null,
      });

      // Drain any events that arrived while awaiting session creation
      if (pendingBuffer.length > 0) {
        const initialEvents: Omit<StoredMidiEvent, 'id'>[] = pendingBuffer.map((event) => ({
          sessionId: sessionId as number,
          type: event.type,
          note: event.note,
          noteName: event.noteName,
          velocity: event.velocity,
          channel: event.channel,
          timestamp: event.timestamp,
          source: event.source,
          userId: null,
          syncStatus: 'pending' as const,
        }));
        await db.midiEvents.bulkAdd(initialEvents);
      }

      return sessionId;
    });

    activeSessionId = id as number;
    eventBuffer = [];
    retryQueue = [];
    pendingBuffer = [];

    // Attach emergency flush handler
    attachBeforeUnload();

    // Start autosave timer
    autosaveTimer = setInterval(() => {
      flush().catch((err) => {
        console.warn('Autosave flush failed:', err);
      });
    }, AUTOSAVE_INTERVAL_MS);

    // Track practice session start
    capture('practice_session_started', {
      session_type: sessionType,
      input_source: inputSource,
      session_id: activeSessionId,
    });

    return activeSessionId;
  })();

  try {
    return await startPromise;
  } finally {
    startPromise = null;
  }
}

/**
 * Buffers a MIDI event for later flush to IndexedDB.
 * Triggers early flush if buffer exceeds MAX_BUFFER_SIZE.
 */
export function recordEvent(event: MidiEvent): void {
  // If recording is requested but session ID not yet assigned, buffer in pending
  if (activeSessionId === null) {
    if (recordingRequested) {
      pendingBuffer.push(event);
    }
    return;
  }

  eventBuffer.push({
    sessionId: activeSessionId,
    type: event.type,
    note: event.note,
    noteName: event.noteName,
    velocity: event.velocity,
    channel: event.channel,
    timestamp: event.timestamp,
    source: event.source,
    userId: null,
    syncStatus: 'pending',
  });

  // Early flush if buffer exceeds cap
  if (eventBuffer.length >= MAX_BUFFER_SIZE) {
    flush().catch((err) => {
      console.warn('Buffer cap flush failed:', err);
    });
  }
}

/**
 * Flushes the event buffer to IndexedDB.
 * Processes retry queue first, then main buffer.
 * Uses async lock: concurrent callers await the in-progress flush.
 */
export async function flush(): Promise<void> {
  if (flushPromise) {
    await flushPromise;
    // After waiting, recurse to flush any events that arrived during the wait
    if (eventBuffer.length > 0 || retryQueue.length > 0) {
      return flush();
    }
    return;
  }

  if (eventBuffer.length === 0 && retryQueue.length === 0) return;

  flushPromise = (async () => {
    // Process retry queue first
    if (retryQueue.length > 0) {
      const retryBatch = retryQueue;
      retryQueue = [];
      try {
        await db.transaction('rw', db.midiEvents, async () => {
          await db.midiEvents.bulkAdd(retryBatch);
        });
      } catch {
        // Re-enqueue failed retries
        retryQueue = [...retryBatch, ...retryQueue];
      }
    }

    // Then process main buffer
    if (eventBuffer.length > 0) {
      const toWrite = eventBuffer;
      eventBuffer = [];
      try {
        await db.transaction('rw', db.midiEvents, async () => {
          await db.midiEvents.bulkAdd(toWrite);
        });
      } catch {
        // Move failed events to retry queue (not back to main buffer)
        retryQueue = [...retryQueue, ...toWrite];
      }
    }
  })();

  try {
    await flushPromise;
  } finally {
    flushPromise = null;
  }
}

/**
 * Emergency flush for beforeunload — synchronous fallback using sendBeacon.
 */
export function emergencyFlush(): void {
  const allEvents = [...retryQueue, ...eventBuffer];
  if (allEvents.length === 0) return;

  // Try sendBeacon first (fire-and-forget)
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(allEvents)], { type: 'application/json' });
    navigator.sendBeacon('/api/session/emergency', blob);
  }

  // Also attempt synchronous IndexedDB write as fallback
  try {
    db.midiEvents.bulkAdd(allEvents);
  } catch {
    // Best effort — tab is closing
  }

  eventBuffer = [];
  retryQueue = [];
}

let beforeUnloadAttached = false;

function attachBeforeUnload(): void {
  if (beforeUnloadAttached || typeof window === 'undefined') return;
  window.addEventListener('beforeunload', emergencyFlush);
  beforeUnloadAttached = true;
}

function detachBeforeUnload(): void {
  if (!beforeUnloadAttached || typeof window === 'undefined') return;
  window.removeEventListener('beforeunload', emergencyFlush);
  beforeUnloadAttached = false;
}

/**
 * Updates session metadata in Dexie (key, tempo).
 * Called periodically to keep the session record current.
 * Story 14.6: Always writes on scheduled interval even if values
 * match the cache, to ensure metadata consistency.
 */
export async function updateMetadata(key: string | null, tempo: number | null): Promise<void> {
  if (activeSessionId === null) return;

  await db.sessions.update(activeSessionId, { key, tempo });
}

/**
 * Records an analysis snapshot linked to the current session.
 */
export async function recordSnapshot(snapshot: InstantSnapshot): Promise<void> {
  if (activeSessionId === null) return;

  await db.analysisSnapshots.add({
    sessionId: activeSessionId,
    createdAt: snapshot.timestamp,
    data: snapshot as unknown as Record<string, unknown>,
    userId: null,
    syncStatus: 'pending',
  });
}

/**
 * Starts periodic metadata updates from the session store.
 * Takes a getter function to read current key/tempo.
 * STATE-L6: Writes metadata immediately on first detection, then
 * continues at the standard interval.
 */
export function startMetadataSync(
  getMetadata: () => { key: string | null; tempo: number | null }
): void {
  if (metadataTimer !== null) return;

  // STATE-L6: Write metadata immediately on first detection
  const { key, tempo } = getMetadata();
  if (key !== null || tempo !== null) {
    updateMetadata(key, tempo).catch((err) => {
      console.warn('Initial metadata write failed:', err);
    });
  }

  metadataTimer = setInterval(() => {
    const { key: k, tempo: t } = getMetadata();
    updateMetadata(k, t).catch((err) => {
      console.warn('Metadata update failed:', err);
    });
  }, METADATA_UPDATE_INTERVAL_MS);
}

/**
 * Stops recording. Performs final flush, updates session record.
 */
export async function stopRecording(): Promise<number | null> {
  if (activeSessionId === null) return null;

  const sessionId = activeSessionId;

  // Clear timers
  if (autosaveTimer !== null) {
    clearInterval(autosaveTimer);
    autosaveTimer = null;
  }
  if (metadataTimer !== null) {
    clearInterval(metadataTimer);
    metadataTimer = null;
  }

  // Final flush
  await flush();

  // Update session record
  const endedAt = Date.now();
  const session = await db.sessions.get(sessionId);
  const startedAt = session?.startedAt ?? endedAt;

  await db.sessions.update(sessionId, {
    endedAt,
    duration: Math.round((endedAt - startedAt) / 1000),
    status: 'completed',
  });

  // Track practice session completion
  const durationMs = endedAt - startedAt;
  capture('practice_session_completed', {
    session_id: sessionId,
    duration_ms: durationMs,
    duration_minutes: Math.round(durationMs / 60000),
    session_type: session?.sessionType,
    key: session?.key,
    tempo: session?.tempo,
  });

  activeSessionId = null;
  recordingRequested = false;
  pendingBuffer = [];

  // Detach emergency flush handler
  detachBeforeUnload();

  return sessionId;
}

/**
 * Returns the current active session ID, or null if not recording.
 */
export function getActiveRecordingId(): number | null {
  return activeSessionId;
}

/**
 * Returns the current buffer size (for monitoring/testing).
 */
export function getBufferSize(): number {
  return eventBuffer.length;
}

/**
 * Hard reset — clears all internal state. For testing only.
 */
export function resetRecorder(): void {
  if (autosaveTimer !== null) {
    clearInterval(autosaveTimer);
    autosaveTimer = null;
  }
  if (metadataTimer !== null) {
    clearInterval(metadataTimer);
    metadataTimer = null;
  }
  detachBeforeUnload();
  activeSessionId = null;
  recordingRequested = false;
  pendingBuffer = [];
  eventBuffer = [];
  retryQueue = [];
  flushPromise = null;
  startPromise = null;
}

/**
 * Returns the current retry queue size (for monitoring/testing).
 */
export function getRetryQueueSize(): number {
  return retryQueue.length;
}

/**
 * Cleans up orphan sessions — sessions with zero MIDI events.
 * Typically called on app startup. Logs to Sentry if orphans are found,
 * then deletes them along with any associated analysis snapshots.
 */
export async function cleanupOrphanSessions(): Promise<number> {
  if (!db) return 0;

  const allSessions = await db.sessions.toArray();
  const orphanIds: number[] = [];

  for (const session of allSessions) {
    // Skip sessions that are currently recording — they may not have events yet
    if (session.status === 'recording') continue;

    const eventCount = await db.midiEvents.where('sessionId').equals(session.id!).count();
    if (eventCount === 0) {
      orphanIds.push(session.id!);
    }
  }

  if (orphanIds.length > 0) {
    Sentry.captureMessage('Orphan sessions detected on startup', {
      level: 'warning',
      tags: { feature: 'session-recorder' },
      extra: { orphanSessionIds: orphanIds, count: orphanIds.length },
    });

    // Delete orphan sessions and any associated snapshots atomically
    await db.transaction('rw', db.sessions, db.analysisSnapshots, async () => {
      await db.sessions.bulkDelete(orphanIds);
      for (const id of orphanIds) {
        await db.analysisSnapshots.where('sessionId').equals(id).delete();
      }
    });
  }

  return orphanIds.length;
}
