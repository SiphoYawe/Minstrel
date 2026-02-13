# Story 5.6: Drill Tracking and Improvement Measurement

Status: ready-for-dev

## Story

As a musician,
I want to see improvement within a drill session,
So I know practice is working.

## Acceptance Criteria

1. **Given** the user is attempting a drill (Attempt phase from Story 5.5), **When** they complete each repetition, **Then** `drill-tracker.ts` captures their performance and measures it against the drill's `successCriteria`. **And** the measurement includes: timing accuracy (ms deviation from target), note accuracy (correct notes / total notes), and tempo adherence (actual BPM vs. target BPM).

2. **Given** the user has completed 2+ reps of a drill, **When** the improvement delta is calculated, **Then** the delta is displayed in real time showing progression across reps (e.g., "400ms → 280ms → 180ms" for timing, or "65% → 78% → 88%" for accuracy). **And** the delta display updates immediately after each rep completes.

3. **Given** the user has been in freeform play and then stops (silence detected), **When** a key insight is generated (FR23), **Then** the system identifies the single highest-impact area for improvement based on the freeform play data. **And** the insight is specific and actionable (e.g., "Your C to Am transitions average 380ms — a targeted drill could cut that in half"). **And** the insight offers to generate a drill for that weakness.

4. **Given** a drill rep is completed (pass, fail, or partial), **When** the result is stored, **Then** `drill_records` in Supabase is updated with: rep-by-rep results (array of `RepPerformance`), overall completion status, improvement deltas, and `completedAt` timestamp. **And** the local Dexie.js copy is also updated.

5. **Given** the drill cycle is in progress, **When** the DrillController component (P1) renders, **Then** it shows: drill title, target skill, current phase indicator (with distinct visual states per UX spec), rep counter ("Rep 3/5"), improvement delta with percentage, and action buttons ("One more" / "Complete"). **And** all visual feedback uses growth mindset framing: "Closing in" rather than scoring, amber for in-progress states, no red for errors.

6. **Given** a drill rep records performance data, **When** the data is processed, **Then** it is fed back to the Difficulty Engine (Story 5.2) via `sessionStore.recordRepPerformance()` so that the growth zone detector can evaluate and queue adjustments between reps.

## Tasks / Subtasks

- [ ] Task 1: Implement `drill-tracker.ts` core measurement logic (AC: 1, 2)
  - [ ] Create `src/features/drills/drill-tracker.ts`
  - [ ] Implement `comparePerformance(userNotes: MidiEvent[], drillNotes: DrillNote[], targetTempo: number): RepPerformance` — compares user input against drill target
  - [ ] Implement `measureTimingAccuracy(userNotes, drillNotes, targetTempo): { deviationMs: number; accuracyPercent: number }` — calculates timing deviation per note, averages
  - [ ] Implement `measureNoteAccuracy(userNotes, drillNotes): { correct: number; total: number; accuracyPercent: number }` — counts correct notes (right pitch within timing window)
  - [ ] Implement `measureTempoAdherence(userNotes, targetTempo): { actualBpm: number; deviationBpm: number }` — calculates actual tempo from note intervals
  - [ ] Implement `calculateImprovementDelta(repHistory: RepPerformance[]): { timingDelta: number; accuracyDelta: number; trend: 'improving' | 'declining' | 'stable' }` — computes improvement across reps
  - [ ] Define timing window for "correct note" detection: +/- 100ms from target time (configurable)

- [ ] Task 2: Implement real-time delta display logic (AC: 2, 5)
  - [ ] Add to `sessionStore`: `drillRepHistory: RepPerformance[]`, `currentDrillImprovement: { timingDeltas: number[]; accuracyDeltas: number[] }`
  - [ ] On each rep completion: append `RepPerformance` to history, compute and store improvement deltas
  - [ ] Format delta display strings:
    - Timing: `"400ms → 280ms → 180ms"` (raw values per rep)
    - Accuracy: `"65% → 78% → 88%"` (percentages per rep)
    - Overall: `"↑ 42% improvement"` (first rep to latest)
  - [ ] Growth mindset formatting: "Closing in" when improving, "Hang in there" when flat, never "Failed" or negative language

- [ ] Task 3: Implement key insight generation after freeform play (AC: 3)
  - [ ] Implement `generateKeyInsight(sessionData: SessionPerformanceData): KeyInsight` in `drill-tracker.ts` or a dedicated `insight-generator.ts`
  - [ ] `KeyInsight` type: `{ weakness: string; description: string; metric: string; currentValue: number; potentialImprovement: string; canGenerateDrill: boolean }`
  - [ ] Analyze freeform play data to find the single highest-impact weakness:
    - Check chord transition speeds (slowest transition pair)
    - Check timing accuracy (worst beat/subdivision)
    - Check note accuracy (most frequently missed notes)
    - Check technique gaps (from tendency tracker, Story 2.4)
  - [ ] Rank weaknesses by impact (frequency x severity) and return the top one
  - [ ] Format with growth mindset language: "Your C to Am transitions average 380ms — a targeted drill could cut that in half"
  - [ ] Connect to snapshot-generator output (Story 2.5) — when silence triggers a snapshot, also generate the key insight

- [ ] Task 4: Implement drill results persistence (AC: 4)
  - [ ] Implement `saveDrillResults(drillId: string, repHistory: RepPerformance[], status: DrillStatus): Promise<void>`
  - [ ] Update `drill_records` in Supabase with JSONB `results` field containing rep-by-rep data
  - [ ] Update `status` to `'completed'` or `'abandoned'`
  - [ ] Set `completed_at` timestamp
  - [ ] Mirror updates to Dexie.js local storage
  - [ ] Queue Supabase sync if offline

- [ ] Task 5: Build DrillController component (AC: 5)
  - [ ] Create `src/components/drill-controller.tsx` (P1 component)
  - [ ] Implement phase indicator with states: Setup, Demonstrate, Your Turn, Results, Complete (from UX spec)
  - [ ] Implement rep counter display: "Rep 3/5"
  - [ ] Implement improvement delta display with formatted strings from Task 2
  - [ ] Implement action buttons: "One more" (adds a rep), "Complete" (ends drill)
  - [ ] Apply dark studio aesthetic: `--bg-secondary` background, 0px border radius, Inter font
  - [ ] Use amber (`--accent-warm`) for in-progress states, pastel blue (`--accent-primary`) for improvement indicators
  - [ ] Never use red — all "not yet achieved" states use amber
  - [ ] Add `'use client'` directive (interactive component with hooks)

- [ ] Task 6: Wire drill tracking to Difficulty Engine (AC: 6)
  - [ ] After each rep: call `sessionStore.recordRepPerformance(repData)` from Story 5.2
  - [ ] Between reps: call `sessionStore.applyPendingAdjustment()` to apply any queued difficulty changes
  - [ ] If difficulty adjustment occurs, update drill parameters for the next rep (tempo, complexity)
  - [ ] Log difficulty adjustments for debugging (not shown to user)

- [ ] Task 7: Implement accessibility for DrillController (AC: 5)
  - [ ] Add `aria-live="polite"` for rep results announcements
  - [ ] Screen reader text for improvement delta: "Rep 3 of 5. Timing improved from 400 milliseconds to 180 milliseconds. 55 percent improvement."
  - [ ] Keyboard navigation for "One more" and "Complete" buttons
  - [ ] Phase indicator readable by screen reader: "Current phase: Your Turn"
  - [ ] Color-dependent information has text alternatives

- [ ] Task 8: Write co-located tests (AC: 1, 2, 3)
  - [ ] Create `src/features/drills/drill-tracker.test.ts`
  - [ ] Test: `comparePerformance` correctly identifies matching notes within timing window
  - [ ] Test: `measureTimingAccuracy` calculates correct deviation from target
  - [ ] Test: `measureNoteAccuracy` counts correct/incorrect notes
  - [ ] Test: `calculateImprovementDelta` shows improvement when reps get better
  - [ ] Test: `calculateImprovementDelta` shows decline when reps get worse
  - [ ] Test: `generateKeyInsight` identifies slowest chord transition as weakness
  - [ ] Test: `generateKeyInsight` returns actionable description with growth mindset language
  - [ ] Test: delta formatting produces correct display strings
  - [ ] Create `src/components/drill-controller.test.tsx` for component rendering tests

## Dev Notes

- **Architecture Layer**: `drill-tracker.ts` is Layer 3 domain logic (pure measurement functions). DrillController is Layer 1 presentation. The `sessionStore` integration is Layer 2. Supabase persistence is Layer 4.

- **Performance Comparison Algorithm**: Matching user notes to drill target notes is the core challenge. The approach:

  ```typescript
  function comparePerformance(
    userNotes: MidiEvent[],
    drillNotes: DrillNote[],
    targetTempo: number
  ): RepPerformance {
    const beatMs = 60000 / targetTempo;
    const TIMING_WINDOW_MS = 100; // +/- 100ms tolerance

    let correctNotes = 0;
    let totalDeviationMs = 0;

    for (const target of drillNotes) {
      const targetTimeMs = target.startBeat * beatMs;
      // Find closest user note matching the pitch
      const match = userNotes.find(
        (n) => n.note === target.midiNote && Math.abs(n.timestamp - targetTimeMs) < TIMING_WINDOW_MS
      );
      if (match) {
        correctNotes++;
        totalDeviationMs += Math.abs(match.timestamp - targetTimeMs);
      }
    }

    return {
      repNumber: currentRep,
      accuracy: correctNotes / drillNotes.length,
      timingDeviation: totalDeviationMs / correctNotes,
      completedAt: new Date().toISOString(),
    };
  }
  ```

- **Key Insight Generation (FR23)**: The insight after freeform play is one of Minstrel's "aha moments." It must be:
  1. **Specific**: "Your C to Am transition averages 380ms" — not "your transitions are slow"
  2. **Actionable**: "A targeted drill could cut that in half" — not "work on this"
  3. **Data-driven**: Based on actual performance metrics, not guesses
  4. **Growth mindset**: "Not yet smooth" not "You're bad at this"

- **Improvement Delta Display**: The UX spec shows `380ms → 220ms ↑ 42%` in the DrillController anatomy. The delta format should be:

  ```typescript
  function formatTimingDelta(reps: RepPerformance[]): string {
    const timings = reps.map((r) => `${Math.round(r.timingDeviation)}ms`);
    return timings.join(' → ');
  }

  function formatImprovementPercent(first: number, last: number): string {
    const improvement = ((first - last) / first) * 100;
    return `↑ ${Math.round(improvement)}%`;
  }
  ```

- **DrillController Component Design**: Follow the UX specification exactly:

  ```
  ┌─────────────────────────────────────────┐
  │  Chord Transition Drill                 │
  │  Target: C → Am smooth voice leading    │
  │                                         │
  │  Phase: [●Demonstrate] [○Your Turn] [○Results] │
  │                                         │
  │  Rep 3/5    380ms → 220ms   ↑ 42%      │
  │                                         │
  │  [One more]              [Complete]     │
  └─────────────────────────────────────────┘
  ```

  - Background: `--bg-secondary` (#1A1A1A)
  - 0px border radius
  - Phase indicators: active phase uses `--accent-primary` (#7CB9E8), inactive uses `--text-tertiary`
  - Improvement percentage: `--accent-success` for positive delta
  - All text: Inter font, `--text-primary` for labels, `--text-secondary` for values
  - Improvement numbers: JetBrains Mono (monospace)

- **Growth Mindset in Code**: Constants for user-facing text:

  ```typescript
  const DRILL_MESSAGES = {
    IMPROVING: 'Closing in',
    STABLE: 'Building consistency',
    FIRST_REP: 'Setting your baseline',
    COMPLETE: 'Solid progress',
    // NEVER: 'Failed', 'Wrong', 'Error', 'Bad'
  } as const;
  ```

- **Difficulty Engine Feedback Loop**: This story closes the loop with Story 5.2. Each rep's performance feeds back into the growth zone detector:

  ```
  User plays rep → drill-tracker measures → sessionStore.recordRepPerformance()
    → growth-zone-detector evaluates → difficulty-engine computes adjustment
    → sessionStore.pendingAdjustment set → applied between reps by drill-player
  ```

- **Dependency**: Requires Story 5.4 (drill data), Story 5.5 (drill playback + phases), Story 5.2 (Difficulty Engine for feedback loop), Story 2.5 (snapshot generation for key insights).

### Project Structure Notes

```
src/features/drills/
├── drill-types.ts               # Extended with RepPerformance details
├── drill-generator.ts           # Story 5.4
├── drill-player.ts              # Story 5.5
├── drill-tracker.ts             # Core tracking + measurement (this story)
├── drill-tracker.test.ts        # Co-located tests (this story)
└── index.ts                     # Barrel export (update)

src/components/
├── drill-controller.tsx         # DrillController P1 component (this story)
├── drill-controller.test.tsx    # Component tests (this story)

src/stores/session-store.ts      # Add drillRepHistory, currentDrillImprovement
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — Zustand patterns, co-located tests
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] — kebab-case files, PascalCase components
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.6] — Full story definition with AC
- [Source: _bmad-output/planning-artifacts/prd.md#FR22] — Drill completion tracking and improvement measurement
- [Source: _bmad-output/planning-artifacts/prd.md#FR23] — Key insight after freeform play
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#DrillController] — Full component specification with states and anatomy
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Emotional Design Principles] — "Earned Confidence, Not Given Praise", "Amber, Not Red"
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Coach Energy in Failure States] — Reframe every miss in terms of trajectory

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
