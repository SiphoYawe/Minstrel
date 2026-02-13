# Story 20.10: Fix Animation and Cleanup Accessibility

Status: ready-for-dev

## Story

As a user with motion sensitivity,
I want userSelect to be cleaned up on unmount and animations to respect prefers-reduced-motion,
So that text selection isn't broken and I don't experience motion sickness.

## Acceptance Criteria

1. Given the timeline scrubber sets `document.body.style.userSelect`, When the component unmounts, Then a useEffect cleanup restores the original value
2. Given the session summary uses custom animation, When `prefers-reduced-motion: reduce` is active, Then the animation is replaced with instant appearance
3. Given the return session banner uses animation, When `prefers-reduced-motion: reduce` is active, Then the animation is replaced with static appearance

## Tasks / Subtasks

1. Clean up userSelect on timeline unmount (UI-M7)
   - Store original value, restore in cleanup
2. Respect prefers-reduced-motion in session summary (UI-M8)
   - Check `window.matchMedia('(prefers-reduced-motion: reduce)')`
   - Use instant appearance when reduced motion preferred
3. Respect prefers-reduced-motion in banner (UI-M10)
   - Same media query check
4. Add unit tests

## Dev Notes

**Findings Covered**: UI-M7, UI-M8, UI-M10
**Files**: `src/components/timeline-scrubber.tsx`, `src/components/session-summary.tsx`, `src/components/return-session-banner.tsx`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
