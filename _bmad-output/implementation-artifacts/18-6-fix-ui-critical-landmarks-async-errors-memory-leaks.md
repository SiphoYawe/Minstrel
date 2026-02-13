# Story 18.6: Fix UI Critical Bugs — Landmarks, Async Errors, Memory Leaks

Status: done

## Story

As a user of Minstrel,
I want the UI to have proper landmarks, error handling, and efficient rendering,
So that the app is accessible, robust, and performant.

## Acceptance Criteria

1. Given the dashboard-chat component renders, When screen readers scan for landmarks, Then a `<main>` element is found wrapping the main content area
2. Given the user clicks a session in replay studio, When IndexedDB fails to load the session, Then the error is caught and a user-facing error message is displayed (no unhandled rejection)
3. Given the user is dragging the timeline scrubber, When the component unmounts mid-drag, Then pointer capture is released and `document.body.style.userSelect` is restored
4. Given session history loads 50+ sessions, When async loading completes, Then all sessions are set in a single `setSessions` call (no individual re-renders per session)
5. Given replay studio tabs render, When sessionId changes, Then tab rendering is memoized with stable keys to prevent unnecessary full re-renders

## Tasks / Subtasks

1. Fix missing `<main>` landmark in dashboard-chat (UI-C1)
   - Change `<div className="flex-1">` to `<main className="flex-1">` in dashboard-chat.tsx line 39
2. Add error handling for session loading in replay-studio (UI-C2)
   - Wrap loadSession in try/catch
   - Show user-facing error toast on failure
3. Fix pointer capture leak in timeline-scrubber (UI-C3)
   - Add cleanup useEffect to release pointer capture
   - Restore `document.body.style.userSelect` on unmount
4. Batch session history loading (UI-C4)
   - Replace individual `setSessions(prev => [...prev, s])` with single `setSessions(allSessions)`
5. Memoize replay studio tabs with stable keys (UI-C5)
   - Use session ID instead of index for tab keys
   - Add useMemo for tab rendering
6. Add tests for all fixes

## Dev Notes

**Architecture Layer**: Presentation Layer (UI components)
**Findings Covered**: UI-C1, UI-C2, UI-C3, UI-C4, UI-C5
**Files**: `src/features/modes/dashboard-chat.tsx` (line 39), `src/features/modes/replay-studio.tsx` (lines 556-577, 166-193), `src/components/timeline-scrubber.tsx` (lines 100-123), `src/components/session-history-list.tsx` (lines 54-94)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- All 32 tests pass (timeline-scrubber: 28, dashboard-chat: 4)
- TypeScript compiles clean

### Completion Notes List

- UI-C1: Changed outer content div to `<main>` in dashboard-chat.tsx for screen reader landmark
- UI-C2: Added `.catch()` handlers to all 3 dynamic import chains in replay-studio.tsx (snapshot/drill useEffect + SessionsListPanel click handler), setting replayStatus to 'error' on failure
- UI-C3: Added `capturedPointerIdRef` to track active pointer, cleanup useEffect releases pointer capture and restores `document.body.style.userSelect` on unmount mid-drag
- UI-C4: Session history loading already batched via `Promise.all` + single `setSessions()` — verified correct
- UI-C5: Wrapped InsightsPanel, ChatPanel, SessionsListPanel with React.memo to prevent unnecessary re-renders on parent state changes (e.g. replayPosition updates)

### File List

- src/features/modes/dashboard-chat.tsx (modified)
- src/features/modes/replay-studio.tsx (modified)
- src/components/timeline-scrubber.tsx (modified)
- src/features/modes/dashboard-chat.test.tsx (new)
- src/components/timeline-scrubber.test.tsx (new)
