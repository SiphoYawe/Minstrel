# Story 19.9: Fix Modal Focus Traps and Keyboard Support

Status: ready-for-dev

## Story

As a keyboard user,
I want modal focus traps, screen reader protection from background content, and visible keyboard hints,
So that I can navigate modals properly, not interact with hidden content, and discover keyboard shortcuts.

## Acceptance Criteria

1. Given the keyboard shortcuts panel is open, When the user presses Tab, Then focus cycles within the modal only (focus trap)
2. Given the mobile redirect overlay is displayed, When screen readers scan the page, Then background content has `aria-hidden="true"` applied
3. Given the drill controller's "Start Drill" button, When rendered, Then a visible keyboard shortcut hint is displayed (e.g., "Press Enter to start")
4. Given any modal closes, When Escape is pressed, Then focus returns to the element that triggered the modal

## Tasks / Subtasks

1. Add focus trap to keyboard shortcuts modal (UI-H8)
   - Use focus-trap-react or manual implementation
   - Add `role="dialog"` and `aria-modal="true"`
2. Add aria-hidden to background during mobile overlay (UI-H9)
   - Toggle `aria-hidden="true"` on main content when overlay shows
   - Clean up on unmount
3. Add keyboard hints to drill controller (UI-H10)
   - Add `<kbd>` element showing "Enter" next to Start button
4. Add focus return on modal close
   - Store trigger element ref, focus on close
5. Add unit tests

## Dev Notes

**Architecture Layer**: Presentation Layer (accessibility)
**Findings Covered**: UI-H8, UI-H9, UI-H10
**Files**: `src/components/keyboard-shortcuts-panel.tsx` (lines 58-110), `src/components/mobile-redirect.tsx` (lines 48-76), `src/components/drill-controller.tsx` (lines 176-185)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
