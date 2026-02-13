# Story 21.2: Fix DST Edge Case and Accumulator Reset

Status: ready-for-dev

## Story

As a musician tracking streaks,
I want DST transition days handled correctly and accumulators fully reset,
So that my streak doesn't break on clock changes and analysis starts fresh each session.

## Acceptance Criteria

1. Given streak calculation runs on a DST transition day, When `isSameCalendarDay` compares dates, Then it uses `Intl.DateTimeFormat` for timezone-aware comparison
2. Given the accumulator is reset via `resetAccumulator()`, When all properties are cleared, Then `startTimestamp` is also reset

## Tasks / Subtasks

1. Fix DST date comparison (STATE-L1)
   - Replace manual offset arithmetic with `Intl.DateTimeFormat`
   - Format both dates in user's timezone before comparing
2. Fix accumulator reset (STATE-L2)
   - Add `accumulator.startTimestamp = null` to `resetAccumulator()`
3. Add unit tests
   - DST transition day (2026-03-08) → streak calculation correct
   - resetAccumulator → startTimestamp is null

## Dev Notes

**Findings Covered**: STATE-L1, STATE-L2
**Files**: `src/features/engagement/streak-tracker.ts`, `src/features/analysis/use-analysis-pipeline.ts`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
