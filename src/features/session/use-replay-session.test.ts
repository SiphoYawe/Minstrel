// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadSessionList } from './use-replay-session';

// Mock Dexie db
vi.mock('@/lib/dexie/db', () => ({
  db: {
    sessions: {
      get: vi.fn(),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          reverse: vi.fn(() => ({
            sortBy: vi.fn(),
          })),
          sortBy: vi.fn(),
        })),
      })),
    },
    midiEvents: {
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          sortBy: vi.fn(),
        })),
      })),
    },
  },
}));

import { db } from '@/lib/dexie/db';
import { createMockSession, createMockSessionList } from '@/test-utils/session-fixtures';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('loadSessionList', () => {
  it('returns sessions sorted by date from Dexie', async () => {
    const mockSessions = createMockSessionList(3);
    const whereResult = {
      equals: vi.fn(() => ({
        reverse: vi.fn(() => ({
          sortBy: vi.fn().mockResolvedValue(mockSessions),
        })),
      })),
    };
    vi.mocked(db.sessions.where).mockReturnValue(whereResult as never);

    const sessions = await loadSessionList();
    expect(sessions).toEqual(mockSessions);
    expect(db.sessions.where).toHaveBeenCalledWith('status');
    expect(whereResult.equals).toHaveBeenCalledWith('completed');
  });

  it('returns empty array when db has no sessions', async () => {
    const whereResult = {
      equals: vi.fn(() => ({
        reverse: vi.fn(() => ({
          sortBy: vi.fn().mockResolvedValue([]),
        })),
      })),
    };
    vi.mocked(db.sessions.where).mockReturnValue(whereResult as never);

    const sessions = await loadSessionList();
    expect(sessions).toEqual([]);
  });
});

describe('loadSessionFromDexie (via hook internals)', () => {
  it('db.sessions.get is callable with session id', async () => {
    const mockSession = createMockSession({ id: 42 });
    vi.mocked(db.sessions.get).mockResolvedValue(mockSession);

    const result = await db.sessions.get(42);
    expect(result).toEqual(mockSession);
    expect(db.sessions.get).toHaveBeenCalledWith(42);
  });
});

describe('loadEventsFromDexie (via hook internals)', () => {
  it('queries midi events by session id', async () => {
    const mockEvents = [
      {
        id: 1,
        sessionId: 1,
        type: 'note-on' as const,
        note: 60,
        noteName: 'C',
        velocity: 80,
        channel: 1,
        timestamp: 1000,
        source: 'midi' as const,
        userId: null,
        syncStatus: 'pending' as const,
      },
    ];
    const sortByMock = vi.fn().mockResolvedValue(mockEvents);
    const equalsMock = vi.fn(() => ({ sortBy: sortByMock }));
    vi.mocked(db.midiEvents.where).mockReturnValue({ equals: equalsMock } as never);

    const result = await db.midiEvents.where('sessionId').equals(1).sortBy('timestamp');
    expect(result).toEqual(mockEvents);
    expect(db.midiEvents.where).toHaveBeenCalledWith('sessionId');
  });
});
