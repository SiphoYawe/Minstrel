# Story 25.4: Streamline Drill Creation Flow

Status: ready-for-dev

## Story

As a musician,
I want to start drills quickly,
So that friction doesn't discourage me from practicing drills.

## Acceptance Criteria

1. Given user wants to start drill, When they click "Generate Drill", Then drill generates AND auto-starts preview in one step
2. Given preview playing, When user ready, Then single "Start" button begins attempt phase
3. Given total flow measured, Then maximum 2 explicit user clicks from intent to attempt

## Tasks / Subtasks

1. Combine generate and preview into single action
2. Merge preview + start into single-step flow
3. Reduce total clicks from 4+ to 2
4. Add unit tests

## Dev Notes

**Findings Covered**: Drill creation clicks (HIGH)
**Files**: `src/components/drill/drill-preview.tsx`, `src/components/drill/drill-controller.tsx`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
