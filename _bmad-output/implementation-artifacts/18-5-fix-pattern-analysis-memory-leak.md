# Story 18.5: Fix Pattern Analysis Memory Leak

Status: done

## Story

As a developer maintaining Minstrel,
I want the pattern analysis interval to be properly managed with lifecycle checks,
So that no memory leaks or stale state access occurs after component unmount.

## Acceptance Criteria

1. Given the analysis pipeline component mounts, When `patternInterval` is created, Then the interval ID is stored in a React ref
2. Given the component unmounts, When cleanup runs, Then the pattern interval is cleared BEFORE any async cleanup operations begin
3. Given the component has unmounted, When a previously scheduled interval callback fires, Then it checks a mounted flag and returns early without accessing Zustand state
4. Given rapid mount/unmount cycles, When the component remounts, Then no duplicate intervals are created

## Tasks / Subtasks

1. Store interval in ref
   - Add `const intervalRef = useRef<NodeJS.Timeout | null>(null)`
   - Store interval ID: `intervalRef.current = setInterval(...)`
2. Add mounted flag
   - Add `const mountedRef = useRef(true)`
   - Set `mountedRef.current = false` at start of cleanup
   - Check `if (!mountedRef.current) return` in interval callback
3. Fix cleanup order
   - First: `mountedRef.current = false`
   - Second: `if (intervalRef.current) clearInterval(intervalRef.current)`
   - Third: Async cleanup operations
4. Add unit tests
   - Mount → interval created → ref stores ID
   - Unmount → interval cleared before async cleanup
   - Interval fires after unmount → mounted check prevents execution
   - Remount while old interval exists → old interval cleared first

## Dev Notes

**Architecture Layer**: Application Layer (analysis)
**Findings Covered**: STATE-C5
**File**: `src/features/analysis/use-analysis-pipeline.ts` (lines 105, 349)
**Issue**: `patternInterval` created unconditionally but only cleared in cleanup. If component unmounts during async operations, interval fires after component is destroyed.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- All 3 lifecycle tests pass
- TypeScript compiles clean

### Completion Notes List

- Stored patternInterval in patternIntervalRef (was bare const)
- Added mountedRef flag checked at top of runPatternAnalysis
- Cleanup order: mountedRef=false first, then clearInterval, then async ops
- Rapid mount/unmount clears stale interval before creating new one
- No duplicate intervals created on remount

### File List

- src/features/analysis/use-analysis-pipeline.ts (modified)
- src/features/analysis/use-analysis-pipeline.test.ts (new)
