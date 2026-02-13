import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { GuestSession, StoredMidiEvent, AnalysisSnapshot } from './db';
import {
  mapSessionToSupabase,
  mapMidiEventToSupabase,
  mapSnapshotToSupabase,
  syncSessionToSupabase,
  withRetry,
  BATCH_SIZE,
} from './sync';

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

// Mock Supabase client
const mockUpsert = vi.fn();
const mockInsert = vi.fn();
const mockFrom = vi.fn((table: string) => {
  if (table === 'sessions') return { upsert: mockUpsert, insert: mockInsert };
  return { insert: mockInsert };
});
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: mockFrom }),
}));

// Mock crypto.randomUUID
let uuidCounter = 0;
vi.stubGlobal('crypto', {
  randomUUID: () => `test-uuid-${++uuidCounter}`,
});

const userId = 'user-abc-123';
const sessionUUID = 'session-uuid-456';

function makeSession(overrides?: Partial<GuestSession>): GuestSession {
  return {
    id: 1,
    startedAt: 1700000000000,
    endedAt: 1700000060000,
    duration: 60000,
    inputSource: 'midi',
    sessionType: 'freeform',
    status: 'completed',
    key: 'C major',
    tempo: 120,
    userId: null,
    syncStatus: 'pending',
    supabaseId: null,
    ...overrides,
  };
}

function makeEvent(overrides?: Partial<StoredMidiEvent>): StoredMidiEvent {
  return {
    id: 1,
    sessionId: 1,
    type: 'note-on',
    note: 60,
    noteName: 'C4',
    velocity: 100,
    channel: 0,
    timestamp: 1000,
    source: 'midi',
    userId: null,
    syncStatus: 'pending',
    ...overrides,
  };
}

function makeSnapshot(overrides?: Partial<AnalysisSnapshot>): AnalysisSnapshot {
  return {
    id: 1,
    sessionId: 1,
    createdAt: 1700000030000,
    data: { key: 'C', tempo: 120 },
    userId: null,
    syncStatus: 'pending',
    ...overrides,
  };
}

describe('mapSessionToSupabase', () => {
  it('maps camelCase Dexie fields to snake_case Supabase columns', () => {
    const session = makeSession();
    const result = mapSessionToSupabase(session, userId, sessionUUID);

    expect(result).toEqual({
      id: sessionUUID,
      user_id: userId,
      mode: 'freeform',
      key_detected: 'C major',
      tempo_avg: 120,
      timing_accuracy: null,
      duration_seconds: 60,
      started_at: new Date(1700000000000).toISOString(),
      ended_at: new Date(1700000060000).toISOString(),
    });
  });

  it('handles null sessionType by defaulting to freeform', () => {
    const session = makeSession({ sessionType: null });
    const result = mapSessionToSupabase(session, userId, sessionUUID);
    expect(result.mode).toBe('freeform');
  });

  it('handles null endedAt', () => {
    const session = makeSession({ endedAt: null });
    const result = mapSessionToSupabase(session, userId, sessionUUID);
    expect(result.ended_at).toBeNull();
  });

  it('rounds duration to whole seconds', () => {
    const session = makeSession({ duration: 65432 });
    const result = mapSessionToSupabase(session, userId, sessionUUID);
    expect(result.duration_seconds).toBe(65);
  });

  it('handles null duration', () => {
    const session = makeSession({ duration: null });
    const result = mapSessionToSupabase(session, userId, sessionUUID);
    expect(result.duration_seconds).toBeNull();
  });
});

describe('mapMidiEventToSupabase', () => {
  it('maps MIDI event fields to Supabase columns', () => {
    uuidCounter = 0;
    const event = makeEvent();
    const result = mapMidiEventToSupabase(event, userId, sessionUUID);

    expect(result.session_id).toBe(sessionUUID);
    expect(result.user_id).toBe(userId);
    expect(result.event_type).toBe('note-on');
    expect(result.note).toBe(60);
    expect(result.velocity).toBe(100);
    expect(result.channel).toBe(0);
    expect(result.timestamp_ms).toBe(1000);
    expect(result.duration_ms).toBeNull();
    expect(result.id).toBe('test-uuid-1');
  });
});

describe('mapSnapshotToSupabase', () => {
  it('maps analysis snapshot fields to Supabase columns', () => {
    uuidCounter = 0;
    const snapshot = makeSnapshot();
    const result = mapSnapshotToSupabase(snapshot, userId, sessionUUID);

    expect(result.session_id).toBe(sessionUUID);
    expect(result.user_id).toBe(userId);
    expect(result.snapshot_type).toBe('silence_triggered');
    expect(result.tendency_data).toEqual({ key: 'C', tempo: 120 });
    expect(result.snapshot_at).toBe(new Date(1700000030000).toISOString());
    expect(result.id).toBe('test-uuid-1');
  });
});

describe('syncSessionToSupabase', () => {
  beforeEach(() => {
    mockFrom.mockClear();
    mockUpsert.mockClear();
    mockInsert.mockClear();
    mockUpsert.mockResolvedValue({ error: null });
    mockInsert.mockResolvedValue({ error: null });
    uuidCounter = 0;
  });

  it('upserts session and inserts events and snapshots', async () => {
    const session = makeSession();
    const events = [makeEvent()];
    const snapshots = [makeSnapshot()];

    const result = await syncSessionToSupabase(session, events, snapshots, userId);

    expect(result.success).toBe(true);
    expect(result.sessionUUID).toBeDefined();
    expect(mockFrom).toHaveBeenCalledWith('sessions');
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenCalledWith('midi_events');
    expect(mockFrom).toHaveBeenCalledWith('analysis_snapshots');
  });

  it('handles session with zero events and snapshots', async () => {
    const session = makeSession();

    const result = await syncSessionToSupabase(session, [], [], userId);

    expect(result.success).toBe(true);
    // Only session upsert, no event/snapshot inserts
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    // mockInsert should not be called (no events, no snapshots)
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('uses existing sessionUUID when provided for idempotent retries', async () => {
    const session = makeSession();
    const existingUUID = 'pre-existing-uuid';

    const result = await syncSessionToSupabase(session, [], [], userId, existingUUID);

    expect(result.sessionUUID).toBe(existingUUID);
    expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({ id: existingUUID }), {
      onConflict: 'id',
    });
  });

  it('batches MIDI events into groups of BATCH_SIZE', async () => {
    const session = makeSession();
    // Create 501 events to verify 2 batch calls
    const events = Array.from({ length: 501 }, (_, i) => makeEvent({ id: i + 1, timestamp: i }));

    await syncSessionToSupabase(session, events, [], userId);

    // First batch of 500 + second batch of 1
    const midiInsertCalls = mockInsert.mock.calls;
    expect(midiInsertCalls).toHaveLength(2);
    expect(midiInsertCalls[0][0]).toHaveLength(500);
    expect(midiInsertCalls[1][0]).toHaveLength(1);
  });

  it('throws when session upsert fails after retries', async () => {
    mockUpsert.mockResolvedValue({ error: { message: 'RLS violation' } });

    const session = makeSession();

    await expect(syncSessionToSupabase(session, [], [], userId)).rejects.toThrow(
      'Session sync failed: RLS violation'
    );
  }, 30000);
});

describe('withRetry', () => {
  it('returns immediately on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, 3, 1);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds on second attempt', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new Error('fail')).mockResolvedValue('ok');

    const result = await withRetry(fn, 3, 1);

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws after max retries exhausted', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('persistent failure'));

    await expect(withRetry(fn, 2, 1)).rejects.toThrow('persistent failure');
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('uses exponential backoff intervals', async () => {
    const callTimes: number[] = [];
    const start = Date.now();
    const fn = vi.fn().mockImplementation(async () => {
      callTimes.push(Date.now() - start);
      if (callTimes.length < 3) throw new Error('retry');
      return 'ok';
    });

    // Use 50ms base so backoff is observable but fast
    const result = await withRetry(fn, 3, 50);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);

    // First retry after ~50ms (50 * 2^0), second after ~100ms more (50 * 2^1)
    // Allow generous tolerance for CI
    expect(callTimes[1]! - callTimes[0]!).toBeGreaterThanOrEqual(40);
    expect(callTimes[2]! - callTimes[1]!).toBeGreaterThanOrEqual(80);
  });
});

describe('BATCH_SIZE', () => {
  it('is 500', () => {
    expect(BATCH_SIZE).toBe(500);
  });
});
