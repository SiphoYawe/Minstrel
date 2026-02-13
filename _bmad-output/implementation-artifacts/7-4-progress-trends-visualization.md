# Story 7.4: Progress Trends Visualization

Status: ready-for-dev

## Story

As a musician,
I want to see my improvement trends over time,
so that I have concrete proof that practice is working.

## Acceptance Criteria

1. Given a user has data from multiple sessions (minimum 3 sessions to show meaningful trends), When they view progress data, Then `progress-aggregator.ts` computes trend lines for four dimensions: timing accuracy (% over time), harmonic complexity (chord variety score over time), speed (average and max clean tempo in BPM over time), and practice consistency (sessions per week, total active time per week).

2. Given trends are computed, When the trends are displayed, Then each dimension is rendered as a line chart showing the data points over a configurable time period: 7 days, 30 days, or 90 days. And the user can switch between time periods using a segmented control (tabs or toggle). And the default view is 30 days.

3. Given the visualization renders trends, When the user views the charts, Then the charts prioritize deltas and trajectories over absolute scores. And each chart shows the trend direction with a delta label (e.g., "Timing: +8% over 30d", "Speed: +12 BPM over 30d"). And upward trends use `--accent-success` color, flat trends use `--text-secondary`, and downward trends use `--accent-warm` (amber, not red — consistent with growth mindset).

4. Given the progress view is displayed, When data is rendered alongside charts, Then Strava-like factual summary cards accompany the charts: precise numbers, personal context, no hollow encouragement. And each metric card shows: current value, delta from period start, best value in period, and a one-line factual insight (e.g., "Timing accuracy peaked on Tuesday at 91%").

5. Given the progress data comes from Supabase, When `progress-aggregator.ts` queries data, Then aggregation queries run against the `progress_metrics` and `sessions` tables. And queries use efficient date-range filtering with indexes on `user_id` and `created_at`. And data is fetched once per view and cached in component state (not re-fetched on every tab switch within the same page load).

6. Given a user has fewer than 3 sessions, When they view progress, Then a placeholder message is shown: "Keep practicing. Trends appear after 3 sessions." And the message uses growth mindset language — forward-looking, not deficit-framing.

## Tasks / Subtasks

- [ ] 1. Extend engagement types for progress trends (AC: 1, 3, 4)
  - [ ] 1.1 Add to `src/features/engagement/engagement-types.ts`: `TrendDimension` enum (TimingAccuracy, HarmonicComplexity, Speed, Consistency), `TrendDataPoint` (date, value), `TrendLine` (dimension, dataPoints, deltaFromStart, currentValue, bestInPeriod, trendDirection), `TrendDirection` enum (Up, Flat, Down), `TrendPeriod` enum (SevenDays, ThirtyDays, NinetyDays), `ProgressSummary` (trends, period, generatedAt)
  - [ ] 1.2 Add constants to `src/lib/constants.ts`: `MIN_SESSIONS_FOR_TRENDS = 3`, `TREND_PERIODS = { '7d': 7, '30d': 30, '90d': 90 }`, `TREND_FLAT_THRESHOLD = 0.02` (2% change or less is considered "flat")

- [ ] 2. Implement progress-aggregator.ts (AC: 1, 3)
  - [ ] 2.1 Create `src/features/engagement/progress-aggregator.ts` — domain logic (Layer 3) for computation, with a service layer for data fetching
  - [ ] 2.2 Implement `aggregateTimingTrend(sessions: SessionMetric[], period: TrendPeriod): TrendLine` — computes timing accuracy trend from session-level averages over the specified period
  - [ ] 2.3 Implement `aggregateHarmonicComplexityTrend(sessions: SessionMetric[], period: TrendPeriod): TrendLine` — computes harmonic complexity score (unique chord types per session, weighted by quality) over time
  - [ ] 2.4 Implement `aggregateSpeedTrend(sessions: SessionMetric[], period: TrendPeriod): TrendLine` — computes average and max clean tempo over time
  - [ ] 2.5 Implement `aggregateConsistencyTrend(sessions: SessionMetric[], period: TrendPeriod): TrendLine` — computes sessions per week and total active minutes per week
  - [ ] 2.6 Implement `computeTrendDirection(dataPoints: TrendDataPoint[]): TrendDirection` — determines if the trend is Up (delta > threshold), Down (delta < -threshold), or Flat (within threshold) using linear regression or simple start-to-end delta
  - [ ] 2.7 Implement `generateProgressSummary(sessions: SessionMetric[], period: TrendPeriod): ProgressSummary` — orchestrating function that produces all four trend lines and the factual insight strings
  - [ ] 2.8 Implement `generateInsightText(trend: TrendLine): string` — creates the factual one-line insight for each dimension (e.g., "Timing accuracy peaked on Tuesday at 91%")

- [ ] 3. Implement progress data fetching service (AC: 5)
  - [ ] 3.1 Create `src/features/engagement/progress-service.ts` (Layer 4 wrapper) for Supabase queries
  - [ ] 3.2 Implement `fetchSessionMetrics(userId: string, fromDate: Date, toDate: Date): Promise<SessionMetric[]>` — queries `progress_metrics` and `sessions` tables for the specified date range, selecting only the columns needed for aggregation
  - [ ] 3.3 Ensure query uses indexes on `(user_id, created_at)` for efficient date-range filtering
  - [ ] 3.4 Implement `fetchSessionCount(userId: string): Promise<number>` — quick count query to determine if the user meets the minimum sessions threshold

- [ ] 4. Create progress trends hook (AC: 1, 2, 5, 6)
  - [ ] 4.1 Create `src/features/engagement/use-progress-trends.ts` — React hook that manages trend data fetching and period selection
  - [ ] 4.2 Fetch all data for the maximum period (90 days) once on mount, then compute trend lines client-side for each period (avoids re-fetching when user switches periods)
  - [ ] 4.3 Expose: `progressSummary`, `selectedPeriod`, `setSelectedPeriod`, `isLoading`, `hasMinimumData`
  - [ ] 4.4 Cache the fetched data in hook state so period switches are instant

- [ ] 5. Build progress trends chart components (AC: 2, 3, 4, 6)
  - [ ] 5.1 Create `src/components/progress-trends.tsx` — `'use client'` container component for the full progress trends view
  - [ ] 5.2 Implement period selector using shadcn/ui Tabs or a segmented control with 7d / 30d / 90d options, 0px border radius
  - [ ] 5.3 Implement trend line chart rendering using Canvas 2D API (consistent with the app's Canvas-based visualization approach) or a lightweight charting approach. Charts should be simple line charts with data points, no heavy charting library. Consider using `<canvas>` elements for consistency with the viz layer.
  - [ ] 5.4 Style charts: `--accent-success` for upward trends, `--text-secondary` for flat, `--accent-warm` for downward. Chart background uses `--bg-secondary`. Grid lines in `--border-subtle`. Data points as small circles (4px).
  - [ ] 5.5 Below each chart, render a summary card (DataCard pattern) showing: current value, delta with direction arrow, best in period, and the factual insight text
  - [ ] 5.6 Implement the empty state: "Keep practicing. Trends appear after 3 sessions." centered in the chart area with `--text-secondary` color
  - [ ] 5.7 Ensure all charts have text alternatives for accessibility: `aria-label` describing the trend ("Timing accuracy: 73%, up 8% over 30 days")
  - [ ] 5.8 Integrate into the `/settings` page or a dedicated progress tab accessible from the main navigation

- [ ] 6. Write co-located tests (AC: 1, 3, 6)
  - [ ] 6.1 Create `src/features/engagement/progress-aggregator.test.ts` — test each aggregation function with mock session data: verify trend computation for known data sets, boundary conditions (exactly 3 sessions), trend direction detection (up, flat, down), insight text generation
  - [ ] 6.2 Test empty/insufficient data handling: fewer than 3 sessions returns appropriate empty state
  - [ ] 6.3 Test period filtering: 7d, 30d, 90d correctly filter data points
  - [ ] 6.4 Create `src/components/progress-trends.test.tsx` — verify period selector renders, empty state renders for insufficient data, chart container renders with correct aria-labels

## Dev Notes

- **Architecture Layer**: `progress-aggregator.ts` is Layer 3 (Domain Logic) — pure aggregation functions that accept session data arrays and return computed trends. `progress-service.ts` is Layer 4 (Infrastructure) — Supabase queries. `use-progress-trends.ts` is Layer 2 (Application Logic). `progress-trends.tsx` is Layer 1 (Presentation).
- **Chart Rendering Approach**: Avoid heavy charting libraries (Chart.js, Recharts, D3) to keep the bundle small. Use either Canvas 2D API (consistent with the app's existing viz layer) or simple SVG for the trend lines. The charts are simple line charts with 4-90 data points — no need for a full charting framework. If a library is needed later, it should be dynamically imported.
- **Strava-Like Factual Summaries**: The key design principle is Strava's activity summary style. Each metric has: a chart (visual), a current value (number), a delta (change indicator), and a factual insight (one sentence). No "Great improvement!" — instead "Timing accuracy peaked on Tuesday at 91%". The tone is that of a training log entry, not a congratulations card.
- **Efficient Supabase Queries**: Fetch all data for 90 days in a single query, then compute 7d and 30d subsets client-side. This avoids three separate queries when the user switches periods. The query should select only the columns needed for aggregation (not full MIDI event data). Consider creating a Supabase view or function for efficient aggregation if the data volume grows.
- **Trend Direction Calculation**: Use simple start-to-end delta for trend direction rather than full linear regression. This is more intuitive for users and simpler to implement. A trend is "Up" if the delta exceeds +2%, "Down" if below -2%, and "Flat" otherwise. The threshold is configurable.
- **Color Semantics**: Upward trends use `--accent-success` (green), NOT to celebrate but to factually indicate upward direction. Downward trends use `--accent-warm` (amber) — explicitly NOT red, consistent with the growth mindset design. Amber means "trajectory to watch", not "failure". Flat trends use `--text-secondary` (neutral grey).
- **Accessibility**: Each chart must have an `aria-label` that conveys the trend information as text (e.g., "Timing accuracy trend: 73%, up 8% over the last 30 days"). Screen reader users should get the same information as visual users without needing to see the chart.
- **Library Versions**: Zustand 5.x for state, Supabase client SDK for DB, shadcn/ui Tabs for period selector. No external charting library at MVP.
- **Testing**: Vitest for unit tests, React Testing Library for component tests. Focus heavily on the aggregation logic — known input data sets should produce exact expected trend values.

### Project Structure Notes

- `src/features/engagement/engagement-types.ts` — extended with trend types (TrendDimension, TrendLine, ProgressSummary)
- `src/features/engagement/progress-aggregator.ts` — trend computation logic (pure functions)
- `src/features/engagement/progress-aggregator.test.ts` — co-located tests
- `src/features/engagement/progress-service.ts` — Supabase query wrapper for progress data
- `src/features/engagement/use-progress-trends.ts` — React hook for trend state and period management
- `src/components/progress-trends.tsx` — progress trends UI with charts and summary cards
- `src/components/progress-trends.test.tsx` — co-located component test
- `src/features/engagement/index.ts` — barrel export updated
- `src/lib/constants.ts` — extended with trend-related constants

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — `progress_metrics` table, `sessions` table, Supabase PostgreSQL
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — naming conventions, co-located tests, Layer 3 boundary rules, `@/` import alias
- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.4] — acceptance criteria and FR43 coverage
- [Source: _bmad-output/planning-artifacts/prd.md#Engagement & Progress] — FR43: progress data with improvement trends over configurable time periods
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation] — color tokens: `--accent-success`, `--accent-warm`, `--text-secondary`
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Inspiration Strategy] — "Strava for Musicians" data identity, factual summaries, Strava activity summary pattern
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Anti-Patterns] — "Score-based assessment" anti-pattern: only trajectory metrics, no scores/grades

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
