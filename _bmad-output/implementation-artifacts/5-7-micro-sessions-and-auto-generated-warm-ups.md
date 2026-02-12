# Story 5.7: Micro-Sessions and Auto-Generated Warm-Ups

Status: ready-for-dev

## Story

As a musician,
I want focused 3-5 min bursts and auto warm-ups,
So I can practice efficiently with limited time.

## Acceptance Criteria

1. **Given** the user starts a new session, **When** a warm-up is generated, **Then** `warmup-generator.ts` creates a 2-minute warm-up routine based on the user's recent session data and current `SkillProfile` (FR36). **And** the warm-up includes 2-4 exercises that progressively increase in difficulty. **And** each exercise specifies notes/chords, tempo, and duration. **And** the warm-up is relevant to what the user has been practicing recently.

2. **Given** a warm-up has been generated, **When** the warm-up plays, **Then** each warm-up exercise is demonstrated via MIDI output first (using `drill-player.ts` from Story 5.5), then the user plays. **And** the demonstration → attempt flow follows the same choreography as drills (UX13). **And** warm-up tempo starts at 80% of the user's current skill level and progressively increases to 100%.

3. **Given** the user wants a focused practice burst, **When** they start a micro-session, **Then** a single-skill focused exercise is generated targeting a specific weakness from their `SkillProfile` assessment. **And** the micro-session lasts 3-5 minutes (configurable). **And** the session includes warm-up reps (easy) → challenge reps (growth zone) → cool-down rep (consolidation).

4. **Given** the user completes a micro-session, **When** the session ends, **Then** the system offers "One more?" to encourage stacking micro-sessions into a longer practice. **And** if they accept, the next micro-session targets a DIFFERENT weakness (not the same one). **And** each stacked micro-session is tracked as a separate drill record but part of the same overall session.

5. **Given** the user has upcoming work (a drill, a weakness to target), **When** the warm-up is generated, **Then** the warm-up adapts to prepare for that specific work. **And** for example, if the upcoming drill targets chord transitions in A minor, the warm-up includes A minor scale patterns and basic A minor chord voicings.

## Tasks / Subtasks

- [ ] Task 1: Define warm-up and micro-session types (AC: 1, 3)
  - [ ] Add to `src/features/session/session-types.ts` or `src/features/drills/drill-types.ts`:
    - `WarmupExercise` type: `{ id: string; title: string; sequence: DrillSequence; targetTempo: number; duration: number; difficulty: 'easy' | 'moderate' | 'target' }`
    - `WarmupRoutine` type: `{ exercises: WarmupExercise[]; totalDurationMinutes: number; basedOn: { recentKeys: string[]; recentWeaknesses: string[]; upcomingFocus?: string } }`
    - `MicroSession` type: `{ id: string; targetWeakness: string; warmupReps: number; challengeReps: number; cooldownReps: number; targetDuration: number; drill: GeneratedDrill }`
    - `MicroSessionStack` type: `{ sessions: MicroSession[]; totalDuration: number; weaknessesTargeted: string[] }`

- [ ] Task 2: Implement `warmup-generator.ts` (AC: 1, 2, 5)
  - [ ] Create `src/features/session/warmup-generator.ts`
  - [ ] Implement `generateWarmup(skillProfile: SkillProfile, recentSessions: SessionSummary[], upcomingFocus?: string): WarmupRoutine`
  - [ ] Logic for warm-up exercise selection:
    1. Determine recent keys practiced (from session summaries) — warm up in those keys
    2. Identify recent weaknesses — include light exercises for those areas
    3. If `upcomingFocus` is specified, tailor warm-up to prepare for it
    4. Progressive difficulty: exercise 1 at 60% skill level, exercise 2 at 80%, exercise 3-4 at 100%
  - [ ] Implement `buildScaleWarmup(key: string, skillLevel: number): WarmupExercise` — generates scale patterns in the given key at appropriate speed
  - [ ] Implement `buildChordWarmup(chords: string[], skillLevel: number): WarmupExercise` — generates chord transition exercises
  - [ ] Implement `buildRhythmWarmup(tempo: number): WarmupExercise` — simple rhythmic exercises at target tempo
  - [ ] Total warm-up duration: ~2 minutes (configurable via `WARMUP_DURATION_SECONDS = 120`)

- [ ] Task 3: Implement warm-up playback integration (AC: 2)
  - [ ] Wire warm-up exercises to `drill-player.ts` for MIDI demonstration
  - [ ] Each warm-up exercise follows the Demonstrate → Attempt flow (simplified — no Analyze phase for warm-ups)
  - [ ] Warm-up tempo progression: start at `skillProfile.speed.value * 0.8`, increase to `skillProfile.speed.value * 1.0` across exercises
  - [ ] Add warm-up state to `sessionStore`: `isWarmingUp: boolean`, `currentWarmupExercise: number`, `warmupRoutine: WarmupRoutine | null`
  - [ ] On warm-up complete, transition to main session content (freeform play or first drill)

- [ ] Task 4: Implement micro-session logic (AC: 3, 4)
  - [ ] Implement `createMicroSession(weakness: string, skillProfile: SkillProfile, difficultyParams: DifficultyParameters): MicroSession`
  - [ ] Structure: 1 warm-up rep (easy difficulty) → 3-5 challenge reps (growth zone difficulty) → 1 cool-down rep (slightly easier)
  - [ ] Duration targeting: calculate rep count to fit within 3-5 minutes based on drill length and tempo
  - [ ] Wire to drill generation (Story 5.4) for the challenge exercise
  - [ ] Warm-up rep uses simplified version of the same exercise (slower tempo, simpler voicing)
  - [ ] Cool-down rep uses the challenge exercise at slightly reduced difficulty

- [ ] Task 5: Implement micro-session stacking (AC: 4)
  - [ ] After micro-session completion, show "One more?" prompt (in DrillController or dedicated UI)
  - [ ] Track `MicroSessionStack` in `sessionStore`: list of completed micro-sessions, total duration, weaknesses covered
  - [ ] On "One more?": select DIFFERENT weakness from skill assessment
  - [ ] Weakness selection priority: pick the next-most-impactful weakness that was NOT targeted in the current stack
  - [ ] Each stacked session is a separate `drill_record` entry but shares the same parent `session_id`
  - [ ] "One more?" prompt uses growth mindset: "Another weakness to chip away at. Keep going?"

- [ ] Task 6: Implement adaptive warm-up for upcoming work (AC: 5)
  - [ ] When a drill or micro-session target is known before warm-up generation, pass it as `upcomingFocus`
  - [ ] `upcomingFocus` parsing: extract key, chord types, and technique from the weakness description
  - [ ] Warm-up exercise 3-4 should directly relate to the upcoming focus:
    - If focus is "chord transitions in Am": warm-up includes Am scale + Am chord shapes
    - If focus is "timing at 140 BPM": warm-up progressively builds from 100 → 120 → 140 BPM
    - If focus is "jazz voicings": warm-up includes basic 7th chord shapes in the relevant key

- [ ] Task 7: Wire warm-up into session start flow (AC: 1, 2)
  - [ ] In session initialization (from session-manager or session page):
    1. Load skill profile (from Story 5.1)
    2. Check if user has an upcoming drill or identified weakness
    3. Generate warm-up via `warmup-generator.ts`
    4. Present warm-up to user: "Ready to warm up?" (matches Aisha user journey)
    5. Play warm-up exercises with MIDI demonstration
    6. On warm-up complete, transition to main session
  - [ ] If user skips warm-up: go directly to freeform play (warm-up is recommended, not forced)
  - [ ] Store warm-up completion in session metadata

- [ ] Task 8: Write co-located tests (AC: 1, 3, 5)
  - [ ] Create `src/features/session/warmup-generator.test.ts`
  - [ ] Test: `generateWarmup` produces 2-4 exercises totaling ~2 minutes
  - [ ] Test: warm-up exercises are in progressive difficulty order
  - [ ] Test: warm-up starting tempo is 80% of skill level speed
  - [ ] Test: when `upcomingFocus` is "Am chord transitions," warm-up includes Am-related exercises
  - [ ] Test: `createMicroSession` structures reps as warmup → challenge → cooldown
  - [ ] Test: micro-session duration estimate is within 3-5 minute range
  - [ ] Test: stacked micro-sessions target different weaknesses
  - [ ] Test: weakness selection for stacking excludes already-targeted weaknesses

## Dev Notes

- **Architecture Layer**: `warmup-generator.ts` is Layer 3 domain logic — pure functions that produce exercise sequences from skill profiles and session data. Session integration is Layer 2. MIDI playback comes from the existing `drill-player.ts` infrastructure (Story 5.5).

- **Warm-Up Generation is LOCAL, Not LLM-Powered**: Unlike drill generation (Story 5.4), warm-ups are generated client-side using rules-based logic. Warm-ups are simpler (scales, basic chords, rhythmic patterns) and don't need the creativity of LLM-generated drills. This saves API calls/tokens and ensures instant warm-up generation (no 2s latency).

- **Scale Pattern Generation**: For scale warm-ups, generate MIDI note sequences programmatically:
  ```typescript
  const SCALES: Record<string, number[]> = {
    'C_major': [0, 2, 4, 5, 7, 9, 11],  // Intervals from root
    'A_minor': [0, 2, 3, 5, 7, 8, 10],
    // ... more scales
  };

  function generateScalePattern(
    rootNote: number,  // MIDI note number of root
    scale: number[],   // Interval pattern
    octaves: number,   // How many octaves
    tempo: number      // Target BPM
  ): DrillSequence {
    const notes: DrillNote[] = [];
    let beat = 0;
    for (let oct = 0; oct < octaves; oct++) {
      for (const interval of scale) {
        notes.push({
          midiNote: rootNote + (oct * 12) + interval,
          duration: 1,     // Quarter notes
          velocity: 80,
          startBeat: beat++,
        });
      }
    }
    return { notes, timeSignature: [4, 4], measures: Math.ceil(beat / 4) };
  }
  ```

- **Chord Warm-Up Generation**: For chord transition warm-ups:
  ```typescript
  const CHORD_VOICINGS: Record<string, number[]> = {
    'C_major': [60, 64, 67],       // C4, E4, G4
    'A_minor': [57, 60, 64],       // A3, C4, E4
    'F_major': [53, 57, 60],       // F3, A3, C4
    'G_major': [55, 59, 62],       // G3, B3, D4
    // ... more voicings
  };

  function generateChordWarmup(
    chordNames: string[],
    tempo: number,
    beatsPerChord: number = 4
  ): DrillSequence { ... }
  ```

- **Micro-Session Duration Calculation**:
  ```typescript
  function estimateMicroSessionDuration(
    drill: GeneratedDrill,
    warmupReps: number,
    challengeReps: number,
    cooldownReps: number
  ): number {
    const repDurationSec = (drill.sequence.measures * (drill.sequence.timeSignature[0])) * (60 / drill.targetTempo);
    const totalReps = warmupReps + challengeReps + cooldownReps;
    const demonstrationTime = repDurationSec; // One demo per phase
    const pauseTime = 2 * totalReps; // 2s pause between reps
    return demonstrationTime + (totalReps * repDurationSec) + pauseTime;
  }
  // Adjust rep count to fit within 180-300 seconds (3-5 minutes)
  ```

- **"One More?" Stacking UX**: This directly mirrors Duolingo's micro-lesson stacking pattern cited in the UX spec. The key insight: low commitment barrier ("just one more 3-minute session") naturally extends practice time. The prompt should be:
  - Growth mindset: "Another weakness to chip away at. Keep going?"
  - Not pushy: "One more?" with clear "Done for today" alternative
  - Shows what's next: "Next up: timing accuracy in the key of G"

- **Session Flow Integration** (matches Aisha's user journey from UX spec):
  ```
  User opens Minstrel → "Welcome back. Ready to warm up?"
    → Auto-generated warm-up (2 min) → MIDI demonstration → User plays
    → "Warm-up complete. Yesterday you were working on [weakness]."
    → Targeted drill or freeform play
  ```

- **Warm-Up Adaptation for Upcoming Work (AC: 5)**: This is a subtle but important feature. Example:
  - Upcoming drill targets "ii-V-I voice leading in Bb"
  - Warm-up exercise 1: Bb major scale (60% tempo)
  - Warm-up exercise 2: Bb major chord shapes (80% tempo)
  - Warm-up exercise 3: ii-V-I basic voicings in Bb (100% tempo)
  - Warm-up exercise 4: Simple voice leading patterns in Bb (100% tempo)
  This ensures the musician's fingers and ears are primed for the main work.

- **Dependency**: Requires Story 5.1 (skill profile for warm-up calibration), Story 5.4 (drill generation for micro-sessions), Story 5.5 (MIDI playback for demonstrations), Story 5.6 (tracking for micro-session results).

### Project Structure Notes

```
src/features/session/
├── warmup-generator.ts          # Warm-up generation logic (this story)
├── warmup-generator.test.ts     # Co-located tests (this story)
├── session-manager.ts           # Extended with warm-up flow (this story)
├── session-types.ts             # Extended with WarmupRoutine, MicroSession types
├── session-recorder.ts          # Story 2.8
└── ...

src/features/drills/
├── drill-generator.ts           # Story 5.4 (used for micro-session drill generation)
├── drill-player.ts              # Story 5.5 (used for warm-up MIDI playback)
├── drill-tracker.ts             # Story 5.6 (used for micro-session tracking)
└── ...

src/stores/session-store.ts      # Add isWarmingUp, warmupRoutine, microSessionStack states
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure] — warmup-generator.ts location
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — Zustand store patterns
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.7] — Full story definition with AC
- [Source: _bmad-output/planning-artifacts/prd.md#FR35] — Micro-sessions (focused bursts, stackable)
- [Source: _bmad-output/planning-artifacts/prd.md#FR36] — Auto-generated warm-ups
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX Pattern Analysis] — Duolingo micro-session stacking pattern
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Effortless Interactions] — "Warm-up generation: Auto-generated based on recent work"
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#User Flow: Aisha] — Return session warm-up flow

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
