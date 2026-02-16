# Story 22.2: Add MIDI Connection Loading Indicator and Timeout

Status: done

## Story

As a user,
I want to see a loading indicator when connecting my MIDI device,
So that I know the app is working and haven't missed anything.

## Acceptance Criteria

1. Given MIDI access requested, When requestMIDIAccess() is pending, Then loading spinner with "Connecting to your instrument..." visible — **DONE**
2. Given connection takes >15 seconds, When timeout fires, Then helpful message with troubleshooting suggestions appears — **DONE**
3. Given MIDI permission denied by OS, When denial occurs, Then clear error explains what happened and how to fix — **DONE** (via ErrorBanner from 22.1)

## Tasks / Subtasks

1. Create MidiConnectionLoading component — **DONE**
   - Shows when connectionStatus === 'connecting'
   - Pulsing progress bar with "Connecting to your instrument..." text
2. Add 15-second timeout with fallback message — **DONE**
   - Local timer in component, resets on status change
   - Switches to amber-toned timeout message with USB/permission suggestions
3. Handle OS permission denial — **DONE**
   - Already handled by midi-engine → sets errorMessage → ErrorBanner (22.1) renders it
4. Add unit tests — **DONE** (7 tests passing)

## Dev Notes

**Findings Covered**: MIDI-C2, MIDI timeout (HIGH)
**Files**: `src/components/midi-connection-loading.tsx`, `src/app/(auth)/session/page.tsx`

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes List

- Created MidiConnectionLoading component with inline loading indicator
- 15-second timeout switches to amber troubleshooting suggestions
- Timer resets when connection status changes (reconnect scenario)
- Permission denial already surfaces via ErrorBanner from 22.1
- 7 unit tests all passing

### File List

- src/components/midi-connection-loading.tsx (new)
- src/components/**tests**/midi-connection-loading.test.tsx (new)
- src/app/(auth)/session/page.tsx (modified — added MidiConnectionLoading)
