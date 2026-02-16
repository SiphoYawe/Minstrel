# Story 23.6: Fix Snapshot and Label Text Readability

Status: done

## Story

As a musician at playing distance,
I want to read canvas text,
So that insights, labels, and chord names are legible from my instrument position.

## Acceptance Criteria

1. Given snapshot insights render on canvas, When displayed, Then text is 16px minimum
2. Given note labels render, When displayed, Then 12px minimum
3. Given chord labels render near high notes at y=24, When collision would occur, Then label repositions
4. Given key display overlaps active notes, When rendered, Then notes render above key display (z-order)

## Tasks / Subtasks

1. Increase snapshot text from 12px to 16px+
   - Locate snapshot insight text rendering
   - Update font size constant
2. Increase note labels from 10px to 12px+
   - Locate note label text rendering
   - Update font size constant
3. Add collision detection for chord label at y=24
   - Detect when chord label would overlap with high notes near y=24
   - Reposition label to avoid collision (shift down or to the side)
4. Fix z-ordering of key display vs notes
   - Ensure notes render after (on top of) key display
   - Verify active notes are always visible above background elements
5. Add unit tests

## Dev Notes

**Findings Covered**: VIZ-C6
**Files**: `src/components/canvas/` (text rendering)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes List

- Note label font increased from 10px → 12px in piano-roll-renderer.ts
- Snapshot insight text increased from 13px → 16px with line height 18 → 22 in snapshot-renderer.ts
- Chord label collision detection: repositions label below high notes when within 44px of top
- Z-order fix: moved renderHarmonicOverlay before renderNotes in frame loop so notes render on top of key display
- Extracted clearCanvas from renderNotes to frame function for correct z-order layering
- All 93 viz tests pass (10 new/updated tests across 3 test files)

### File List

- src/components/viz/piano-roll-renderer.ts (collision detection, remove clearCanvas, font size)
- src/components/viz/snapshot-renderer.ts (insight text 13px → 16px)
- src/components/viz/visualization-canvas.tsx (render order fix, explicit clearCanvas)
- src/components/viz/piano-roll-renderer.test.ts (updated counts, added collision test)
- src/components/viz/snapshot-renderer.test.ts (added 16px font verification test)
