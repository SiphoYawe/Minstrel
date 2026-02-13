# Story 19.4: Add Atomic IndexedDB Transactions

Status: ready-for-dev

## Story

As a musician recording practice sessions,
I want session creation and event writes to be atomic,
So that browser crashes never create orphan sessions with zero events.

## Acceptance Criteria

1. Given a new session starts, When session record AND first events are written, Then they are wrapped in a single Dexie transaction
2. Given a browser crash occurs between session creation and event writing, When the database is checked, Then no orphan sessions (sessions with zero events) exist
3. Given the Dexie transaction fails, When the error is caught, Then both session record AND events are rolled back together
4. Given normal session recording, When events are flushed periodically, Then the flush uses a transaction to ensure all events in the batch are written atomically

## Tasks / Subtasks

1. Wrap session creation in Dexie transaction
   - Use `db.transaction('rw', db.sessions, db.events, async () => { ... })`
   - Include both session record and initial events in same transaction
2. Wrap periodic flush in transaction
   - Use `db.transaction('rw', db.events, async () => { await db.events.bulkAdd(events) })`
3. Add orphan session cleanup query
   - Query for sessions with zero events on app startup
   - Log to Sentry if found
4. Add unit tests
   - Normal session start → transaction commits → both written
   - Transaction fails → neither written
   - Query for orphan sessions → count is 0

## Dev Notes

**Architecture Layer**: Infrastructure Layer (IndexedDB)
**Findings Covered**: STATE-H3
**File**: `src/features/session/session-recorder.ts` (lines 36-48, 135)
**Current Issue**: Session creation and event writing use separate transactions. Browser crash between them creates orphans.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
