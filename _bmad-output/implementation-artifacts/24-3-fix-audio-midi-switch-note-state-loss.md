# Story 24.3: Fix Audio/MIDI Switch Note State Loss

Status: ready-for-dev

## Story

As a user switching between audio and MIDI input,
I want my notes to be preserved,
So that switching modes doesn't cause notes to visually disappear.

## Acceptance Criteria

1. Given source switch from MIDI to audio, When switch occurs, Then pending MIDI notes in activeNotes preserved
2. Given overlapping note events from different sources, When they arrive, Then each source's notes tracked independently
3. Given source switch completes, When new source active, Then only new source events affect activeNotes

## Tasks / Subtasks

1. Tag active notes with source identifier (MIDI-C12)
   - Add `source: 'midi' | 'audio'` field to active note entries
   - Ensure all note creation paths set the source tag
2. Prevent cross-source note-off clearing
   - Only allow note-off events to clear notes from the same source
   - Prevent MIDI note-off from clearing audio-sourced notes and vice versa
3. Clean up old source notes after switch completes
   - After source switch stabilizes, gracefully expire notes from the previous source
   - Add configurable timeout for stale source note cleanup
4. Add unit tests

## Dev Notes

**Findings Covered**: MIDI-C12
**Files**: `src/stores/midi-store.ts`, `src/hooks/use-midi.ts`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
