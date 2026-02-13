import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from './db';
import type { GuestSession, StoredMidiEvent, AnalysisSnapshot } from './db';

// Dexie uses fake-indexeddb automatically in test environment (via vitest setup)

describe('MinstrelDatabase', () => {
  beforeEach(async () => {
    // Clear all tables before each test
    await db.sessions.clear();
    await db.midiEvents.clear();
    await db.analysisSnapshots.clear();
  });

  afterEach(async () => {
    await db.sessions.clear();
    await db.midiEvents.clear();
    await db.analysisSnapshots.clear();
  });

  it('has the correct database name', () => {
    expect(db.name).toBe('minstrel-local');
  });

  it('has sessions, midiEvents, and analysisSnapshots tables', () => {
    expect(db.sessions).toBeDefined();
    expect(db.midiEvents).toBeDefined();
    expect(db.analysisSnapshots).toBeDefined();
  });

  describe('sessions table', () => {
    it('creates a session with auto-incremented id', async () => {
      const session: Omit<GuestSession, 'id'> = {
        startedAt: Date.now(),
        endedAt: null,
        duration: null,
        inputSource: 'midi',
        sessionType: null,
        status: 'recording',
        key: null,
        tempo: null,
        userId: null,
        syncStatus: 'pending',
        supabaseId: null,
      };
      const id = await db.sessions.add(session);
      expect(id).toBeGreaterThan(0);
    });

    it('reads a session back with all fields', async () => {
      const startedAt = Date.now();
      const id = await db.sessions.add({
        startedAt,
        endedAt: null,
        duration: null,
        inputSource: 'audio',
        sessionType: 'freeform',
        status: 'recording',
        key: null,
        tempo: null,
        userId: null,
        syncStatus: 'pending',
        supabaseId: null,
      });
      const session = await db.sessions.get(id);
      expect(session).toBeDefined();
      expect(session!.startedAt).toBe(startedAt);
      expect(session!.inputSource).toBe('audio');
      expect(session!.endedAt).toBeNull();
      expect(session!.sessionType).toBe('freeform');
      expect(session!.status).toBe('recording');
      expect(session!.key).toBeNull();
      expect(session!.tempo).toBeNull();
      expect(session!.userId).toBeNull();
      expect(session!.syncStatus).toBe('pending');
    });

    it('updates a session with end time', async () => {
      const startedAt = 1000000;
      const id = await db.sessions.add({
        startedAt,
        endedAt: null,
        duration: null,
        inputSource: 'midi',
        sessionType: null,
        status: 'recording',
        key: null,
        tempo: null,
        userId: null,
        syncStatus: 'pending',
        supabaseId: null,
      });
      const endedAt = startedAt + 60000;
      await db.sessions.update(id, { endedAt, duration: endedAt - startedAt, status: 'completed' });
      const session = await db.sessions.get(id);
      expect(session!.endedAt).toBe(endedAt);
      expect(session!.duration).toBe(60000);
      expect(session!.status).toBe('completed');
    });

    it('updates session metadata (key and tempo)', async () => {
      const id = await db.sessions.add({
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
      await db.sessions.update(id, { key: 'C major', tempo: 120 });
      const session = await db.sessions.get(id);
      expect(session!.key).toBe('C major');
      expect(session!.tempo).toBe(120);
    });

    it('queries sessions by sessionType index', async () => {
      await db.sessions.bulkAdd([
        {
          startedAt: 1000,
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
        },
        {
          startedAt: 2000,
          endedAt: null,
          duration: null,
          inputSource: 'midi',
          sessionType: 'drill',
          status: 'recording',
          key: null,
          tempo: null,
          userId: null,
          syncStatus: 'pending',
          supabaseId: null,
        },
        {
          startedAt: 3000,
          endedAt: null,
          duration: null,
          inputSource: 'midi',
          sessionType: 'freeform',
          status: 'completed',
          key: null,
          tempo: null,
          userId: null,
          syncStatus: 'pending',
          supabaseId: null,
        },
      ]);
      const freeform = await db.sessions.where('sessionType').equals('freeform').toArray();
      expect(freeform).toHaveLength(2);
    });

    it('queries sessions by userId index', async () => {
      await db.sessions.bulkAdd([
        {
          startedAt: 1000,
          endedAt: null,
          duration: null,
          inputSource: 'midi',
          sessionType: 'freeform',
          status: 'completed',
          key: null,
          tempo: null,
          userId: null,
          syncStatus: 'pending',
          supabaseId: null,
        },
        {
          startedAt: 2000,
          endedAt: null,
          duration: null,
          inputSource: 'midi',
          sessionType: 'freeform',
          status: 'completed',
          key: null,
          tempo: null,
          userId: 'user-123',
          syncStatus: 'synced',
          supabaseId: null,
        },
      ]);
      const guest = await db.sessions.filter((s) => s.userId === null).toArray();
      expect(guest).toHaveLength(1);
      const owned = await db.sessions.where('userId').equals('user-123').toArray();
      expect(owned).toHaveLength(1);
    });
  });

  describe('midiEvents table', () => {
    it('stores and retrieves a MIDI event', async () => {
      const sessionId = (await db.sessions.add({
        startedAt: Date.now(),
        endedAt: null,
        duration: null,
        inputSource: 'midi',
        sessionType: null,
        status: 'recording',
        key: null,
        tempo: null,
        userId: null,
        syncStatus: 'pending',
        supabaseId: null,
      })) as number;

      const event: Omit<StoredMidiEvent, 'id'> = {
        sessionId,
        type: 'note-on',
        note: 60,
        noteName: 'C4',
        velocity: 100,
        channel: 0,
        timestamp: performance.now(),
        source: 'midi',
        userId: null,
        syncStatus: 'pending',
      };

      const eventId = await db.midiEvents.add(event);
      const stored = await db.midiEvents.get(eventId);
      expect(stored).toBeDefined();
      expect(stored!.note).toBe(60);
      expect(stored!.noteName).toBe('C4');
    });

    it('queries events by sessionId', async () => {
      const sessionId = 1;
      await db.midiEvents.bulkAdd([
        {
          sessionId,
          type: 'note-on',
          note: 60,
          noteName: 'C4',
          velocity: 100,
          channel: 0,
          timestamp: 1,
          source: 'midi',
          userId: null,
          syncStatus: 'pending',
        },
        {
          sessionId,
          type: 'note-off',
          note: 60,
          noteName: 'C4',
          velocity: 0,
          channel: 0,
          timestamp: 2,
          source: 'midi',
          userId: null,
          syncStatus: 'pending',
        },
        {
          sessionId: 2,
          type: 'note-on',
          note: 64,
          noteName: 'E4',
          velocity: 80,
          channel: 0,
          timestamp: 3,
          source: 'midi',
          userId: null,
          syncStatus: 'pending',
        },
      ]);

      const events = await db.midiEvents.where('sessionId').equals(sessionId).toArray();
      expect(events).toHaveLength(2);
    });

    it('queries events by compound index [sessionId+timestamp]', async () => {
      const sessionId = 1;
      await db.midiEvents.bulkAdd([
        {
          sessionId,
          type: 'note-on',
          note: 60,
          noteName: 'C4',
          velocity: 100,
          channel: 0,
          timestamp: 100,
          source: 'midi',
          userId: null,
          syncStatus: 'pending',
        },
        {
          sessionId,
          type: 'note-on',
          note: 62,
          noteName: 'D4',
          velocity: 90,
          channel: 0,
          timestamp: 200,
          source: 'midi',
          userId: null,
          syncStatus: 'pending',
        },
        {
          sessionId,
          type: 'note-on',
          note: 64,
          noteName: 'E4',
          velocity: 80,
          channel: 0,
          timestamp: 300,
          source: 'midi',
          userId: null,
          syncStatus: 'pending',
        },
        {
          sessionId: 2,
          type: 'note-on',
          note: 65,
          noteName: 'F4',
          velocity: 70,
          channel: 0,
          timestamp: 150,
          source: 'midi',
          userId: null,
          syncStatus: 'pending',
        },
      ]);

      const events = await db.midiEvents
        .where('[sessionId+timestamp]')
        .between([sessionId, 100], [sessionId, 250])
        .toArray();
      expect(events).toHaveLength(2);
      expect(events[0].noteName).toBe('C4');
      expect(events[1].noteName).toBe('D4');
    });
  });

  describe('analysisSnapshots table', () => {
    it('stores and retrieves a snapshot', async () => {
      const snapshot: Omit<AnalysisSnapshot, 'id'> = {
        sessionId: 1,
        createdAt: Date.now(),
        data: { keyCentre: 'C', tempo: 120 },
        userId: null,
        syncStatus: 'pending',
      };
      const id = await db.analysisSnapshots.add(snapshot);
      const stored = await db.analysisSnapshots.get(id);
      expect(stored).toBeDefined();
      expect(stored!.data).toEqual({ keyCentre: 'C', tempo: 120 });
    });

    it('queries snapshots by compound index [sessionId+createdAt]', async () => {
      await db.analysisSnapshots.bulkAdd([
        {
          sessionId: 1,
          createdAt: 100,
          data: { key: 'C' },
          userId: null,
          syncStatus: 'pending' as const,
        },
        {
          sessionId: 1,
          createdAt: 200,
          data: { key: 'G' },
          userId: null,
          syncStatus: 'pending' as const,
        },
        {
          sessionId: 1,
          createdAt: 300,
          data: { key: 'D' },
          userId: null,
          syncStatus: 'pending' as const,
        },
        {
          sessionId: 2,
          createdAt: 150,
          data: { key: 'F' },
          userId: null,
          syncStatus: 'pending' as const,
        },
      ]);

      const results = await db.analysisSnapshots
        .where('[sessionId+createdAt]')
        .between([1, 100], [1, 250])
        .toArray();
      expect(results).toHaveLength(2);
      expect(results[0].data).toEqual({ key: 'C' });
      expect(results[1].data).toEqual({ key: 'G' });
    });
  });
});
