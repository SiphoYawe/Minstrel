# Story 19.6: Fix Drill and Replay Context Issues

Status: ready-for-dev

## Story

As a musician using drills and replay,
I want adaptive replay context windows, drill generation timeouts, and genre visibility,
So that replay analysis matches tempo, drills don't hang, and unknown genres are tracked.

## Acceptance Criteria

1. Given replay context is built, When the window size is calculated, Then it adapts based on detected tempo to always capture approximately 16 beats
2. Given a drill generation request, When the AI provider takes longer than 20 seconds, Then the request is aborted via AbortController and a timeout error is returned
3. Given an unknown genre is detected, When the genre terminology lookup falls back to GENERIC, Then the unknown genre name is logged to Sentry

## Tasks / Subtasks

1. Make replay context window adaptive (AI-H4)
   - Formula: `beatsToCapture * (60000 / tempo)` where beatsToCapture = 16
   - 40 BPM → 24000ms window; 180 BPM → 5328ms window
2. Add drill generation timeout (AI-H6)
   - Create AbortController with 20-second timeout
   - Pass `abortSignal: controller.signal` to `streamObject`
   - Return timeout error to user on abort
3. Log unknown genres (AI-H7)
   - Add Sentry.captureMessage on GENERIC fallback with genre name
4. Add unit tests

## Dev Notes

**Architecture Layer**: Application Layer (coaching, drills)
**Findings Covered**: AI-H4, AI-H6, AI-H7
**Files**: `src/features/coaching/context-builder.ts` (lines 131, 172), `src/app/api/ai/drill/route.ts` (lines 68-73), `src/features/coaching/genre-terminology.ts` (lines 447-450)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
