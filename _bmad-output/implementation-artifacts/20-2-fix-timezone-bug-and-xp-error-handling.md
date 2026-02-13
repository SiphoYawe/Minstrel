# Story 20.2: Fix Timezone Bug and XP Fire-and-Forget Error Handling

Status: ready-for-dev

## Story

As a traveling musician,
I want my streak to be calculated from my home timezone and XP failures to be visible,
So that traveling doesn't break my streak and I know when XP awards fail.

## Acceptance Criteria

1. Given the streak calculation, When timezone offset is needed, Then the user's primary timezone is persisted and used consistently
2. Given a user travels across timezones, When streak is checked, Then the persisted timezone is used to avoid false streak breaks
3. Given `awardXp()` encounters a database error, When the function returns, Then it returns an error status (not void) that the caller handles
4. Given XP award fails, When local state is set, Then it syncs from the database return value

## Tasks / Subtasks

1. Persist user timezone (STATE-M1)
   - Store `Intl.DateTimeFormat().resolvedOptions().timeZone` on signup
   - Use persisted timezone in streak calculations
2. Return error status from awardXp (STATE-M2)
   - Change return type to `Promise<{ success: boolean, newTotal?: number }>`
   - Caller handles failure case
3. Add unit tests

## Dev Notes

**Findings Covered**: STATE-M1, STATE-M2
**Files**: `src/features/engagement/use-streak.ts`, `src/features/engagement/xp-service.ts`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
