import { db } from '@/lib/dexie/db';
import type { StoredMidiEvent } from '@/lib/dexie/db';
import type { MidiEvent } from '@/features/midi/midi-types';
import type { SessionType } from './session-types';
import type { InstantSnapshot } from '@/features/analysis/analysis-types';
import { capture } from '@/lib/analytics';
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

/**
 * Starts recording a session. Creates a session record in Dexie.
 * Returns the session ID.
 */
export async function startRecording(
  sessionType: SessionType,
  inputSource: MidiEvent['source'] = 'midi'
): Promise<number> {
  if (activeSessionId !== null) return activeSessionId;

  // Mark recording as requested so recordEvent buffers events before ID is assigned
  recordingRequested = true;

  const id = await db.sessions.add({
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

  activeSessionId = id as number;
  eventBuffer = [];
  retryQueue = [];

  // Attach emergency flush handler
  attachBeforeUnload();

  // Drain any events that arrived while awaiting session creation
  for (const event of pendingBuffer) {
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
  }
  pendingBuffer = [];

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
        await db.midiEvents.bulkAdd(retryBatch);
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
        await db.midiEvents.bulkAdd(toWrite);
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
 */
export function startMetadataSync(
  getMetadata: () => { key: string | null; tempo: number | null }
): void {
  if (metadataTimer !== null) return;

  metadataTimer = setInterval(() => {
    const { key, tempo } = getMetadata();
    updateMetadata(key, tempo).catch((err) => {
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
}

/**
 * Returns the current retry queue size (for monitoring/testing).
 */
export function getRetryQueueSize(): number {
  return retryQueue.length;
}
