# Story 13.2: Integrate Mode Switcher into Layout Flow

Status: ready-for-dev

## Story

As a musician,
I want the mode switcher tabs to be part of the page layout flow instead of floating over content,
So that tabs never overlap data cards, chat panels, or other interactive elements.

## Acceptance Criteria

1. Given the mode switcher currently uses fixed right-4 top-12 z-30 positioning, When this story is completed, Then the mode switcher is repositioned into the layout flow, either as part of the StatusBar or as inline tabs at the top of the session page content area
2. Given the mode switcher is integrated into the layout flow, When the right panel is visible (Dashboard or Replay modes), Then the mode switcher does not overlap any panel content at 1024px, 1280px, or 1440px viewport widths
3. Given the mode switcher is in the layout flow, When the user switches modes, Then the mode transition occurs smoothly with the tabs remaining in their fixed layout position
4. Given the mode switcher is integrated, When rendered alongside the StatusBar, Then the combined height of StatusBar + mode switcher does not exceed 80px
5. Given the mode switcher no longer uses fixed positioning, When the page scrolls (if any content area scrolls), Then the mode switcher remains visible and accessible at all times (sticky within the session page)

## Tasks / Subtasks

1. Remove fixed positioning from mode-switcher.tsx
   - Remove fixed, right-4, top-12, z-30 classes
   - Convert to relative or flow-based positioning
   - Test that mode switcher still renders correctly

2. Integrate mode switcher into StatusBar or session page layout flow
   - Option A: Add as right-aligned element within StatusBar flex container
   - Option B: Place as first child in session page content area with sticky positioning
   - Implement chosen approach and test layout

3. Verify no overlap at 1024px, 1280px, 1440px viewports
   - Test with right panel visible in Dashboard mode
   - Test with right panel visible in Replay Studio mode
   - Verify no overlap with data cards, chat panels, or other interactive elements
   - Test at all three viewport widths

4. Ensure smooth mode transitions in new position
   - Test switching between all three modes
   - Verify mode switcher remains in fixed layout position
   - Check for visual glitches or layout shifts during transitions

5. Keep combined StatusBar + mode switcher height ≤ 80px
   - Measure combined height of StatusBar and mode switcher
   - Adjust spacing, padding, or font sizes if needed to meet constraint
   - Verify at multiple viewport widths

6. Add sticky positioning for scroll scenarios
   - If mode switcher is in session page flow, add sticky top-0
   - Ensure it remains visible when content scrolls
   - Test scrolling behavior in all three modes

7. Add visual regression tests at multiple viewport widths
   - Create Playwright tests for 1024px, 1280px, 1440px viewports
   - Test all three modes at each viewport width
   - Verify no overlap or layout issues

## Dev Notes

### Architecture Layer

- **Presentation Layer**: Modify mode-switcher.tsx and status-bar.tsx

### Technical Details

- Primary file: src/features/modes/mode-switcher.tsx
- StatusBar file: src/components/status-bar.tsx
- Current StatusBar positioning: fixed top-0 z-40
- Current mode switcher positioning: fixed right-4 top-12 z-30 (to be removed)
- Target combined height: ≤ 80px
- Design system: shadcn/ui + Tailwind CSS
- Border radius: 0px (sharp corners)

### Project Structure Notes

Files to modify:

- src/features/modes/mode-switcher.tsx
- src/components/status-bar.tsx (if integrating into StatusBar)
- src/app/(auth)/session/page.tsx (if integrating into session page flow)

Key implementation notes:

- Remove fixed right-4 top-12 z-30 from mode-switcher.tsx
- Consider integrating into StatusBar as right-aligned flex item
- Alternative: place as first child in session page with sticky top-0
- StatusBar is currently fixed top-0 z-40 - may need height adjustment
- Test layout at 1024px, 1280px, and 1440px breakpoints
- Verify no overlap with right panels in Dashboard and Replay modes
- Combined StatusBar + mode switcher height must not exceed 80px

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
