# Story 25.2: Add Difficulty Change Explanations

Status: ready-for-dev

## Story

As a musician,
I want to understand why drills got harder or easier,
So that I trust the system and feel motivated by my progress.

## Acceptance Criteria

1. Given difficulty changed since last session, When drill generated, Then explanation appears: "We noticed [metric]. Adjusting difficulty to keep you in the growth zone."
2. Given drill successCriteria exists, When difficulty engine sets thresholds, Then derived from same source (no independent hardcoded values)
3. Given user views drill details, When checking, Then specific metrics that triggered change are listed

## Tasks / Subtasks

1. Track difficulty changes between sessions
2. Generate human-readable explanation messages
3. Unify successCriteria and difficulty engine thresholds
4. Show change reasons in drill details
5. Add unit tests

## Dev Notes

**Findings Covered**: DRILL-C2, DRILL-C4
**Files**: `src/lib/difficulty-engine.ts`, `src/components/drill/`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
