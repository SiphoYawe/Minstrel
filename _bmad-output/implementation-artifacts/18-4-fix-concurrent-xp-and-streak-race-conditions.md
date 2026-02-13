# Story 18.4: Fix Concurrent XP and Streak Race Conditions

Status: done

## Story

As a musician earning XP and building streaks,
I want concurrent updates to be handled atomically,
So that no XP or streak increments are lost from simultaneous operations.

## Acceptance Criteria

1. Given concurrent XP awards from session end AND achievement unlock, When both run simultaneously, Then the final lifetimeXp reflects both increments (no lost update)
2. Given the `awardSessionXp` function, When it calls Supabase RPC, Then local state is set from the RPC return value (not from optimistic calculation)
3. Given concurrent streak updates from two browser tabs, When both tabs end sessions, Then the streak increments correctly by the total count (atomic server-side increment)
4. Given the streak `recordSession` function, When it updates, Then it uses Supabase RPC for atomic increment and reads the return value for local state

## Tasks / Subtasks

1. Fix XP award to use server return value
   - Change pattern from optimistic set + RPC to RPC-first + set from return
   - Ensure `awardSessionXp` uses `const { data } = await supabase.rpc('award_xp', { amount })`
   - Set local state: `setXp({ lifetimeXp: data.new_lifetime_xp })`
2. Create atomic streak RPC
   - Create RPC `increment_streak(user_id UUID) RETURNS INTEGER` for atomic increment
   - Update streak hook to use RPC return value
   - Replace `streakRef.current` with server-authoritative value
3. Add unit tests
   - Concurrent XP awards (session +50, achievement +25) → final XP = initial + 75
   - Award while RPC pending → final XP from server return value
   - Two tabs record sessions simultaneously → streak increments by 2
   - Streak RPC returns new value → local state matches server

## Dev Notes

**Architecture Layer**: Domain Layer (engagement)
**Findings Covered**: STATE-C2, STATE-C3
**Files**: `src/features/engagement/use-xp.ts` (lines 49-70), `src/features/engagement/use-streak.ts` (lines 46-55)
**Key Pattern Change**: Optimistic → Server-authoritative for concurrent-safe state

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- All 35 engagement tests pass (xp-service: 8, streak-tracker: 27)
- TypeScript compiles clean

### Completion Notes List

- Updated increment_xp RPC to return new_lifetime_xp (was VOID)
- Created increment_streak RPC with atomic INSERT...ON CONFLICT
- awardXp() now returns { newLifetimeXp } from server
- use-xp hook sets lifetimeXp from server return (optimistic → authoritative)
- updateStreak() now uses RPC and returns server values
- use-streak hook sets streak from server return (optimistic → authoritative)

### File List

- supabase/migrations/20260213000012_fix_xp_streak_race_conditions.sql (new)
- src/features/engagement/xp-service.ts (modified)
- src/features/engagement/use-xp.ts (modified)
- src/features/engagement/streak-service.ts (modified)
- src/features/engagement/use-streak.ts (modified)
- src/features/engagement/xp-service.test.ts (modified)
