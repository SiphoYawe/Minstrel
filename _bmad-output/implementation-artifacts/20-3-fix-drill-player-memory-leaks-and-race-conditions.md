# Story 20.3: Fix Drill Player Memory Leaks and Race Conditions

Status: ready-for-dev

## Story

As a musician using drills,
I want timers to respect stop commands and audio nodes to be cleaned up,
So that stopped drills don't cause ghost state updates and audio nodes don't accumulate.

## Acceptance Criteria

1. Given `stop()` is called during drill playback, When remaining setTimeout timers fire, Then each callback checks a `stopped` flag and returns early
2. Given the listen phase transition is scheduled, When `stop()` is called during the 1.5s window, Then the timer callback does not transition
3. Given oscillator and gain nodes are created for drill playback, When playback completes, Then nodes are explicitly disconnected
4. Given rapid drill playback cycles, When audio nodes accumulate, Then the total node count stays bounded

## Tasks / Subtasks

1. Add stopped flag and timer tracking (STATE-M3, STATE-M4)
   - Add `private stopped = false` and `private timers: NodeJS.Timeout[] = []`
   - Check `if (this.stopped) return` in all timer callbacks
   - Clear all timers in `stop()`
2. Disconnect audio nodes after playback (STATE-M6)
   - Add `osc.addEventListener('ended', () => { osc.disconnect(); gain.disconnect() })`
3. Add unit tests

## Dev Notes

**Findings Covered**: STATE-M3, STATE-M4, STATE-M6
**File**: `src/features/drills/drill-player.ts` (lines 63-135, 142-172, 216-220)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
