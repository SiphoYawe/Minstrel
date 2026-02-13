# Story 20.12: Add Performance Optimizations — Virtualization and Pagination

Status: ready-for-dev

## Story

As a user with a long practice history,
I want achievement gallery and session history to use virtualization or pagination,
So that the UI remains performant even with large datasets.

## Acceptance Criteria

1. Given 43+ achievements are rendered, When the gallery displays, Then it uses virtual scrolling or pagination
2. Given session history loads, When there are 50+ sessions, Then pagination is used with a "Load More" button
3. Given pagination is implemented, When the user clicks "Load More", Then additional items append without removing previously loaded ones

## Tasks / Subtasks

1. Add virtualization to achievement gallery (UI-M11)
   - Use react-window FixedSizeGrid or pagination
2. Add pagination to session history (UI-M12)
   - Load 20 sessions initially
   - Add "Load More" button for next page
3. Add unit tests

## Dev Notes

**Findings Covered**: UI-M11, UI-M12
**Files**: `src/components/achievement-gallery.tsx`, `src/components/session-history-list.tsx`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
