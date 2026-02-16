# Story 29.5: Fix Responsive Breakdowns Across Viewports

Status: done

## Story

As a mobile/tablet user,
I want the app to work on smaller screens,
So that key feedback is visible regardless of viewport size.

## Acceptance Criteria

1. Given viewport <768px, When status bar renders, Then all critical info (MIDI status, session time, key) visible with responsive layout
2. Given viewport <768px, When canvas legend renders, Then collapses to icon-only mode
3. Given viewport <768px, When dashboard cards render, Then stack vertically full-width
4. Given viewport <768px, When timing graphs render, Then use 12px+ text and simplified layout

## Tasks / Subtasks

1. Add responsive layout to status bar
   - Ensure MIDI status, session time, and key detection remain visible on small screens
   - Use responsive Tailwind classes for layout adjustments
2. Add icon-only collapse mode to canvas legend
   - Collapse legend labels to icons below 768px breakpoint
3. Fix dashboard card stacking on mobile
   - Stack cards vertically at full width below 768px
4. Fix timing graph font size and layout for mobile
   - Enforce 12px minimum text size on timing graphs
   - Simplify graph layout for narrow viewports
5. Add unit tests

## Dev Notes

**Findings Covered**: Theme 5, responsive issues across areas
**Files**: status bar, canvas legend, timing graph, drill panel, dashboard card components

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes List

- Status bar: removed `hidden sm:flex` from center section so key/BPM are visible on all viewports; reduced gap to `gap-1.5 sm:gap-3`; hid device name and MIDI Help button below sm breakpoint to free space
- Canvas legend: collapsed labels/sublabels below md breakpoint (`hidden md:block`); reduced gap from `gap-8` to `gap-3 md:gap-8`; reduced padding to `px-2 py-1.5 md:px-4 md:py-2`
- DataCard: changed grid from `grid-cols-2` to `grid-cols-1 sm:grid-cols-2`; Notes Played card uses `sm:col-span-2` instead of `col-span-2`
- Dashboard difficulty subgrid: changed from `grid-cols-2` to `grid-cols-1 sm:grid-cols-2`
- Timing grid: dynamic beat count based on canvas width — compact mode (<500px) uses 6 past + 2 predictive beats vs full mode (12+4); font already 12px (compliant)
- Drill panel: metadata row uses `flex-wrap` with `gap-2 sm:gap-4` for mobile wrapping
- Fixed pre-existing broken status bar tests (were searching for wrong text 'Help' instead of 'MIDI Help')
- 51 tests passing across 3 test files

### File List

- src/components/status-bar.tsx
- src/components/status-bar.test.tsx
- src/components/viz/canvas-legend.tsx
- src/components/data-card.tsx
- src/components/data-card.test.tsx
- src/components/dashboard-view.tsx
- src/components/viz/timing-grid-renderer.ts
- src/components/viz/timing-grid-renderer.test.ts
- src/components/drill-panel.tsx
