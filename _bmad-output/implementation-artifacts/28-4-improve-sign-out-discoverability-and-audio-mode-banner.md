# Story 28.4: Improve Sign-Out Discoverability and Audio Mode Banner

Status: ready-for-dev

## Story

As a user,
I want to find sign-out easily and control audio mode,
So that common actions are discoverable and audio mode has clear exit path.

## Acceptance Criteria

1. Given sidebar open, When user looks for sign-out, Then visible at bottom without expanding sub-menu
2. Given audio mode banner visible, When user wants to switch back, Then "Switch to MIDI" button in banner
3. Given user clicks "Switch to MIDI", When action fires, Then app attempts MIDI reconnection

## Tasks / Subtasks

1. Move sign-out to visible position in sidebar
   - Place sign-out button at bottom of sidebar, always visible
2. Add "Switch to MIDI" button to audio mode banner
   - Render actionable button within the audio mode fallback banner
3. Wire button to MIDI reconnection flow
   - Trigger MIDI device re-enumeration and connection attempt
4. Add unit tests

## Dev Notes

**Findings Covered**: Sign-out discoverability (HIGH), audio mode banner (HIGH)
**Files**: `src/components/sidebar/`, audio mode banner component

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
