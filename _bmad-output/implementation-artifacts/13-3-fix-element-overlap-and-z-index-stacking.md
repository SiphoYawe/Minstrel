# Story 13.3: Fix Element Overlap and Z-Index Stacking

Status: ready-for-dev

## Story

As a musician,
I want all UI elements to be properly layered so nothing overlaps interactive controls,
So that I can click buttons, read data, and interact with all features without obstruction.

## Acceptance Criteria

1. Given the current z-index conflicts between StatusBar (z-40), ModeSwitcher (z-30), SnapshotCTA (z-20), and WarmUpPrompt (z-20), When this story is completed, Then a z-index scale is defined and documented: base content (z-0), overlays (z-10), navigation (z-20), modals (z-30), toasts (z-40)
2. Given the SnapshotCTA uses absolute bottom-16 z-20, When it appears during a session pause, Then it does not overlap the mode switcher, data cards, or any interactive element in any of the three modes
3. Given the WarmUpPrompt uses absolute top-24 z-20, When it appears before session start, Then it does not overlap the mode switcher or status bar
4. Given all z-index values are audited and fixed, When testing at 1024px viewport width, Then no interactive elements are hidden behind other elements in Silent Coach, Dashboard+Chat, or Replay Studio modes
5. Given all z-index values are audited and fixed, When testing at 1280px and 1440px viewport widths, Then the same no-overlap guarantee holds
6. Given a modal or dialog opens, When the modal renders, Then it sits above all other content including the navigation sidebar and status bar

## Tasks / Subtasks

1. Define z-index scale as CSS custom properties in globals.css
   - Add custom properties: --z-base: 0, --z-overlay: 10, --z-nav: 20, --z-modal: 30, --z-toast: 40
   - Document the z-index scale in code comments
   - Create usage guidelines for each z-index layer

2. Audit and update all z-index values across components
   - Audit: status-bar.tsx (currently z-40)
   - Audit: mode-switcher.tsx (currently z-30)
   - Audit: snapshot-cta.tsx (currently z-20)
   - Audit: warm-up-prompt.tsx (currently z-20)
   - Update all components to use the new z-index scale
   - Replace hardcoded z-index values with Tailwind classes based on custom properties

3. Fix SnapshotCTA positioning to prevent overlaps
   - Review current absolute bottom-16 z-20 positioning
   - Consider converting from absolute to flow-based positioning
   - Ensure no overlap with mode switcher, data cards, or interactive elements
   - Test in all three modes

4. Fix WarmUpPrompt positioning to prevent overlaps
   - Review current absolute top-24 z-20 positioning
   - Consider converting from absolute to flow-based positioning
   - Ensure no overlap with mode switcher or status bar
   - Test before session start

5. Test at 1024px viewport
   - Test Silent Coach mode
   - Test Dashboard+Chat mode
   - Test Replay Studio mode
   - Verify no interactive elements are hidden behind other elements

6. Test at 1280px and 1440px viewports
   - Repeat tests from task 5 at 1280px viewport
   - Repeat tests from task 5 at 1440px viewport
   - Verify no overlap or stacking issues at any viewport width

7. Verify modals render above all content
   - Test modal/dialog rendering
   - Ensure modal sits above navigation sidebar (z-20)
   - Ensure modal sits above status bar (z-20)
   - Verify modal uses z-modal (z-30) from the defined scale

8. Add integration tests for stacking context
   - Create Playwright tests for z-index stacking
   - Test SnapshotCTA appearance and positioning
   - Test WarmUpPrompt appearance and positioning
   - Test modal rendering above all content

## Dev Notes

### Architecture Layer

- **Presentation Layer**: Update multiple components
- **Infrastructure Layer**: Define z-index scale in globals.css

### Technical Details

- Z-index scale (to be defined in globals.css):
  - --z-base: 0 (base content)
  - --z-overlay: 10 (overlays, popovers)
  - --z-nav: 20 (navigation sidebar, status bar)
  - --z-modal: 30 (modals, dialogs)
  - --z-toast: 40 (toasts, notifications)

- Current z-index values (to be audited):
  - StatusBar: z-40 (should be z-20 for navigation)
  - ModeSwitcher: z-30 (may be removed if integrated into layout flow)
  - SnapshotCTA: z-20 (should be z-10 for overlay)
  - WarmUpPrompt: z-20 (should be z-10 for overlay)

### Project Structure Notes

Files to modify:

- src/app/globals.css (add z-index custom properties)
- src/components/status-bar.tsx (update z-index from z-40 to z-20)
- src/features/modes/mode-switcher.tsx (update or remove z-index)
- src/components/snapshot-cta.tsx (update z-index and positioning)
- src/components/warm-up-prompt.tsx (update z-index and positioning)

Key implementation notes:

- Define z-index scale as CSS custom properties
- Audit all components using z-index values
- Update StatusBar from z-40 to z-20 (navigation layer)
- Update SnapshotCTA from z-20 to z-10 (overlay layer)
- Update WarmUpPrompt from z-20 to z-10 (overlay layer)
- Consider converting SnapshotCTA and WarmUpPrompt from absolute to flow-based positioning
- Test at 1024px, 1280px, 1440px widths and heights down to 700px
- Verify modals use z-30 (modal layer) to sit above all other content

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
