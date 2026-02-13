# Story 20.6: Clean Up Dead Code, Schema Mismatches, and Missing Context

Status: ready-for-dev

## Story

As a developer maintaining Minstrel,
I want dead code removed, growth mindset violations logged, genre context included in drills, values clamped, and schemas bounded,
So that the codebase is clean and AI interactions are accurate and safe.

## Acceptance Criteria

1. Given `SNAPSHOT_FADE_IN_MS` and `SNAPSHOT_FADE_OUT_MS` constants, When checked, Then they are either imported by code or removed as dead code
2. Given `validateGrowthMindset` returns violations, When detected, Then they are logged to Sentry
3. Given a drill generation request, When `buildApiPayload` runs, Then it includes `sessionContext.genre`
4. Given `timingAccuracy` is passed to the AI, When converted, Then it is clamped: `Math.max(0, Math.min(1, value / 100))`
5. Given the `DrillNoteSchema` array, When validated, Then it has a `.max(64)` constraint

## Tasks / Subtasks

1. Audit and clean up snapshot fade constants (AI-M4)
2. Log growth mindset violations to Sentry (AI-M5)
3. Include genre in drill payload (AI-M6)
4. Add runtime clamping for timingAccuracy (AI-M8)
5. Add max length to drill note schema (AI-M9)
6. Add unit tests

## Dev Notes

**Findings Covered**: AI-M4, AI-M5, AI-M6, AI-M8, AI-M9
**Files**: `src/lib/constants.ts`, `src/features/coaching/response-processor.ts`, `src/features/drills/drill-generator.ts`, `src/lib/ai/schemas.ts`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
