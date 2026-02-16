# Story 23.3: Fix Harmonic Overlay Markers and Chord Quality Distinction

Status: done

## Story

As a musician,
I want to distinguish chord tones from passing tones and see chord quality,
So that I understand harmonic information without relying on color alone.

## Acceptance Criteria

1. Given harmonic markers render, When displayed, Then chord-tones are 8px+ circles and passing-tones are 8px+ diamonds (shape distinction)
2. Given chord quality displayed, When rendered, Then includes text label ("Maj", "min", "Dom7") in addition to color
3. Given colorblind user views canvas, When chord quality shown, Then distinction clear without relying on color alone

## Tasks / Subtasks

1. Increase marker size from 4px to 8px+
   - Locate harmonic marker rendering code
   - Update size constants
2. Add shape distinction (circles vs diamonds)
   - Render chord-tones as circles
   - Render passing-tones as diamonds
   - Ensure shapes are clearly distinguishable at playing distance
3. Add text labels for chord quality
   - Render "Maj", "min", "Dom7", etc. labels alongside chord markers
   - Position labels to avoid overlap with other canvas elements
4. Test with color blindness simulator
   - Verify chord-tone vs passing-tone distinction without color
   - Verify chord quality distinction without color
5. Add unit tests

## Dev Notes

**Findings Covered**: VIZ-C4, VIZ-C7
**Files**: `src/components/canvas/` (harmonic overlay, chord rendering)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes List

- Increased TONE_MARKER_SIZE from 5 to 10 (AC: 8px+)
- Chord tones now render as circles (ctx.arc), passing tones as diamonds (ctx.moveTo/lineTo path)
- Added chord quality text labels ("Maj", "min", "Dom7", etc.) rendered at canvas center
- Passing tone alpha increased from 0.3 to 0.45 for better visibility
- Added drawDiamond helper and qualityLabel mapper
- All 11 harmonic overlay tests pass (4 new/updated)

### File List

- src/components/viz/harmonic-overlay-renderer.ts (shape distinction, quality labels)
- src/components/viz/harmonic-overlay-renderer.test.ts (updated tests)
