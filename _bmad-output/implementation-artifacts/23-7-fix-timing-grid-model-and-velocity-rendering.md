# Story 23.7: Fix Timing Grid Model and Velocity Rendering

Status: done

## Story

As a musician,
I want to see beat markers I can play against and see all my notes including soft ones,
So that timing feedback is useful and no playing is invisible.

## Acceptance Criteria

1. Given timing grid visible, When rendered, Then shows predictive beat markers based on current detected tempo
2. Given very soft note (velocity 1-20), When rendered, Then has minimum 0.5 opacity
3. Given session ends, When canvas would go blank, Then fade-out animation over 1 second followed by "Session complete" message

## Tasks / Subtasks

1. Change timing grid from retroactive to predictive model
   - Analyze current retroactive timing grid implementation
   - Implement predictive beat markers based on detected tempo
   - Extrapolate upcoming beats from current tempo detection
2. Set minimum velocity opacity to 0.5
   - Locate velocity-to-opacity mapping function
   - Clamp minimum opacity to 0.5 for velocity values 1-20
   - Ensure very soft notes are always visible
3. Add session-end fade animation and message
   - Implement 1-second fade-out animation on session end
   - Display "Session complete" message after fade completes
   - Ensure message is readable (16px+ font, centered)
4. Add unit tests

## Dev Notes

**Findings Covered**: VIZ-C3
**Files**: `src/components/canvas/` (timing grid, velocity mapping)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes List

- Predictive timing grid: shows 12 past + 4 future beat markers (dashed at lower alpha) based on detected BPM
- Grid lines render even with 0 deviations when BPM is detected (gives user beats to play against)
- Velocity opacity floor: clamped at 0.5 minimum so soft notes (velocity 1-20) are always visible
- Session-end fade: 1-second fade-out animation over dark background, then centered "Session complete" message
- Session-end state resets when a new session starts
- All 95 viz tests pass (6 new/updated tests across 4 test files)

### File List

- src/components/viz/canvas-utils.ts (velocityToAlpha 0.5 minimum clamp)
- src/components/viz/timing-grid-renderer.ts (predictive model with PREDICTIVE_BEATS, dashed future lines)
- src/components/viz/visualization-canvas.tsx (session-end fade animation + "Session complete" message)
- src/components/viz/canvas-utils.test.ts (updated alpha tests, added soft notes test)
- src/components/viz/piano-roll-renderer.test.ts (updated alpha range tests)
- src/components/viz/timing-grid-renderer.test.ts (added setLineDash mock, predictive grid + dashed line tests)
