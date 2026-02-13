import * as Sentry from '@sentry/nextjs';
import { db } from './db';
import { syncSessionToSupabase, BATCH_SIZE } from './sync';
import type { StoredMidiEvent, AnalysisSnapshot } from './db';
import { useAppStore } from '@/stores/app-store';

export interface MigrationResult {
  sessionsTotal: number;
  sessionsSynced: number;
  eventsTotal: number;
  eventsSynced: number;
  snapshotsTotal: number;
  snapshotsSynced: number;
  errors: string[];
}

// Migration lock to prevent concurrent runs
let migrationInProgress: Promise<MigrationResult> | null = null;

export async function hasGuestData(): Promise<boolean> {
  if (!db) return false;
  const count = await db.sessions.filter((s) => !s.userId).count();
  return count > 0;
}

export async function associateGuestData(userId: string): Promise<number> {
  if (!db) return 0;

  let count = 0;
  await db.transaction('rw', [db.sessions, db.midiEvents, db.analysisSnapshots], async () => {
    const guestSessions = await db.sessions.filter((s) => !s.userId).toArray();
    count = guestSessions.length;

    for (const session of guestSessions) {
      await db.sessions.update(session.id!, { userId, syncStatus: 'pending' });
      await db.midiEvents
        .where('sessionId')
        .equals(session.id!)
        .modify({ userId, syncStatus: 'pending' });
      await db.analysisSnapshots
        .where('sessionId')
        .equals(session.id!)
        .modify({ userId, syncStatus: 'pending' });
    }
  });

  return count;
}

/**
 * Loads MIDI events for a session in batches to avoid loading all into memory at once.
 */
async function loadEventsInBatches(sessionId: number): Promise<StoredMidiEvent[]> {
  const events: StoredMidiEvent[] = [];
  let offset = 0;

  for (;;) {
    const batch = await db.midiEvents
      .where('sessionId')
      .equals(sessionId)
      .offset(offset)
      .limit(BATCH_SIZE)
      .toArray();

    events.push(...batch);
    if (batch.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
  }

  return events;
}

/**
 * Loads analysis snapshots for a session in batches.
 */
async function loadSnapshotsInBatches(sessionId: number): Promise<AnalysisSnapshot[]> {
  const snapshots: AnalysisSnapshot[] = [];
  let offset = 0;

  for (;;) {
    const batch = await db.analysisSnapshots
      .where('sessionId')
      .equals(sessionId)
      .offset(offset)
      .limit(BATCH_SIZE)
      .toArray();

    snapshots.push(...batch);
    if (batch.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
  }

  return snapshots;
}

async function doMigrateGuestData(userId: string): Promise<MigrationResult> {
  const result: MigrationResult = {
    sessionsTotal: 0,
    sessionsSynced: 0,
    eventsTotal: 0,
    eventsSynced: 0,
    snapshotsTotal: 0,
    snapshotsSynced: 0,
    errors: [],
  };

  if (!db) return result;

  // Find sessions owned by this user that haven't been synced yet
  const pendingSessions = await db.sessions
    .where('syncStatus')
    .equals('pending')
    .filter((s) => s.userId === userId)
    .toArray();

  // Also pick up previously failed sessions for retry
  const failedSessions = await db.sessions
    .where('syncStatus')
    .equals('failed')
    .filter((s) => s.userId === userId)
    .toArray();

  const sessionsToSync = [...pendingSessions, ...failedSessions];

  if (sessionsToSync.length === 0) return result;

  result.sessionsTotal = sessionsToSync.length;

  // Count total events and snapshots
  for (const session of sessionsToSync) {
    const eventCount = await db.midiEvents.where('sessionId').equals(session.id!).count();
    const snapshotCount = await db.analysisSnapshots.where('sessionId').equals(session.id!).count();
    result.eventsTotal += eventCount;
    result.snapshotsTotal += snapshotCount;
  }

  const store = useAppStore.getState();
  store.setMigrationStatus('migrating');
  store.setMigrationProgress({ synced: 0, total: result.sessionsTotal });

  // Sync each session as a logical unit
  for (const session of sessionsToSync) {
    try {
      const events = await loadEventsInBatches(session.id!);
      const snapshots = await loadSnapshotsInBatches(session.id!);

      // Use existing supabaseId if this is a retry, for idempotency
      const syncResult = await syncSessionToSupabase(
        session,
        events,
        snapshots,
        userId,
        session.supabaseId ?? undefined
      );

      // Store the supabaseId for future retries and mark as synced
      await db.sessions.update(session.id!, {
        syncStatus: 'synced',
        supabaseId: syncResult.sessionUUID,
      });
      await db.midiEvents.where('sessionId').equals(session.id!).modify({ syncStatus: 'synced' });
      await db.analysisSnapshots
        .where('sessionId')
        .equals(session.id!)
        .modify({ syncStatus: 'synced' });

      result.sessionsSynced++;
      result.eventsSynced += events.length;
      result.snapshotsSynced += snapshots.length;

      useAppStore.getState().setMigrationProgress({
        synced: result.sessionsSynced,
        total: result.sessionsTotal,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown sync error';
      result.errors.push(`Session ${session.id}: ${message}`);

      Sentry.captureException(err, {
        tags: { feature: 'migration' },
        extra: {
          sessionId: session.id,
          userId,
          sessionsTotal: result.sessionsTotal,
          sessionsSynced: result.sessionsSynced,
        },
      });

      // Mark as failed for later retry — preserve supabaseId for idempotency
      await db.sessions.update(session.id!, { syncStatus: 'failed' });
    }
  }

  // Set final migration status
  if (result.errors.length === 0) {
    useAppStore.getState().setMigrationStatus('complete');
    // Auto-dismiss after 3s — return to idle so the indicator disappears
    setTimeout(() => {
      if (useAppStore.getState().migrationStatus === 'complete') {
        useAppStore.getState().setMigrationStatus('idle');
      }
    }, 3000);
  } else {
    useAppStore.getState().setMigrationStatus('partial-failure');
  }

  return result;
}

export async function migrateGuestData(userId: string): Promise<MigrationResult> {
  // If a migration is already running, return its result
  if (migrationInProgress) {
    return migrationInProgress;
  }

  migrationInProgress = doMigrateGuestData(userId);
  try {
    return await migrationInProgress;
  } finally {
    migrationInProgress = null;
  }
}

export async function triggerMigrationIfNeeded(userId: string): Promise<void> {
  if (!db) return;

  // First, associate any remaining unowned guest data with this user
  // (handles case where associateGuestData failed during signup)
  await associateGuestData(userId).catch((err) => {
    Sentry.captureException(err, {
      tags: { feature: 'migration' },
      extra: { step: 'associateGuestData', userId },
    });
  });

  // Check for unsynced sessions belonging to this user
  const pendingCount = await db.sessions
    .where('syncStatus')
    .anyOf(['pending', 'failed'])
    .filter((s) => s.userId === userId)
    .count();

  if (pendingCount === 0) return;

  // Fire-and-forget: don't block the auth flow
  migrateGuestData(userId).catch((err) => {
    Sentry.captureException(err, {
      tags: { feature: 'migration' },
      extra: { step: 'migrateGuestData', userId },
    });
    useAppStore.getState().setMigrationStatus('partial-failure');
  });
}
