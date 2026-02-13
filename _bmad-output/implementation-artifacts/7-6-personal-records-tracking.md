# Story 7.6: Personal Records Tracking

Status: ready-for-dev

## Story

As a musician,
I want to track my personal records across different skills,
so that I can celebrate concrete achievements and push myself.

## Acceptance Criteria

1. Given the user achieves a new best in a tracked metric during a session, When the session ends or a drill completes, Then personal records are detected and tracked for: fastest clean tempo (BPM at which the user played a drill or passage with >85% timing accuracy), longest practice streak (days, sourced from streak tracker), highest timing accuracy (% for a single drill or passage), and most complex chord progression handled (measured by number of unique chord types in a successfully navigated progression). And each record type stores: record value, date achieved, session ID (context), and the previous record value for comparison.

2. Given a new personal record is detected, When the session summary renders, Then the new record is highlighted in the session summary with a `--accent-success` visual indicator (left border or icon glow). And the highlight is subtle — a small icon and the old-vs-new comparison, not a full-screen celebration. And the text reads factually: "New record: 142 BPM clean tempo (previous: 128 BPM)" — precise, personal, no exclamation marks.

3. Given personal records are stored, When the user views their records, Then all current records are displayed in a dedicated section (within profile, settings, or progress page) showing: record type, current record value, date achieved, and the full history of previous records for that type. And the presentation uses the athlete-stats aesthetic: think of a runner's PR board — clean, factual, precise numbers with dates. And each record type has a descriptive label (e.g., "Clean Tempo", "Timing Accuracy", "Harmonic Complexity", "Practice Streak").

4. Given records are persisted to Supabase, When record data is written, Then each record is stored in the `progress_metrics` table with `metric_type` set to the specific record type (e.g., "record_clean_tempo", "record_timing_accuracy"). And `current_value` stores the current best. And `best_value` mirrors `current_value` (they are the same for records). And a `metadata` JSONB field stores the record history array: `[{ value, date, sessionId }]`. And previous records are never deleted — they are preserved in the history for comparison.

5. Given the user breaks a record that was set in a previous session, When the record update is persisted, Then the previous record is appended to the history array in the `metadata` field. And the `current_value` is updated to the new best. And the `updated_at` timestamp reflects the new record date.

6. Given co-located tests validate record detection, When tests execute, Then edge cases are covered: exact tie with existing record (no new record, tie does not replace), first session (all metrics become initial records), multiple records broken in one session (each tracked independently), record broken multiple times in same session (only the final best value is stored as the new record).

## Tasks / Subtasks

- [ ] 1. Extend engagement types for personal records (AC: 1, 4)
  - [ ] 1.1 Add to `src/features/engagement/engagement-types.ts`: `PersonalRecordType` enum (CleanTempo, TimingAccuracy, HarmonicComplexity, PracticeStreak), `PersonalRecord` (recordType, currentValue, previousValue, achievedAt, sessionId), `RecordHistoryEntry` (value, date, sessionId), `PersonalRecordWithHistory` (recordType, currentValue, history: RecordHistoryEntry[], label, unit), `RecordDetectionInput` (sessionMetrics including maxCleanTempo, bestTimingAccuracy, maxChordComplexity, currentStreak)
  - [ ] 1.2 Add constants to `src/lib/constants.ts`: `CLEAN_TEMPO_ACCURACY_THRESHOLD = 0.85` (85% timing accuracy to qualify as "clean"), `RECORD_TYPES` mapping enum values to display labels and units (e.g., CleanTempo -> "Clean Tempo", "BPM")

- [ ] 2. Implement personal record detection logic (AC: 1, 6)
  - [ ] 2.1 Create `src/features/engagement/record-tracker.ts` — pure domain logic (Layer 3)
  - [ ] 2.2 Implement `detectNewRecords(currentRecords: PersonalRecordWithHistory[], sessionInput: RecordDetectionInput): PersonalRecord[]` — compares session metrics against existing records, returns array of new records (empty if none broken). Ties do not count as new records (must strictly exceed previous value).
  - [ ] 2.3 Implement `detectCleanTempo(sessionMetrics: SessionMetrics, currentRecord: number | null): PersonalRecord | null` — checks if the session's max tempo at >85% accuracy exceeds the existing record
  - [ ] 2.4 Implement `detectTimingAccuracy(sessionMetrics: SessionMetrics, currentRecord: number | null): PersonalRecord | null` — checks if the session's best timing accuracy for any drill or passage exceeds the existing record
  - [ ] 2.5 Implement `detectHarmonicComplexity(sessionMetrics: SessionMetrics, currentRecord: number | null): PersonalRecord | null` — checks if the session's max unique chord types in a progression exceeds the existing record
  - [ ] 2.6 Implement `updateRecordHistory(existing: PersonalRecordWithHistory, newRecord: PersonalRecord): PersonalRecordWithHistory` — appends the old record to history, updates current value. If this is the first record, history starts empty.
  - [ ] 2.7 Handle first-session case: if no existing records, all session metrics become the initial records (with empty history)

- [ ] 3. Implement personal records persistence service (AC: 4, 5)
  - [ ] 3.1 Create `src/features/engagement/record-service.ts` (Layer 4 wrapper) for Supabase read/write of personal record data
  - [ ] 3.2 Implement `fetchPersonalRecords(userId: string): Promise<PersonalRecordWithHistory[]>` — queries `progress_metrics` where `metric_type` starts with "record\_", reconstructs the full record objects with history from the `metadata` JSONB field
  - [ ] 3.3 Implement `saveNewRecords(userId: string, updatedRecords: PersonalRecordWithHistory[]): Promise<void>` — upserts updated records to `progress_metrics` with the new current value and appended history in `metadata`
  - [ ] 3.4 Verify JSONB metadata field correctly stores and retrieves the history array

- [ ] 4. Integrate record tracking with session lifecycle (AC: 1, 2)
  - [ ] 4.1 Create a hook `src/features/engagement/use-personal-records.ts` that manages record state and triggers detection on session end
  - [ ] 4.2 On session end, collect: max clean tempo from session (tempo where timing accuracy >85%), best timing accuracy for any drill or passage, max harmonic complexity score, current streak value (from Story 7.1)
  - [ ] 4.3 Call `detectNewRecords` with current records and session input
  - [ ] 4.4 If new records detected, update record history and persist. Dispatch new records to `sessionStore` so the SessionSummary can display them.
  - [ ] 4.5 Also dispatch new records to the achievement engine (Story 7.3) and XP calculator (Story 7.2) for cross-feature integration

- [ ] 5. Build personal records display components (AC: 2, 3)
  - [ ] 5.1 Create `src/components/personal-records.tsx` — `'use client'` component that displays the personal records board
  - [ ] 5.2 Layout as a grid of record cards, one per record type. Each card shows: record type label, current value with unit (e.g., "142 BPM"), date achieved, and an expandable history showing previous records
  - [ ] 5.3 Use athlete-stat aesthetic: clean typography, `--text-primary` for values, `--text-secondary` for labels and dates, `--bg-secondary` card backgrounds, 0px border radius, `--border-subtle` separators between history entries
  - [ ] 5.4 Integrate record highlights into the SessionSummary component: when a new record is detected in the current session, show it with `--accent-success` left border (2px) and "New record" label + old vs. new comparison
  - [ ] 5.5 No exclamation marks, no "Congratulations!", no special animations — just the facts: "New record: 142 BPM clean tempo (previous: 128 BPM)"
  - [ ] 5.6 Integrate the records board into the settings/profile/progress page, accessible from main navigation
  - [ ] 5.7 Add accessibility: each record card has descriptive `aria-label` (e.g., "Clean tempo personal record: 142 beats per minute, set on February 10, 2026"), history entries have clear labels

- [ ] 6. Write co-located tests (AC: 1, 6)
  - [ ] 6.1 Create `src/features/engagement/record-tracker.test.ts` — test record detection for all four record types: new record set, no new record (below existing), exact tie (should not trigger), first session (all become initial records)
  - [ ] 6.2 Test multiple records broken in one session: verify each is independently detected and tracked
  - [ ] 6.3 Test record broken multiple times in same session: only the best value from that session is stored
  - [ ] 6.4 Test history preservation: verify previous records are appended to history, never deleted
  - [ ] 6.5 Test clean tempo threshold: verify that tempo is only counted as "clean" when timing accuracy exceeds 85%
  - [ ] 6.6 Create `src/components/personal-records.test.tsx` — verify record card rendering, new record highlight rendering, history expansion, accessibility labels

## Dev Notes

- **Architecture Layer**: `record-tracker.ts` is Layer 3 (Domain Logic) — pure detection functions, no side effects. `record-service.ts` is Layer 4 (Infrastructure) — handles Supabase JSONB read/write. `use-personal-records.ts` is Layer 2 (Application Logic). `personal-records.tsx` is Layer 1 (Presentation).
- **Athlete-Stats Aesthetic**: Personal records should feel like looking at a runner's personal best board at their gym. Clean, precise, dated. "142 BPM — Feb 10, 2026" not "You smashed your speed record!" The visual reference is a Strava PR list: metric name, value, date, history. That is all. No emojis, no celebrations, no animations.
- **"Clean Tempo" Definition**: A tempo is "clean" only if timing accuracy exceeds 85% at that tempo. A user who plays at 180 BPM but with 60% accuracy does not set a clean tempo record. This prevents incentivizing sloppy fast playing. The threshold is configurable via `CLEAN_TEMPO_ACCURACY_THRESHOLD`.
- **Ties Do Not Replace**: If the user matches their existing record exactly, it is NOT recorded as a new record. The record must be strictly exceeded. This prevents unnecessary notifications and history entries for non-improvements.
- **JSONB History Pattern**: The `metadata` JSONB field in `progress_metrics` stores the record history as an array: `[{ value: 128, date: "2026-02-08T...", sessionId: "..." }, ...]`. This avoids creating a separate history table and keeps all record data in one row per record type. The array is appended to, never modified. Consider limiting history length (e.g., keep last 50 entries) to prevent unbounded growth, though this is unlikely to be an issue at MVP scale.
- **Cross-Feature Integration**: New personal records feed into: (a) XP calculator (Story 7.2) for record bonus XP, (b) achievement engine (Story 7.3) for record-based achievement triggers, (c) session summary for display, and (d) weekly summary (Story 7.5) for "records set this week" count. The `use-personal-records.ts` hook dispatches new records to the relevant stores/hooks.
- **First-Session Bootstrapping**: On the user's first session, all metrics become initial records with empty history. This means every user starts with records to beat. The display for first records should not show "previous" since there is none — just "First record: 82 BPM clean tempo".
- **Harmonic Complexity Score**: The "most complex chord progression handled" is measured as the number of unique chord types (e.g., Cmaj, Am7, Dm, G7 = 4 types) in a progression that the user navigated with >70% accuracy. This is a simplified complexity metric that can be refined later.
- **Library Versions**: Zustand 5.x for state, Supabase client SDK for DB (JSONB support). No additional dependencies.
- **Testing**: Vitest for unit tests, React Testing Library for component tests. Record detection is entirely pure functions — test all boundary conditions exhaustively. The JSONB history pattern should be tested for correct append behavior.

### Project Structure Notes

- `src/features/engagement/engagement-types.ts` — extended with personal record types (PersonalRecordType, PersonalRecord, RecordHistoryEntry, PersonalRecordWithHistory)
- `src/features/engagement/record-tracker.ts` — record detection logic (pure functions)
- `src/features/engagement/record-tracker.test.ts` — co-located tests
- `src/features/engagement/record-service.ts` — Supabase persistence wrapper for records (JSONB handling)
- `src/features/engagement/use-personal-records.ts` — React hook for record state and session-end detection
- `src/components/personal-records.tsx` — personal records board UI component
- `src/components/personal-records.test.tsx` — co-located component test
- `src/features/engagement/index.ts` — barrel export updated
- `src/lib/constants.ts` — extended with record-related constants

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — `progress_metrics` table with JSONB metadata, Supabase PostgreSQL, RLS policies
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — naming conventions, co-located tests, Layer 3 boundary rules
- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.6] — acceptance criteria and FR39 coverage
- [Source: _bmad-output/planning-artifacts/prd.md#Session Management] — FR39: personal records for fastest clean run, longest streak, accuracy milestones
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#SessionSummary] — personal record highlight in session summary with `--accent-success` glow
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation] — `--accent-success` for improvement indicators and personal records
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Inspiration Strategy] — Strava factual summaries, athlete-stat presentation, "precise, personal, worth tracking"
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Anti-Patterns] — "Score-based assessment" anti-pattern: only trajectory metrics and personal records, no grades

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
