# Story 19.10: Fix Banner Behavior and Timeline Navigation

Status: ready-for-dev

## Story

As a keyboard user navigating Minstrel,
I want the return session banner to respect my keyboard focus and timeline markers to have semantic structure,
So that auto-dismiss doesn't steal my focus and screen readers can understand marker groupings.

## Acceptance Criteria

1. Given the return session banner is displayed, When MIDI input is detected, Then the banner checks if it currently has focus before auto-dismissing
2. Given the banner has keyboard focus, When MIDI input arrives, Then the banner does NOT auto-dismiss (preserving keyboard flow)
3. Given timeline markers are rendered, When the marker container is inspected, Then it has `role="list"` and each marker has `role="listitem"`
4. Given a user tabs into the marker list, When navigating, Then arrow keys move between markers following list navigation patterns

## Tasks / Subtasks

1. Fix banner auto-dismiss focus check (UI-H7)
   - Add bannerRef to check `bannerRef.current?.contains(document.activeElement)`
   - Only dismiss if banner does NOT have focus
2. Add semantic list structure to timeline markers (UI-H11)
   - Add `role="list"` to marker container
   - Add `role="listitem"` to each marker button
   - Add `aria-label="Timeline markers"` to container
3. Add arrow key navigation for markers
4. Add unit tests

## Dev Notes

**Architecture Layer**: Presentation Layer (accessibility, UX)
**Findings Covered**: UI-H7, UI-H11
**Files**: `src/components/return-session-banner.tsx` (lines 57-70), `src/components/timeline-scrubber.tsx` (lines 238-282)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
