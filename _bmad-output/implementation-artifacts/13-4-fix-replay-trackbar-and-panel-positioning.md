# Story 13.4: Fix Replay Trackbar and Panel Positioning

Status: ready-for-dev

## Story

As a musician in Replay Studio,
I want the timeline scrubber to be properly contained and not overlap the right panel,
So that I can use both the timeline and the session details panel without visual conflicts.

## Acceptance Criteria

1. Given the Replay Studio uses grid-cols-[3fr_1fr] layout, When the timeline scrubber renders at the bottom of the canvas column, Then the scrubber is visually contained within the canvas/left column and does not extend into the right panel area
2. Given the right panel contains session tabs, When the viewport height is less than 700px, Then the timeline scrubber and right panel content do not overlap vertically
3. Given the timeline scrubber and right panel are rendered side by side, When the user views the layout, Then a clear visual separator distinguishes the scrubber area from the right panel
4. Given the scrubber uses shrink-0 in a flex column, When the content area above it has overflow, Then the scrubber maintains its full height and functionality without being compressed
5. Given the Replay Studio grid layout, When the right panel minimum width is enforced, Then the right panel is at least 320px wide

## Tasks / Subtasks

1. Constrain timeline scrubber to left grid column only
   - Verify timeline scrubber is a child of the left grid column only
   - Remove any grid span or absolute positioning that extends into right panel
   - Test that scrubber is visually contained within canvas/left column

2. Fix vertical overlap at viewport heights < 700px
   - Test layout at viewport height 700px and below
   - Adjust flex layout to prevent vertical overlap
   - Consider adding overflow-y-auto to right panel if needed
   - Ensure scrubber maintains shrink-0 to prevent compression

3. Add visual separator between scrubber and right panel
   - Add border-left or similar visual separator to right panel
   - Use design system colors (subtle grey or accent-blue)
   - Ensure separator is visible at all viewport sizes

4. Verify scrubber shrink-0 behavior with overflowing content
   - Test with varying amounts of content in canvas area
   - Ensure scrubber maintains full height when content overflows
   - Verify scrubber functionality remains intact

5. Enforce minimum 320px width on right panel
   - Add min-w-[320px] to right panel container
   - Test at 1024px viewport (smallest supported)
   - Verify right panel does not shrink below 320px

6. Adjust grid-cols ratio for better panel sizing
   - Current: grid-cols-[3fr_1fr] makes right panel ~256px at 1024px
   - Consider: grid-cols-[2fr_1fr] or fixed sizing
   - Test new ratio at 1024px, 1280px, 1440px viewports
   - Ensure right panel is at least 320px at all viewport sizes

7. Add layout tests at multiple viewport sizes
   - Create Playwright tests for 1024px, 1280px, 1440px viewports
   - Test viewport heights: 700px, 800px, 900px
   - Verify no overlap between scrubber and right panel
   - Verify right panel minimum width of 320px

## Dev Notes

### Architecture Layer

- **Presentation Layer**: Modify timeline-scrubber.tsx and replay-studio.tsx

### Technical Details

- Primary files:
  - src/components/timeline-scrubber.tsx
  - src/features/modes/replay-studio.tsx
- Current grid layout: grid-cols-[3fr_1fr]
- Current right panel width at 1024px: ~256px (too narrow)
- Target right panel minimum width: 320px
- Timeline scrubber positioning: shrink-0 (correct, should be maintained)

### Project Structure Notes

Files to modify:

- src/components/timeline-scrubber.tsx
- src/features/modes/replay-studio.tsx

Key implementation notes:

- Timeline scrubber must be child of left grid column only (not spanning both)
- Current grid-cols-[3fr_1fr] makes right panel only ~256px at 1024px viewport
- Consider grid-cols-[2fr_1fr] or min-w-[320px] on right panel
- Add min-w-[320px] to right panel container
- Ensure scrubber shrink-0 is maintained
- Add visual separator (border-left) to right panel
- Test at viewport widths: 1024px, 1280px, 1440px
- Test at viewport heights: 700px, 800px, 900px
- Verify no vertical overlap at viewport height < 700px

Grid layout considerations:

- At 1024px with grid-cols-[3fr_1fr]: left = 768px, right = 256px
- At 1024px with grid-cols-[2fr_1fr]: left = 683px, right = 341px
- At 1024px with min-w-[320px] on right: left adjusts, right = 320px minimum

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
