# Story 29.1: Add Replay Error Recovery and Edge Case Handling

Status: done

## Story

As a user,
I want replay mode to handle errors gracefully,
So that invalid sessions don't crash the app.

## Acceptance Criteria

1. Given invalid session ID in URL, When replay page loads, Then error message with "Back to Sessions" link
2. Given session deleted during active playback, When deletion occurs, Then playback stops: "This session is no longer available"
3. Given session has 0 duration, When timeline renders, Then "Empty session" instead of broken scrubber

## Tasks / Subtasks

1. Add session ID validation on replay page load
   - Validate session ID format and existence before rendering
   - Show error state with "Back to Sessions" link if invalid
2. Handle mid-playback deletion with graceful stop
   - Detect session removal during playback
   - Stop playback and display "This session is no longer available" message
3. Handle 0-duration edge case in timeline
   - Check session duration before rendering scrubber
   - Display "Empty session" placeholder for 0-duration sessions
4. Add unit tests

## Dev Notes

**Findings Covered**: REPLAY-C1, REPLAY-C2, REPLAY-C4
**Files**: `src/app/(app)/replay/`, `src/components/replay/`

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes List

- Added `replayErrorMessage` and `'deleted'` status to session store
- Enhanced useReplaySession hook with specific error messages for not-found vs no-sessions
- Added mid-playback deletion polling (5s interval) that detects removed sessions and stops playback
- Updated replay page to show "Back to Sessions" link for invalid session IDs
- Enhanced ReplayStudio error/deleted states with contextual messages and navigation
- Added 0-duration/empty session detection: shows "Empty session" placeholder instead of broken scrubber
- 10 new unit tests covering all edge cases

### File List

- src/stores/session-store.ts
- src/features/session/use-replay-session.ts
- src/features/modes/replay-studio.tsx
- src/app/(auth)/replay/[id]/page.tsx
- src/features/session/replay-error-recovery.test.ts (new)
