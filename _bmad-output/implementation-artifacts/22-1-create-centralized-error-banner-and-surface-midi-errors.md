# Story 22.1: Create Centralized Error Banner and Surface MIDI Errors

Status: done

## Story

As a user,
I want to see error messages when something goes wrong,
So that I know when MIDI is not working or data isn't being saved.

## Acceptance Criteria

1. Given midiStore.errorMessage is set, When error is non-null, Then visible amber banner appears at top of active mode — **DONE**
2. Given error banner visible, When user dismisses, Then banner hides but errors remain in store for debugging — **DONE**
3. Given multiple errors overlap, When they occur, Then most recent error shown with count indicator — **DONE**
4. Given error banner component, When used across modes, Then consistent amber styling with growth mindset language — **DONE**

## Tasks / Subtasks

1. Create reusable ErrorBanner component in src/components/ — **DONE**
   - Amber-toned styling per growth mindset mandate
   - Dismiss button that hides banner but preserves error in store
   - Count indicator for queued/overlapping errors
2. Subscribe to midiStore.errorMessage via Zustand vanilla subscribe — **DONE**
   - Wired into session page so it renders across all modes
3. Add dismiss/count/queue logic — **DONE**
   - Error queue with most-recent-first display (max 10)
   - Count badge when multiple errors pending
   - Deduplication of consecutive identical messages
4. Style with amber tone per growth mindset mandate — **DONE**
   - Uses accent-warm tokens, no red
5. Add unit tests — **DONE** (8 tests passing)

## Dev Notes

**Findings Covered**: MIDI-C1, Theme 1 (Silent Failures)
**Files**: `src/stores/midi-store.ts`, all mode layout components

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Created ErrorBanner component at src/components/error-banner.tsx
- Wired into session page (src/app/(auth)/session/page.tsx) above mode-specific layouts
- Uses vanilla Zustand subscribe for errorMessage changes
- Error queue with count badge, dismiss preserves store state
- 8 unit tests all passing

### File List

- src/components/error-banner.tsx (new)
- src/components/**tests**/error-banner.test.tsx (new)
- src/app/(auth)/session/page.tsx (modified — added ErrorBanner import and render)
