# Story 7.1: Practice Streak Tracking

Status: ready-for-dev

## Story

As a musician,
I want to see my daily practice streak,
so that I'm motivated to maintain a consistent practice habit.

## Acceptance Criteria

1. Given a user has an account and completes a practice session with at least 3 minutes of active MIDI input, When the session ends or is autosaved, Then `streak-tracker.ts` calculates whether this constitutes a "meaningful practice day" and updates the user's current streak count in the `progress_metrics` table. And the streak count increments by 1 if no qualifying session was recorded today, or remains the same if one already exists.

2. Given a user's last meaningful practice session was more than 48 hours ago, When streak-tracker evaluates the streak, Then the streak resets to 0 (or 1 if the current session qualifies). And the 48-hour window is measured from the end timestamp of the last qualifying session to account for timezone differences and late-night practice.

3. Given a user has an active streak, When the StreakBadge component (P2) renders in the StatusBar, Then it displays the current streak as "Day {n}" (e.g., "Day 14") in the understated athlete-log aesthetic. And the presentation is never aggressive — no exclamation marks, no all-caps, no animated celebrations. And the flame icon uses `--accent-warm` when active, muted grey when broken.

4. Given a user's streak is at risk (practiced yesterday but not today), When the StreakBadge renders, Then it shows a muted flame icon with a tooltip: "Practice today to keep your streak". And the tooltip uses growth mindset language — no guilt, no pressure.

5. Given a user's streak reaches a milestone day (7, 30, 100, 365), When the StreakBadge renders on that day, Then a subtle glow effect is applied to the badge (not confetti, not animation, not popup). And the milestone is announced via `aria-live` for screen reader users.

6. Given a user has a broken streak, When the StreakBadge renders, Then it shows a grey flame with "Start fresh" as tooltip. And there is no guilt language — no "You lost your streak!" or negative framing.

7. Given streak data needs to persist, When streak-tracker writes to Supabase, Then the `progress_metrics` table stores: `user_id`, `metric_type` ("streak"), `current_value` (current streak count), `best_value` (longest streak ever), `last_qualified_at` (timestamp of last meaningful practice), and `updated_at`. And RLS policies ensure only the owning user can read/write their streak data.

## Tasks / Subtasks

- [ ] 1. Define engagement types for streak tracking (AC: 1, 2, 7)
  - [ ] 1.1 Create `src/features/engagement/engagement-types.ts` with types: `StreakData` (currentStreak, bestStreak, lastQualifiedAt, streakStatus), `StreakStatus` enum (Active, AtRisk, Broken, Milestone), `MeaningfulSessionCriteria` (minDurationMs, minMidiEvents), `ProgressMetricRow` (id, userId, metricType, currentValue, bestValue, metadata, lastQualifiedAt, createdAt, updatedAt)
  - [ ] 1.2 Define constants in `src/lib/constants.ts`: `MIN_MEANINGFUL_PRACTICE_MS = 180_000` (3 minutes), `STREAK_RESET_WINDOW_MS = 172_800_000` (48 hours), `STREAK_MILESTONES = [7, 30, 100, 365]`
  - [ ] 1.3 Export types via `src/features/engagement/index.ts` barrel export

- [ ] 2. Implement streak-tracker.ts (AC: 1, 2)
  - [ ] 2.1 Create `src/features/engagement/streak-tracker.ts` — pure domain logic (Layer 3), no framework imports
  - [ ] 2.2 Implement `isSessionMeaningful(activePlayDurationMs: number): boolean` — returns true if duration >= 3 minutes of active MIDI input
  - [ ] 2.3 Implement `calculateStreakUpdate(currentStreak: StreakData, sessionEndTime: Date): StreakData` — pure function that computes new streak state: increments if within 48h window and first qualifying session today, resets to 1 if beyond 48h, returns unchanged if already qualified today
  - [ ] 2.4 Implement `getStreakStatus(streak: StreakData, now: Date): StreakStatus` — returns Active, AtRisk (last session was yesterday), Broken (>48h gap), or Milestone (current streak matches milestone array)
  - [ ] 2.5 Implement `isSameCalendarDay(date1: Date, date2: Date, timezoneOffset: number): boolean` — utility to check if two timestamps fall on the same calendar day for the user's timezone

- [ ] 3. Implement Supabase persistence for streak data (AC: 7)
  - [ ] 3.1 Create a service function in `src/features/engagement/streak-service.ts` (Layer 4 wrapper) that reads/writes streak data from/to `progress_metrics` table via `@/lib/supabase/client.ts`
  - [ ] 3.2 Implement `fetchStreak(userId: string): Promise<StreakData>` — queries `progress_metrics` where `metric_type = 'streak'`
  - [ ] 3.3 Implement `updateStreak(userId: string, streak: StreakData): Promise<void>` — upserts streak data to `progress_metrics`
  - [ ] 3.4 Verify RLS policy on `progress_metrics` allows only the authenticated user to read/write their own rows

- [ ] 4. Integrate streak tracking with session lifecycle (AC: 1, 2)
  - [ ] 4.1 Create a hook `src/features/engagement/use-streak.ts` that manages streak state and exposes it to React components
  - [ ] 4.2 Hook into the session end/autosave event (from `session-manager.ts`) to trigger streak evaluation
  - [ ] 4.3 Calculate active play duration from session MIDI event timestamps (first note to last note, excluding silence gaps >30s)
  - [ ] 4.4 On meaningful session completion, call `calculateStreakUpdate` and persist via `updateStreak`

- [ ] 5. Build StreakBadge component (AC: 3, 4, 5, 6)
  - [ ] 5.1 Create `src/components/streak-badge.tsx` — `'use client'` component using shadcn/ui Badge primitive
  - [ ] 5.2 Render flame icon using `--accent-warm` for active state, muted grey for broken state
  - [ ] 5.3 Display "Day {n}" text in `--text-primary`, using understated typography (Inter, normal weight)
  - [ ] 5.4 Implement tooltip states: "Practice today to keep your streak" (at risk), "Start fresh" (broken), milestone glow effect for milestone days
  - [ ] 5.5 Add `aria-label="Practice streak: {n} days"` and `aria-live="polite"` for milestone announcements
  - [ ] 5.6 Integrate into StatusBar as a persistent element, 0px border radius per design system

- [ ] 6. Write co-located tests (AC: 1, 2, 3, 4, 5, 6)
  - [ ] 6.1 Create `src/features/engagement/streak-tracker.test.ts` — test meaningful session detection (exact boundary at 3 min), streak increment, streak reset after 48h, same-day deduplication, milestone detection, streak status evaluation for all states
  - [ ] 6.2 Create `src/components/streak-badge.test.tsx` — test rendering for active, at-risk, broken, and milestone states, verify aria-label text, verify no aggressive language in any state

## Dev Notes

- **Architecture Layer**: `streak-tracker.ts` is Layer 3 (Domain Logic) — pure functions, no side effects, no imports from infrastructure or framework. `streak-service.ts` is Layer 4 (Infrastructure) — handles Supabase I/O. `use-streak.ts` is Layer 2 (Application Logic) — orchestrates between domain logic and infrastructure. `streak-badge.tsx` is Layer 1 (Presentation).
- **Understated Presentation**: The StreakBadge follows the Strava/athlete training log aesthetic. "Day 47" is the maximum expression. No exclamation points, no confetti, no fireworks. The streak is factual data, not a celebration. Think of it like a runner's log entry, not a game reward popup.
- **48-Hour Window Rationale**: The 48h reset window (instead of 24h) provides a generous buffer. A user who practices at 11pm one night and noon the next day doesn't lose their streak. This is a quality-of-life decision that reduces false streak breaks from timezone/schedule variation.
- **"Meaningful Practice" Definition**: 3 minutes of active MIDI input is the threshold. This is measured by actual note-on events, not app open time. A user who opens the app and walks away for 30 minutes gets no streak credit. The calculation uses timestamps of the first and last MIDI events, subtracting silence gaps >30s.
- **Supabase Query Pattern**: Streak data uses the `progress_metrics` table with `metric_type = 'streak'`. This avoids creating a separate `streaks` table and keeps the data model consistent with other progress metrics (XP, personal records). Use upsert (`on conflict (user_id, metric_type)`) for atomic updates.
- **No Notifications**: There is no push notification or email reminder for at-risk streaks. The StreakBadge in the StatusBar is the only indicator. Minstrel is not Duolingo — we do not guilt-trip users into opening the app.
- **Library Versions**: Zustand 5.x for state, Supabase client SDK for DB, shadcn/ui Badge for component primitive. No additional dependencies.
- **Testing**: Vitest for unit tests, React Testing Library for component tests. Test the pure domain logic exhaustively (edge cases around midnight, timezone boundaries, exact 3-minute boundary). Component tests verify visual states and accessibility attributes.

### Project Structure Notes

- `src/features/engagement/engagement-types.ts` — shared types for all engagement features (created here, extended in Stories 7.2-7.6)
- `src/features/engagement/streak-tracker.ts` — streak calculation logic (pure functions)
- `src/features/engagement/streak-tracker.test.ts` — co-located tests
- `src/features/engagement/streak-service.ts` — Supabase persistence wrapper
- `src/features/engagement/use-streak.ts` — React hook for streak state
- `src/features/engagement/index.ts` — barrel export for engagement feature
- `src/components/streak-badge.tsx` — StreakBadge UI component (P2)
- `src/components/streak-badge.test.tsx` — co-located component test
- `src/lib/constants.ts` — extended with streak-related constants

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — `progress_metrics` table, Supabase PostgreSQL, RLS policies
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — naming conventions, co-located tests, Layer 3 boundary rules, Zustand patterns
- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.1] — acceptance criteria and FR40 coverage
- [Source: _bmad-output/planning-artifacts/prd.md#Engagement & Progress] — FR40: practice streaks based on meaningful activity
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#StreakBadge] — component states (Active, At Risk, Broken, Milestone), flame icon, aria-label, understated aesthetic
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Anti-Patterns] — "Gamification excess" anti-pattern, Duolingo streak adapted to athlete-log aesthetic

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
