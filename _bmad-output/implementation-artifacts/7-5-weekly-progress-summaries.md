# Story 7.5: Weekly Progress Summaries

Status: ready-for-dev

## Story

As a musician,
I want a weekly summary of my practice and improvement,
so that I can see the bigger picture of my growth.

## Acceptance Criteria

1. Given the user has practiced during the past week (at least 1 session), When they view the weekly summary, Then the SessionSummary component (P1) displays a weekly progress card containing: total practice time (formatted as hours and minutes), number of sessions, key metrics that improved with percentage deltas, number of drills completed, and number of personal records set.

2. Given the user has data from the previous week as well, When the weekly summary renders, Then a comparison with the previous week is shown for each metric: total time delta (e.g., "1h 23m, +32m from last week"), session count delta, and specific metric deltas (e.g., "Timing accuracy: 78%, up 8% from last week"). And comparisons use `--accent-success` for improvement, `--text-secondary` for unchanged, and `--accent-warm` (amber) for regression.

3. Given the weekly summary is generated, When the data is presented, Then the tone is factual and data-driven. And phrasing follows the pattern "You improved X by Y% this week" or "Timing up 8%", never "Great job this week!" or "Keep it up!". And each data point is precise (exact numbers, not ranges or vague language).

4. Given the weekly summary is computed, When all data is assembled, Then the summary surfaces the single highest-impact insight of the week: the metric that showed the most meaningful change (positive or negative). And the insight is phrased factually (e.g., "Biggest improvement: chord transitions decreased from 340ms to 220ms" or "Focus area: timing accuracy dipped 3% this week — revisit metronome drills").

5. Given the weekly summary pulls data from Supabase, When the summary is computed, Then data comes from `progress_metrics` (aggregated metrics) and `sessions` (session metadata including duration, drill count). And the computation uses ISO week boundaries (Monday to Sunday) for consistency. And the current week's data is always live (not cached stale data).

6. Given the user has no sessions this week, When they view the weekly summary, Then a placeholder is shown: "No sessions this week yet. Your instrument is waiting." And the message uses growth mindset language — inviting, not guilt-inducing.

## Tasks / Subtasks

- [ ] 1. Extend engagement types for weekly summaries (AC: 1, 2, 4)
  - [ ] 1.1 Add to `src/features/engagement/engagement-types.ts`: `WeeklySummary` (weekStartDate, weekEndDate, totalPracticeMs, sessionCount, drillsCompleted, personalRecordsSet, metricDeltas, highestImpactInsight, previousWeekComparison), `WeeklyMetricDelta` (metricName, currentValue, previousValue, deltaPercent, direction), `WeeklyComparison` (totalTimeDeltaMs, sessionCountDelta, metricDeltas[])
  - [ ] 1.2 Add constants to `src/lib/constants.ts`: `WEEK_START_DAY = 1` (Monday, ISO standard)

- [ ] 2. Implement weekly summary computation (AC: 1, 2, 4)
  - [ ] 2.1 Create `src/features/engagement/weekly-summary-generator.ts` — pure domain logic (Layer 3)
  - [ ] 2.2 Implement `computeWeeklySummary(currentWeekSessions: SessionMetric[], previousWeekSessions: SessionMetric[], currentWeekRecords: PersonalRecord[]): WeeklySummary` — orchestrating function that produces the full summary from raw session data
  - [ ] 2.3 Implement `calculateTotalPracticeTime(sessions: SessionMetric[]): number` — sums active play duration across all sessions in the week (milliseconds)
  - [ ] 2.4 Implement `calculateMetricDeltas(currentWeek: SessionMetric[], previousWeek: SessionMetric[]): WeeklyMetricDelta[]` — computes week-over-week deltas for: timing accuracy average, harmonic complexity average, max clean tempo, practice consistency
  - [ ] 2.5 Implement `identifyHighestImpactInsight(deltas: WeeklyMetricDelta[]): string` — selects the metric with the largest absolute percentage change and generates a factual insight string. If improvement: "Biggest improvement: {metric} improved {delta}%". If regression: "Focus area: {metric} dipped {delta}% — consider revisiting {related drill type}".
  - [ ] 2.6 Implement `getISOWeekBounds(date: Date): { start: Date, end: Date }` — returns Monday 00:00:00 to Sunday 23:59:59 for the week containing the given date

- [ ] 3. Implement weekly summary data fetching (AC: 5)
  - [ ] 3.1 Extend `src/features/engagement/progress-service.ts` with `fetchWeeklySessionData(userId: string, weekStart: Date, weekEnd: Date): Promise<SessionMetric[]>` — queries sessions and progress_metrics for the specified week
  - [ ] 3.2 Implement `fetchWeeklySummaryData(userId: string): Promise<{ currentWeek: SessionMetric[], previousWeek: SessionMetric[] }>` — fetches data for both the current and previous week in a single call (or two parallel queries)
  - [ ] 3.3 Ensure current week data is always fresh (no aggressive caching for the current week)

- [ ] 4. Create weekly summary hook (AC: 1, 5, 6)
  - [ ] 4.1 Create `src/features/engagement/use-weekly-summary.ts` — React hook that fetches data and computes the weekly summary
  - [ ] 4.2 Expose: `weeklySummary`, `isLoading`, `hasData` (whether any sessions exist this week)
  - [ ] 4.3 Fetch data on mount and recompute when the current session ends (to include just-completed session in the weekly view)

- [ ] 5. Build weekly summary UI component (AC: 1, 2, 3, 4, 6)
  - [ ] 5.1 Create `src/components/weekly-summary.tsx` — `'use client'` component that renders the weekly progress summary card
  - [ ] 5.2 Header section: "This Week" with the date range (e.g., "Feb 3 - Feb 9")
  - [ ] 5.3 Top-line stats row: total time, sessions count, drills completed, records set — using DataCard-style layout with `--text-primary` values and `--text-secondary` labels
  - [ ] 5.4 Metrics comparison section: each metric as a row showing current value, delta arrow (up/down/flat), and percentage change. Use `--accent-success` for improvement, `--text-secondary` for flat, `--accent-warm` for regression.
  - [ ] 5.5 Highest-impact insight displayed as a highlighted card at the bottom with `--accent-primary` left border (2px) and factual text
  - [ ] 5.6 Week-over-week comparison: "vs. last week" section with delta values for total time and sessions
  - [ ] 5.7 Empty state: "No sessions this week yet. Your instrument is waiting." in `--text-secondary`, centered
  - [ ] 5.8 All text uses understated factual tone: numbers are precise, no exclamation marks, no celebratory language
  - [ ] 5.9 0px border radius on all cards, `--bg-secondary` card backgrounds, `--border-subtle` separators
  - [ ] 5.10 Integrate into the session end flow (shown in SessionSummary) and/or as a tab in the settings/progress page
  - [ ] 5.11 Add accessibility: all delta values include direction text for screen readers ("improved 8 percent" / "declined 3 percent")

- [ ] 6. Write co-located tests (AC: 1, 2, 3, 4, 6)
  - [ ] 6.1 Create `src/features/engagement/weekly-summary-generator.test.ts` — test full summary computation with known data sets, verify total time calculation, metric delta calculation (improvement, regression, no change), highest-impact insight selection (positive and negative scenarios), ISO week boundary computation
  - [ ] 6.2 Test edge cases: single session in a week, many sessions, zero drills, zero records, first week (no previous week for comparison)
  - [ ] 6.3 Test insight text generation: verify factual tone, no hollow encouragement language
  - [ ] 6.4 Create `src/components/weekly-summary.test.tsx` — verify rendering of all sections, empty state rendering, delta arrow directions, accessibility text for deltas

## Dev Notes

- **Architecture Layer**: `weekly-summary-generator.ts` is Layer 3 (Domain Logic) — pure functions that compute summaries from session data arrays. Data fetching is in `progress-service.ts` (Layer 4). `use-weekly-summary.ts` is Layer 2 (Application Logic). `weekly-summary.tsx` is Layer 1 (Presentation).
- **Factual Tone is Mandatory**: Every text element in the weekly summary must pass the "Strava test" — would this text look natural on a Strava weekly summary? "Practice time: 2h 47m, +32m from last week" passes. "Great week of practice!" fails. "You improved timing by 8%" passes. "Keep up the amazing work!" fails. This is the most important design constraint for this story.
- **ISO Week Boundaries**: Use ISO 8601 week numbering (weeks start on Monday) for consistency across timezones and locales. The `getISOWeekBounds` utility handles this. Do not use Sunday-start weeks as this creates confusion for international users.
- **Highest-Impact Insight**: The insight algorithm selects the metric with the largest absolute percentage change. If the largest change is an improvement, frame it positively but factually. If the largest change is a regression, frame it as a "focus area" with a constructive suggestion. Never frame regression as failure.
- **SessionSummary Integration**: The weekly summary is a section within the broader SessionSummary component (P1), which also shows individual session data. The weekly summary appears as a collapsible or separate tab. It should be visible but not dominant — the primary session summary is about the session just completed, and the weekly summary provides broader context.
- **Previous Week Comparison**: If the user has no data from the previous week (e.g., first week using Minstrel), show current week data without comparison deltas. Display "First week" indicator instead of deltas. Do not show "-100%" or similar misleading comparisons.
- **Data Freshness**: The current week's data must include the session that just ended (if the summary is viewed at session end). The hook should re-fetch or recompute when a session completes. Previous week data can be cached since it does not change.
- **Library Versions**: Zustand 5.x for state, Supabase client SDK for DB, shadcn/ui Card/Badge for UI primitives. No additional dependencies.
- **Testing**: Vitest for unit tests, React Testing Library for component tests. Focus on the computation logic — known data sets should produce exact expected summaries. Test the insight text for tone compliance.

### Project Structure Notes

- `src/features/engagement/engagement-types.ts` — extended with weekly summary types (WeeklySummary, WeeklyMetricDelta, WeeklyComparison)
- `src/features/engagement/weekly-summary-generator.ts` — weekly summary computation logic (pure functions)
- `src/features/engagement/weekly-summary-generator.test.ts` — co-located tests
- `src/features/engagement/progress-service.ts` — extended with weekly data fetching
- `src/features/engagement/use-weekly-summary.ts` — React hook for weekly summary state
- `src/components/weekly-summary.tsx` — weekly summary UI component
- `src/components/weekly-summary.test.tsx` — co-located component test
- `src/features/engagement/index.ts` — barrel export updated
- `src/lib/constants.ts` — extended with week-related constants

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — `progress_metrics` table, `sessions` table, Supabase PostgreSQL
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — naming conventions, co-located tests, Layer 3 boundary rules
- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.5] — acceptance criteria and FR44 coverage
- [Source: _bmad-output/planning-artifacts/prd.md#Engagement & Progress] — FR44: weekly progress summaries with skill improvement metrics
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#SessionSummary] — component anatomy: total time, skills practiced, key improvements with deltas, streak update, next session hint
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Inspiration Strategy] — Strava factual summaries pattern, "Earned Confidence, Not Given Praise"
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Anti-Patterns] — "Hollow encouragement" anti-pattern: every positive feedback must be data-backed

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
