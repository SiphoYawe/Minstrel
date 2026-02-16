# Story 22.6: Fix First-Run Prompt Timing and MIDI Coordination

Status: done

## Story

As a new user,
I want the first-run prompt to coordinate with my MIDI connection status,
So that I'm not told to "play your first note" before I can actually play.

## Acceptance Criteria

1. Given MIDI not connected, When FirstRunPrompt would show, Then it displays MIDI connection step first ("Connect your instrument to get started")
2. Given MIDI connects after prompt visible, When connection succeeds, Then prompt transitions to "Play your first note"
3. Given note played before prompt renders (race), When prompt mounts, Then it skips to "Session started!" confirmation

## Tasks / Subtasks

1. Add MIDI connection state check to FirstRunPrompt
   - Read midiStore connection status on mount
   - Show appropriate message based on connection state
2. Add state-driven transitions (connecting -> connected -> playing)
   - Subscribe to midiStore connection changes
   - Animate transition between prompt states
   - "Connect your instrument" -> "Play your first note" -> "Session started!"
3. Handle race condition with fallback message
   - Check if notes already received before prompt renders
   - Skip directly to confirmation if session already started
4. Add unit tests

## Dev Notes

**Findings Covered**: MIDI-C6, NAV-C5
**Files**: `src/components/first-run-prompt.tsx`, `src/stores/midi-store.ts`

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes List

- Three-state prompt: disconnected → "Connect your instrument to get started", connected → "Play your first note", race → "Session started!" auto-dismiss
- Race condition handled by checking `activeSessionId` or `totalNotesPlayed > 0` before showing onboarding
- SessionStartedConfirmation auto-dismisses after 2.5s with green check icon
- Auto-dismiss on first MIDI note-on via vanilla Zustand subscribe
- Dismiss persists to localStorage (`minstrel:first-run-dismissed`)
- Cleaned up unused state/ref variables from previous implementation
- 9 unit tests all passing

### File List

- src/components/first-run-prompt.tsx (modified — three-state prompt with race condition handling)
- src/components/**tests**/first-run-prompt.test.tsx (new)
