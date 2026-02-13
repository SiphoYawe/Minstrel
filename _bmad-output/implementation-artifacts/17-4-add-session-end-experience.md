# Story 17.4: Add Session End Experience

Status: ready-for-dev

## Story

As a musician finishing a practice session,
I want to see a summary of what I just practiced with my stats and a motivational message,
So that I feel a sense of accomplishment and know what to work on next.

## Acceptance Criteria

1. Given the user has been playing and stops for 60 seconds, When the silence threshold is reached, Then a session summary card automatically appears with a smooth slide-up animation
2. Given the session summary card is displayed, When the user views it, Then it shows: session duration, total notes played, detected key, average tempo, timing accuracy percentage, and improvement vs last session
3. Given the session summary card is displayed, When the user views the bottom section, Then a growth-mindset motivational message is displayed
4. Given the session summary card is displayed, When the user views the action buttons, Then three options are available: "View Replay", "Continue Playing", "End Session"
5. Given the user clicks "Continue Playing", When the summary is dismissed, Then the session continues and the 60-second silence timer resets
6. Given the user clicks "End Session", When the session ends, Then the session is saved automatically and the user is navigated to the Dashboard

## Tasks / Subtasks

1. Wire showSummary state to 60-second silence timer (AC: 1)
2. Add slide-up animation for summary card (AC: 1)
3. Populate summary with session stats (AC: 2)
4. Add improvement comparison vs last session (AC: 2)
5. Add randomized growth-mindset messages (AC: 3)
6. Implement "View Replay", "Continue Playing", "End Session" buttons (AC: 4)
7. Reset silence timer on "Continue Playing" (AC: 5)
8. Save session and navigate on "End Session" (AC: 6)
9. Add tests for session end flow

## Dev Notes

**Architecture Layer**: Presentation Layer (UI components) + Application Layer (session lifecycle management)

**Technical Details**:

- Primary file: src/components/session-summary.tsx (already exists but showSummary is initialized to false and never set to true)
- Silence detection logic exists in src/features/analysis/use-analysis-pipeline.ts — add secondary 60s timer
- src/app/(auth)/session/page.tsx has showSummary state — wire it to silence timer
- Session summary stats: compute from sessionStore current session data
- Growth mindset messages: randomize from 10-15 positive messages in src/lib/constants.ts

### Project Structure Notes

**Key files to modify/create**:

- Modify: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/components/session-summary.tsx`
- Modify: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/features/analysis/use-analysis-pipeline.ts`
- Modify: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/app/(auth)/session/page.tsx`
- Modify: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/lib/constants.ts` (add growth-mindset messages)
- Modify: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/stores/session-store.ts` (session save logic)

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
