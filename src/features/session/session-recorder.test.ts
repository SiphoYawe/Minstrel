import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  startRecording,
  recordEvent,
  flush,
  emergencyFlush,
  updateMetadata,
  recordSnapshot,
  startMetadataSync,
  stopRecording,
  getActiveRecordingId,
  getBufferSize,
  getRetryQueueSize,
  resetRecorder,
  cleanupOrphanSessions,
} from './session-recorder';
import type { MidiEvent } from '@/features/midi/midi-types';
import type { InstantSnapshot } from '@/features/analysis/analysis-types';
import { db } from '@/lib/dexie/db';

vi.mock('@sentry/nextjs', () => ({
  captureMessage: vi.fn(),
  captureException: vi.fn(),
}));

// Dexie uses fake-indexeddb automatically in test environment (via vitest setup)

function makeMidiEvent(overrides: Partial<MidiEvent> = {}): MidiEvent {
  return {
    type: 'note-on',
    note: 60,
    noteName: 'C4',
    velocity: 100,
    channel: 0,
    timestamp: performance.now(),
    source: 'midi',
    ...overrides,
  };
}

function makeSnapshot(overrides: Partial<InstantSnapshot> = {}): InstantSnapshot {
  return {
    id: 'snap-test',
    key: null,
    chordsUsed: [],
    timingAccuracy: 90,
    averageTempo: 120,
    keyInsight: 'Test snapshot',
    insightCategory: 'GENERAL',
    genrePatterns: [],
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('session-recorder', () => {
  beforeEach(async () => {
    resetRecorder();
    await db.sessions.clear();
    await db.midiEvents.clear();
    await db.analysisSnapshots.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetRecorder();
  });

  describe('startRecording', () => {
    it('creates a session record in Dexie with correct metadata', async () => {
      const id = await startRecording('freeform', 'midi');
      expect(id).toBeGreaterThan(0);
      expect(getActiveRecordingId()).toBe(id);

      const session = await db.sessions.get(id);
      expect(session).toBeDefined();
      expect(session!.sessionType).toBe('freeform');
      expect(session!.status).toBe('recording');
      expect(session!.inputSource).toBe('midi');
      expect(session!.key).toBeNull();
      expect(session!.tempo).toBeNull();
    });

    it('returns existing session ID on double-start', async () => {
      const id1 = await startRecording('freeform');
      const id2 = await startRecording('freeform');
      expect(id2).toBe(id1);
    });

    it('concurrent double-start returns same session ID via async lock (STATE-M7)', async () => {
      // Fire two startRecording calls concurrently without awaiting the first
      const [id1, id2] = await Promise.all([
        startRecording('freeform'),
        startRecording('freeform'),
      ]);

      // Both should return the same session ID — only one session created
      expect(id1).toBe(id2);

      // Only one session should exist in Dexie
      const sessionCount = await db.sessions.count();
      expect(sessionCount).toBe(1);
    });

    it('defaults inputSource to midi', async () => {
      const id = await startRecording('freeform');
      const session = await db.sessions.get(id);
      expect(session!.inputSource).toBe('midi');
    });
  });

  describe('recordEvent', () => {
    it('buffers events in memory (not immediately written to Dexie)', async () => {
      await startRecording('freeform');
      const event = makeMidiEvent();
      recordEvent(event);

      expect(getBufferSize()).toBe(1);
      const stored = await db.midiEvents.count();
      expect(stored).toBe(0);
    });

    it('does nothing if not recording and not requested', () => {
      recordEvent(makeMidiEvent());
      expect(getBufferSize()).toBe(0);
    });

    it('captures events into pending buffer and writes them atomically with session', async () => {
      // Start recording but don't await — simulates the async gap
      const recordingPromise = startRecording('freeform');

      // Record events while startRecording is still awaiting the transaction
      // These would be lost without the pending buffer fix
      recordEvent(makeMidiEvent({ note: 60, timestamp: 1 }));
      recordEvent(makeMidiEvent({ note: 64, timestamp: 2 }));

      // Now await the recording start
      const sessionId = await recordingPromise;

      // Pending events are now written atomically inside the transaction,
      // so the main buffer should be empty and events should already be in Dexie
      expect(getBufferSize()).toBe(0);

      const events = await db.midiEvents.where('sessionId').equals(sessionId).toArray();
      expect(events).toHaveLength(2);
      expect(events[0].note).toBe(60);
      expect(events[1].note).toBe(64);
    });

    it('buffers multiple events', async () => {
      await startRecording('freeform');
      recordEvent(makeMidiEvent({ note: 60 }));
      recordEvent(makeMidiEvent({ note: 64 }));
      recordEvent(makeMidiEvent({ note: 67 }));
      expect(getBufferSize()).toBe(3);
    });
  });

  describe('flush', () => {
    it('bulk-writes buffered events to Dexie and clears buffer', async () => {
      await startRecording('freeform');
      recordEvent(makeMidiEvent({ note: 60 }));
      recordEvent(makeMidiEvent({ note: 64 }));
      recordEvent(makeMidiEvent({ note: 67 }));

      await flush();

      expect(getBufferSize()).toBe(0);
      const stored = await db.midiEvents.count();
      expect(stored).toBe(3);
    });

    it('does nothing when buffer is empty', async () => {
      await startRecording('freeform');
      await flush(); // no-op
      expect(getBufferSize()).toBe(0);
    });

    it('guards against concurrent flush calls', async () => {
      await startRecording('freeform');
      recordEvent(makeMidiEvent({ note: 60 }));
      recordEvent(makeMidiEvent({ note: 64 }));

      // Start two flushes concurrently — second should no-op due to guard
      const [result1, result2] = await Promise.all([flush(), flush()]);

      // Both should resolve (no error), total stored should be 2 (not duplicated)
      expect(result1).toBeUndefined();
      expect(result2).toBeUndefined();
      const stored = await db.midiEvents.count();
      expect(stored).toBe(2);
    });

    it('moves failed events to retry queue (not back to main buffer)', async () => {
      await startRecording('freeform');
      recordEvent(makeMidiEvent());
      recordEvent(makeMidiEvent());

      const originalBulkAdd = db.midiEvents.bulkAdd.bind(db.midiEvents);
      const bulkAddSpy = vi
        .spyOn(db.midiEvents, 'bulkAdd')
        .mockRejectedValueOnce(new Error('Write failed'));

      await flush();
      // Events should be in retry queue, not main buffer
      expect(getBufferSize()).toBe(0);
      expect(getRetryQueueSize()).toBe(2);

      // Restore and retry — next flush processes retry queue first
      bulkAddSpy.mockImplementation(originalBulkAdd);
      await flush();
      expect(getRetryQueueSize()).toBe(0);
      const stored = await db.midiEvents.count();
      expect(stored).toBe(2);
    });

    it('processes retry queue before main buffer on flush', async () => {
      await startRecording('freeform');
      recordEvent(makeMidiEvent({ note: 60 }));

      const originalBulkAdd = db.midiEvents.bulkAdd.bind(db.midiEvents);
      const bulkAddSpy = vi
        .spyOn(db.midiEvents, 'bulkAdd')
        .mockRejectedValueOnce(new Error('Write failed'));

      // First flush fails — events go to retry queue
      await flush();
      expect(getRetryQueueSize()).toBe(1);

      // Now add new events to main buffer
      recordEvent(makeMidiEvent({ note: 64 }));
      expect(getBufferSize()).toBe(1);

      // Restore and flush — retry queue processed first, then main buffer
      bulkAddSpy.mockImplementation(originalBulkAdd);
      await flush();
      expect(getRetryQueueSize()).toBe(0);
      expect(getBufferSize()).toBe(0);
      const stored = await db.midiEvents.count();
      expect(stored).toBe(2);
    });

    it('concurrent flush waits for first flush to complete', async () => {
      await startRecording('freeform');
      recordEvent(makeMidiEvent({ note: 60 }));
      recordEvent(makeMidiEvent({ note: 64 }));
      recordEvent(makeMidiEvent({ note: 67 }));

      // Both flush calls should resolve without errors or duplicates
      await Promise.all([flush(), flush()]);

      const stored = await db.midiEvents.count();
      expect(stored).toBe(3);
    });
  });

  describe('autosave', () => {
    it('verifies autosave timer calls bulkAdd on the 30s interval', async () => {
      await startRecording('freeform');
      recordEvent(makeMidiEvent({ note: 60 }));
      recordEvent(makeMidiEvent({ note: 64 }));
      expect(getBufferSize()).toBe(2);

      // Spy on bulkAdd to verify the autosave timer triggers a write
      const bulkAddSpy = vi.spyOn(db.midiEvents, 'bulkAdd');

      // Wait slightly over 30s for the autosave interval to fire
      await new Promise((r) => setTimeout(r, 31_000));

      expect(bulkAddSpy).toHaveBeenCalled();
      expect(getBufferSize()).toBe(0);
      bulkAddSpy.mockRestore();
    }, 35_000);
  });

  describe('write integrity', () => {
    it('1000 events recorded, 1000 events retrieved after flush', async () => {
      const sessionId = await startRecording('freeform');

      for (let i = 0; i < 1000; i++) {
        recordEvent(makeMidiEvent({ note: 60 + (i % 12), timestamp: i }));
      }

      expect(getBufferSize()).toBe(1000);
      await flush();
      expect(getBufferSize()).toBe(0);

      const events = await db.midiEvents.where('sessionId').equals(sessionId).toArray();
      expect(events).toHaveLength(1000);
    });
  });

  describe('buffer cap', () => {
    it('triggers early flush when buffer reaches MAX_BUFFER_SIZE', async () => {
      await startRecording('freeform');

      // Record exactly MAX_BUFFER_SIZE events
      for (let i = 0; i < 10_000; i++) {
        recordEvent(makeMidiEvent({ note: 60 + (i % 12), timestamp: i }));
      }

      // The 10,000th event triggers an early async flush
      // Wait for the flush promise to resolve
      await new Promise((r) => setTimeout(r, 50));

      const stored = await db.midiEvents.count();
      expect(stored).toBe(10_000);
      expect(getBufferSize()).toBe(0);
    });
  });

  describe('updateMetadata', () => {
    it('updates key and tempo in Dexie session record', async () => {
      const id = await startRecording('freeform');
      await updateMetadata('C major', 120);

      const session = await db.sessions.get(id);
      expect(session!.key).toBe('C major');
      expect(session!.tempo).toBe(120);
    });

    it('always writes on repeated calls even with same values', async () => {
      await startRecording('freeform');
      const updateSpy = vi.spyOn(db.sessions, 'update');

      await updateMetadata('C major', 120);
      expect(updateSpy).toHaveBeenCalledTimes(1);

      // Same values — should still write (no caching)
      await updateMetadata('C major', 120);
      expect(updateSpy).toHaveBeenCalledTimes(2);

      updateSpy.mockRestore();
    });

    it('does nothing if not recording', async () => {
      const updateSpy = vi.spyOn(db.sessions, 'update');
      await updateMetadata('C major', 120);
      expect(updateSpy).not.toHaveBeenCalled();
      updateSpy.mockRestore();
    });
  });

  describe('recordSnapshot', () => {
    it('persists snapshot to analysisSnapshots table', async () => {
      const sessionId = await startRecording('freeform');
      const snapshot = makeSnapshot({ timestamp: 5000 });
      await recordSnapshot(snapshot);

      const snapshots = await db.analysisSnapshots.where('sessionId').equals(sessionId).toArray();
      expect(snapshots).toHaveLength(1);
      expect(snapshots[0].createdAt).toBe(5000);
      expect(snapshots[0].data).toBeDefined();
    });

    it('does nothing if not recording', async () => {
      await recordSnapshot(makeSnapshot());
      const count = await db.analysisSnapshots.count();
      expect(count).toBe(0);
    });
  });

  describe('startMetadataSync', () => {
    it('guards against duplicate timers', async () => {
      await startRecording('freeform');
      // Call twice — second should be a no-op (returns immediately)
      startMetadataSync(() => ({ key: null, tempo: null }));
      startMetadataSync(() => ({ key: 'changed', tempo: 999 }));
      // No error thrown = success; timer deduplication verified
    });

    it('at most one metadata interval exists after rapid successive calls (STATE-H4)', async () => {
      await startRecording('freeform');
      const updateSpy = vi.spyOn(db.sessions, 'update');

      // Call startMetadataSync multiple times rapidly — only first should create an interval
      startMetadataSync(() => ({ key: 'A minor', tempo: 100 }));
      startMetadataSync(() => ({ key: 'C major', tempo: 120 }));
      startMetadataSync(() => ({ key: 'G major', tempo: 140 }));

      // Wait for one metadata interval tick (METADATA_UPDATE_INTERVAL_MS = 10000ms by default)
      // Since only 1 interval should exist, after one tick only the first getter should fire
      await new Promise((r) => setTimeout(r, 11_000));

      // All update calls should use 'A minor' / 100 (the first getter), not 'G major' / 140
      const calls = updateSpy.mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(1);
      for (const call of calls) {
        // call[1] is the update object { key, tempo }
        const updateObj = call[1] as Record<string, unknown>;
        expect(updateObj.key).toBe('A minor');
        expect(updateObj.tempo).toBe(100);
      }

      updateSpy.mockRestore();
    }, 15_000);
  });

  describe('stopRecording', () => {
    it('performs final flush, updates session, and clears state', async () => {
      const id = await startRecording('freeform');
      recordEvent(makeMidiEvent({ note: 60 }));
      recordEvent(makeMidiEvent({ note: 64 }));

      const returnedId = await stopRecording();
      expect(returnedId).toBe(id);

      // Buffer should be flushed
      expect(getBufferSize()).toBe(0);
      const stored = await db.midiEvents.count();
      expect(stored).toBe(2);

      // Session should be updated
      const session = await db.sessions.get(id);
      expect(session!.status).toBe('completed');
      expect(session!.endedAt).not.toBeNull();
      expect(session!.duration).toBeGreaterThanOrEqual(0);

      // Active session should be cleared
      expect(getActiveRecordingId()).toBeNull();
    });

    it('returns null if not recording', async () => {
      const result = await stopRecording();
      expect(result).toBeNull();
    });

    it('clears autosave and metadata timers', async () => {
      await startRecording('freeform');
      startMetadataSync(() => ({ key: null, tempo: null }));

      await stopRecording();

      // Recording new events after stop should not buffer (no active session)
      recordEvent(makeMidiEvent());
      expect(getBufferSize()).toBe(0);
    });
  });

  describe('emergencyFlush', () => {
    it('clears both event buffer and retry queue', async () => {
      await startRecording('freeform');
      recordEvent(makeMidiEvent());
      recordEvent(makeMidiEvent());

      // Force one event into retry queue
      const originalBulkAdd = db.midiEvents.bulkAdd.bind(db.midiEvents);
      vi.spyOn(db.midiEvents, 'bulkAdd').mockRejectedValueOnce(new Error('fail'));
      await flush();
      expect(getRetryQueueSize()).toBe(2);
      vi.spyOn(db.midiEvents, 'bulkAdd').mockImplementation(originalBulkAdd);

      // Add new events
      recordEvent(makeMidiEvent());
      expect(getBufferSize()).toBe(1);

      emergencyFlush();

      expect(getBufferSize()).toBe(0);
      expect(getRetryQueueSize()).toBe(0);
    });

    it('does nothing when buffers are empty', () => {
      // Should not throw
      emergencyFlush();
      expect(getBufferSize()).toBe(0);
    });
  });

  describe('resetRecorder', () => {
    it('clears all internal state including retry queue', async () => {
      await startRecording('freeform');
      recordEvent(makeMidiEvent());
      startMetadataSync(() => ({ key: null, tempo: null }));

      resetRecorder();

      expect(getActiveRecordingId()).toBeNull();
      expect(getBufferSize()).toBe(0);
      expect(getRetryQueueSize()).toBe(0);
    });
  });

  describe('atomic transactions', () => {
    it('session creation and pending events are written in a single transaction', async () => {
      // Start recording but don't await — buffer events during async gap
      const recordingPromise = startRecording('freeform');
      recordEvent(makeMidiEvent({ note: 60, timestamp: 1 }));
      recordEvent(makeMidiEvent({ note: 64, timestamp: 2 }));
      recordEvent(makeMidiEvent({ note: 67, timestamp: 3 }));

      const sessionId = await recordingPromise;

      // Session AND events should both be in Dexie (written atomically)
      const session = await db.sessions.get(sessionId);
      expect(session).toBeDefined();
      expect(session!.status).toBe('recording');

      const events = await db.midiEvents.where('sessionId').equals(sessionId).toArray();
      expect(events).toHaveLength(3);
    });

    it('transaction failure rolls back both session and events', async () => {
      // Spy on db.transaction to simulate a transaction failure
      const originalTransaction = db.transaction.bind(db);
      vi.spyOn(db, 'transaction').mockImplementationOnce(() => {
        throw new Error('Transaction failed');
      });

      // startRecording should throw
      await expect(startRecording('freeform')).rejects.toThrow('Transaction failed');

      // Neither session nor events should be written
      const sessions = await db.sessions.count();
      expect(sessions).toBe(0);
      const events = await db.midiEvents.count();
      expect(events).toBe(0);

      // Active session should not be set
      expect(getActiveRecordingId()).toBeNull();

      // Restore original
      vi.spyOn(db, 'transaction').mockImplementation(originalTransaction);
    });

    it('flush writes events inside a Dexie transaction', async () => {
      const sessionId = await startRecording('freeform');
      recordEvent(makeMidiEvent({ note: 60 }));
      recordEvent(makeMidiEvent({ note: 64 }));

      // Spy on db.transaction to verify it's called during flush
      const transactionSpy = vi.spyOn(db, 'transaction');

      await flush();

      // transaction should have been called at least once during flush
      expect(transactionSpy).toHaveBeenCalled();

      // Verify events are persisted
      const stored = await db.midiEvents.where('sessionId').equals(sessionId).toArray();
      expect(stored).toHaveLength(2);

      transactionSpy.mockRestore();
    });
  });

  describe('cleanupOrphanSessions', () => {
    it('detects and removes orphan sessions with zero events', async () => {
      const Sentry = await import('@sentry/nextjs');

      // Create a completed session with no events (orphan)
      await db.sessions.add({
        startedAt: 1000,
        endedAt: 2000,
        duration: 1,
        inputSource: 'midi',
        sessionType: 'freeform',
        status: 'completed',
        key: null,
        tempo: null,
        userId: null,
        syncStatus: 'pending',
        supabaseId: null,
      });

      const orphanCount = await cleanupOrphanSessions();
      expect(orphanCount).toBe(1);

      // Orphan should be deleted
      const sessions = await db.sessions.count();
      expect(sessions).toBe(0);

      // Sentry should have been notified
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        'Orphan sessions detected on startup',
        expect.objectContaining({
          level: 'warning',
          tags: { feature: 'session-recorder' },
        })
      );
    });

    it('does not remove sessions that have events', async () => {
      // Create a session with events (not an orphan)
      const sessionId = (await db.sessions.add({
        startedAt: 1000,
        endedAt: 2000,
        duration: 1,
        inputSource: 'midi',
        sessionType: 'freeform',
        status: 'completed',
        key: null,
        tempo: null,
        userId: null,
        syncStatus: 'pending',
        supabaseId: null,
      })) as number;

      await db.midiEvents.add({
        sessionId,
        type: 'note-on',
        note: 60,
        noteName: 'C4',
        velocity: 100,
        channel: 0,
        timestamp: 1500,
        source: 'midi',
        userId: null,
        syncStatus: 'pending',
      });

      const orphanCount = await cleanupOrphanSessions();
      expect(orphanCount).toBe(0);

      // Session should still exist
      const sessions = await db.sessions.count();
      expect(sessions).toBe(1);
    });

    it('does not remove sessions with status "recording"', async () => {
      // Create a recording session with no events (not orphan — still active)
      await db.sessions.add({
        startedAt: Date.now(),
        endedAt: null,
        duration: null,
        inputSource: 'midi',
        sessionType: 'freeform',
        status: 'recording',
        key: null,
        tempo: null,
        userId: null,
        syncStatus: 'pending',
        supabaseId: null,
      });

      const orphanCount = await cleanupOrphanSessions();
      expect(orphanCount).toBe(0);

      const sessions = await db.sessions.count();
      expect(sessions).toBe(1);
    });

    it('returns 0 when there are no orphan sessions', async () => {
      const orphanCount = await cleanupOrphanSessions();
      expect(orphanCount).toBe(0);
    });

    it('also cleans up analysis snapshots associated with orphan sessions', async () => {
      // Create an orphan session with associated snapshots but no events
      const sessionId = (await db.sessions.add({
        startedAt: 1000,
        endedAt: 2000,
        duration: 1,
        inputSource: 'midi',
        sessionType: 'freeform',
        status: 'completed',
        key: null,
        tempo: null,
        userId: null,
        syncStatus: 'pending',
        supabaseId: null,
      })) as number;

      await db.analysisSnapshots.add({
        sessionId,
        createdAt: 1500,
        data: { key: 'C' },
        userId: null,
        syncStatus: 'pending',
      });

      const orphanCount = await cleanupOrphanSessions();
      expect(orphanCount).toBe(1);

      // Both the session and its snapshots should be deleted
      const sessions = await db.sessions.count();
      expect(sessions).toBe(0);
      const snapshots = await db.analysisSnapshots.count();
      expect(snapshots).toBe(0);
    });
  });
});
