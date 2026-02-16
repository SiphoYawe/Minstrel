# Story 25.6: Fix Warm-Up Prompt Timing and Add Drill Pause/Resume

Status: ready-for-dev

## Story

As a musician,
I want reliable warm-up prompts and the ability to pause drills,
So that warm-ups appear when expected and I can handle interruptions during practice.

## Acceptance Criteria

1. Given warm-up prompt should appear, When conditions met, Then waits for MIDI connection + mode render (event-driven, not setTimeout)
2. Given drill in progress, When user presses Escape or clicks Pause, Then drill timer pauses with "Paused" overlay
3. Given drill paused, When user clicks Resume, Then timer resumes from where it left off

## Tasks / Subtasks

1. Replace 1500ms setTimeout with event-driven warm-up trigger
2. Add pause/resume state to drill controller
3. Add pause overlay UI
4. Add keyboard (Escape) handler for pause
5. Add unit tests

## Dev Notes

**Findings Covered**: DRILL-C3, drill pause/resume (HIGH)
**Files**: `src/components/warm-up-prompt.tsx`, `src/components/drill/drill-controller.tsx`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
