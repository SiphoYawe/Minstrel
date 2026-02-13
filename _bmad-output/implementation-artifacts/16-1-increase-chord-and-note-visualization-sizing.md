# Story 16.1: Increase Chord and Note Visualization Sizing

Status: ready-for-dev

## Story

As a musician,
I want the chord labels, note bars, and harmonic indicators on the canvas to be larger and more noticeable,
So that I can read them at a glance during play without leaning toward the screen.

## Acceptance Criteria

1. Given the piano roll renderer draws note bars on the canvas, When notes are rendered, Then note bar height is increased by approximately 30% from the current size while maintaining proportional spacing
2. Given the harmonic overlay renders chord labels, When chord labels are drawn on the canvas, Then the font size is at least 16px logical (scaled for canvas DPI)
3. Given the harmonic overlay renders the key center label, When the key is displayed, Then the label is larger and more prominent than chord labels (e.g., 20px) with higher contrast
4. Given notes are active (currently being played), When the piano roll renders them, Then a subtle glow or bloom effect is applied to active notes for improved visibility
5. Given notes are rendered on the piano roll, When active notes are displayed, Then note name labels (e.g., "C4", "G#3") appear adjacent to active note bars in 10px JetBrains Mono font
6. Given the harmonic overlay renders Roman numeral indicators, When harmonic function labels are drawn, Then they are sized at least 14px and positioned with clear visual connection to their corresponding chord

## Tasks / Subtasks

1. Increase note bar height by 30% in piano-roll-renderer.ts (AC: 1)
2. Increase chord label font size to 16px+ in harmonic-overlay-renderer.ts (AC: 2)
3. Increase key center label to 20px with higher contrast (AC: 3)
4. Add glow/bloom effect for active notes (AC: 4)
5. Add note name labels adjacent to active note bars (AC: 5)
6. Increase Roman numeral label sizing to 14px+ (AC: 6)
7. Account for canvas DPI scaling in all sizing changes
8. Add visual regression tests

## Dev Notes

**Architecture Layer**: Presentation Layer (Canvas Renderers)

**Technical Details**:

- Primary files: src/components/viz/piano-roll-renderer.ts, src/components/viz/harmonic-overlay-renderer.ts
- All sizing changes must account for canvas DPI scaling (window.devicePixelRatio)
- Glow effect: draw a second rectangle at same position with globalAlpha = 0.15 and 4px padding
- Note name labels: use canvas fillText() positioned to the left or right of the note bar
- Keep existing dark aesthetic (#0F0F0F background, pastel blue accents)

### Project Structure Notes

**Key Files to Modify/Create**:

- `src/components/viz/piano-roll-renderer.ts` - increase note bar height, add glow effect, add note name labels
- `src/components/viz/harmonic-overlay-renderer.ts` - increase chord label, key center label, and Roman numeral sizing
- `src/components/viz/canvas-helpers.ts` (if exists) - DPI scaling utilities

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
