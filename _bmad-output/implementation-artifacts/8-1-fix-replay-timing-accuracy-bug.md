# Story 8.1: Fix Replay Timing Accuracy Bug

Status: ready-for-dev

## Story

As a musician,
I want my timing accuracy to reflect my actual performance,
so that coaching advice about timing is meaningful.

## Acceptance Criteria

1. Given the timing accuracy calculation runs in `buildSessionContext()`, When `noteOnCount > 0`, Then it calculates accuracy from the actual `timingAccuracy` field in sessionStore (which is already populated by the analysis pipeline at `session-store.ts:230`), not a self-division formula. And the resulting value is a float between 0 and 1 representing real performance accuracy.

2. Given a session with mixed timing accuracy, When the context builder assembles AI context via `buildSessionContext()`, Then the `timingAccuracy` field reflects real performance (e.g., 0.73), not a constant value of 1.0. And the AI coaching system prompt references this value to provide timing-specific advice.

3. Given existing timing data in sessionStore snapshots, When `buildSessionContext()` reads accuracy, Then it sources from `state.timingAccuracy` (the store field populated by the timing analysis pipeline at `session-store.ts:57`). And the value is normalized to a 0-1 range by dividing by 100 (since sessionStore stores it as a percentage 0-100).

## Tasks / Subtasks

- [ ] 1. Fix timing accuracy calculation in buildSessionContext (AC: 1, 3)
  - [ ] 1.1 Open `src/features/coaching/context-builder.ts` line 34
  - [ ] 1.2 The current code at line 34 reads `const timingAccuracy = state.timingAccuracy / 100;` which is actually correct -- it reads from `state.timingAccuracy` and normalizes to 0-1. Verify this is correct by tracing the data flow from `session-store.ts:230` where `timingAccuracy` is set via `data.accuracy`
  - [ ] 1.3 Verify `buildReplayContext` at line 222 also correctly reads from `sessionMeta.timingAccuracy` and normalizes: `const timingAccuracy = sessionMeta.timingAccuracy != null ? sessionMeta.timingAccuracy / 100 : 0;`
  - [ ] 1.4 Confirm the original bug description references line 223 with `noteOnCount / Math.max(1, noteOnCount)` -- if this code has since been fixed, verify the fix is correct. If it persists in another branch or was reverted, reapply the fix

- [ ] 2. Add unit test verifying non-trivial accuracy values (AC: 2)
  - [ ] 2.1 Create `src/features/coaching/context-builder.test.ts` (co-located test)
  - [ ] 2.2 Test `buildSessionContext()` returns `timingAccuracy` matching `state.timingAccuracy / 100` by mocking sessionStore state with `timingAccuracy: 73` and asserting result is `0.73`
  - [ ] 2.3 Test `buildReplayContext()` returns correct `timingAccuracy` when `sessionMeta.timingAccuracy` is provided (e.g., 85 -> 0.85)
  - [ ] 2.4 Test edge cases: `timingAccuracy: 0` returns 0, `timingAccuracy: 100` returns 1.0, `timingAccuracy: null` in replay context returns 0

- [ ] 3. Verify AI coaching references correct timing data (AC: 2)
  - [ ] 3.1 Trace the data flow from `buildSessionContext()` return value through to the AI system prompt in `src/features/coaching/` to confirm the `timingAccuracy` field is included in the prompt sent to the LLM
  - [ ] 3.2 Verify no other code path overrides or replaces the timing accuracy with a constant

## Dev Notes

- **Architecture Layer**: `context-builder.ts` is Layer 3 (Domain Logic) / Layer 2 (Application Logic) -- it reads from Zustand stores and assembles context for AI consumption.
- **Current code at line 34**: `const timingAccuracy = state.timingAccuracy / 100;` -- this reads from the sessionStore's `timingAccuracy` field (stored as 0-100 percentage) and normalizes to 0-1. This appears correct.
- **Original bug (line 223 reference)**: The bug description mentions line 223 with `noteOnCount / Math.max(1, noteOnCount)`. In the current codebase, line 222-223 in `buildReplayContext` reads: `const timingAccuracy = sessionMeta.timingAccuracy != null ? sessionMeta.timingAccuracy / 100 : 0;`. This may have been partially fixed already. The task is to verify the fix is complete and add tests to prevent regression.
- **sessionStore timing accuracy source**: `src/stores/session-store.ts` line 57 declares `timingAccuracy: number` (default: 100 at line 165), and line 230 sets it from `data.accuracy` (from the timing analysis pipeline).
- **Testing**: Vitest + mocking `useSessionStore.getState()` to return controlled state. Mock the store using `vi.mock('@/stores/session-store')`.

### Project Structure Notes

- `src/features/coaching/context-builder.ts` -- fix/verify timing accuracy calculation (lines 34, 222)
- `src/features/coaching/context-builder.test.ts` -- create co-located test file
- `src/stores/session-store.ts` -- reference for `timingAccuracy` field (lines 57, 165, 230)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md] -- Layer 3 domain logic patterns, Zustand store access via getState()
- [Source: _bmad-output/planning-artifacts/prd.md] -- FR8-13: Real-time analysis features including timing accuracy
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2] -- Timing accuracy and tempo analysis story

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
