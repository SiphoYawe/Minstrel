# Story 12.3: Add MIDI Output Playback During Replay

Status: ready-for-dev

## Story

As a musician reviewing a past session,
I want to hear the replayed notes through my instrument's speakers (via MIDI output),
So that I can listen to my performance as well as see it.

## Acceptance Criteria

1. Given a MIDI output device is connected and replay is playing, When the replay event dispatcher emits a note-on event, Then the corresponding MIDI note-on message is sent to the connected MIDI output device with correct note number, velocity, and channel
2. Given a MIDI output device is connected and replay is playing, When the replay event dispatcher emits a note-off event, Then the corresponding MIDI note-off message is sent to the MIDI output device
3. Given no MIDI output device is connected and replay is playing, When the replay event dispatcher emits note events, Then the system falls back to Web Audio API synthesis (oscillator-based) to produce audible playback
4. Given replay is paused, When the pause occurs, Then all currently sounding notes receive note-off messages immediately (both MIDI output and Web Audio)
5. Given the user scrubs the timeline during replay, When the scrub repositions the playback head, Then all sounding notes are stopped immediately before resuming from the new position
6. Given replay is playing with MIDI output, When the replay speed is adjusted (if supported), Then note timing is adjusted proportionally but note durations and velocities remain correct

## Tasks / Subtasks

1. Wire replay event dispatcher to MIDI output via midiStore.sendMidiMessage
   - Call sendMidiMessage for each note-on event with correct parameters
   - Call sendMidiMessage for each note-off event
   - Ensure note number, velocity, and channel are correctly mapped
2. Implement Web Audio API fallback synthesis for replay
   - Create Web Audio context and oscillator nodes
   - Map MIDI note numbers to frequencies
   - Handle note-on (start oscillator) and note-off (stop oscillator)
   - Apply velocity to gain for dynamics
3. Send all-notes-off on pause
   - Detect pause event
   - Send MIDI CC 123 (all-notes-off) to output device
   - Stop all Web Audio oscillators
4. Send all-notes-off on scrub
   - Detect scrub event from timeline
   - Send MIDI CC 123 to output device
   - Stop all Web Audio oscillators
5. Handle replay speed adjustments
   - Adjust event timing proportionally to speed multiplier
   - Preserve note durations and velocities
   - Ensure MIDI output timing matches visual playback
6. Add replay audio toggle option
   - Add UI toggle in replay mode controls
   - Store preference in appStore
   - Conditionally enable/disable MIDI output and Web Audio
7. Extract shared synthesis utility from drill-player.ts
   - Identify common Web Audio synthesis code in drill-player.ts
   - Extract to shared utility module
   - Refactor both drill-player and replay to use shared utility
8. Add tests for MIDI output during replay
   - Mock MIDI output device
   - Test note-on/note-off message sending
   - Test Web Audio fallback
   - Test all-notes-off on pause/scrub
   - Test audio toggle

## Dev Notes

**Architecture Layer**: Infrastructure Layer (MIDI output, Web Audio) and Application Layer (replay engine orchestration)

**Technical Details**:

- Leverage existing MIDI output infrastructure in `src/stores/midi-store.ts` (the outputDevice state and sendMidiMessage action)
- Web Audio fallback: reference `src/features/drills/drill-player.ts` which already has oscillator-based synthesis code — extract shared utility
- Must send all-notes-off (CC 123) on pause/scrub to prevent stuck notes on the MIDI output device
- MIDI output should be toggle-able (some users may want visual-only replay)

### Project Structure Notes

**Files to Modify**:

- `/Users/siphoyawe/Desktop/Projects/Minstrel/src/features/session/replay-engine.ts` — wire to MIDI output and Web Audio
- `/Users/siphoyawe/Desktop/Projects/Minstrel/src/stores/midi-store.ts` — ensure sendMidiMessage supports replay use case
- `/Users/siphoyawe/Desktop/Projects/Minstrel/src/features/drills/drill-player.ts` — extract shared synthesis code
- `/Users/siphoyawe/Desktop/Projects/Minstrel/src/stores/app-store.ts` — add replay audio toggle preference

**Files to Create**:

- `/Users/siphoyawe/Desktop/Projects/Minstrel/src/lib/audio/web-audio-synth.ts` — shared Web Audio synthesis utility
- `/Users/siphoyawe/Desktop/Projects/Minstrel/src/features/session/__tests__/replay-midi-output.test.ts` — unit tests

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
