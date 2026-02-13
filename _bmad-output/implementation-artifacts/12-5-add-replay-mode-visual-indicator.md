# Story 12.5: Add Replay Mode Visual Indicator

Status: ready-for-dev

## Story

As a musician,
I want a clear visual distinction when I am in replay mode versus live mode,
So that I never confuse replayed content with my current live playing.

## Acceptance Criteria

1. Given the user enters replay mode, When the visualization canvas renders, Then a subtle "REPLAY" label is displayed in the top-left corner of the canvas with reduced opacity (e.g., 40%)
2. Given the user is in replay mode, When the canvas renders, Then the canvas border or outline uses a distinct color (e.g., accent-warm amber) to differentiate from live mode
3. Given replay is actively playing (not paused), When the canvas renders, Then a playback-head indicator (vertical line or glow bar) sweeps across the canvas in sync with the replay position
4. Given replay is paused, When the canvas renders, Then the playback-head indicator stops at the current position and pulses subtly to indicate the paused state
5. Given the user switches from replay mode to live mode, When the mode transition occurs, Then the "REPLAY" label, distinct border, and playback-head indicator are immediately removed

## Tasks / Subtasks

1. Render "REPLAY" label on canvas in replay mode
   - Draw text label in top-left corner of canvas
   - Use Inter font, appropriate size
   - Apply 40% opacity
   - Position with proper padding from canvas edge
2. Apply distinct border/outline color in replay mode
   - Add CSS class for replay mode border
   - Use accent-warm amber from design tokens
   - Toggle class based on currentMode
   - Apply to canvas container element
3. Render playback-head vertical line synced to replayPosition
   - Calculate x-position from replayPosition / totalDuration
   - Draw semi-transparent vertical line at x-position
   - Update position every frame during playback
   - Use appropriate color from design tokens
4. Add pulsing animation for paused playback-head
   - Detect paused state
   - Apply subtle opacity pulse to playback-head
   - Use requestAnimationFrame for smooth animation
   - Stop pulsing when playback resumes
5. Clean up all replay visual indicators on mode switch
   - Listen for mode change events
   - Clear "REPLAY" label
   - Remove border class
   - Clear playback-head indicator
   - Reset canvas state
6. Add tests for replay visual indicators
   - Test "REPLAY" label rendering
   - Test border color change
   - Test playback-head rendering and sync
   - Test playback-head pulsing when paused
   - Test cleanup on mode switch

## Dev Notes

**Architecture Layer**: Presentation Layer (visualization-canvas.tsx)

**Technical Details**:

- The "REPLAY" label should be rendered on the Canvas (not as a DOM overlay) for consistency with the 60fps render loop
- Playback-head indicator: a semi-transparent vertical line rendered by the canvas at the x-position corresponding to replayPosition relative to total session duration
- Border color change can be applied via a CSS class toggled on the canvas container element in `src/components/viz/visualization-canvas.tsx`
- Keep visual additions subtle per the 70/30 attention split principle (UX11)

### Project Structure Notes

**Files to Modify**:

- `/Users/siphoyawe/Desktop/Projects/Minstrel/src/components/viz/visualization-canvas.tsx` — add replay visual indicators, border class toggle
- `/Users/siphoyawe/Desktop/Projects/Minstrel/src/styles/globals.css` — add replay mode border class
- `/Users/siphoyawe/Desktop/Projects/Minstrel/src/components/viz/piano-roll-renderer.ts` — may need to draw "REPLAY" label and playback-head here

**Files to Create**:

- `/Users/siphoyawe/Desktop/Projects/Minstrel/src/components/viz/__tests__/replay-visual-indicators.test.ts` — visual indicator tests

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
