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
      };
      const id = await db.sessions.add(session);
      expect(id).toBeGreaterThan(0);
    });

    it('reads a session back', async () => {
      const startedAt = Date.now();
      const id = await db.sessions.add({
        startedAt,
        endedAt: null,
        duration: null,
        inputSource: 'audio',
      });
      const session = await db.sessions.get(id);
      expect(session).toBeDefined();
      expect(session!.startedAt).toBe(startedAt);
      expect(session!.inputSource).toBe('audio');
      expect(session!.endedAt).toBeNull();
    });

    it('updates a session with end time', async () => {
      const startedAt = 1000000;
      const id = await db.sessions.add({
        startedAt,
        endedAt: null,
        duration: null,
        inputSource: 'midi',
      });
      const endedAt = startedAt + 60000;
      await db.sessions.update(id, { endedAt, duration: endedAt - startedAt });
      const session = await db.sessions.get(id);
      expect(session!.endedAt).toBe(endedAt);
      expect(session!.duration).toBe(60000);
    });
  });

  describe('midiEvents table', () => {
    it('stores and retrieves a MIDI event', async () => {
      const sessionId = (await db.sessions.add({
        startedAt: Date.now(),
        endedAt: null,
        duration: null,
        inputSource: 'midi',
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
      };
      const id = await db.analysisSnapshots.add(snapshot);
      const stored = await db.analysisSnapshots.get(id);
      expect(stored).toBeDefined();
      expect(stored!.data).toEqual({ keyCentre: 'C', tempo: 120 });
    });
  });
});
