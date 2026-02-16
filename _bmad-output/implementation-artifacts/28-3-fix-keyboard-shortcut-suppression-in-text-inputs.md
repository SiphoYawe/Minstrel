# Story 28.3: Fix Keyboard Shortcut Suppression in Text Inputs

Status: ready-for-dev

## Story

As a user typing in chat,
I want keyboard shortcuts to be suppressed,
So that typing doesn't accidentally switch modes or trigger actions.

## Acceptance Criteria

1. Given user focused on text input/textarea, When they press Alt+1/2/3, Then shortcut suppressed
2. Given user focused on any input/textarea/contenteditable, When any app-level shortcut fires, Then suppressed
3. Given user tabs away from text input, When shortcut pressed, Then fires normally

## Tasks / Subtasks

1. Add focus element check to keyboard shortcut handler
   - Detect when active element is input, textarea, or contenteditable
2. Suppress shortcuts when active element is input/textarea/contenteditable
   - Early return from shortcut handler when user is typing
3. Add unit tests for suppression logic
   - Test shortcut suppression in input/textarea/contenteditable
   - Test shortcuts still fire when focus is elsewhere

## Dev Notes

**Findings Covered**: Keyboard shortcuts in text inputs (HIGH)
**Files**: `src/hooks/use-keyboard-shortcuts.ts` or keyboard handler

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
