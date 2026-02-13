# Story 5.2: Dynamic Difficulty Adjustment and Growth Zone Detection

Status: ready-for-dev

## Story

As a musician,
I want difficulty to adjust in real time based on how I'm performing,
So I'm always challenged but never frustrated.

## Acceptance Criteria

1. **Given** the user is attempting a drill or exercise, **When** the Difficulty Engine processes real-time performance data from the current drill rep, **Then** `difficulty-engine.ts` computes updated challenge parameters (tempo, harmonic complexity, key, rhythmic density) based on the user's current `SkillProfile` and in-session performance. **And** the adjusted parameters are stored in `sessionStore` for consumption by drill generation and warm-up systems.

2. **Given** the user is performing drills, **When** `growth-zone-detector.ts` evaluates performance across consecutive repetitions, **Then** it detects "too easy" when accuracy exceeds 90% for 3 or more consecutive reps and signals difficulty should increase. **And** it detects "too hard" when accuracy drops below 40% for 3 or more consecutive reps and signals difficulty should decrease. **And** it detects "growth zone" when accuracy is between 60% and 85% and signals to maintain current difficulty.

3. **Given** the growth zone target is 60-85% accuracy, **When** the Difficulty Engine adjusts parameters, **Then** adjustments aim to keep the user within this zone. **And** adjustments are proportional — small increments when near the zone edges, larger adjustments when far outside the zone.

4. **Given** the UX principle "Show, Don't Configure," **When** difficulty changes, **Then** there are no sliders, level selectors, difficulty labels, or any user-visible configuration. **And** the user never sees "Easy," "Medium," "Hard" or any equivalent. **And** difficulty adjustments are completely invisible to the user.

5. **Given** the user is mid-exercise, **When** a difficulty adjustment is triggered, **Then** the adjustment is queued and applied only between drill repetitions — never mid-exercise. **And** the transition to new parameters is smooth (no jarring jumps).

6. **Given** simulated performance data sets, **When** co-located unit tests execute, **Then** `difficulty-engine.test.ts` validates that: consistently high accuracy triggers difficulty increase after 3 reps; consistently low accuracy triggers difficulty decrease after 3 reps; fluctuating accuracy within growth zone triggers no change; and difficulty parameters change by appropriate increments. **And** `growth-zone-detector.test.ts` validates zone detection thresholds with edge cases (exactly 40%, exactly 90%, exactly 60%, exactly 85%).

## Tasks / Subtasks

- [ ] Task 1: Define difficulty engine types in `difficulty-types.ts` (AC: 1, 4)
  - [ ] Define `DifficultyParameters` type: `{ tempo: number; harmonicComplexity: number; keyDifficulty: number; rhythmicDensity: number; noteRange: number }`
  - [ ] Define `DifficultyAdjustment` type: `{ parameter: keyof DifficultyParameters; direction: 'increase' | 'decrease' | 'maintain'; magnitude: number }`
  - [ ] Define `GrowthZoneStatus` enum: `TooEasy`, `GrowthZone`, `TooHard`
  - [ ] Define `RepPerformance` type: `{ repNumber: number; accuracy: number; timingDeviation: number; completedAt: string }`
  - [ ] Define `DifficultyState` type for `sessionStore`: `{ currentParameters: DifficultyParameters; zoneStatus: GrowthZoneStatus; repHistory: RepPerformance[]; pendingAdjustment: DifficultyAdjustment | null }`

- [ ] Task 2: Implement `growth-zone-detector.ts` (AC: 2, 3)
  - [ ] Create `src/features/difficulty/growth-zone-detector.ts`
  - [ ] Implement `detectZone(repHistory: RepPerformance[]): GrowthZoneStatus` — evaluates last N reps (configurable, default 3)
  - [ ] Implement `isTooEasy(recentReps)` — returns `true` if all reps above 90% accuracy
  - [ ] Implement `isTooHard(recentReps)` — returns `true` if all reps below 40% accuracy
  - [ ] Implement `isInGrowthZone(recentReps)` — returns `true` if average accuracy between 60% and 85%
  - [ ] Implement `getAccuracyTrend(repHistory)` — returns `'improving' | 'declining' | 'stable'` for the Difficulty Engine to use

- [ ] Task 3: Implement `difficulty-engine.ts` core adjustment logic (AC: 1, 3, 5)
  - [ ] Create `src/features/difficulty/difficulty-engine.ts`
  - [ ] Implement `initializeDifficulty(skillProfile: SkillProfile): DifficultyParameters` — converts skill profile to starting parameters
  - [ ] Implement `computeAdjustment(zoneStatus, currentParams, skillProfile): DifficultyAdjustment` — determines which parameter to adjust and by how much
  - [ ] Implement `applyAdjustment(currentParams, adjustment): DifficultyParameters` — produces new parameters from adjustment
  - [ ] Implement proportional adjustment logic: small increments near zone edges (e.g., tempo +/- 2-5 BPM), larger when far outside (e.g., +/- 10-15 BPM)
  - [ ] Implement single-dimension adjustment: only change ONE parameter per adjustment (tempo OR complexity OR key, never multiple simultaneously)
  - [ ] Implement adjustment queuing: return `pendingAdjustment` that is applied only when `applyBetweenReps()` is called

- [ ] Task 4: Integrate with `sessionStore` (AC: 1, 5)
  - [ ] Add `difficultyState: DifficultyState | null` to `sessionStore`
  - [ ] Add actions: `initDifficulty(skillProfile)`, `recordRepPerformance(rep)`, `evaluateAndAdjust()`, `applyPendingAdjustment()`
  - [ ] `recordRepPerformance` appends to `repHistory` and triggers `evaluateAndAdjust`
  - [ ] `evaluateAndAdjust` runs growth zone detection and computes adjustment (stores as pending)
  - [ ] `applyPendingAdjustment` applies the pending adjustment and clears it (called between reps by drill-player)
  - [ ] Ensure all store updates use immutable patterns per architecture

- [ ] Task 5: Write co-located tests (AC: 6)
  - [ ] Create `src/features/difficulty/difficulty-engine.test.ts`
  - [ ] Create `src/features/difficulty/growth-zone-detector.test.ts`
  - [ ] Test: 3 reps at 95% accuracy → `GrowthZoneStatus.TooEasy`
  - [ ] Test: 3 reps at 30% accuracy → `GrowthZoneStatus.TooHard`
  - [ ] Test: 3 reps at 72% accuracy → `GrowthZoneStatus.GrowthZone`
  - [ ] Test: mixed reps [95%, 40%, 70%] → no adjustment (inconsistent data)
  - [ ] Test: edge cases at exactly 40%, 60%, 85%, 90% boundaries
  - [ ] Test: `initializeDifficulty` converts low skill profile to easy parameters
  - [ ] Test: `computeAdjustment` for TooEasy returns increase adjustment
  - [ ] Test: `computeAdjustment` for TooHard returns decrease adjustment
  - [ ] Test: adjustment changes only one parameter at a time
  - [ ] Test: adjustment magnitude is proportional to distance from growth zone

## Dev Notes

- **This is the heart of the Difficulty Engine** — the critical quality gate for launch. The growth zone detection and dynamic adjustment must be precise and well-tested. The PRD states: "The Difficulty Engine must be _perfect_ at launch. If challenge calibration is off — too easy or too hard — the core value proposition fails."

- **Architecture Layer**: Domain Logic (Layer 3). Both `difficulty-engine.ts` and `growth-zone-detector.ts` are pure function modules. They receive data and return results — no side effects, no framework imports. Store integration is in the application layer (Task 4).

- **Growth Zone Constants**:

  ```typescript
  const GROWTH_ZONE = {
    TOO_EASY_THRESHOLD: 0.9, // >90% accuracy = too easy
    TOO_HARD_THRESHOLD: 0.4, // <40% accuracy = too hard
    ZONE_LOW: 0.6, // Growth zone lower bound
    ZONE_HIGH: 0.85, // Growth zone upper bound
    CONSECUTIVE_REPS: 3, // Reps needed to trigger adjustment
  } as const;
  ```

- **Proportional Adjustment Strategy**:

  ```typescript
  // Distance from nearest zone edge determines magnitude
  // Example for tempo adjustment:
  const ADJUSTMENT_SCALE = {
    tempo: { min: 2, max: 15 }, // BPM change range
    harmonicComplexity: { min: 0.05, max: 0.2 }, // complexity delta
    rhythmicDensity: { min: 0.05, max: 0.2 },
  };

  // If accuracy is 98% (8% above TOO_EASY_THRESHOLD of 90%):
  // distance = 0.98 - 0.90 = 0.08
  // normalizedDistance = 0.08 / 0.10 = 0.8 (capped at 1.0)
  // tempoIncrease = min + normalizedDistance * (max - min) = 2 + 0.8 * 13 = 12.4 BPM
  ```

- **Single-Dimension Adjustment Rule**: This is critical for the "invisible" feel. Changing multiple parameters at once creates jarring difficulty spikes. The engine should select the dimension most likely to move the user into the growth zone based on their `SkillProfile` weaknesses. Priority order:
  1. Tempo (most intuitive adjustment)
  2. Harmonic complexity (chord difficulty)
  3. Rhythmic density (note density)
  4. Key difficulty (less common keys)

- **Adjustment Queuing Pattern**: Adjustments are computed in real time but never applied mid-exercise:

  ```typescript
  // During rep: compute and store pending
  sessionStore.setState({ pendingAdjustment: adjustment });

  // Between reps (called by drill-player.ts):
  sessionStore.getState().applyPendingAdjustment();
  ```

- **UX Principle — "Show, Don't Configure"**: There is ZERO UI for difficulty. No settings, no sliders, no labels. The user's only signal that difficulty changed is that the next drill feels slightly different. This matches the Duolingo pattern of invisible adaptive difficulty cited in the UX spec.

- **Dependency**: Requires `SkillProfile` from Story 5.1. The `initializeDifficulty` function converts the profile into starting `DifficultyParameters`. Without a profile (first session), use sensible defaults that err on the side of easy.

- **Default Parameters (No Profile)**:
  ```typescript
  const DEFAULT_DIFFICULTY: DifficultyParameters = {
    tempo: 80, // Conservative starting tempo
    harmonicComplexity: 0.2, // Simple triads
    keyDifficulty: 0.1, // C major / A minor
    rhythmicDensity: 0.2, // Quarter/half notes
    noteRange: 0.3, // Single octave
  };
  ```

### Project Structure Notes

```
src/features/difficulty/
├── difficulty-types.ts               # Extended with DifficultyParameters, GrowthZoneStatus (this story)
├── skill-assessor.ts                 # Story 5.1
├── skill-assessor.test.ts            # Story 5.1
├── difficulty-engine.ts              # Core adjustment logic (this story)
├── difficulty-engine.test.ts         # Co-located tests (this story)
├── growth-zone-detector.ts           # Zone detection logic (this story)
├── growth-zone-detector.test.ts      # Co-located tests (this story)
├── progressive-overload.ts           # Story 5.3
└── index.ts                          # Barrel export (update)

src/stores/session-store.ts           # Add difficultyState + actions
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — Zustand store patterns, immutable updates
- [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries] — Layer 3 domain logic rules
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.2] — Full story definition with AC
- [Source: _bmad-output/planning-artifacts/prd.md#FR15] — Dynamic difficulty adjustment
- [Source: _bmad-output/planning-artifacts/prd.md#FR17] — Growth zone detection and maintenance
- [Source: _bmad-output/planning-artifacts/prd.md#Critical Quality Gate] — "Difficulty Engine must be perfect at launch"
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Experience Principles] — "Show, Don't Configure"
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX Pattern Analysis] — Duolingo invisible adaptive difficulty

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
