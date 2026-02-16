# Story 25.5: Keep Instructions Visible and Add Real-Time Feedback

Status: ready-for-dev

## Story

As a musician in a drill,
I want to see the instructions while playing and get immediate feedback,
So that I don't have to memorize drills and know if I'm on track.

## Acceptance Criteria

1. Given drill in Attempt phase, When user playing, Then drill instructions remain visible (collapsed but expandable) at top of panel
2. Given user plays note during attempt, When analyzed, Then immediate feedback: green flash for on-target, amber for close, no flash for off-target
3. Given timing deviation occurs, When detected, Then brief indicator shows "Early" or "Late" near timing display

## Tasks / Subtasks

1. Keep instructions component mounted during Attempt phase (collapsed)
2. Add real-time note-by-note feedback visualization
3. Add "Early"/"Late" timing deviation indicator
4. Add unit tests

## Dev Notes

**Findings Covered**: Instructions disappear (HIGH), no real-time feedback (HIGH)
**Files**: `src/components/drill/drill-controller.tsx`, `src/components/drill/drill-tracker.tsx`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
