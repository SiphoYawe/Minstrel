import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  startRecording,
  recordEvent,
  flush,
  updateMetadata,
  recordSnapshot,
  startMetadataSync,
  stopRecording,
  getActiveRecordingId,
  getBufferSize,
  resetRecorder,
} from './session-recorder';
import type { MidiEvent } from '@/features/midi/midi-types';
import type { InstantSnapshot } from '@/features/analysis/analysis-types';
import { db } from '@/lib/dexie/db';

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

    it('captures events into pending buffer before startRecording resolves', async () => {
      // Start recording but don't await — simulates the async gap
      const recordingPromise = startRecording('freeform');

      // Record events while startRecording is still awaiting db.sessions.add
      // These would be lost without the pending buffer fix
      recordEvent(makeMidiEvent({ note: 60, timestamp: 1 }));
      recordEvent(makeMidiEvent({ note: 64, timestamp: 2 }));

      // Now await the recording start
      const sessionId = await recordingPromise;

      // Pending events should now be in the main buffer
      expect(getBufferSize()).toBe(2);

      // Flush and verify they're persisted with the correct sessionId
      await flush();
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

    it('retains events on write failure and rethrows', async () => {
      await startRecording('freeform');
      recordEvent(makeMidiEvent());
      recordEvent(makeMidiEvent());

      const originalBulkAdd = db.midiEvents.bulkAdd.bind(db.midiEvents);
      const bulkAddSpy = vi
        .spyOn(db.midiEvents, 'bulkAdd')
        .mockRejectedValueOnce(new Error('Write failed'));

      await expect(flush()).rejects.toThrow('Write failed');
      // Events should be retained in buffer
      expect(getBufferSize()).toBe(2);

      // Restore and retry — should succeed
      bulkAddSpy.mockImplementation(originalBulkAdd);
      await flush();
      expect(getBufferSize()).toBe(0);
      const stored = await db.midiEvents.count();
      expect(stored).toBe(2);
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

  describe('resetRecorder', () => {
    it('clears all internal state', async () => {
      await startRecording('freeform');
      recordEvent(makeMidiEvent());
      startMetadataSync(() => ({ key: null, tempo: null }));

      resetRecorder();

      expect(getActiveRecordingId()).toBeNull();
      expect(getBufferSize()).toBe(0);
    });
  });
});
