import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  startGuestSession,
  endGuestSession,
  recordGuestEvent,
  getActiveSessionId,
  resetGuestSession,
} from './guest-session';
import type { MidiEvent } from '@/features/midi/midi-types';

// Mock the Dexie database
vi.mock('@/lib/dexie/db', () => {
  const sessions = new Map<number, Record<string, unknown>>();
  const midiEvents: Record<string, unknown>[] = [];
  let nextSessionId = 1;
  let nextEventId = 1;

  return {
    db: {
      sessions: {
        add: vi.fn(async (data: Record<string, unknown>) => {
          const id = nextSessionId++;
          sessions.set(id, { ...data, id });
          return id;
        }),
        get: vi.fn(async (id: number) => sessions.get(id) ?? undefined),
        update: vi.fn(async (id: number, changes: Record<string, unknown>) => {
          const existing = sessions.get(id);
          if (existing) {
            sessions.set(id, { ...existing, ...changes });
          }
        }),
        clear: vi.fn(() => {
          sessions.clear();
          nextSessionId = 1;
        }),
      },
      midiEvents: {
        add: vi.fn(async (data: Record<string, unknown>) => {
          const id = nextEventId++;
          midiEvents.push({ ...data, id });
          return id;
        }),
        clear: vi.fn(() => {
          midiEvents.length = 0;
          nextEventId = 1;
        }),
      },
    },
  };
});

const mockEvent: MidiEvent = {
  type: 'note-on',
  note: 60,
  noteName: 'C4',
  velocity: 100,
  channel: 0,
  timestamp: 1000,
  source: 'midi',
};

describe('guest-session', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    resetGuestSession();
    const { db } = await import('@/lib/dexie/db');
    db.sessions.clear();
    db.midiEvents.clear();
  });

  it('starts a session and returns an ID', async () => {
    const id = await startGuestSession('midi');
    expect(id).toBe(1);
    expect(getActiveSessionId()).toBe(1);
  });

  it('ends a session and clears active ID', async () => {
    const { db } = await import('@/lib/dexie/db');
    const id = await startGuestSession('midi');
    await endGuestSession(id);
    expect(getActiveSessionId()).toBeNull();
    expect(db.sessions.update).toHaveBeenCalledWith(
      id,
      expect.objectContaining({ status: 'completed' })
    );
  });

  it('records a guest event', async () => {
    const { db } = await import('@/lib/dexie/db');
    const id = await startGuestSession('midi');
    await recordGuestEvent(id, mockEvent);
    expect(db.midiEvents.add).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: id,
        note: 60,
        noteName: 'C4',
        source: 'midi',
      })
    );
  });

  it('auto-ends session after 5 minutes of inactivity', async () => {
    const { db } = await import('@/lib/dexie/db');
    await startGuestSession('midi');
    vi.advanceTimersByTime(5 * 60 * 1000);
    // Allow async operations to resolve
    await vi.runAllTimersAsync();
    expect(db.sessions.update).toHaveBeenCalled();
    expect(getActiveSessionId()).toBeNull();
  });

  it('resets inactivity timer when recording events', async () => {
    const id = await startGuestSession('midi');
    // Advance 4 minutes
    vi.advanceTimersByTime(4 * 60 * 1000);
    // Record an event — resets the timer
    await recordGuestEvent(id, mockEvent);
    // Advance another 4 minutes (total 8 from start, but only 4 since last event)
    vi.advanceTimersByTime(4 * 60 * 1000);
    // Should still be active
    expect(getActiveSessionId()).toBe(id);
  });

  it('resetGuestSession clears active session', async () => {
    const id = await startGuestSession('audio');
    expect(getActiveSessionId()).toBe(id);
    resetGuestSession();
    expect(getActiveSessionId()).toBeNull();
  });

  it('endGuestSession is idempotent for unknown session IDs', async () => {
    await endGuestSession(999);
    expect(getActiveSessionId()).toBeNull();
  });

  it('starts a session with audio input source', async () => {
    const { db } = await import('@/lib/dexie/db');
    await startGuestSession('audio');
    expect(db.sessions.add).toHaveBeenCalledWith(expect.objectContaining({ inputSource: 'audio' }));
  });

  it('returns existing session ID on double-start without creating a new session', async () => {
    const { db } = await import('@/lib/dexie/db');
    const firstId = await startGuestSession('midi');
    const secondId = await startGuestSession('midi');
    expect(secondId).toBe(firstId);
    expect(db.sessions.add).toHaveBeenCalledTimes(1);
  });
});
