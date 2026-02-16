# Story 24.6: Fix Migration Indicator and localStorage Safety

Status: done

## Story

As a user converting from guest to registered account,
I want to see migration progress and not lose data,
So that I'm confident my practice history is preserved.

## Acceptance Criteria

1. Given guest data migration starts, When migrateGuestData() called, Then blocking overlay appears: "Moving your practice data to your account..."
2. Given migration fails or browser closes mid-migration, When user returns, Then migration retries automatically
3. Given private browsing mode, When localStorage fails, Then app detects and warns: "Private browsing mode — settings won't persist between sessions"

## Tasks / Subtasks

1. Add blocking migration overlay component (MIDI-C8)
   - Create overlay with progress message
   - Block all user interaction until migration completes or fails
2. Implement migration retry logic on failure (MIDI-C16)
   - Track migration state (pending, in-progress, completed, failed)
   - On app load, check for incomplete migration and retry
   - Set max retry attempts with exponential backoff
3. Detect private browsing mode localStorage failures (MIDI-C18)
   - Wrap localStorage access in try/catch
   - Test write on app init to detect private browsing restrictions
4. Show warning for private browsing users
   - Display persistent amber banner: "Private browsing mode — settings won't persist between sessions"
   - Fall back to in-memory storage for session settings
5. Add unit tests

## Dev Notes

**Findings Covered**: MIDI-C8, MIDI-C16, MIDI-C18
**Files**: `src/lib/guest-migration.ts`, `src/stores/app-store.ts`

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes List

- Created `safe-storage.ts` utility with `isLocalStorageAvailable()`, `safeGetItem()`, `safeSetItem()`, `safeRemoveItem()` — cached detection + try/catch wrappers
- Added `isPrivateBrowsing` state to app-store, auto-detects on store init via `!isLocalStorageAvailable()`
- Switched app-store from raw `localStorage` calls to `safeGetItem`/`safeSetItem` for sidebar and legend persistence
- Created `MigrationOverlay` component — blocking `role="alertdialog"` with focus management, indeterminate progress bar (reuses shimmer keyframe), session counter
- Created `PrivateBrowsingBanner` — persistent amber banner matching AudioModeBanner pattern, non-dismissible
- Added `migrateWithRetry()` with exponential backoff (3 attempts, 1s/2s/4s delays), explicit `partial-failure` status on exhaustion
- Wired both new components into root layout
- 18 tests across 3 test files (safe-storage: 10, migration-overlay: 5, private-browsing-banner: 3)

### File List

- src/lib/safe-storage.ts (new — localStorage safety utility)
- src/lib/safe-storage.test.ts (new — 10 tests)
- src/stores/app-store.ts (added isPrivateBrowsing, switched to safeGetItem/safeSetItem)
- src/lib/dexie/migration.ts (added migrateWithRetry with exponential backoff)
- src/lib/dexie/migration-retry.test.ts (new — 2 integration tests)
- src/components/migration-overlay.tsx (new — blocking overlay)
- src/components/migration-overlay.test.tsx (new — 5 tests)
- src/components/private-browsing-banner.tsx (new — amber banner)
- src/components/private-browsing-banner.test.tsx (new — 3 tests)
- src/app/layout.tsx (wired MigrationOverlay and PrivateBrowsingBanner)
- src/app/globals.css (no net change — removed duplicate keyframe)
