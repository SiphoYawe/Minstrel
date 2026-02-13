# Story 16.5: Add Canvas Visualization Legend

Status: ready-for-dev

## Story

As a new musician using Minstrel,
I want to understand what the piano roll, timing grid, and harmonic overlay represent,
So that I can interpret the visualization correctly from my first session.

## Acceptance Criteria

1. Given the user enters Silent Coach mode for the first time, When the canvas renders, Then a subtle legend overlay appears showing labeled arrows pointing to: "Notes", "Timing", "Key"
2. Given the legend is displayed, When 30 seconds elapse OR the user plays their first note, Then the legend automatically fades out with a smooth transition
3. Given the legend has been auto-hidden, When the user wants to see it again, Then an info button in the corner of the canvas re-shows the legend on click
4. Given the legend is displayed, When rendered on the canvas, Then it uses semi-transparent background panels and does not obscure more than 20% of the canvas area
5. Given the legend has been dismissed by the user, When the user returns to Silent Coach mode, Then the legend does not reappear automatically (persisted to localStorage)
6. Given the legend info button is present, When the user tabs to it with keyboard navigation, Then the button is focusable and activates on Enter/Space

## Tasks / Subtasks

1. Create legend overlay component with labeled arrows (AC: 1)
2. Implement 30-second auto-hide and first-note hide (AC: 2)
3. Add info button to re-show legend (AC: 3)
4. Style with semi-transparent panels under 20% coverage (AC: 4)
5. Persist dismissed state to localStorage (AC: 5)
6. Add keyboard accessibility for info button (AC: 6)
7. Add tests for legend visibility logic

## Dev Notes

**Architecture Layer**: Presentation Layer (UI Components) + Application Layer (State Management)

**Technical Details**:

- Recommended: DOM overlay with pointer-events: none on non-interactive elements, pointer-events: auto on the info button
- Auto-hide logic: set setTimeout(30000) on mount; clear on first note (listen to midiStore.activeNotes change)
- Persistence: store legendDismissed: boolean in localStorage via appStore
- Info button: position as absolute bottom-4 right-4 within the canvas container, using shadcn/ui Button with variant="ghost"

### Project Structure Notes

**Key Files to Create**:

- `src/components/viz/canvas-legend.tsx` - legend overlay component
- `src/components/viz/canvas-legend-button.tsx` - info button to re-show legend

**Key Files to Modify**:

- `src/stores/app-store.ts` - add legendDismissed state and localStorage persistence
- `src/components/silent-coach-mode.tsx` or canvas container component - integrate legend overlay

**Design Specs**:

- Legend labels: "Notes" (pointing to piano roll), "Timing" (pointing to grid), "Key" (pointing to harmonic overlay)
- Semi-transparent panels: rgba(15, 15, 15, 0.85) backgrounds
- Arrows: simple SVG arrows in #7CB9E8
- Info button: ghost variant, bottom-4 right-4, icon-only (info icon)
- Transition: opacity fade over 300ms

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
