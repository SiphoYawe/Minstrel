# Story 24.2: Add Multi-Store State Coordination

Status: ready-for-dev

## Story

As a developer,
I want the three Zustand stores to coordinate state changes,
So that MIDI disconnect/reconnect and mode switching don't create impossible states.

## Acceptance Criteria

1. Given MIDI disconnects, When event fires, Then session recording pauses with "MIDI disconnected" marker in timeline
2. Given MIDI reconnects, When event fires, Then session recording resumes with "reconnected" marker (no gap corruption)
3. Given mode switch during active recording, When transition happens, Then all three stores transition atomically

## Tasks / Subtasks

1. Create store coordination layer / middleware (MIDI-C10, Theme 4)
   - Implement cross-store subscription that listens to MIDI connection state
   - Ensure atomic transitions across midiStore, sessionStore, and appStore
2. Add disconnect/reconnect markers to session timeline
   - Define marker types for "MIDI disconnected" and "MIDI reconnected"
   - Insert markers into session event stream
3. Pause recording on MIDI disconnect
   - Suspend note recording in sessionStore when MIDI connection lost
   - Preserve partial session state without corruption
4. Resume recording on reconnect
   - Resume session recording when MIDI connection restored
   - Ensure no gap corruption in timeline data
5. Add unit tests

## Dev Notes

**Findings Covered**: MIDI-C10, Theme 4
**Files**: `src/stores/midi-store.ts`, `src/stores/session-store.ts`, `src/stores/app-store.ts`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
