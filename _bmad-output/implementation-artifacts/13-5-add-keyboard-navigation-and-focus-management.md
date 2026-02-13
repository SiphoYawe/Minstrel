# Story 13.5: Add Keyboard Navigation and Focus Management

Status: ready-for-dev

## Story

As a musician with accessibility needs,
I want to navigate the entire application using only a keyboard,
So that Minstrel meets WCAG 2.1 AA accessibility requirements.

## Acceptance Criteria

1. Given the user presses Tab from the top of any page, When a skip-to-content link is focused, Then pressing Enter skips focus past the sidebar and status bar to the main content area
2. Given the user switches modes via the mode switcher, When the mode transition completes, Then focus is moved to the main content area of the newly active mode
3. Given the Replay Studio tab list, When focus is on one of the tabs, Then arrow keys move between tabs and Enter/Space activates the focused tab (WCAG tab panel pattern)
4. Given any interactive element in the application, When the user tabs to it, Then a visible focus indicator is displayed (minimum 2px outline using accent-blue color)
5. Given the navigation sidebar, When the user tabs into the sidebar, Then up/down arrow keys navigate between sidebar items and Enter activates the focused item
6. Given a modal or overlay is open, When the user presses Escape, Then the modal closes and focus returns to the element that triggered it (focus trap pattern)

## Tasks / Subtasks

1. Add skip-to-content link in (auth)/layout.tsx
   - Create skip-to-content link as first focusable element
   - Style to be visually hidden until focused
   - On Enter, skip focus to main content area (skip sidebar and status bar)
   - Test with keyboard navigation

2. Add focus management on mode switch
   - Use useEffect in mode-switcher.tsx to detect mode changes
   - Call .focus() on the new mode's primary element after transition
   - Identify primary focusable element for each mode
   - Test focus movement when switching between all three modes

3. Implement WCAG tab panel pattern for Replay Studio tabs
   - Add role="tablist" to tab container
   - Add role="tab" to each tab button
   - Add role="tabpanel" to each panel
   - Add aria-selected attribute to tabs
   - Implement arrow key navigation between tabs
   - Implement Enter/Space activation for focused tab
   - Test keyboard navigation in Replay Studio

4. Add global focus-visible indicator in globals.css
   - Add CSS rule: \*:focus-visible { outline: 2px solid var(--accent-blue); outline-offset: 2px; }
   - Define --accent-blue CSS custom property (#7CB9E8)
   - Test focus indicator visibility on all interactive elements
   - Ensure minimum 2px outline width

5. Add keyboard navigation for sidebar items
   - Implement up/down arrow key navigation between sidebar items
   - Implement Enter key activation for focused sidebar item
   - Add aria-current="page" to active sidebar item
   - Test keyboard navigation in sidebar
   - Ensure focus indicator is visible on sidebar items

6. Implement focus trap pattern for modals/overlays
   - Trap focus within modal when open
   - Implement Escape key to close modal
   - Return focus to triggering element when modal closes
   - Test with all modals/overlays in the application
   - Consider using radix-ui dialog primitive for built-in focus trap

7. Add accessibility tests with keyboard interaction
   - Create Playwright tests for keyboard navigation
   - Test skip-to-content link functionality
   - Test focus management on mode switch
   - Test WCAG tab panel pattern in Replay Studio
   - Test sidebar keyboard navigation
   - Test modal focus trap and Escape key
   - Test focus indicators are visible on all interactive elements

## Dev Notes

### Architecture Layer

- **Presentation Layer**: Update multiple components and layout
- **Infrastructure Layer**: Add global focus styles in globals.css

### Technical Details

- Focus indicator: 2px solid outline using accent-blue (#7CB9E8)
- WCAG 2.1 AA compliance required
- ARIA roles: tablist, tab, tabpanel, aria-selected, aria-current
- Focus management: useEffect hooks, .focus() calls, useRef for element references
- Focus trap: Consider using radix-ui dialog or similar library

### Project Structure Notes

Files to modify:

- src/app/(auth)/layout.tsx (add skip-to-content link)
- src/app/globals.css (add focus-visible indicator)
- src/features/modes/mode-switcher.tsx (add focus management on mode switch)
- src/features/modes/replay-studio.tsx (implement WCAG tab panel pattern)
- src/components/app-sidebar.tsx (add keyboard navigation)
- All modal/dialog components (implement focus trap pattern)

Files to create:

- src/components/skip-to-content.tsx (optional, if extracted as separate component)

Key implementation notes:

- Skip-to-content link: visually hidden until focused, first focusable element
- Focus indicator: \*:focus-visible { outline: 2px solid var(--accent-blue); outline-offset: 2px; }
- Define --accent-blue: #7CB9E8 as CSS custom property
- Mode switch focus: useEffect to call .focus() on new mode's primary element
- Replay Studio tabs: role="tablist", role="tab", role="tabpanel", aria-selected
- Arrow key navigation: up/down for sidebar, left/right for tabs
- Enter/Space activation: for sidebar items and tabs
- Modal focus trap: trap focus within modal, Escape to close, return focus to trigger
- Consider using radix-ui primitives for built-in accessibility

WCAG 2.1 AA requirements:

- 2.1.1 Keyboard: All functionality available via keyboard
- 2.1.2 No Keyboard Trap: Focus can move away from any component
- 2.4.3 Focus Order: Logical focus order
- 2.4.7 Focus Visible: Keyboard focus indicator is visible
- 4.1.3 Status Messages: Use ARIA live regions where appropriate

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]
- [WCAG 2.1 AA: https://www.w3.org/WAI/WCAG21/quickref/]
- [ARIA Tab Panel Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
