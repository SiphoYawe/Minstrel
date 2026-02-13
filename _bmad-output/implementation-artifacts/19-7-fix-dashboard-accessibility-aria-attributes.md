# Story 19.7: Fix Dashboard Accessibility — ARIA Attributes

Status: ready-for-dev

## Story

As a screen reader user,
I want proper ARIA attributes on dashboard interactive elements,
So that I can understand toggle states, receive state change announcements, navigate tabs with arrow keys, and know when content is loading.

## Acceptance Criteria

1. Given the engagement toggle button in dashboard, When rendered, Then it includes `aria-expanded={showEngagement}` attribute
2. Given the engagement section opens or closes, When the state changes, Then an `aria-live` region announces the state change
3. Given the replay studio tab list, When a user presses left/right arrow keys, Then focus moves between tabs following the roving tabindex pattern
4. Given replay data is loading, When the loading spinner appears, Then an `aria-live="assertive"` announcement informs screen readers

## Tasks / Subtasks

1. Add aria-expanded to engagement toggle (UI-H1)
   - Add `aria-expanded={showEngagement}` and `aria-controls="engagement-section"`
2. Add aria-live announcement for accordion state (UI-H2)
   - Add sr-only aria-live="polite" region
3. Implement roving tabindex for replay tabs (UI-H3)
   - Add ArrowLeft/ArrowRight key handlers
   - Cycle focus through tabs
4. Add loading state announcement (UI-H4)
   - Add aria-live="assertive" region for loading state
5. Add unit tests

## Dev Notes

**Architecture Layer**: Presentation Layer (accessibility)
**Findings Covered**: UI-H1, UI-H2, UI-H3, UI-H4
**Files**: `src/features/modes/dashboard-chat.tsx` (lines 62-72), `src/features/modes/replay-studio.tsx` (lines 90-116, 166-193)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
