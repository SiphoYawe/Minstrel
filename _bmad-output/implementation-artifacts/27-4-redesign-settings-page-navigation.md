# Story 27.4: Redesign Settings Page Navigation

Status: ready-for-dev

## Story

As a user,
I want to quickly find settings sections,
So that I don't have to scroll through unorganized content.

## Acceptance Criteria

1. Given settings page loads, When rendered, Then a sticky sidebar/top nav shows all section names
2. Given section clicked in nav, When scrolling, Then target section scrolls into view with highlighted indicator
3. Given "Preferences" section has no content, When rendered, Then it is removed until real preferences exist
4. Given API Keys section, When accessed, Then it is the first/most prominent section

## Tasks / Subtasks

1. Add sticky section navigation component (SET-C6)
   - Create sidebar or top nav with section anchors
   - Highlight active section based on scroll position
2. Implement smooth scroll-to-section
   - Add scroll-into-view behavior on nav item click
   - Update URL hash for deep linking
3. Remove placeholder Preferences section
   - Delete empty Preferences section from settings page
   - Clean up related unused code
4. Reorder sections (API Keys first)
   - Move API Keys section to top of settings page
   - Ensure nav order matches page order

## Dev Notes

**Findings Covered**: SET-C6, Preferences placeholder (MEDIUM)
**Files**: `src/app/(app)/settings/page.tsx`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
