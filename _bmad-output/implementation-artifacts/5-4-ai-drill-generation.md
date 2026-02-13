# Story 5.4: AI Drill Generation

Status: ready-for-dev

## Story

As a musician,
I want personalized exercises from my specific weaknesses,
So every drill targets something I need.

## Acceptance Criteria

1. **Given** the analysis has identified a weakness (e.g., slow chord transitions, timing drift on beat 3, avoidance of minor keys), **When** a drill is requested (automatically after a session snapshot key insight, or manually by the user), **Then** `/api/ai/drill/route.ts` generates a targeted exercise using Vercel AI SDK `generateObject` with a Zod schema. **And** the generated drill includes: target skill description, sequence of notes/chords (as MIDI note numbers), target tempo (BPM), time signature, number of reps, and success criteria (timing threshold, accuracy target).

2. **Given** the drill generation request, **When** the LLM generates the drill, **Then** the response completes in under 2 seconds (NFR4). **And** the `drill-generator.ts` client-side module builds the request payload with full context: current `SkillProfile`, `DifficultyParameters`, weakness description, genre context, and previous drills for this weakness (to avoid repetition).

3. **Given** the same weakness has been drilled before, **When** a new drill is requested for that weakness, **Then** the system passes previous drill IDs and descriptions to the LLM prompt to ensure variety (FR21). **And** the LLM is instructed to vary: chord voicings, rhythmic patterns, key center, approach direction (ascending vs. descending), or exercise structure. **And** no two consecutive drills for the same weakness use identical note sequences.

4. **Given** the user's current `DifficultyParameters` from the Difficulty Engine (Story 5.2), **When** the drill is generated, **Then** the drill's complexity is calibrated to those parameters. **And** the target tempo matches the user's current tempo parameter (+/- 5 BPM). **And** harmonic complexity matches the user's current harmonic complexity level.

5. **Given** a drill is successfully generated, **When** stored, **Then** the drill data is persisted to the `drill_records` table in Supabase with columns: `id`, `user_id`, `session_id`, `target_skill`, `weakness_description`, `drill_data` (JSONB — full drill object), `difficulty_parameters` (JSONB), `status` (`generated` | `in_progress` | `completed` | `abandoned`), `created_at`. **And** a local copy is stored in Dexie.js for immediate access.

## Tasks / Subtasks

- [ ] Task 1: Define drill types in `src/features/drills/drill-types.ts` (AC: 1, 5)
  - [ ] Define `DrillNote` type: `{ midiNote: number; duration: number; velocity: number; startBeat: number }`
  - [ ] Define `DrillSequence` type: `{ notes: DrillNote[]; chordSymbols?: string[]; timeSignature: [number, number]; measures: number }`
  - [ ] Define `DrillSuccessCriteria` type: `{ timingThresholdMs: number; accuracyTarget: number; tempoToleranceBpm: number }`
  - [ ] Define `GeneratedDrill` type: `{ id: string; targetSkill: string; weaknessDescription: string; sequence: DrillSequence; targetTempo: number; successCriteria: DrillSuccessCriteria; reps: number; instructions: string; difficultyLevel: DifficultyParameters }`
  - [ ] Define `DrillRecord` type for database persistence: extends `GeneratedDrill` with `userId`, `sessionId`, `status`, `createdAt`, `completedAt`, `results`
  - [ ] Define `DrillGenerationRequest` type: `{ weakness: string; skillProfile: SkillProfile; difficultyParameters: DifficultyParameters; genreContext?: string; previousDrillIds?: string[] }`
  - [ ] Define `DrillPhase` enum: `Setup`, `Demonstrate`, `Listen`, `Attempt`, `Analyze`, `Complete`

- [ ] Task 2: Define Zod schema for LLM drill generation in `src/lib/ai/schemas.ts` (AC: 1)
  - [ ] Create `DrillGenerationSchema`:
    ```typescript
    const DrillGenerationSchema = z.object({
      targetSkill: z.string().describe('Specific skill this drill targets'),
      instructions: z.string().describe('Brief instruction for the musician'),
      sequence: z.object({
        notes: z.array(
          z.object({
            midiNote: z.number().min(21).max(108),
            duration: z.number().positive().describe('Duration in beats'),
            velocity: z.number().min(1).max(127),
            startBeat: z.number().min(0),
          })
        ),
        chordSymbols: z.array(z.string()).optional(),
        timeSignature: z.tuple([z.number(), z.number()]),
        measures: z.number().int().positive(),
      }),
      targetTempo: z.number().min(40).max(240),
      successCriteria: z.object({
        timingThresholdMs: z.number().positive(),
        accuracyTarget: z.number().min(0).max(1),
        tempoToleranceBpm: z.number().positive(),
      }),
      reps: z.number().int().min(1).max(20),
    });
    ```

- [ ] Task 3: Implement `drill-generator.ts` client-side request builder (AC: 2, 3, 4)
  - [ ] Create `src/features/drills/drill-generator.ts`
  - [ ] Implement `buildDrillRequest(weakness, sessionContext): DrillGenerationRequest` — assembles all context for the API call
  - [ ] Implement `getPreviousDrillsForWeakness(userId, weaknessDescription): Promise<string[]>` — queries drill_records for previous drills targeting the same weakness
  - [ ] Implement `requestDrill(request: DrillGenerationRequest): Promise<GeneratedDrill>` — calls `/api/ai/drill` and returns parsed result
  - [ ] Implement timeout handling: if generation exceeds 2s, show user "Still generating..." feedback
  - [ ] Add drill ID generation (`crypto.randomUUID()`) on successful response

- [ ] Task 4: Implement `/api/ai/drill/route.ts` server-side endpoint (AC: 1, 2, 3, 4)
  - [ ] Create `src/app/api/ai/drill/route.ts`
  - [ ] Authenticate user and validate session
  - [ ] Decrypt user's API key from Supabase
  - [ ] Build LLM prompt with:
    - System prompt (Studio Engineer persona, musical pedagogy context)
    - Weakness description and target skill
    - Current skill profile summary
    - Difficulty parameters (tempo, complexity constraints)
    - Previous drills for this weakness (to ensure variety)
    - Genre context if available
  - [ ] Call `generateObject` with `DrillGenerationSchema` and user's provider
  - [ ] Validate response against schema (Zod handles this automatically)
  - [ ] Return structured `ApiResponse<GeneratedDrill>`
  - [ ] Handle errors: `INVALID_KEY`, `RATE_LIMITED`, `PROVIDER_DOWN`, `GENERATION_FAILED`
  - [ ] Log generation time for NFR4 monitoring

- [ ] Task 5: Add drill generation system prompt to `src/lib/ai/prompts.ts` (AC: 1, 3)
  - [ ] Write `DRILL_GENERATION_SYSTEM_PROMPT` with:
    - Role: expert music practice coach and exercise designer
    - Constraints: generate exercises playable on standard MIDI instruments (piano range 21-108)
    - Variety instruction: when previous drills are provided, vary voicings, rhythmic patterns, key center, or approach direction
    - Difficulty calibration: match the provided tempo and complexity parameters
    - Musical validity: generated sequences must be musically coherent (not random notes)
    - Growth mindset: instructions should use encouraging, forward-looking language

- [ ] Task 6: Implement drill persistence (AC: 5)
  - [ ] Create Supabase migration for `drill_records` table (if not already from Story 3.1):
    ```sql
    CREATE TABLE drill_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) NOT NULL,
      session_id UUID REFERENCES sessions(id),
      target_skill TEXT NOT NULL,
      weakness_description TEXT NOT NULL,
      drill_data JSONB NOT NULL,
      difficulty_parameters JSONB NOT NULL,
      status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'in_progress', 'completed', 'abandoned')),
      results JSONB,
      created_at TIMESTAMPTZ DEFAULT now(),
      completed_at TIMESTAMPTZ
    );
    CREATE INDEX idx_drill_records_user_id ON drill_records(user_id);
    CREATE INDEX idx_drill_records_session_id ON drill_records(session_id);
    ```
  - [ ] Add RLS policy: users can only CRUD their own drill records
  - [ ] Add `drill_records` table to Dexie schema in `src/lib/dexie/db.ts`
  - [ ] Implement `saveDrill(drill: GeneratedDrill)` — saves to both Dexie and queues Supabase sync
  - [ ] Implement `updateDrillStatus(drillId, status)` — updates status in both stores

- [ ] Task 7: Write co-located tests (AC: 1, 2, 3)
  - [ ] Create `src/features/drills/drill-generator.test.ts`
  - [ ] Test: `buildDrillRequest` includes all required context fields
  - [ ] Test: `buildDrillRequest` includes previous drill IDs when available
  - [ ] Test: `requestDrill` handles API errors gracefully (returns structured error, not crash)
  - [ ] Test: `requestDrill` handles timeout (>2s) with appropriate feedback
  - [ ] Test: generated drill ID is a valid UUID
  - [ ] Create mock AI response fixtures in `e2e/fixtures/mock-ai-responses.ts` for drill generation

## Dev Notes

- **Architecture Layer**: `drill-generator.ts` is Layer 3 domain logic (request building, context assembly). `/api/ai/drill/route.ts` is Layer 4 infrastructure. Drill persistence spans Layers 3 and 4.

- **Zod Schema as Contract**: The `DrillGenerationSchema` in `src/lib/ai/schemas.ts` serves triple duty:
  1. **LLM constraint** — `generateObject` uses it to guide the LLM's structured output
  2. **Server validation** — Zod validates the LLM response automatically
  3. **Client types** — `z.infer<typeof DrillGenerationSchema>` generates TypeScript types
     This is the architecture's "validate at the boundary" pattern.

- **MIDI Note Numbers**: The schema constrains notes to 21-108 (standard 88-key piano range: A0 to C8). The `midiNote` field uses standard MIDI note numbers:
  - Middle C = 60
  - C3 = 48, C5 = 72
  - Guitar standard tuning: E2(40), A2(45), D3(50), G3(55), B3(59), E4(64)

- **Drill Sequence as MIDI**: The `DrillSequence.notes` array directly maps to MIDI output. Each `DrillNote` has:
  - `midiNote` — MIDI note number for `noteOn`/`noteOff` events
  - `duration` — in beats (converted to ms using `targetTempo`)
  - `velocity` — MIDI velocity (1-127), controls loudness
  - `startBeat` — when in the measure the note starts

- **Variety Strategy (FR21)**: The prompt includes previous drill descriptions and explicitly instructs:

  ```
  IMPORTANT: The musician has already practiced these drills for this weakness:
  ${previousDrills.map(d => `- ${d.instructions}`).join('\n')}

  Generate a DIFFERENT drill. Vary one or more of:
  - Chord voicings (open vs. close, different inversions)
  - Rhythmic pattern (straight vs. swing, different subdivisions)
  - Key center (try a related key)
  - Approach direction (ascending vs. descending)
  - Exercise structure (call-and-response, loop, sequence)
  ```

- **Performance Budget (NFR4)**: Drill generation must complete in <2 seconds. Monitor this:

  ```typescript
  const startTime = performance.now();
  const result = await generateObject({ ... });
  const elapsed = performance.now() - startTime;
  if (elapsed > 2000) {
    Sentry.captureMessage('Drill generation exceeded 2s', { extra: { elapsed } });
  }
  ```

- **Dependency Chain**: Stories 5.1 (skill profile) + 5.2 (difficulty parameters) + Epic 3 (API key) + Story 4.1 (AI SDK setup) feed into this story. This story feeds into Story 5.5 (MIDI output plays the drill) and Story 5.6 (tracks performance against drill criteria).

- **Vercel AI SDK 6.x `generateObject` Pattern**:

  ```typescript
  import { generateObject } from 'ai';
  import { createProvider } from '@/lib/ai/provider';
  import { DrillGenerationSchema } from '@/lib/ai/schemas';

  const provider = createProvider(userApiKey, providerType);

  const { object: drill } = await generateObject({
    model: provider(modelId),
    schema: DrillGenerationSchema,
    system: DRILL_GENERATION_SYSTEM_PROMPT,
    prompt: buildDrillPrompt(request),
  });
  ```

- **Error Handling**: Follow architecture API error patterns. Growth mindset in user-facing messages:
  - `GENERATION_FAILED` → "Could not create a drill right now. Try again in a moment."
  - `INVALID_KEY` → "Check your API key in Settings."
  - `RATE_LIMITED` → "Taking a breather — try again in a few seconds."

### Project Structure Notes

```
src/features/drills/
├── drill-types.ts               # All drill type definitions (this story)
├── drill-generator.ts           # Client-side request builder (this story)
├── drill-generator.test.ts      # Co-located tests (this story)
├── drill-player.ts              # Story 5.5 (MIDI output playback)
├── drill-tracker.ts             # Story 5.6 (performance tracking)
├── drill-tracker.test.ts        # Story 5.6
└── index.ts                     # Barrel export (this story)

src/app/api/ai/drill/route.ts    # Server-side drill generation endpoint (this story)
src/lib/ai/schemas.ts            # DrillGenerationSchema (this story — extends from Story 5.3)
src/lib/ai/prompts.ts            # DRILL_GENERATION_SYSTEM_PROMPT (this story — extends)
src/lib/dexie/db.ts              # Add drill_records to Dexie schema
supabase/migrations/             # drill_records table migration
e2e/fixtures/mock-ai-responses.ts # Mock drill generation responses
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] — Vercel AI SDK `generateObject`, API route patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — drill_records table, Dexie sync
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — Zod validation at boundaries, error codes
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.4] — Full story definition with AC
- [Source: _bmad-output/planning-artifacts/prd.md#FR19] — Targeted drill generation from weaknesses
- [Source: _bmad-output/planning-artifacts/prd.md#FR21] — Varied drills without repetition
- [Source: _bmad-output/planning-artifacts/prd.md#NFR4] — <2s drill generation
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#DrillController] — Drill UI component specification

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
