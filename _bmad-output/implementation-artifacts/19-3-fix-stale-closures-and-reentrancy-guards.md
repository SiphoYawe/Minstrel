# Story 19.3: Fix Stale Closures and Reentrancy Guards

Status: ready-for-dev

## Story

As a developer maintaining Minstrel,
I want state-dependent callbacks to always read fresh state and async operations to be properly guarded,
So that concurrent updates don't cause lost data or duplicate operations.

## Acceptance Criteria

1. Given the streak hook reads streak data, When `recordSession` executes, Then it reads current streak from `Zustand.getState()` directly instead of a potentially stale ref
2. Given `startMetadataSync` is called rapidly in succession, When interval creation runs, Then at most one interval exists at any time (guarded by ref check)
3. Given concurrent drill rep results arrive, When `addDrillRepResult` executes, Then it uses Zustand's `set(state => ...)` updater pattern to ensure sequential state reads
4. Given stale closure scenarios, When any state-dependent callback fires, Then it reads fresh state via `getState()` or updater functions

## Tasks / Subtasks

1. Fix stale streak ref (STATE-H1)
   - Replace `streakRef.current` with `useEngagementStore.getState().currentStreak`
   - Use getState() in async callbacks instead of ref
2. Add reentrancy guard to metadata sync (STATE-H4)
   - Add `metadataIntervalRef = useRef<NodeJS.Timeout | null>(null)`
   - Guard: `if (metadataIntervalRef.current) return`
   - Clear on unmount
3. Fix drill rep history race (STATE-H5)
   - Use Zustand updater pattern: `set((state) => ({ repHistory: [...state.repHistory, result] }))`
4. Add unit tests
   - Concurrent streak updates → final streak correct
   - Rapid startMetadataSync calls → only 1 interval
   - Concurrent drill results → all results in history

## Dev Notes

**Architecture Layer**: Application Layer (engagement, session, drills)
**Findings Covered**: STATE-H1, STATE-H4, STATE-H5
**Files**: `src/features/engagement/use-streak.ts` (lines 18-22, 52), `src/features/session/session-recorder.ts` (lines 180-191), `src/features/drills/drill-player.ts` (lines 343-372)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
