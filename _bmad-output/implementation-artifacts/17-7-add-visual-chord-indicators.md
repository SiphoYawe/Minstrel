# Story 17.7: Add Visual Chord Indicators

Status: ready-for-dev

## Story

As a musician,
I want chords displayed as visual shapes (not just text labels) with color-coded harmonic function,
So that I can quickly understand chord quality and harmonic movement at a glance.

## Acceptance Criteria

1. Given a chord is detected during live play, When the chord indicator renders on the canvas, Then a colored block represents the chord quality: solid fill for major, outlined for minor, fill with dot/accent for 7th chords, dashed outline for diminished
2. Given chord indicators are rendered, When displayed on the canvas, Then they are color-coded by harmonic function: tonic=accent-blue, dominant=accent-warm, subdominant=third distinct color
3. Given chords have been detected in sequence, When the chord progression strip renders, Then the last 8 detected chords are shown as a horizontal strip of colored blocks with text labels underneath
4. Given the chord progression strip is rendered, When a new chord is detected, Then the strip scrolls/shifts left smoothly to accommodate the new chord block
5. Given the chord indicator blocks are rendered, When the user views them, Then they are at least 32px wide and 24px tall with legible labels
6. Given the chord visualization enhancement is active, When rendering performance is measured, Then the additional rendering does not drop frame rate below 55fps

## Tasks / Subtasks

1. Add chord quality visual blocks to harmonic-overlay-renderer.ts (AC: 1)
2. Add color-coding by harmonic function (AC: 2)
3. Create chord progression strip with last 8 chords (AC: 3)
4. Add smooth scroll/shift animation for new chords (AC: 4)
5. Enforce minimum 32px x 24px block sizing (AC: 5)
6. Performance test to maintain 55+ fps (AC: 6)
7. Add chord quality mapping constants
8. Add tests for chord indicator rendering

## Dev Notes

**Architecture Layer**: Presentation Layer (Canvas rendering) + Domain Layer (chord analysis)

**Technical Details**:

- Primary file: src/components/viz/harmonic-overlay-renderer.ts
- Chord quality → visual style mapping: define in src/lib/constants.ts or directly in the renderer
- Harmonic function detection: use relationship between chord root and detected key
- Chord progression strip: can be rendered as DOM element below canvas or as dedicated canvas region
- Keep blocks simple — no complex shapes that could impact render performance

### Project Structure Notes

**Key files to modify/create**:

- Modify: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/components/viz/harmonic-overlay-renderer.ts`
- Create: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/components/chord-progression-strip.tsx`
- Modify: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/lib/constants.ts` (chord visual mappings)
- Modify: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/features/analysis/chord-detector.ts`

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
