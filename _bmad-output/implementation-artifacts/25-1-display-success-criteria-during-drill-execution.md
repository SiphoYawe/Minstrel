# Story 25.1: Display Success Criteria During Drill Execution

Status: ready-for-dev

## Story

As a musician practicing drills,
I want to see what I'm aiming for,
So that I understand what "passing" means and can track my progress during the attempt.

## Acceptance Criteria

1. Given drill in progress, When attempt phase active, Then success criteria visible: "Target: 85% accuracy, +/-50ms timing, 90 BPM"
2. Given user completes rep, When results show, Then each criterion shown as met/not-yet-met with actual vs target value
3. Given criteria displayed, When terms potentially confusing, Then tooltips explain each metric in plain language

## Tasks / Subtasks

1. Extract successCriteria from drill data and render in drill-controller
2. Show live comparison after each rep in drill-tracker
3. Add tooltip explanations for each metric
4. Add unit tests

## Dev Notes

**Findings Covered**: DRILL-C1
**Files**: `src/components/drill/drill-controller.tsx`, `src/components/drill/drill-tracker.tsx`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
