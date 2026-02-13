import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { db } from './db';
import type { GuestSession, StoredMidiEvent, AnalysisSnapshot } from './db';
import {
  hasGuestData,
  associateGuestData,
  migrateGuestData,
  triggerMigrationIfNeeded,
} from './migration';
import { useAppStore } from '@/stores/app-store';

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

// Mock the sync module — we test sync separately
vi.mock('./sync', () => ({
  syncSessionToSupabase: vi.fn().mockResolvedValue({ success: true, sessionUUID: 'mock-uuid' }),
  BATCH_SIZE: 500,
}));

const { syncSessionToSupabase } = await import('./sync');

const userId = 'user-test-123';

function addGuestSession(overrides?: Partial<GuestSession>) {
  return db.sessions.add({
    startedAt: Date.now(),
    endedAt: Date.now() + 60000,
    duration: 60000,
    inputSource: 'midi',
    sessionType: 'freeform',
    status: 'completed',
    key: null,
    tempo: null,
    userId: null,
    syncStatus: 'pending',
    supabaseId: null,
    ...overrides,
  });
}

function addGuestEvent(sessionId: number, overrides?: Partial<StoredMidiEvent>) {
  return db.midiEvents.add({
    sessionId,
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
  });
}

function addGuestSnapshot(sessionId: number, overrides?: Partial<AnalysisSnapshot>) {
  return db.analysisSnapshots.add({
    sessionId,
    createdAt: Date.now(),
    data: { key: 'C' },
    userId: null,
    syncStatus: 'pending',
    ...overrides,
  });
}

describe('migration', () => {
  beforeEach(async () => {
    await db.sessions.clear();
    await db.midiEvents.clear();
    await db.analysisSnapshots.clear();
    vi.mocked(syncSessionToSupabase).mockReset();
    vi.mocked(syncSessionToSupabase).mockResolvedValue({ success: true, sessionUUID: 'mock-uuid' });
    useAppStore.getState().setMigrationStatus('idle');
    useAppStore.getState().setMigrationProgress({ synced: 0, total: 0 });
  });

  afterEach(async () => {
    await db.sessions.clear();
    await db.midiEvents.clear();
    await db.analysisSnapshots.clear();
  });

  describe('hasGuestData', () => {
    it('returns false when no sessions exist', async () => {
      expect(await hasGuestData()).toBe(false);
    });

    it('returns true when guest sessions exist (userId is null)', async () => {
      await addGuestSession();
      expect(await hasGuestData()).toBe(true);
    });

    it('returns false when all sessions have a userId', async () => {
      await addGuestSession({ userId: 'some-user' });
      expect(await hasGuestData()).toBe(false);
    });
  });

  describe('associateGuestData', () => {
    it('sets userId on guest sessions and their events/snapshots', async () => {
      const sessionId = (await addGuestSession()) as number;
      await addGuestEvent(sessionId);
      await addGuestSnapshot(sessionId);

      const count = await associateGuestData(userId);
      expect(count).toBe(1);

      const session = await db.sessions.get(sessionId);
      expect(session!.userId).toBe(userId);

      const events = await db.midiEvents.where('sessionId').equals(sessionId).toArray();
      expect(events[0].userId).toBe(userId);

      const snapshots = await db.analysisSnapshots.where('sessionId').equals(sessionId).toArray();
      expect(snapshots[0].userId).toBe(userId);
    });

    it('does not modify sessions that already have a userId', async () => {
      const ownedId = (await addGuestSession({ userId: 'other-user' })) as number;
      const guestId = (await addGuestSession()) as number;

      const count = await associateGuestData(userId);
      expect(count).toBe(1);

      const owned = await db.sessions.get(ownedId);
      expect(owned!.userId).toBe('other-user');

      const guest = await db.sessions.get(guestId);
      expect(guest!.userId).toBe(userId);
    });

    it('returns 0 when no guest data exists', async () => {
      const count = await associateGuestData(userId);
      expect(count).toBe(0);
    });
  });

  describe('migrateGuestData', () => {
    it('syncs pending sessions to Supabase and marks them as synced', async () => {
      const sessionId = (await addGuestSession({ userId })) as number;
      await addGuestEvent(sessionId, { userId });
      await addGuestSnapshot(sessionId, { userId });

      const result = await migrateGuestData(userId);

      expect(result.sessionsTotal).toBe(1);
      expect(result.sessionsSynced).toBe(1);
      expect(result.eventsTotal).toBe(1);
      expect(result.eventsSynced).toBe(1);
      expect(result.snapshotsTotal).toBe(1);
      expect(result.snapshotsSynced).toBe(1);
      expect(result.errors).toHaveLength(0);

      expect(syncSessionToSupabase).toHaveBeenCalledTimes(1);

      const session = await db.sessions.get(sessionId);
      expect(session!.syncStatus).toBe('synced');
    });

    it('returns empty result when no pending sessions exist', async () => {
      const result = await migrateGuestData(userId);

      expect(result.sessionsTotal).toBe(0);
      expect(result.sessionsSynced).toBe(0);
      expect(syncSessionToSupabase).not.toHaveBeenCalled();
    });

    it('does not sync sessions belonging to a different user', async () => {
      await addGuestSession({ userId: 'different-user' });

      const result = await migrateGuestData(userId);

      expect(result.sessionsTotal).toBe(0);
      expect(syncSessionToSupabase).not.toHaveBeenCalled();
    });

    it('handles partial failure — marks failed sessions and continues with others', async () => {
      const s1 = (await addGuestSession({ userId })) as number;
      const s2 = (await addGuestSession({ userId })) as number;
      await addGuestEvent(s1, { userId });
      await addGuestEvent(s2, { userId });

      vi.mocked(syncSessionToSupabase)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ success: true });

      const result = await migrateGuestData(userId);

      expect(result.sessionsTotal).toBe(2);
      expect(result.sessionsSynced).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Network error');

      const failed = await db.sessions.get(s1);
      expect(failed!.syncStatus).toBe('failed');

      const synced = await db.sessions.get(s2);
      expect(synced!.syncStatus).toBe('synced');
    });

    it('retries previously failed sessions', async () => {
      const sessionId = (await addGuestSession({
        userId,
        syncStatus: 'failed',
      })) as number;
      await addGuestEvent(sessionId, { userId });

      const result = await migrateGuestData(userId);

      expect(result.sessionsTotal).toBe(1);
      expect(result.sessionsSynced).toBe(1);
      expect(syncSessionToSupabase).toHaveBeenCalledTimes(1);

      const session = await db.sessions.get(sessionId);
      expect(session!.syncStatus).toBe('synced');
    });

    it('updates appStore migration status to complete on full success', async () => {
      await addGuestSession({ userId });

      await migrateGuestData(userId);

      expect(useAppStore.getState().migrationStatus).toBe('complete');
    });

    it('updates appStore migration status to partial-failure when errors occur', async () => {
      await addGuestSession({ userId });
      vi.mocked(syncSessionToSupabase).mockRejectedValue(new Error('fail'));

      await migrateGuestData(userId);

      expect(useAppStore.getState().migrationStatus).toBe('partial-failure');
    });

    it('updates appStore migration progress incrementally', async () => {
      const progressUpdates: Array<{ synced: number; total: number }> = [];
      const unsub = useAppStore.subscribe((state) => {
        progressUpdates.push({ ...state.migrationProgress });
      });

      await addGuestSession({ userId });
      await addGuestSession({ userId });

      await migrateGuestData(userId);
      unsub();

      // Should have set total first, then incremented synced
      const totalSet = progressUpdates.find((p) => p.total === 2);
      expect(totalSet).toBeDefined();

      const lastProgress = progressUpdates[progressUpdates.length - 1];
      expect(lastProgress.synced).toBe(2);
      expect(lastProgress.total).toBe(2);
    });

    it('skips already synced sessions', async () => {
      await addGuestSession({ userId, syncStatus: 'synced' });

      const result = await migrateGuestData(userId);

      expect(result.sessionsTotal).toBe(0);
      expect(syncSessionToSupabase).not.toHaveBeenCalled();
    });

    it('stores supabaseId from sync result for idempotent retries', async () => {
      vi.mocked(syncSessionToSupabase).mockResolvedValue({
        success: true,
        sessionUUID: 'uuid-from-sync',
      });

      const sessionId = (await addGuestSession({ userId })) as number;
      await migrateGuestData(userId);

      const session = await db.sessions.get(sessionId);
      expect(session!.supabaseId).toBe('uuid-from-sync');
    });

    it('passes existing supabaseId to sync on retry', async () => {
      const sessionId = (await addGuestSession({
        userId,
        syncStatus: 'failed',
        supabaseId: 'existing-uuid',
      })) as number;
      await addGuestEvent(sessionId, { userId });

      await migrateGuestData(userId);

      expect(syncSessionToSupabase).toHaveBeenCalledWith(
        expect.objectContaining({ id: sessionId }),
        expect.any(Array),
        expect.any(Array),
        userId,
        'existing-uuid'
      );
    });

    it('returns same promise when called concurrently (migration lock)', async () => {
      await addGuestSession({ userId });

      const promise1 = migrateGuestData(userId);
      const promise2 = migrateGuestData(userId);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Both should resolve to the same result (same migration run)
      expect(result1).toBe(result2);
      expect(syncSessionToSupabase).toHaveBeenCalledTimes(1);
    });
  });

  describe('triggerMigrationIfNeeded', () => {
    it('does nothing when no pending data exists', async () => {
      await triggerMigrationIfNeeded(userId);
      expect(syncSessionToSupabase).not.toHaveBeenCalled();
    });

    it('does nothing when no sessions belong to the user', async () => {
      await addGuestSession({ userId: 'other-user' });
      await triggerMigrationIfNeeded(userId);
      expect(syncSessionToSupabase).not.toHaveBeenCalled();
    });

    it('triggers migration for pending data', async () => {
      await addGuestSession({ userId });

      await triggerMigrationIfNeeded(userId);

      // Give fire-and-forget time to complete
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(syncSessionToSupabase).toHaveBeenCalledTimes(1);
    });

    it('associates unowned guest data before checking for pending sessions', async () => {
      // Session has no userId — simulates failed association during signup
      await addGuestSession();

      await triggerMigrationIfNeeded(userId);

      // Should have associated the guest session with this user
      const sessions = await db.sessions.where('userId').equals(userId).toArray();
      expect(sessions).toHaveLength(1);

      // Give fire-and-forget time to complete
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(syncSessionToSupabase).toHaveBeenCalledTimes(1);
    });

    it('sets partial-failure on unexpected error', async () => {
      await addGuestSession({ userId });
      vi.mocked(syncSessionToSupabase).mockRejectedValue(new Error('unexpected'));

      await triggerMigrationIfNeeded(userId);

      // Give fire-and-forget time to complete
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(useAppStore.getState().migrationStatus).toBe('partial-failure');
    });
  });
});
