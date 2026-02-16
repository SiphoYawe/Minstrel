# Story 28.5: Fix Return Session Banner and Mode Transition Feedback

Status: ready-for-dev

## Story

As a user,
I want banners to appear in the right context and mode switches to feel smooth,
So that I'm not confused by misplaced UI elements or abrupt transitions.

## Acceptance Criteria

1. Given user in Replay mode, When return session banner would show, Then suppressed
2. Given return session banner visible, When user presses any key, Then can be dismissed (not just MIDI)
3. Given mode switch occurs, When transition happens, Then brief fade animation (200ms) provides visual continuity

## Tasks / Subtasks

1. Add mode check to return session banner (suppress in replay)
   - Check current mode before rendering; skip if in Replay mode
2. Add keyboard dismiss handler to banner
   - Listen for any keydown event to dismiss the banner
3. Add 200ms fade transition on mode switch
   - Apply CSS transition on mode container for smooth visual continuity
4. Add unit tests

## Dev Notes

**Findings Covered**: Return banner context (HIGH), banner keyboard dismiss (HIGH), mode transitions (MEDIUM)
**Files**: `src/components/return-session-banner.tsx`, mode components

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
