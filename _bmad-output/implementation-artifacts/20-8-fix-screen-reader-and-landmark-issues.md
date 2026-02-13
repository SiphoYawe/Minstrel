# Story 20.8: Fix Screen Reader and Landmark Issues

Status: ready-for-dev

## Story

As a screen reader user,
I want proper landmarks, complete mode labels, and no duplicate announcements,
So that I can navigate efficiently and receive clear, non-redundant information.

## Acceptance Criteria

1. Given the silent coach mode renders, When screen readers scan landmarks, Then a `<main>` element wraps the content
2. Given the mode switcher uses hidden text prefixes, When screen readers read labels, Then `aria-label` provides the full text
3. Given mode switching triggers an announcement, When `role="status"` already announces, Then the manual `textContent` update is removed

## Tasks / Subtasks

1. Add main landmark to silent coach (UI-M1)
   - Change `<div>` to `<main>`
2. Fix mode switcher aria-labels (UI-M2)
   - Add complete `aria-label` attributes
3. Remove redundant aria-live update (UI-M3)
   - Remove manual textContent update, rely on role="status"
4. Add unit tests

## Dev Notes

**Findings Covered**: UI-M1, UI-M2, UI-M3
**Files**: `src/features/modes/silent-coach.tsx`, `src/features/modes/mode-switcher.tsx`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
