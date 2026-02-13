# Story 17.1: Surface Warm-Up Drills Section

Status: ready-for-dev

## Story

As a musician starting a practice session,
I want to easily find and start warm-up exercises,
So that I can prepare properly before diving into focused practice.

## Acceptance Criteria

1. Given the WarmUpPrompt component's current visibility conditions are strict, When the conditions are relaxed, Then the warm-up prompt shows for any authenticated user with at least 1 previous session (remove skillProfile and totalNotesPlayed requirements)
2. Given the user navigates to the Dashboard, When the Dashboard renders, Then a dedicated "Warm-Up" section is visible with available warm-up exercises
3. Given the warm-up section displays exercises, When the user views an exercise, Then it shows: name, target area, estimated duration, and visual preview
4. Given the user completes a warm-up exercise, When the warm-up finishes, Then the completion is tracked and shows "Completed today" with a checkmark
5. Given the navigation sidebar exists (Epic 13.1), When the user wants a quick warm-up, Then a "Quick Warm-Up" shortcut is accessible from the sidebar or session page header
6. Given the user has no previous sessions, When the warm-up section renders, Then it shows a generic beginner warm-up option

## Tasks / Subtasks

1. Relax WarmUpPrompt visibility conditions (AC: 1)
2. Create warm-up section card for Dashboard (AC: 2)
3. Display exercise details with visual preview (AC: 3)
4. Add completion tracking with daily status (AC: 4)
5. Add Quick Warm-Up shortcut to sidebar/header (AC: 5)
6. Implement beginner warm-up fallback (AC: 6)
7. Add tests for warm-up visibility and tracking

## Dev Notes

**Architecture Layer**: Presentation Layer (UI components) + Application Layer (warm-up flow logic)

**Technical Details**:

- Primary files: src/components/warm-up-prompt.tsx (lines 42-52 — strict visibility conditions), src/features/session/warm-up-flow.ts
- Relax conditions: remove skillProfile and totalNotesPlayed > 0 checks
- Warm-up section in Dashboard: add as a card component in src/app/(auth)/dashboard/page.tsx
- Completion tracking: add warmUpCompleted timestamp to sessionStore or IndexedDB

### Project Structure Notes

**Key files to modify/create**:

- Modify: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/components/warm-up-prompt.tsx`
- Modify: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/features/session/warm-up-flow.ts`
- Modify: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/app/(auth)/dashboard/page.tsx`
- Create: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/components/warm-up-section.tsx`
- Modify: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/stores/session-store.ts` (add warmUpCompleted tracking)

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
