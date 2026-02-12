# Story 5.3: Progressive Overload and Cross-Session Recalibration

Status: ready-for-dev

## Story

As a musician,
I want increasing challenge over time with cross-session memory,
So I keep improving without hitting plateaus.

## Acceptance Criteria

1. **Given** the user returns for a new session, **When** the Difficulty Engine initializes, **Then** `progressive-overload.ts` loads the user's cumulative `SkillProfile` from Supabase (via `progress_metrics` table) and computes starting `DifficultyParameters` calibrated to their historical performance. **And** the starting difficulty is NOT reset to default — it reflects the user's accumulated skill level.

2. **Given** the user has session history, **When** the progressive overload system computes next-session difficulty, **Then** it increases only one dimension at a time (e.g., tempo OR harmonic complexity OR key difficulty — never multiple simultaneously). **And** the increase amount is small and proportional to growth zone stability in the previous session (more stable = slightly bigger step).

3. **Given** the user has completed 3+ sessions, **When** the `/api/ai/analyze` endpoint is called for cross-session recalibration, **Then** it sends the user's `SkillProfile` history, recent session summaries, and tendency data to the LLM via Vercel AI SDK `generateObject`. **And** the LLM returns a `RecalibrationResult` (validated by Zod schema) containing: recommended dimension to focus on, suggested parameter adjustments, and detected plateau indicators. **And** the response is received within 2 seconds (NFR4-adjacent).

4. **Given** the LLM detects that a skill dimension has plateaued (no improvement over 3+ sessions), **When** the recalibration result is processed, **Then** `progressive-overload.ts` flags the plateau and adjusts strategy: switching the focus dimension, suggesting different exercise approaches, or reducing the overload increment on the plateaued dimension. **And** plateau detection data is available for drill generation (Story 5.4) and coaching (Epic 4).

5. **Given** the user has local session data in Dexie.js and server data in Supabase, **When** a new session begins, **Then** the progressive overload system reconciles local and server skill profiles by taking the most recently updated values. **And** if a sync conflict exists, the more recent `lastAssessedAt` timestamp wins.

## Tasks / Subtasks

- [ ] Task 1: Extend difficulty types for progressive overload (AC: 1, 2, 4)
  - [ ] Add `OverloadStrategy` type to `difficulty-types.ts`: `{ focusDimension: SkillDimension; incrementScale: number; plateauFlags: Record<SkillDimension, boolean>; sessionsSinceLastRecalibration: number }`
  - [ ] Add `RecalibrationResult` type: `{ recommendedFocus: SkillDimension; parameterAdjustments: Partial<DifficultyParameters>; plateauDimensions: SkillDimension[]; reasoning: string }`
  - [ ] Add `ProgressiveOverloadConfig` constants: `MAX_INCREMENT_SCALE`, `PLATEAU_SESSION_THRESHOLD` (default 3), `RECALIBRATION_INTERVAL` (default every 5 sessions)

- [ ] Task 2: Implement `progressive-overload.ts` (AC: 1, 2, 4)
  - [ ] Create `src/features/difficulty/progressive-overload.ts`
  - [ ] Implement `loadAndInitialize(userId: string): Promise<DifficultyParameters>` — loads skill profile from Supabase, computes starting parameters
  - [ ] Implement `computeOverloadStep(skillProfile, previousSessionStats): DifficultyAdjustment` — determines next-session difficulty increment
  - [ ] Implement `selectFocusDimension(skillProfile, overloadStrategy): SkillDimension` — picks the dimension to increase based on weakest dimension with sufficient confidence, avoiding plateaued dimensions
  - [ ] Implement `detectPlateaus(profileHistory: SkillProfile[]): Record<SkillDimension, boolean>` — compares profiles across sessions to find stalled dimensions
  - [ ] Implement `handlePlateau(dimension, currentStrategy): OverloadStrategy` — switches focus, adjusts approach
  - [ ] Implement `reconcileProfiles(local: SkillProfile, server: SkillProfile): SkillProfile` — merges by most recent `lastAssessedAt` per dimension

- [ ] Task 3: Implement `/api/ai/analyze` route for cross-session recalibration (AC: 3)
  - [ ] Create `src/app/api/ai/analyze/route.ts`
  - [ ] Define Zod schema for `RecalibrationResult` in `src/lib/ai/schemas.ts`:
    ```typescript
    const RecalibrationResultSchema = z.object({
      recommendedFocus: z.enum(['timing_accuracy', 'harmonic_complexity', 'technique_range', 'speed', 'genre_familiarity']),
      parameterAdjustments: z.object({
        tempo: z.number().optional(),
        harmonicComplexity: z.number().optional(),
        keyDifficulty: z.number().optional(),
        rhythmicDensity: z.number().optional(),
      }),
      plateauDimensions: z.array(z.string()),
      reasoning: z.string(),
    });
    ```
  - [ ] Implement POST handler: authenticate user, decrypt API key, build prompt with skill profile history and session summaries
  - [ ] Use Vercel AI SDK `generateObject` with the Zod schema for structured output
  - [ ] Build system prompt for recalibration in `src/lib/ai/prompts.ts`: include Studio Engineer persona, growth mindset framing, and musical pedagogy context
  - [ ] Handle errors: `INVALID_KEY`, `RATE_LIMITED`, `PROVIDER_DOWN`, `GENERATION_FAILED` with structured `ApiResponse` format
  - [ ] Enforce rate limiting (100 req/min per user, NFR13)

- [ ] Task 4: Implement Dexie ↔ Supabase profile sync (AC: 5)
  - [ ] Add skill profile storage to Dexie schema in `src/lib/dexie/db.ts` (if not already present)
  - [ ] Implement `syncSkillProfile(userId)` in progressive-overload or in `src/lib/dexie/sync.ts`
  - [ ] On session start: load from Supabase, compare with local, reconcile, store merged result locally
  - [ ] On session end: save updated profile to both Dexie and queue Supabase sync
  - [ ] Handle offline scenario: use local profile if Supabase unreachable, queue sync for later

- [ ] Task 5: Wire progressive overload into session initialization (AC: 1, 5)
  - [ ] Add `overloadStrategy: OverloadStrategy | null` to `sessionStore`
  - [ ] On session start (in `session-manager.ts` or equivalent): call `loadAndInitialize` to get starting parameters
  - [ ] If user has 3+ sessions and recalibration interval reached: trigger `/api/ai/analyze` call
  - [ ] Store recalibration result in `sessionStore` for use by drill generation and coaching context

- [ ] Task 6: Write co-located tests (AC: 1, 2, 4)
  - [ ] Create `src/features/difficulty/progressive-overload.test.ts`
  - [ ] Test: first session with no history returns default parameters
  - [ ] Test: returning user gets parameters calibrated to their skill profile
  - [ ] Test: overload step increases only one dimension
  - [ ] Test: overload increment scales with growth zone stability
  - [ ] Test: plateau detected after 3 sessions with < 2% improvement on a dimension
  - [ ] Test: plateau handling switches focus dimension
  - [ ] Test: profile reconciliation takes most recent `lastAssessedAt` per dimension
  - [ ] Test: offline fallback uses local profile correctly

## Dev Notes

- **Architecture Layer**: This story spans Layers 3 and 4. `progressive-overload.ts` core logic (plateau detection, overload computation, focus selection) is Layer 3 domain logic — pure functions. The `/api/ai/analyze` route is Layer 4 infrastructure. The Supabase/Dexie sync is Layer 4. Session initialization wiring is Layer 2.

- **Cross-Session Recalibration via LLM**: The LLM is used for nuanced pattern analysis that rules-based code struggles with. For example, detecting that a user plays great timing in C major but terrible timing in Ab major (key-dependent weakness). The LLM receives:
  ```typescript
  const recalibrationPrompt = {
    skillProfileHistory: last5ProfileSnapshots,
    sessionSummaries: last5SessionSummaries,
    tendencyData: userTendencies,
    currentOverloadStrategy: currentStrategy,
  };
  ```
  The system prompt instructs the LLM to act as a music pedagogy expert and return structured recommendations.

- **Zod Schema for `generateObject`**: The schema is defined in `src/lib/ai/schemas.ts` and shared between the API route (server-side validation) and the client (type inference). Example usage with Vercel AI SDK 6.x:
  ```typescript
  import { generateObject } from 'ai';
  import { RecalibrationResultSchema } from '@/lib/ai/schemas';

  const result = await generateObject({
    model: provider(modelId),
    schema: RecalibrationResultSchema,
    prompt: buildRecalibrationPrompt(profileHistory, sessionSummaries),
    system: RECALIBRATION_SYSTEM_PROMPT,
  });
  ```

- **Recalibration System Prompt** (for `src/lib/ai/prompts.ts`):
  ```
  You are a music pedagogy expert and practice coach. Analyze the musician's
  skill profile history and recent sessions. Identify:
  1. Which skill dimension would benefit most from focused practice
  2. Whether any dimensions have plateaued (no meaningful improvement over 3+ sessions)
  3. Specific parameter adjustments for the next session

  Return structured recommendations. Be specific about musical context.
  Use growth mindset framing — plateaus are opportunities to try different approaches,
  not failures.
  ```

- **Progressive Overload Increment Logic**:
  ```typescript
  // Base increment per dimension (per session)
  const BASE_INCREMENTS = {
    tempo: 3,                    // +3 BPM per session
    harmonicComplexity: 0.03,    // +3% complexity
    keyDifficulty: 0.05,         // Slightly harder key
    rhythmicDensity: 0.03,       // +3% density
    noteRange: 0.02,             // Slightly wider range
  };

  // Scale by growth zone stability (0.0 to 1.5x)
  // If user was in growth zone for 80%+ of reps: scale = 1.2
  // If user struggled: scale = 0.5
  const scaledIncrement = BASE_INCREMENTS[dimension] * stabilityScale;
  ```

- **Plateau Detection**: A dimension is considered plateaued when:
  ```typescript
  const PLATEAU_THRESHOLD = 0.02; // <2% improvement
  const PLATEAU_SESSIONS = 3;     // Over 3 sessions

  function isPlateaued(history: DimensionScore[]): boolean {
    if (history.length < PLATEAU_SESSIONS) return false;
    const recent = history.slice(-PLATEAU_SESSIONS);
    const improvement = recent[recent.length - 1].value - recent[0].value;
    return Math.abs(improvement) < PLATEAU_THRESHOLD;
  }
  ```

- **API Route Pattern**: Follow the architecture's standard API route structure:
  ```typescript
  export async function POST(request: Request) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return Response.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Sign in to continue.' } }, { status: 401 });
      }
      // ... decrypt key, call LLM, return result
      return Response.json({ data: result, error: null });
    } catch (error) {
      // ... Sentry, structured error
    }
  }
  ```

- **Dependency Chain**: Story 5.1 (skill profile) → THIS STORY → Story 5.4 (drill generation uses overload strategy). The `/api/ai/analyze` route also depends on Epic 3 (API key management) and Story 4.1 (Vercel AI SDK setup).

### Project Structure Notes

```
src/features/difficulty/
├── difficulty-types.ts               # Extended with OverloadStrategy, RecalibrationResult
├── skill-assessor.ts                 # Story 5.1
├── difficulty-engine.ts              # Story 5.2
├── growth-zone-detector.ts           # Story 5.2
├── progressive-overload.ts           # Cross-session overload logic (this story)
├── progressive-overload.test.ts      # Co-located tests (this story)
└── index.ts                          # Barrel export (update)

src/app/api/ai/analyze/route.ts       # Cross-session recalibration endpoint (this story)
src/lib/ai/schemas.ts                 # RecalibrationResultSchema (this story)
src/lib/ai/prompts.ts                 # RECALIBRATION_SYSTEM_PROMPT (this story)
src/stores/session-store.ts           # Add overloadStrategy state
src/lib/dexie/db.ts                   # Add skill profile storage (if needed)
src/lib/dexie/sync.ts                 # Profile sync logic (if needed)
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — API route patterns, Vercel AI SDK `generateObject`
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — Dexie ↔ Supabase sync strategy
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — Error handling, API response format
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.3] — Full story definition with AC
- [Source: _bmad-output/planning-artifacts/prd.md#FR16] — Progressive overload requirement
- [Source: _bmad-output/planning-artifacts/prd.md#FR18] — Cross-session recalibration requirement
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Effortless Interactions] — Difficulty calibration is always automatic

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
