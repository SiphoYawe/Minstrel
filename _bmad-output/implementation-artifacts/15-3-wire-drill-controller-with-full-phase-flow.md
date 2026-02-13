# Story 15.3: Wire Drill Controller with Full Phase Flow

Status: ready-for-dev

## Story

As a musician,
I want the drill to guide me through the complete Demonstrate, Listen, Attempt, Analyze flow,
So that I get structured practice with clear feedback at each stage.

## Acceptance Criteria

1. Given a drill is loaded into the DrillController, When the user clicks "Start Drill", Then the Demonstrate phase begins with note playback and visual highlighting
2. Given the Demonstrate phase completes, When the phase transitions to Listen, Then the UI shows "Your turn — listen first" and the drill notes play again at reduced velocity
3. Given the Listen phase completes, When the phase transitions to Attempt, Then the UI shows "Now you try" and the system listens for MIDI input comparing against expected notes
4. Given the user completes their attempt, When the phase transitions to Analyze, Then the UI shows accuracy results: notes hit/missed, timing accuracy, velocity accuracy, and overall drill score
5. Given the Analyze phase displays results, When the user views the results, Then options are available: "Try Again", "New Drill", and "Done"
6. Given the drill is displayed, When rendered in the UI, Then it appears in a dedicated drill panel, NOT in the AI chat panel

## Tasks / Subtasks

1. Wire Demonstrate phase to drill-player.ts playback (AC: 1)
2. Implement Listen phase with reduced velocity playback (AC: 2)
3. Implement Attempt phase with MIDI input comparison (AC: 3)
4. Implement Analyze phase with accuracy results (AC: 4)
5. Add "Try Again", "New Drill", "Done" action buttons (AC: 5)
6. Ensure drill renders in dedicated panel, not chat (AC: 6)
7. Add attempt comparison algorithm with timing tolerance
8. Add tests for full phase flow

## Dev Notes

**Architecture Layer**: Application + Domain

- Implement full drill phase state machine
- Add real-time note comparison algorithm for Attempt phase
- Compute accuracy metrics for Analyze phase

### Project Structure Notes

**Primary files to modify/create**:

- `src/components/drill-controller.tsx`
- `src/features/drills/drill-player.ts`
- `src/features/drills/drill-analyzer.ts` (NEW - for attempt analysis)
- `src/features/drills/types.ts` (drill phase types)

**Technical implementation details**:

- The DrillController component likely already has phase state management — verify and wire up actual drill-player.ts playback calls
- Attempt analysis: compare user's MIDI input from midiStore against expected notes within timing tolerance (+/-100ms)
- Phase transitions should use the UX13 "Demonstrate, Listen, Attempt, Analyze" choreography from the UX spec
- Listen phase: play notes at 0.7x velocity of original
- Attempt phase: subscribe to midiStore.notes and compare in real-time as notes arrive
- Timing tolerance: ±100ms window for "hit", ±50ms for "perfect"
- Velocity accuracy: ±20 velocity units for "close", ±10 for "perfect"
- Overall drill score: weighted average (notes hit: 50%, timing: 30%, velocity: 20%)
- Phase state machine: `idle → demonstrate → listen → attempt → analyze → idle`
- Auto-advance phases after completion (except analyze, which requires user action)

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md - UX13 Drill Controller choreography]
- [Source: src/components/drill-controller.tsx - Existing phase structure]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
