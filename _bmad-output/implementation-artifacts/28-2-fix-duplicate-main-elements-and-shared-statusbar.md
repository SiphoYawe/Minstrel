# Story 28.2: Fix Duplicate Main Elements and Shared StatusBar

Status: ready-for-dev

## Story

As a user switching modes,
I want a smooth transition without flashing,
So that the status bar persists and the layout is valid HTML.

## Acceptance Criteria

1. Given app layout, When rendered, Then only one main element exists in DOM
2. Given StatusBar, When modes switch, Then StatusBar remains mounted (no unmount/remount flash)
3. Given StatusBar shared, When different modes need different content, Then content updates reactively without remounting

## Tasks / Subtasks

1. Remove duplicate main/id="main-content" from SilentCoach
   - Ensure only the shared layout provides the main element
2. Move StatusBar to shared layout (above mode components)
   - Hoist StatusBar so it persists across mode switches
3. Make StatusBar content reactive to current mode
   - StatusBar reads current mode from store and renders appropriate content
4. Add unit tests

## Dev Notes

**Findings Covered**: NAV-C3, NAV-C4
**Files**: `src/components/silent-coach/`, `src/components/layouts/`, status bar components

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
