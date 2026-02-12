# Story 7.2: XP Calculation and Awards

Status: ready-for-dev

## Story

As a musician,
I want to earn XP for practice time and improvements,
so that my effort is quantified and I can see cumulative progress.

## Acceptance Criteria

1. Given a user completes a practice session, When XP is calculated, Then `xp-calculator.ts` awards base XP for practice time at a rate defined in constants (e.g., 1 XP per minute of active playing, minimum 3 minutes to qualify). And the base XP value is rounded to the nearest integer.

2. Given a user's timing accuracy improved during a session compared to their rolling average, When XP is calculated, Then a timing improvement bonus is awarded. And the bonus scales proportionally with the magnitude of improvement (e.g., +5% accuracy = +10 bonus XP, +10% = +25 bonus XP). And the bonus formula is defined as a pure function with configurable multipliers.

3. Given a user completes a drill successfully, When XP is calculated, Then a drill completion bonus is awarded (flat bonus per drill, e.g., 15 XP). And partial drill completion (attempted but not passed) awards a reduced bonus (e.g., 5 XP) to reward effort, not just success.

4. Given a user sets a new personal record during a session, When XP is calculated, Then a new record bonus is awarded (flat bonus, e.g., 25 XP per record). And the bonus applies once per record type per session (no double-counting if the same record is broken multiple times within one session).

5. Given XP has been awarded, When the session ends or is autosaved, Then the total XP is persisted to the `progress_metrics` table with `metric_type = 'xp'`. And `current_value` stores the cumulative lifetime XP total. And the per-session XP breakdown is stored in the session metadata for transparency.

6. Given a user views their profile or session summary, When XP data is rendered, Then cumulative XP is displayed as a number (e.g., "1,240 XP") in a DataCard or profile section. And XP is visible but not the primary focus — it supports the progress feeling without dominating the interface. And there are no levels, ranks, leaderboards, or tier labels derived from XP.

7. Given XP is calculated, When the results are presented, Then the breakdown shows each XP source clearly: "Practice: 23 XP, Timing Improvement: 10 XP, Drills: 15 XP, New Record: 25 XP = 73 XP". And the presentation is factual and precise, not celebratory.

## Tasks / Subtasks

- [ ] 1. Extend engagement types for XP (AC: 1, 2, 3, 4, 5)
  - [ ] 1.1 Add to `src/features/engagement/engagement-types.ts`: `XpBreakdown` (practiceXp, timingBonusXp, drillCompletionXp, newRecordXp, totalXp), `XpAwardEvent` (sessionId, userId, breakdown, awardedAt), `XpConfig` (baseRatePerMinute, timingImprovementMultiplier, drillCompletionBonus, drillAttemptBonus, newRecordBonus)
  - [ ] 1.2 Add XP-related constants to `src/lib/constants.ts`: `XP_BASE_RATE_PER_MINUTE = 1`, `XP_TIMING_IMPROVEMENT_MULTIPLIER = 2`, `XP_DRILL_COMPLETION_BONUS = 15`, `XP_DRILL_ATTEMPT_BONUS = 5`, `XP_NEW_RECORD_BONUS = 25`

- [ ] 2. Implement xp-calculator.ts (AC: 1, 2, 3, 4, 7)
  - [ ] 2.1 Create `src/features/engagement/xp-calculator.ts` — pure domain logic (Layer 3), no framework imports
  - [ ] 2.2 Implement `calculateBaseXp(activePlayDurationMs: number): number` — converts active play time to base XP at the configured rate, minimum 3 minutes to qualify (returns 0 below threshold)
  - [ ] 2.3 Implement `calculateTimingBonus(currentAccuracy: number, rollingAverage: number): number` — awards bonus XP proportional to improvement delta. Returns 0 if no improvement or regression. Uses configurable multiplier.
  - [ ] 2.4 Implement `calculateDrillXp(drillResults: DrillResult[]): number` — sums drill completion bonus (full for passed, partial for attempted) across all drills in the session
  - [ ] 2.5 Implement `calculateRecordXp(newRecords: PersonalRecord[]): number` — awards flat bonus per unique record type achieved in the session, deduplicating multiple breaks of the same record
  - [ ] 2.6 Implement `calculateSessionXp(sessionData: SessionXpInput): XpBreakdown` — orchestrating function that computes all components and returns the full breakdown with total
  - [ ] 2.7 Ensure all functions are pure with no side effects — accept data, return results

- [ ] 3. Implement XP persistence service (AC: 5)
  - [ ] 3.1 Create `src/features/engagement/xp-service.ts` (Layer 4 wrapper) for Supabase read/write of XP data
  - [ ] 3.2 Implement `fetchLifetimeXp(userId: string): Promise<number>` — queries `progress_metrics` where `metric_type = 'xp'`
  - [ ] 3.3 Implement `awardXp(userId: string, breakdown: XpBreakdown, sessionId: string): Promise<void>` — atomically increments cumulative XP in `progress_metrics` and stores the per-session breakdown in session metadata

- [ ] 4. Integrate XP calculation with session lifecycle (AC: 1, 2, 3, 4, 5)
  - [ ] 4.1 Create a hook `src/features/engagement/use-xp.ts` that exposes lifetime XP and the latest session's XP breakdown
  - [ ] 4.2 Hook into the session end event to trigger XP calculation: collect active play duration from session data, timing accuracy deltas from analysis, drill results from `drill_records`, and new personal records from Story 7.6
  - [ ] 4.3 Call `calculateSessionXp` with aggregated session data, then persist via `awardXp`
  - [ ] 4.4 Update `sessionStore` with the XP breakdown for the current session so the SessionSummary can display it

- [ ] 5. Build XP display in profile and session summary (AC: 6, 7)
  - [ ] 5.1 Add XP total display to the user profile section (e.g., in `/settings` or a future profile page) using a DataCard component with "Total XP" label and formatted number (comma-separated)
  - [ ] 5.2 Add XP breakdown section to the SessionSummary component (P1): display each source line and the total, using understated factual formatting
  - [ ] 5.3 Ensure XP display uses `--text-secondary` color and standard Inter typography — not a primary visual element
  - [ ] 5.4 No levels, ranks, badges, or progress bars derived from XP — it is a raw cumulative number only

- [ ] 6. Write co-located tests (AC: 1, 2, 3, 4, 7)
  - [ ] 6.1 Create `src/features/engagement/xp-calculator.test.ts` — test base XP calculation (exact boundary at 3 min, various durations), timing bonus (improvement, no improvement, regression), drill XP (full, partial, mixed), record XP (single, multiple, deduplication), full session XP orchestration with combined inputs
  - [ ] 6.2 Test edge cases: zero-length session, session with only drills (no freeform), session with only freeform (no drills), session where every component is zero

## Dev Notes

- **Architecture Layer**: `xp-calculator.ts` is Layer 3 (Domain Logic) — pure mathematical functions, easily testable, no side effects. `xp-service.ts` is Layer 4 (Infrastructure) — handles Supabase persistence. `use-xp.ts` is Layer 2 (Application Logic) — orchestrates calculation and persistence on session end.
- **XP Philosophy**: XP in Minstrel is a personal odometer, not a game score. It quantifies effort over time. There are no levels to reach, no ranks to unlock, no leaderboards to climb. The number goes up with practice. That is its only function. Think of it like a runner's lifetime mileage counter — meaningful to the individual, irrelevant as a comparison metric.
- **Strava-Like Presentation**: XP breakdown in the session summary should read like a Strava activity summary. Factual line items: "Practice: 23 XP" not "You earned 23 XP for practicing!" No emojis. No "Great work!" Just the data.
- **No Levels or Tiers**: Explicitly do NOT derive levels, ranks, titles, or progress bars from XP. If a progress bar is needed in the future, it would be for a specific skill dimension (timing accuracy trend), never for "XP toward next level." This is a critical design constraint from the anti-patterns analysis.
- **Timing Bonus Formula**: The timing improvement bonus compares the current session's average timing accuracy against a rolling average from the last N sessions (suggest N=5). The delta is multiplied by the configurable multiplier. This rewards genuine improvement, not just having a good baseline. Users who already have 95% accuracy can still earn bonuses by improving.
- **Atomic XP Updates**: Use Supabase's `rpc` or a single UPDATE query to atomically increment the lifetime XP total. Avoid read-modify-write patterns that could cause race conditions if multiple sessions sync simultaneously.
- **Session Metadata Storage**: The per-session XP breakdown is stored alongside the session metadata (not as a separate table). This keeps the data model simple and allows the session summary to display the breakdown without an extra query.
- **Dependency on Story 7.6**: The `calculateRecordXp` function depends on personal record detection from Story 7.6. During initial implementation, this can return 0 and be wired up when personal records tracking is complete. The type system should define the interface now.
- **Library Versions**: Zustand 5.x for state, Supabase client SDK for DB. No additional dependencies.
- **Testing**: Vitest for unit tests. XP calculation is entirely pure functions — exhaustive testing is straightforward. Test all boundary conditions and the interaction between multiple bonus types.

### Project Structure Notes

- `src/features/engagement/engagement-types.ts` — extended with XP types (XpBreakdown, XpAwardEvent, XpConfig)
- `src/features/engagement/xp-calculator.ts` — XP calculation logic (pure functions)
- `src/features/engagement/xp-calculator.test.ts` — co-located tests
- `src/features/engagement/xp-service.ts` — Supabase persistence wrapper for XP
- `src/features/engagement/use-xp.ts` — React hook for XP state
- `src/features/engagement/index.ts` — barrel export updated
- `src/lib/constants.ts` — extended with XP-related constants

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — `progress_metrics` table, Supabase PostgreSQL, RLS policies
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — naming conventions, co-located tests, Layer 3 boundary rules
- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.2] — acceptance criteria and FR41 coverage
- [Source: _bmad-output/planning-artifacts/prd.md#Engagement & Progress] — FR41: XP for practice time, accuracy improvements, milestone completion
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Anti-Patterns] — "Gamification excess" anti-pattern, "Score-based assessment" anti-pattern, "Hollow encouragement" anti-pattern
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Inspiration Strategy] — "XP and achievements (Duolingo -> understated milestone badges) — retain progress tangibility, strip gamification excess"

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
