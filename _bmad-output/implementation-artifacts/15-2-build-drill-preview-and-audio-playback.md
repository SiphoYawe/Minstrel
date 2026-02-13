# Story 15.2: Build Drill Preview and Audio Playback

Status: ready-for-dev

## Story

As a musician,
I want to hear what a generated drill sounds like before I attempt it,
So that I know the target sound and can practice accurately.

## Acceptance Criteria

1. Given a drill has been generated with note sequences, When the user clicks the "Preview" button on the drill card, Then the drill notes are played through the connected MIDI output device at the drill's target tempo
2. Given no MIDI output device is connected, When the user clicks "Preview", Then the drill notes are played using Web Audio API synthesis (oscillator-based fallback)
3. Given the drill's Demonstrate phase begins, When the demonstration plays, Then the notes are played with emphasized velocity and the UI shows which note is currently being demonstrated with visual highlighting
4. Given a drill is being previewed or demonstrated, When the user clicks "Stop" or the preview completes, Then all sounding notes are immediately stopped
5. Given the drill demonstration has completed, When the user wants to hear it again, Then a "Repeat Demonstration" button is available
6. Given the drill preview plays via Web Audio, When compared to MIDI output playback, Then the timing and rhythm are equivalent

## Tasks / Subtasks

1. Add previewDrill() method to drill-player.ts (AC: 1)
2. Implement Web Audio API fallback for preview (AC: 2)
3. Add visual note highlighting during demonstration (AC: 3)
4. Add stop with immediate note-off (AC: 4)
5. Add "Repeat Demonstration" button (AC: 5)
6. Ensure timing parity between MIDI output and Web Audio (AC: 6)
7. Add tests for drill preview playback

## Dev Notes

**Architecture Layer**: Infrastructure + Presentation

- Extend existing drill-player.ts audio capabilities
- Add real-time visual feedback during playback
- Ensure timing consistency across MIDI and Web Audio paths

### Project Structure Notes

**Primary files to modify/create**:

- `src/features/drills/drill-player.ts` (has existing oscillator synthesis and MIDI output code)
- `src/components/drill-controller.tsx`
- `src/components/drill-note-visualizer.tsx` (NEW - for visual highlighting)

**Technical implementation details**:

- drill-player.ts already has playNote() with both MIDI output and oscillator paths
- Add previewDrill(notes: DrillNote[]) method to drill-player.ts
- Visual highlighting during demonstration: pass current-note index to DrillController
- All-notes-off on stop: send MIDI CC 123
- For Web Audio timing: use AudioContext.currentTime + scheduled note timing to match MIDI precision
- Emphasized velocity in Demonstrate phase: multiply note velocity by 1.2 (capped at 127)
- Current note highlighting: add `isActive` prop to note visualization component

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md - UX13 Drill choreography]
- [Source: src/features/drills/drill-player.ts - Existing playback code]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
