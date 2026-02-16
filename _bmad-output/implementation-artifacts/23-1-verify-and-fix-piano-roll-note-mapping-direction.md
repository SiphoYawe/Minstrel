# Story 23.1: Verify and Fix Piano Roll Note Mapping Direction

Status: done

## Story

As a musician,
I want low notes at the bottom and high notes at the top of the piano roll,
So that the visualization matches standard musical convention.

## Acceptance Criteria

1. Given the piano roll canvas, When notes render, Then low notes (C2, MIDI 36) appear at bottom and high notes (C6, MIDI 84) at top
2. Given ascending scale (C3->C4->C5), When notes appear, Then they visually move upward
3. Given mapping is changed, When existing replay sessions play back, Then notes render correctly with new mapping

## Tasks / Subtasks

1. Audit noteNumberToY() function for mapping direction
   - Trace the current Y-coordinate calculation
   - Determine if mapping is inverted (low=top, high=bottom)
2. Fix mapping if inverted (standard: low=bottom, high=top)
   - Reverse the Y-axis mapping so higher MIDI numbers map to lower Y values (top of canvas)
   - Ensure full MIDI range (21-108) maps correctly across canvas height
3. Verify replay sessions render correctly
   - Load existing replay data and confirm notes appear in correct positions
   - Test with known ascending/descending scale patterns
4. Add unit tests

## Dev Notes

**Findings Covered**: VIZ-C1
**Files**: `src/components/canvas/` (note rendering)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes List

- Verified noteNumberToY() mapping is CORRECT: `1 - noteNumber / 127` maps MIDI 0 → bottom, MIDI 127 → top
- Added 3 new tests covering specific AC scenarios (C2 below C6, ascending scale, multiple canvas heights)
- All 21 canvas-utils tests pass
- Replay sessions use same noteNumberToY() function — no separate fix needed

### File List

- src/components/viz/canvas-utils.test.ts (added 3 tests)
