# Story 25.3: Add Attempt Phase Countdown Timer and Done Button

Status: ready-for-dev

## Story

As a musician,
I want to see how much time I have left and be able to finish early,
So that I'm not surprised by auto-completion and can control my practice flow.

## Acceptance Criteria

1. Given attempt phase starts, When timer running, Then visible countdown shows remaining seconds
2. Given countdown reaches 5 seconds, When warning fires, Then amber flash: "5 seconds remaining"
3. Given user finishes early, When they click "Done" or press Enter, Then attempt ends immediately and analysis begins
4. Given user hasn't started playing, When 15 seconds elapses, Then shows "No notes detected. Try again?" with retry button

## Tasks / Subtasks

1. Add countdown timer UI to drill attempt phase
2. Add 5-second warning animation
3. Add "Done" button and Enter key handler
4. Add "no notes" detection with retry option
5. Add unit tests

## Dev Notes

**Findings Covered**: DRILL-C5
**Files**: `src/components/drill/drill-controller.tsx`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
