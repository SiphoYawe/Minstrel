# Story 21.4: Fix Session Cache and Metadata Fixes

Status: ready-for-dev

## Story

As a musician using session continuity,
I want the continuity cache invalidated on session completion and metadata written immediately on first detection,
So that the next session has up-to-date context and metadata is captured promptly.

## Acceptance Criteria

1. Given a session completes, When saved, Then the continuity context cache is invalidated
2. Given key or tempo is detected for the first time, When detection occurs, Then metadata is written immediately (not waiting for 10-second interval)
3. Given STATE-L7 (guest session double-start), When verified, Then confirmed as non-issue (startingRef guard works)

## Tasks / Subtasks

1. Invalidate continuity cache on session end (STATE-L4)
   - Add `continuityContextCache.invalidate()` after saveSession
2. Write metadata immediately on first detection (STATE-L6)
   - Check if first detection, call `writeMetadataImmediately()` if so
3. Verify STATE-L7 non-issue
   - Review startingRef guard, document as non-issue
4. Add unit tests

## Dev Notes

**Findings Covered**: STATE-L4, STATE-L6, STATE-L7
**Files**: `src/features/session/session-manager.ts`, `src/features/session/session-recorder.ts`, `src/features/session/use-guest-session.ts`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
