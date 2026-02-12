# Story 5.1: Multi-Dimensional Skill Assessment

Status: ready-for-dev

## Story

As a musician,
I want Minstrel to understand my skill level across multiple dimensions,
So that challenges are calibrated to my actual abilities.

## Acceptance Criteria

1. **Given** the user has completed at least one session with analysis data (notes, chords, timing from Epic 2), **When** the skill assessor runs after session completion, **Then** `skill-assessor.ts` produces a `SkillProfile` object covering five dimensions: timing accuracy, harmonic complexity handled, technique range (chord types and intervals used), speed (max clean tempo), and genre familiarity. **And** the assessment is derived from actual session data stored in `sessionStore` and Dexie.js.

2. **Given** a `SkillProfile` is generated, **When** each dimension is scored, **Then** every dimension uses a continuous floating-point scale (0.0 to 1.0) — not discrete levels like "beginner/intermediate/advanced." **And** each dimension includes a `confidence` value (0.0 to 1.0) that increases with more data points.

3. **Given** the user completes a new session, **When** the skill assessor processes the latest session data, **Then** the profile updates incrementally by blending new session data with the existing profile using an exponentially weighted moving average (recent sessions weighted more heavily). **And** the update runs without blocking the UI.

4. **Given** the user has an account and is authenticated, **When** the skill profile is computed, **Then** the in-session profile is stored in `sessionStore` for real-time access by the Difficulty Engine. **And** the cross-session profile is persisted to the `progress_metrics` table in Supabase with columns for each dimension and a `last_assessed_at` timestamp. **And** the local Dexie.js copy syncs to Supabase via the existing sync layer.

5. **Given** known performance data sets (test fixtures), **When** co-located unit tests execute, **Then** `skill-assessor.test.ts` validates that: a beginner fixture (simple chords, slow tempo, wide timing variance) scores low on all dimensions; an intermediate fixture (jazz voicings, moderate tempo, tight timing) scores high on harmonic complexity and timing; and dimension scores change appropriately when new session data is blended in.

## Tasks / Subtasks

- [ ] Task 1: Define skill profile types in `src/features/difficulty/difficulty-types.ts` (AC: 1, 2)
  - [ ] Define `SkillDimension` enum: `TimingAccuracy`, `HarmonicComplexity`, `TechniqueRange`, `Speed`, `GenreFamiliarity`
  - [ ] Define `DimensionScore` type: `{ value: number; confidence: number; dataPoints: number; lastUpdated: string }`
  - [ ] Define `SkillProfile` type: `Record<SkillDimension, DimensionScore>` with `userId`, `profileVersion`, `lastAssessedAt`
  - [ ] Define `SessionPerformanceData` type for raw input to the assessor (from analysis results)

- [ ] Task 2: Implement `skill-assessor.ts` core assessment logic (AC: 1, 2, 3)
  - [ ] Create `src/features/difficulty/skill-assessor.ts`
  - [ ] Implement `assessTimingAccuracy(sessionData)` — compute from timing deviation data, normalize to 0.0-1.0
  - [ ] Implement `assessHarmonicComplexity(sessionData)` — score based on chord types used (triads=low, extended=high, altered=very high)
  - [ ] Implement `assessTechniqueRange(sessionData)` — score based on diversity of chord types, intervals, and note range
  - [ ] Implement `assessSpeed(sessionData)` — normalize max clean tempo (error rate < threshold) to 0.0-1.0 scale
  - [ ] Implement `assessGenreFamiliarity(sessionData)` — score based on genre-detector output and variety of genre patterns played
  - [ ] Implement `createSkillProfile(sessionData)` — assemble all dimensions into a `SkillProfile`
  - [ ] Implement `blendProfiles(existing, newSession, alpha)` — exponentially weighted moving average with configurable alpha (default 0.3 for recent-session emphasis)
  - [ ] Implement `updateConfidence(existing, newDataPoints)` — confidence increases asymptotically toward 1.0 with more data

- [ ] Task 3: Integrate with `sessionStore` for in-session access (AC: 4)
  - [ ] Add `skillProfile: SkillProfile | null` to `sessionStore` state
  - [ ] Add `setSkillProfile` and `updateSkillProfile` actions to `sessionStore`
  - [ ] Trigger skill assessment after session snapshot generation (connect to `snapshot-generator.ts` output from Story 2.5)
  - [ ] Ensure `sessionStore` updates are non-blocking (use `queueMicrotask` or similar)

- [ ] Task 4: Implement cross-session persistence to Supabase (AC: 4)
  - [ ] Add skill profile columns to `progress_metrics` table: `timing_accuracy`, `harmonic_complexity`, `technique_range`, `speed`, `genre_familiarity`, each with `_value` and `_confidence` suffixes, plus `last_assessed_at`
  - [ ] Create Supabase migration `xxx_skill_profile_columns.sql` for new columns (or ensure they exist from Story 3.1 schema)
  - [ ] Implement `loadSkillProfile(userId)` — reads from Supabase `progress_metrics`
  - [ ] Implement `saveSkillProfile(userId, profile)` — upserts to Supabase `progress_metrics`
  - [ ] Store local copy in Dexie.js for offline access; sync on reconnection

- [ ] Task 5: Write co-located tests (AC: 5)
  - [ ] Create `src/features/difficulty/skill-assessor.test.ts`
  - [ ] Create test fixtures in `src/test-utils/skill-fixtures.ts`: beginner performance data, intermediate performance data, advanced performance data
  - [ ] Test: beginner fixture scores all dimensions below 0.3
  - [ ] Test: intermediate fixture scores timing and harmonic complexity above 0.5
  - [ ] Test: `blendProfiles` correctly weights new data (alpha=0.3 gives 30% weight to new session)
  - [ ] Test: confidence increases with more data points
  - [ ] Test: profile is immutable — `blendProfiles` returns a new object, does not mutate existing

## Dev Notes

- **This is the foundation of the Difficulty Engine.** Every other story in Epic 5 depends on the `SkillProfile` produced here. Get the types and interfaces right first — they are the contract for Stories 5.2 through 5.7.

- **Architecture Layer**: This is Domain Logic (Layer 3). `skill-assessor.ts` must be a pure function module with no framework imports, no UI, no infrastructure. It receives `SessionPerformanceData` and returns `SkillProfile`. The `sessionStore` integration (Layer 2) and Supabase persistence (Layer 4) are separate concerns wired in by the application layer.

- **Exponentially Weighted Moving Average (EWMA)**: The blending formula for each dimension is:
  ```typescript
  newValue = alpha * sessionScore + (1 - alpha) * existingScore;
  ```
  Where `alpha = 0.3` by default. This means 30% weight to the most recent session, 70% to history. This prevents a single bad session from destroying a built-up profile while still being responsive to real improvement.

- **Continuous Scale Design**: The 0.0 to 1.0 scale is intentional — the Difficulty Engine (Story 5.2) uses these continuous values for smooth difficulty curves. Discrete levels would create jarring jumps. The mapping is:
  - `0.0 - 0.2` — beginner range
  - `0.2 - 0.5` — developing
  - `0.5 - 0.75` — competent
  - `0.75 - 1.0` — advanced
  These labels are NEVER shown to the user — they are internal references only.

- **Confidence Tracking**: Each dimension has a `confidence` value that approaches 1.0 asymptotically:
  ```typescript
  confidence = 1 - Math.exp(-dataPoints / CONFIDENCE_RATE);
  // CONFIDENCE_RATE = 10 means ~63% confidence after 10 data points, ~95% after 30
  ```
  The Difficulty Engine (Story 5.2) uses confidence to determine how aggressively to adjust — low confidence = more cautious adjustments.

- **Dependency on Epic 2 analysis outputs**: `SessionPerformanceData` is assembled from:
  - `timing-analyzer.ts` (Story 2.2) — timing deviation metrics
  - `chord-analyzer.ts` (Story 2.1) — chord types and progressions
  - `harmonic-analyzer.ts` (Story 2.3) — key detection and harmonic function
  - `genre-detector.ts` (Story 2.4) — genre pattern recognition
  - `tendency-tracker.ts` (Story 2.4) — comfort zones and avoidance patterns

- **Supabase `progress_metrics` table**: This table may already exist from Story 3.1. If so, add columns via migration. If not, create the table. Key schema:
  ```sql
  -- progress_metrics table (may already exist)
  ALTER TABLE progress_metrics
    ADD COLUMN timing_accuracy_value FLOAT DEFAULT 0,
    ADD COLUMN timing_accuracy_confidence FLOAT DEFAULT 0,
    ADD COLUMN harmonic_complexity_value FLOAT DEFAULT 0,
    ADD COLUMN harmonic_complexity_confidence FLOAT DEFAULT 0,
    ADD COLUMN technique_range_value FLOAT DEFAULT 0,
    ADD COLUMN technique_range_confidence FLOAT DEFAULT 0,
    ADD COLUMN speed_value FLOAT DEFAULT 0,
    ADD COLUMN speed_confidence FLOAT DEFAULT 0,
    ADD COLUMN genre_familiarity_value FLOAT DEFAULT 0,
    ADD COLUMN genre_familiarity_confidence FLOAT DEFAULT 0,
    ADD COLUMN last_assessed_at TIMESTAMPTZ DEFAULT now();
  ```

- **Zustand Pattern**: Use selective selectors when reading from `sessionStore`:
  ```typescript
  const skillProfile = useSessionStore((s) => s.skillProfile);
  ```

- **No UI in this story.** The skill profile is consumed by the Difficulty Engine (Story 5.2), drill generation (Story 5.4), and warm-up generation (Story 5.7). No user-facing display of skill dimensions.

### Project Structure Notes

```
src/features/difficulty/
├── difficulty-types.ts          # SkillProfile, DimensionScore, SkillDimension types (this story)
├── skill-assessor.ts            # Core assessment logic (this story)
├── skill-assessor.test.ts       # Co-located tests (this story)
├── difficulty-engine.ts         # Story 5.2
├── growth-zone-detector.ts      # Story 5.2
├── progressive-overload.ts      # Story 5.3
└── index.ts                     # Barrel export (this story — add entries as files are created)

src/stores/session-store.ts      # Add skillProfile state + actions
src/test-utils/skill-fixtures.ts # Test fixtures for skill assessment
supabase/migrations/             # Migration for progress_metrics skill columns
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — progress_metrics table schema
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — Zustand store patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries] — Layer 3 domain logic rules
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.1] — Full story definition
- [Source: _bmad-output/planning-artifacts/prd.md#FR14] — Multi-dimensional skill assessment requirement
- [Source: _bmad-output/planning-artifacts/prd.md#Critical Quality Gate] — Difficulty Engine must be perfect at launch

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
