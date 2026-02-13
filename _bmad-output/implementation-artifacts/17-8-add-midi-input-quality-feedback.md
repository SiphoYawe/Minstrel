# Story 17.8: Add MIDI Input Quality Feedback

Status: done

## Story

As a musician,
I want subtle visual feedback on the canvas about my timing quality as I play,
So that I get ambient awareness of my performance without being distracted from my instrument.

## Acceptance Criteria

1. Given the user plays a note with good timing (within +/-50ms of detected beat), When the timing grid renderer processes the note, Then a subtle green pulse briefly appears (200ms fade-in, 400ms fade-out)
2. Given the user plays a note late (>50ms after the beat), When the timing grid renderer processes the note, Then a subtle amber pulse briefly appears
3. Given the user plays a note early (>50ms before the beat), When the timing grid renderer processes the note, Then a subtle amber pulse briefly appears
4. Given the user has been playing consistently well (>85% timing accuracy over last 30 seconds), When the "flow state" is detected, Then a subtle ambient glow effect appears around canvas edges
5. Given visual timing feedback is displayed, When the pulses render, Then they are subtle background effects (10-15% opacity) that do not distract
6. Given the user has prefers-reduced-motion enabled, When timing feedback would render, Then pulses are replaced with static color shifts (no animation)

## Tasks / Subtasks

1. Add green pulse for on-time notes in timing-grid-renderer.ts (AC: 1)
2. Add amber pulse for late notes (AC: 2)
3. Add amber pulse for early notes (AC: 3)
4. Implement flow state detection with 30-second rolling window (AC: 4)
5. Add ambient glow effect for flow state (AC: 4)
6. Keep all pulses at 10-15% opacity (AC: 5)
7. Add prefers-reduced-motion fallback (AC: 6)
8. Performance test to maintain 60fps target
9. Add tests for timing feedback rendering

## Dev Notes

**Architecture Layer**: Presentation Layer (Canvas rendering) + Domain Layer (timing analysis)

**Technical Details**:

- Primary file: src/components/viz/timing-grid-renderer.ts
- Green pulse: fillStyle with rgba(success-green, 0.12), animated via globalAlpha interpolation
- Flow state detection: track rolling 30-second window of timing deviations; if >85% within threshold, set isFlowState = true
- Flow glow: render radial gradient at canvas edges with very low opacity (5-8%), pulsing between 5% and 8% over 2-second cycles
- All effects must be computed in render loop without triggering React re-renders (vanilla Zustand subscribe pattern)
- prefers-reduced-motion: check window.matchMedia and skip animations

### Project Structure Notes

**Key files to modify/create**:

- Modify: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/components/viz/timing-grid-renderer.ts`
- Create: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/features/analysis/flow-state-detector.ts`
- Modify: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/stores/midi-store.ts` (track timing history)
- Create: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/lib/animation-utils.ts` (pulse animation helpers)

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]

## Dev Agent Record

### Agent Model Used

claude-opus-4-6

### Debug Log References

- Removed unused ON_BEAT_TOLERANCE_MS import from flow-state-detector.ts

### Completion Notes List

- Created flow state detector with 30-second rolling window and 85% accuracy threshold
- Added timing pulses: green (on-time ±50ms) and amber (early/late) radial gradient pulses
- Pulse animation: 200ms fade-in, 400ms fade-out at 12% max opacity
- Flow glow: 4-edge linear gradient with sinusoidal pulse between 4-8% opacity over 2s cycle
- prefers-reduced-motion: static dots for pulses, constant alpha for glow
- All effects computed in render loop via vanilla Zustand subscribe — no React re-renders
- 34 tests passing across flow-state-detector, timing-grid-renderer

### File List

- Created: src/features/analysis/flow-state-detector.ts
- Created: src/features/analysis/flow-state-detector.test.ts
- Modified: src/components/viz/timing-grid-renderer.ts (added pulse + glow rendering)
- Modified: src/components/viz/timing-grid-renderer.test.ts (added 13 new tests)
- Modified: src/components/viz/visualization-canvas.tsx (wired pulses + flow detection)
