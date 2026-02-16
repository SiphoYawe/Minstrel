# Story 22.3: Fix Troubleshooting Panel Behavior and Persistence

Status: done

## Story

As a user,
I want to be able to reopen the troubleshooting panel after dismissing it,
So that I can access help when I need it.

## Acceptance Criteria

1. Given troubleshooting panel dismissed, When user wants to reopen, Then persistent "MIDI Help" button in status bar allows manual reopening — **DONE**
2. Given connection flake (rapid connect/disconnect), When status changes rapidly, Then panel debounces open/close by 2 seconds — **DONE**
3. Given panel is open and connection succeeds, When MIDI connects, Then panel stays open 3 seconds showing success before auto-closing — **DONE**

## Tasks / Subtasks

1. Add persistent "MIDI Help" button to status bar — **DONE**
   - Always visible (except unsupported browser)
   - Toggles panel open/close on click
2. Add 2-second debounce logic — **DONE**
   - Prevents flickering from rapid connect/disconnect cycles
   - Debounce timer cleared on status change within window
3. Add success-then-close animation — **DONE**
   - Shows "Connected — you're all set" with green indicator for 3 seconds
   - Then auto-closes via onDismiss
4. Add unit tests — **DONE** (7 tests passing)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes List

- StatusBar: "MIDI Help" button always visible, toggles showTroubleshooting
- TroubleshootingPanel: 2s debounce before showing success state
- Success state shows for 3s with green indicator then auto-closes
- Rapid connect/disconnect cancels debounce timer — no flicker
- 7 unit tests all passing

### File List

- src/components/status-bar.tsx (modified — persistent MIDI Help button)
- src/components/troubleshooting-panel.tsx (modified — debounce + success state)
- src/components/**tests**/troubleshooting-panel.test.tsx (new)
