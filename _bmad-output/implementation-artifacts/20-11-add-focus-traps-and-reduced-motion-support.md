# Story 20.11: Add Focus Traps and Reduced Motion Support

Status: ready-for-dev

## Story

As a keyboard user,
I want the session summary modal to trap focus and media query listeners to be cleaned up,
So that I can't tab out of modals and no memory leaks occur from orphaned listeners.

## Acceptance Criteria

1. Given the session summary modal opens, When the user presses Tab, Then focus is trapped within the modal
2. Given the session summary modal opens, When it mounts, Then focus moves to the first interactive button
3. Given the small screen banner uses a media query listener, When the component unmounts, Then `removeEventListener` is called

## Tasks / Subtasks

1. Add focus trap to session summary (UI-M9)
   - Use focus-trap-react
   - Add `role="dialog"` and `aria-modal="true"`
2. Verify media query cleanup in small screen banner (UI-M13)
   - Ensure removeEventListener in useEffect cleanup
3. Add unit tests

## Dev Notes

**Findings Covered**: UI-M9, UI-M13
**Files**: `src/components/session-summary.tsx`, `src/components/small-screen-banner.tsx`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
