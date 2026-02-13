# Story 21.3: Fix Timer and Subscription Cleanup

Status: ready-for-dev

## Story

As a developer maintaining Minstrel,
I want silence timeouts and MIDI subscriptions to check mount state before executing,
So that no React warnings occur from state updates on unmounted components.

## Acceptance Criteria

1. Given the 10-second silence timeout fires, When the component has unmounted, Then the callback checks a mounted flag and returns early
2. Given MIDI access is requested asynchronously, When the component unmounts before the promise resolves, Then no subscription is created after unmount

## Tasks / Subtasks

1. Add mounted flag to silence timeout (STATE-L3)
   - Add `mountedRef = useRef(true)`, set false in cleanup
   - Check before calling `handleSilence()`
2. Add mounted check to MIDI subscription (STATE-L5)
   - Add `let mounted = true` in useEffect
   - Check after async `requestMIDIAccess` resolves
   - Set false in cleanup
3. Add unit tests

## Dev Notes

**Findings Covered**: STATE-L3, STATE-L5
**Files**: `src/features/analysis/use-analysis-pipeline.ts`, `src/features/midi/use-midi.ts`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
