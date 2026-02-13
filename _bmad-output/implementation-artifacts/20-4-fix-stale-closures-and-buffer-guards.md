# Story 20.4: Fix Stale Closures and Buffer Guards

Status: ready-for-dev

## Story

As a developer maintaining Minstrel,
I want MIDI reconnection to reset detection state and session recording to handle early events,
So that drum detection works after reconnect and no events are lost during session start.

## Acceptance Criteria

1. Given `retryConnection` is called in useMidi, When a new MIDI connection is established, Then `channelChecked` is reset to false so drum channel detection runs again
2. Given `recordEvent` is called before `startRecording` completes, When events arrive, Then they are buffered correctly in `pendingBuffer`
3. Given double-start is attempted on the session recorder, When the second start arrives, Then an async lock prevents reentrancy

## Tasks / Subtasks

1. Reset channelChecked on MIDI retry (STATE-M5)
   - Add `channelChecked = false` in `retryConnection()`
2. Add async lock to session recorder start (STATE-M7)
   - Add `startPromise` field for reentrancy guard
   - Return existing promise on double-start
3. Add unit tests

## Dev Notes

**Findings Covered**: STATE-M5, STATE-M7
**Files**: `src/features/midi/use-midi.ts`, `src/features/session/session-recorder.ts`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
