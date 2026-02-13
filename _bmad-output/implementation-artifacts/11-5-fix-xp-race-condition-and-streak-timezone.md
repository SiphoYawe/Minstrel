# Story 11.5: Fix XP Race Condition and Streak Timezone Handling

Status: ready-for-dev

## Story

As a musician,
I want my XP to be accurately tracked without race conditions and my streak to respect my local timezone,
So that my progress data is reliable.

## Acceptance Criteria

1. Given multiple XP awards happen concurrently (e.g., session end + achievement unlock), When `awardXp()` runs, Then the update uses an atomic database operation (Supabase RPC with `UPDATE ... SET current_value = current_value + $delta`) to prevent lost updates from concurrent read-modify-write cycles. And the retry loop at `src/features/engagement/xp-service.ts:44-80` is replaced with a single atomic call.

2. Given a user in timezone UTC-8, When they practice at 11pm local time (7am UTC next day), Then the streak calculation at `calculateStreakUpdate()` uses their local date to determine this is still the same calendar day. And the streak is NOT broken by the UTC date boundary.

3. Given the streak tracker calculates day boundaries, When it compares dates via `isSameCalendarDay()` at `src/features/engagement/streak-tracker.ts:12-21`, Then it receives the user's timezone offset and uses it for calendar day comparison. And the timezone offset is sourced from `new Date().getTimezoneOffset()` on the client.

4. Given the `useStreak()` hook at `src/features/engagement/use-streak.ts`, When it calls `calculateStreakUpdate()` at line 52, Then it passes `timezoneOffsetMinutes` as the third argument. And the timezone offset is computed as `-new Date().getTimezoneOffset()` (converting from JS's inverted convention to standard UTC offset in minutes).

## Tasks / Subtasks

- [ ] 1. Replace read-modify-write with atomic Supabase operation (AC: 1)
  - [ ] 1.1 Create a Supabase RPC function (database migration) named `increment_xp` that performs: `UPDATE progress_metrics SET current_value = current_value + $delta, best_value = GREATEST(best_value, current_value + $delta), metadata = $metadata, last_qualified_at = $last_qualified_at WHERE user_id = $user_id AND metric_type = 'xp'`
  - [ ] 1.2 The RPC should handle the upsert case: if no row exists, insert one with `current_value = $delta`
  - [ ] 1.3 Create migration file at `supabase/migrations/{timestamp}_add_increment_xp_rpc.sql`
  - [ ] 1.4 In `src/features/engagement/xp-service.ts`, replace the `awardXp()` function (lines 37-81) to call `supabase.rpc('increment_xp', { ... })` instead of the read-modify-write loop
  - [ ] 1.5 Remove the `fetchLifetimeXp()` call from within `awardXp()` — the atomic RPC handles the increment without needing to read first
  - [ ] 1.6 Remove the retry loop (lines 44-80) and `MAX_RETRY_ATTEMPTS` constant (line 11) — the atomic operation eliminates the need for retries

- [ ] 2. Verify timezone handling in streak tracker (AC: 2, 3)
  - [ ] 2.1 Review `src/features/engagement/streak-tracker.ts:12-21` — the `isSameCalendarDay()` function already accepts `timezoneOffsetMinutes` parameter and correctly applies it. Verify the offset math: `offset = timezoneOffsetMinutes * 60_000`, then `new Date(date.getTime() + offset)` shifts to local time before comparing UTC date components.
  - [ ] 2.2 Review `calculateStreakUpdate()` at `src/features/engagement/streak-tracker.ts:23-64` — it already accepts `timezoneOffsetMinutes` as a parameter and passes it to `isSameCalendarDay()` at line 33.
  - [ ] 2.3 Review `getStreakStatus()` at `src/features/engagement/streak-tracker.ts:66-93` — it already accepts `timezoneOffsetMinutes` and passes it to `isSameCalendarDay()` at line 88.

- [ ] 3. Verify timezone offset is passed from useStreak hook (AC: 4)
  - [ ] 3.1 Review `src/features/engagement/use-streak.ts:51-52` — the hook already computes `const timezoneOffsetMinutes = -new Date().getTimezoneOffset()` and passes it to `calculateStreakUpdate()`. Verify this is correct.
  - [ ] 3.2 Review `src/features/engagement/use-streak.ts:32-33` — the hook also passes timezone offset to `getStreakStatus()` when fetching the initial streak. Verify this is correct.
  - [ ] 3.3 If the timezone handling is already correctly wired (steps 2 and 3 verify existing code), document this in the completion notes and focus the story on the XP race condition fix.

- [ ] 4. Add tests (AC: 1, 2, 3)
  - [ ] 4.1 Add test in `src/features/engagement/xp-service.test.ts` (create if needed) verifying `awardXp()` calls the RPC with correct delta
  - [ ] 4.2 Add test verifying concurrent `awardXp()` calls result in correct cumulative XP (mock RPC to simulate atomic behavior)
  - [ ] 4.3 Add timezone edge case tests in `src/features/engagement/streak-tracker.test.ts`:
    - Test UTC-8 user practicing at 11pm local (7am UTC next day) — should be same calendar day locally
    - Test UTC+12 user practicing at 1am local (1pm UTC previous day) — should be a new calendar day locally
    - Test UTC+0 user — UTC and local are identical
    - Test day boundary at exactly midnight local time

## Dev Notes

- **Architecture Layer**: Layer 4 (Infrastructure) for the Supabase RPC and xp-service; Layer 3 (Domain Logic) for streak-tracker.
- **XP Race Condition**: The current `awardXp()` at `src/features/engagement/xp-service.ts:37-81` does:
  1. Read current XP via `fetchLifetimeXp()` (line 46)
  2. Calculate `newTotal = current + breakdown.totalXp` (line 47)
  3. Upsert the new total (lines 49-63)
     This is a classic read-modify-write race: if two calls run concurrently, both read the same `current` value and one update overwrites the other. The retry loop (lines 44-80) only catches `23505` (unique violation) and `40001` (serialization failure) errors, not the case where both upserts succeed but one overwrites the other.
- **Streak Timezone**: Upon code review, `src/features/engagement/use-streak.ts` already passes `timezoneOffsetMinutes` at lines 32 and 52, and `streak-tracker.ts` already uses it in `isSameCalendarDay()` at line 12. The timezone handling appears to be correctly implemented. This task should verify and add edge case tests.
- **Supabase RPC**: The migration file should use `CREATE OR REPLACE FUNCTION increment_xp(...)` with `SECURITY DEFINER` for RLS bypass, or ensure the function runs with the user's permissions.
- The `fetchLifetimeXp()` function at line 17-28 is still useful for displaying XP elsewhere — do NOT remove it, only remove its call from within `awardXp()`.

### Project Structure Notes

- `src/features/engagement/xp-service.ts` — replace `awardXp()` with atomic RPC call (lines 37-81)
- `supabase/migrations/{timestamp}_add_increment_xp_rpc.sql` — create RPC function for atomic XP increment
- `src/features/engagement/streak-tracker.ts` — verify timezone handling (lines 12-21, 23-64, 66-93)
- `src/features/engagement/use-streak.ts` — verify timezone offset is passed (lines 32, 52)
- `src/features/engagement/streak-tracker.test.ts` — add timezone edge case tests
- `src/features/engagement/xp-service.test.ts` — create tests for atomic XP award

### References

- [Source: _bmad-output/planning-artifacts/prd.md] — FR39-44: Engagement and progress tracking
- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.2] — XP calculation and awards
- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.1] — Practice streak tracking
- [Source: _bmad-output/planning-artifacts/architecture.md] — Supabase PostgreSQL, data integrity patterns

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
