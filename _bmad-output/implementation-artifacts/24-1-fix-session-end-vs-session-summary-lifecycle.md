# Story 24.1: Fix Session End vs Session Summary Lifecycle

Status: ready-for-dev

## Story

As a user,
I want session summary to actually end my session,
So that playing after dismissing the summary starts a new session and doesn't corrupt data.

## Acceptance Criteria

1. Given session summary triggered, When it appears, Then current session immediately ended and finalized
2. Given user dismisses summary and plays more, When notes arrive, Then new session created automatically
3. Given session summary displayed, When shown, Then includes "Start New Session" CTA button

## Tasks / Subtasks

1. Wire session end to summary trigger in session-store.ts (MIDI-C11)
   - Ensure `endSession()` is called when summary is triggered
   - Finalize session data before summary renders
2. Auto-create new session on post-summary note input
   - Detect notes arriving when no active session exists
   - Automatically call `startSession()` on first post-summary note
3. Add "Start New Session" CTA to session summary component
   - Add button to session-summary.tsx
   - Wire button to explicitly start a fresh session
4. Add unit tests

## Dev Notes

**Findings Covered**: MIDI-C11
**Files**: `src/stores/session-store.ts`, `src/components/session-summary.tsx`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
