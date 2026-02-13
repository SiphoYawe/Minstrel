# Story 3.2: Guest-to-Account Data Migration

Status: done

## Story

As a guest user who decides to create an account,
I want my existing guest session data to transfer to my new account,
So that I don't lose the practice I've already done.

## Acceptance Criteria

1. **Given** a guest user has session data stored in browser IndexedDB via Dexie.js, **When** they create an account through the signup flow, **Then** a migration process is triggered that associates all existing Dexie.js data (sessions, MIDI events, analysis snapshots) with the newly created user ID.

2. **Given** the migration is in progress, **When** the Dexie data is being synced, **Then** the `src/lib/dexie/sync.ts` module uploads all guest sessions to Supabase in batches, respecting rate limits and transaction safety, and the migration runs in the background without blocking the UI.

3. **Given** the migration runs in the background, **When** the user continues using Minstrel, **Then** a subtle progress indicator (e.g., "Syncing your practice history...") is visible but non-intrusive, and the user can start new sessions immediately without waiting for migration to complete.

4. **Given** the migration completes successfully, **When** the user navigates to their session history or replay, **Then** all previously recorded guest sessions are visible with correct timestamps, metadata, and MIDI event data.

5. **Given** the migration fails due to network error or partial failure, **When** the sync encounters an error, **Then** the guest data remains intact in IndexedDB, the error is reported to Sentry, a retry mechanism automatically attempts re-sync with exponential backoff (max 3 retries), and the user sees "Some sessions are still syncing — we'll keep trying" rather than an error.

6. **Given** the guest had no data in IndexedDB, **When** they create an account, **Then** no migration is triggered and the account is created cleanly with no errors or unnecessary progress indicators.

## Tasks / Subtasks

- [ ] Task 1: Update Dexie.js schema to support user ID association (AC: 1)
  - [ ] Update `src/lib/dexie/db.ts` to add `user_id` field (nullable) to `sessions`, `midi_events`, and `analysis_snapshots` Dexie tables
  - [ ] Ensure guest data is stored with `user_id: null` (or a guest sentinel value like `'guest'`)
  - [ ] Add a Dexie index on `user_id` for efficient queries during migration

- [ ] Task 2: Implement guest data migration service (AC: 1, 2, 4)
  - [ ] Create `src/lib/dexie/migration.ts` with `migrateGuestData(userId: string): Promise<MigrationResult>` function
  - [ ] Query all Dexie records where `user_id` is null or `'guest'`
  - [ ] Update local Dexie records to set `user_id` to the new authenticated user ID
  - [ ] Batch records for Supabase upload: sessions first (parent records), then midi_events and analysis_snapshots (child records, referencing session IDs)
  - [ ] Return `MigrationResult` with counts: `{ sessionsTotal, sessionsSynced, eventsTotal, eventsSynced, snapshotsTotal, snapshotsSynced, errors: string[] }`

- [ ] Task 3: Implement Dexie-to-Supabase sync engine for migration (AC: 2)
  - [ ] Update `src/lib/dexie/sync.ts` with `syncSessionBatch(sessions: DexieSession[], userId: string): Promise<SyncResult>` function
  - [ ] Implement batch upload: chunk MIDI events into batches of 500 records per Supabase insert to avoid payload size limits
  - [ ] Map Dexie field names (camelCase) to Supabase column names (snake_case) during sync
  - [ ] Handle UUID generation for Supabase records (generate UUIDs client-side and store mapping between Dexie local IDs and Supabase UUIDs)
  - [ ] Wrap each session sync in a logical unit: session metadata + its midi_events + its snapshots succeed or fail together

- [ ] Task 4: Implement retry logic with exponential backoff (AC: 5)
  - [ ] Add retry configuration: max 3 retries, backoff intervals of 2s, 4s, 8s
  - [ ] Track failed records separately so retries only attempt un-synced data
  - [ ] On permanent failure (3 retries exhausted), mark records as `sync_status: 'failed'` in Dexie and report to Sentry
  - [ ] Ensure failed records are retried on next app load or manual trigger

- [ ] Task 5: Integrate migration into signup flow (AC: 1, 3, 6)
  - [ ] Update `src/features/auth/use-auth.ts` `signUp` function to trigger migration after successful account creation
  - [ ] Check if IndexedDB contains guest data before triggering migration (skip if empty, AC: 6)
  - [ ] Run migration asynchronously — do not `await` in the signup flow; fire and observe via state
  - [ ] Update `appStore` with migration state: `migrationStatus: 'idle' | 'migrating' | 'complete' | 'partial-failure'` and `migrationProgress: { synced: number, total: number }`

- [ ] Task 6: Create migration progress UI indicator (AC: 3)
  - [ ] Add a subtle toast or StatusBar indicator showing "Syncing your practice history..." with progress (e.g., "3 of 5 sessions synced")
  - [ ] Show completion message: "All practice data synced to your account"
  - [ ] Show partial failure message: "Some sessions are still syncing — we'll keep trying" (growth mindset, not alarming)
  - [ ] Use `appStore.migrationStatus` and `appStore.migrationProgress` for conditional rendering
  - [ ] Ensure indicator is non-blocking — user can navigate anywhere while migration runs

- [ ] Task 7: Write tests (AC: all)
  - [ ] Create `src/lib/dexie/migration.test.ts` testing: migration with guest data, migration with no guest data, partial failure and retry, user ID association correctness
  - [ ] Create `src/lib/dexie/sync.test.ts` testing: batch upload chunking, camelCase-to-snake_case mapping, UUID generation and mapping, retry logic
  - [ ] Mock Supabase client for sync tests; mock Dexie for migration tests

## Dev Notes

- **Dexie.js Schema Versioning**: Dexie uses version-based schema migrations. When adding `user_id` to existing tables, increment the Dexie database version in `src/lib/dexie/db.ts`. The upgrade function should set `user_id = null` for all existing records.
- **Sync Direction**: This is a one-way sync (Dexie -> Supabase) for migration purposes. The ongoing sync layer (background sync for new sessions) is a separate concern that will be refined in Epic 2 stories. This migration handles the one-time guest-to-account transfer.
- **Batch Size**: MIDI events can be numerous (thousands per session). Batch uploads in chunks of 500 to stay under Supabase insert payload limits and avoid timeouts. For a 30-minute session at 120 BPM, expect approximately 3,600 note events.
- **UUID Mapping**: Dexie uses auto-incremented numeric IDs by default. Supabase uses UUIDs. Generate UUIDs client-side during migration and maintain a mapping so that foreign key references (session_id in midi_events) are correct.
- **Race Condition Prevention**: If the user starts a new session during migration, new data should be written with the authenticated `user_id` immediately. Only records with `user_id = null` or `'guest'` are candidates for migration.
- **Idempotency**: Migration should be idempotent — if interrupted and restarted, it should not create duplicate records in Supabase. Use the local Dexie ID + user_id as a deduplication key, or check for existing records before insert.
- **Memory Management**: Do not load all MIDI events into memory at once. Stream records from Dexie in batches using cursor-based iteration (`db.midi_events.where('session_id').equals(id).each(...)`) to stay under the 200MB memory constraint.
- **Error Reporting**: Log migration failures to Sentry with context (session count, event count, error type) but never log actual MIDI data or user content.
- **Architecture Layer**: This is Layer 4 (Infrastructure) code in `src/lib/dexie/`. It is called from Layer 2 (Application) in the auth hook. No direct UI dependencies.

### Project Structure Notes

Files created/modified in this story:

```
src/lib/dexie/db.ts                 (update - add user_id fields)
src/lib/dexie/migration.ts          (create)
src/lib/dexie/sync.ts               (update - add batch sync)
src/features/auth/use-auth.ts       (update - trigger migration on signup)
src/stores/app-store.ts             (update - add migration state)
src/lib/dexie/migration.test.ts     (create)
src/lib/dexie/sync.test.ts          (create)
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture — Dexie.js 4.x]
- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions — Client-Side Persistence]
- [Source: _bmad-output/planning-artifacts/architecture.md#Communication Patterns — Event Naming]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2]
- [Source: _bmad-output/planning-artifacts/prd.md#FR45, FR46]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
