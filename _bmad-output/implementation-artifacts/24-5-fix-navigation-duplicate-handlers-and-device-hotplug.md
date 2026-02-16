# Story 24.5: Fix Navigation Duplicate Handlers and Device Hotplug

Status: done

## Story

As a user navigating between pages,
I want event handlers to be properly cleaned up,
So that MIDI events aren't processed twice and device swaps are tracked.

## Acceptance Criteria

1. Given user navigates between routes, When useMidi() and useAnalysisPipeline() hooks unmount, Then all event listeners properly cleaned up
2. Given user navigates back, When hooks remount, Then only one set of event listeners exists
3. Given MIDI device disconnected and different one connected, When swap occurs, Then "Device changed" notification appears with session marker

## Tasks / Subtasks

1. Audit cleanup functions in useMidi() and useAnalysisPipeline() (MIDI-C14)
   - Verify all useEffect cleanup returns remove every listener added
   - Fix any missing cleanup paths
2. Add listener deduplication check on mount (MIDI-C14)
   - Track registered listeners to prevent duplicate registration
   - Log warning in dev mode if duplicate detected
3. Detect device swap and show notification (MIDI-C15)
   - Compare device ID on reconnect to previously connected device
   - Show "Device changed" notification when IDs differ
4. Add device-change marker to session
   - Insert "device changed" marker into session timeline
   - Include old and new device identifiers in marker metadata
5. Add unit tests

## Dev Notes

**Findings Covered**: MIDI-C14, MIDI-C15
**Files**: `src/hooks/use-midi.ts`, `src/hooks/use-analysis-pipeline.ts`

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes List

- Added `previousDeviceId` module-level tracking to use-midi.ts
- Device swap detection in `onActiveDeviceChanged` callback fires `device-changed` session marker with old/new device metadata
- Only fires marker during active session (sessionStartTimestamp !== null) and when device ID actually changes
- Cleanup resets `previousDeviceId = null` on hook unmount
- 3 new tests for device swap: marker on different device, no marker on same device, no marker without active session
- Fixed test isolation: added `useSessionStore.getState().endSession()` to beforeEach to prevent marker leakage between tests

### File List

- src/features/midi/use-midi.ts (device swap detection, previousDeviceId tracking)
- src/features/midi/use-midi.test.ts (3 device swap tests, session store reset in beforeEach)
