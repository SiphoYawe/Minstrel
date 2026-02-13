# Story 12.1: Build Replay Event Dispatcher

Status: ready-for-dev

## Story

As a musician reviewing a past session,
I want the replay engine to dispatch note events at the correct playback position,
So that the visualization system receives the same events it would during live play.

## Acceptance Criteria

1. Given a session is loaded into replay mode with replayEvents populated in sessionStore, When the replay engine's requestAnimationFrame loop advances from previousPosition to currentPosition, Then all events with timestamps between previousPosition and currentPosition are identified and dispatched in chronological order
2. Given a replay event is a note-on event, When the dispatcher processes it, Then the note is added to useMidiStore.activeNotes (or a dedicated replay notes state) with correct note number, velocity, and channel
3. Given a replay event is a note-off event, When the dispatcher processes it, Then the corresponding note is removed from the active notes state
4. Given replay is paused, When the animation frame fires, Then no events are dispatched and previousPosition does not advance
5. Given the user scrubs the timeline to a new position, When the scrub completes, Then all active notes are cleared and the dispatcher resets previousPosition to the new scrub position
6. Given replay reaches the end of the session, When the last event has been dispatched, Then replay stops, all active notes are cleared, and the play/pause control shows the stopped state

## Tasks / Subtasks

1. Add previousPosition tracking to replay engine
   - Add previousPosition state variable to replay engine
   - Initialize previousPosition to 0 on session load
   - Update previousPosition to currentPosition after each dispatch cycle
2. Implement event scanning between previousPosition and currentPosition using binary search
   - Create binary search utility to find start index in replayEvents array
   - Scan from start index to end of range (currentPosition)
   - Collect all events in the time range
3. Dispatch note-on events to midiStore or dedicated replay notes state
   - Add note to activeNotes with {note, velocity, channel} structure
   - Ensure note data matches MidiEvent format
4. Dispatch note-off events to remove from active notes
   - Remove matching note from activeNotes by note number
   - Handle channel-specific note-off if needed
5. Handle pause state — skip dispatch when paused
   - Check isPlaying flag before dispatching
   - Preserve previousPosition when paused
6. Handle scrub — clear active notes and reset previousPosition
   - Listen for scrub events from timeline
   - Clear all activeNotes on scrub
   - Set previousPosition to new scrub position
7. Handle end-of-session — stop replay and clear notes
   - Detect when currentPosition >= session duration
   - Stop replay animation loop
   - Clear all activeNotes
   - Update play/pause UI state
8. Add unit tests for replay event dispatcher
   - Test event dispatch in normal playback
   - Test pause behavior
   - Test scrub behavior
   - Test end-of-session behavior
   - Test note-on/note-off dispatching

## Dev Notes

**Architecture Layer**: Application Layer (replay-engine.ts orchestrates domain events)

**Technical Details**:

- Primary file: `src/features/session/replay-engine.ts` — the tick() method in the animation frame loop needs to binary-search or linearly scan replayEvents between previousPosition and currentPosition
- Must track previousPosition (last dispatched timestamp) separately from replayPosition (current playback head)
- Events are stored in sessionStore.replayEvents as MidiEvent[] with timestamp, type, note, velocity fields
- Consider dispatching to useMidiStore directly or creating a parallel replayActiveNotes state to avoid conflicts when switching between live and replay modes
- Performance: binary search for start index since events are sorted by timestamp; avoid scanning full array each frame

### Project Structure Notes

**Files to Modify**:

- `/Users/siphoyawe/Desktop/Projects/Minstrel/src/features/session/replay-engine.ts` — add previousPosition tracking, event scanning, and dispatch logic
- `/Users/siphoyawe/Desktop/Projects/Minstrel/src/stores/midi-store.ts` — may need to add replayActiveNotes state if separating from live activeNotes
- `/Users/siphoyawe/Desktop/Projects/Minstrel/src/stores/session-store.ts` — ensure replayEvents structure is correct

**Files to Create**:

- `/Users/siphoyawe/Desktop/Projects/Minstrel/src/features/session/__tests__/replay-event-dispatcher.test.ts` — unit tests

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
