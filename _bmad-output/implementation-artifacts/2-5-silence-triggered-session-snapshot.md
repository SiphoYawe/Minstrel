# Story 2.5: Silence-Triggered Session Snapshot

Status: ready-for-dev

## Story

As a musician,
I want an instant summary when I pause playing,
so that I get immediate actionable feedback without navigating menus.

## Acceptance Criteria

1. Given the user has been playing and then stops, When silence is detected (no MIDI input for 3+ seconds), Then `snapshot-generator.ts` produces an `InstantSnapshot` within 500ms containing: key played in (from harmonic-analyzer), chords used (from chord-analyzer), timing accuracy percentage (from timing-analyzer), average tempo BPM (from timing-analyzer), and one key insight string. And the snapshot is dispatched to `sessionStore.currentSnapshot`.

2. Given the snapshot is being generated, When the key insight is determined, Then the insight identifies the single highest-impact area for improvement, selected from: timing weakness (e.g., "Your C to Am transition averages 400ms -- smoothing this would improve your flow"), harmonic gap (e.g., "You stayed in C major the whole session -- try exploring the relative minor"), or tendency observation (e.g., "You favor root position chords -- inversions could add color"). And the insight is specific, referencing actual data from the session.

3. Given a snapshot has been generated, When the VisualizationCanvas receives the snapshot, Then the canvas transitions from real-time mode to snapshot display mode (UX12). And the snapshot summary is rendered with clean typography on the canvas. And snapshot display uses growth mindset language and amber (#F5C542 or similar warm amber) tones for in-progress indicators.

4. Given the snapshot display is visible, When the user starts playing again (MIDI note-on event detected), Then the Canvas smoothly transitions back to real-time visualization mode. And the transition is animated (fade/slide, not abrupt). And the snapshot is preserved in `sessionStore.snapshots` array for later reference.

5. Given multiple play-pause cycles occur during a session, When each silence period triggers, Then a new snapshot is generated each time (not the same snapshot repeated). And each snapshot reflects the analysis state at the time of that pause (cumulative or segment-based). And all snapshots are stored in order in `sessionStore.snapshots`.

6. Given the snapshot display is shown, When growth mindset principles are applied, Then no snapshot text uses the words "wrong", "failed", "bad", or "error". And suggestions use "not yet" framing (e.g., "Timing consistency: getting there -- 78% and climbing"). And visual indicators use amber tones, never red. And the language frames current state as trajectory toward a goal.

## Tasks / Subtasks

- [ ] 1. Define snapshot types (AC: 1, 2)
  - [ ] 1.1 Extend `src/features/analysis/analysis-types.ts` with types: `InstantSnapshot` (key: KeyCenter | null, chordsUsed: DetectedChord[], timingAccuracy: number, averageTempo: number | null, keyInsight: string, timestamp: number, genrePatterns: GenrePattern[], id: string)
  - [ ] 1.2 Define `InsightCategory` enum: `TIMING`, `HARMONIC`, `TENDENCY`, `GENERAL`
  - [ ] 1.3 Define `InsightTemplate` type: (category: InsightCategory, template: string, dataRef: string) for structured insight generation

- [ ] 2. Implement silence detection (AC: 1)
  - [ ] 2.1 Add silence detection logic to the analysis pipeline — track the timestamp of the last MIDI note-on event
  - [ ] 2.2 Use `setInterval` (checking every 500ms) or a timeout reset approach: start a 3000ms timer on each note-on event. If the timer fires without being reset, silence is detected.
  - [ ] 2.3 Dispatch a `silence:detected` event or call the snapshot generation pipeline directly
  - [ ] 2.4 Add `SILENCE_THRESHOLD_MS = 3000` to `src/lib/constants.ts` (may already exist from Story 2.1)

- [ ] 3. Implement snapshot-generator.ts (AC: 1, 2)
  - [ ] 3.1 Create `src/features/analysis/snapshot-generator.ts` — pure domain logic (Layer 3)
  - [ ] 3.2 Implement `generateSnapshot(state: SnapshotInput): InstantSnapshot` — aggregates current analysis state into a snapshot object. `SnapshotInput` includes the current sessionStore analysis data (key, chords, timing, tempo, tendencies, genres).
  - [ ] 3.3 Implement `generateKeyInsight(state: SnapshotInput): string` — selects the highest-impact insight from available data using a priority ranking:
    1. Timing weakness with specific transition data (most actionable)
    2. Chord transition speed (specific, measurable)
    3. Harmonic range observation (key/chord diversity)
    4. Tendency/avoidance observation (comfort zone awareness)
    5. General encouragement (fallback if no specific data)
  - [ ] 3.4 Each insight template references specific data: note names, chord names, millisecond timings, percentages. No generic statements.
  - [ ] 3.5 Apply growth mindset language filter to all generated text: replace "wrong" -> "not yet", "error" -> "opportunity", "failed" -> "in progress"
  - [ ] 3.6 Ensure snapshot generation completes within 500ms (aggregation of already-computed data, no heavy computation)

- [ ] 4. Implement insight templates (AC: 2, 6)
  - [ ] 4.1 Create a collection of parameterized insight templates, organized by category:
    - TIMING: "Your {chord1} to {chord2} transition averages {ms}ms -- smoothing this would improve your flow"
    - TIMING: "Timing consistency: {accuracy}% and climbing -- beat 3 tends to drift {direction} by {ms}ms"
    - HARMONIC: "You stayed in {key} the entire session -- try exploring the relative {relativeKey}"
    - HARMONIC: "Strong command of {chordTypes} -- adding {suggestedType} chords could expand your palette"
    - TENDENCY: "You favor {pattern} -- {suggestion} could add variety"
    - GENERAL: "Solid session in {key} at {tempo} BPM -- keep building on that foundation"
  - [ ] 4.2 Template selection is based on data availability and impact ranking
  - [ ] 4.3 All templates pass the growth mindset language check (no negative framing)

- [ ] 5. Implement Canvas snapshot display mode (AC: 3, 4)
  - [ ] 5.1 Extend `src/components/viz/visualization-canvas.tsx` with a display mode state: `'realtime' | 'snapshot'`
  - [ ] 5.2 In snapshot mode: render key, chords, timing accuracy, tempo, and key insight text on the canvas with clean typography (Inter font, 70/30 attention-friendly sizing)
  - [ ] 5.3 Use amber tones (#F5C542 or design-system-approved warm amber) for any in-progress or "not yet" indicators
  - [ ] 5.4 Implement smooth transition animation from real-time to snapshot mode: fade out real-time viz over 300ms, fade in snapshot summary over 300ms
  - [ ] 5.5 Implement smooth transition back on play resume: fade out snapshot over 200ms, immediately resume real-time rendering
  - [ ] 5.6 Subscribe to `sessionStore.currentSnapshot` via vanilla Zustand subscribe to trigger mode switch

- [ ] 6. Integrate with sessionStore (AC: 1, 4, 5)
  - [ ] 6.1 Add `currentSnapshot: InstantSnapshot | null`, `snapshots: InstantSnapshot[]` to `sessionStore`
  - [ ] 6.2 On silence detection: read current analysis state from sessionStore, pass to `generateSnapshot()`, dispatch result to `sessionStore.currentSnapshot` and append to `sessionStore.snapshots`
  - [ ] 6.3 On play resume (MIDI note-on after silence): set `sessionStore.currentSnapshot = null` to trigger Canvas transition back to real-time mode
  - [ ] 6.4 Generate unique snapshot IDs using `crypto.randomUUID()`

- [ ] 7. Write co-located tests (AC: 1, 2, 6)
  - [ ] 7.1 Create `src/features/analysis/snapshot-generator.test.ts` — co-located beside source file (not in architecture tree but follows convention)
  - [ ] 7.2 Test snapshot generation with complete data: produces snapshot with all fields populated
  - [ ] 7.3 Test snapshot generation with partial data: missing tempo (null) still produces valid snapshot
  - [ ] 7.4 Test key insight selection: timing weakness is prioritized over harmonic observation
  - [ ] 7.5 Test growth mindset language: no snapshot text contains banned words ("wrong", "failed", "bad", "error")
  - [ ] 7.6 Test insight specificity: generated insights contain actual data values (note names, percentages, ms values), not placeholders
  - [ ] 7.7 Test multiple snapshots: each pause generates a unique snapshot with updated data

## Dev Notes

- **Architecture Layer**: Snapshot generation is Layer 3 (Domain Logic). Pure function that aggregates existing analysis state. No framework dependencies. Canvas display logic is Layer 1 (Presentation).
- **Performance**: Snapshot generation reads already-computed data from sessionStore — no re-analysis needed. The 500ms budget is generous for what is essentially data formatting. The only expensive operation is insight selection, which compares a small number of candidates.
- **Silence Detection Pattern**: The timeout-reset pattern is preferred over polling. On each note-on event, clear the existing timeout and set a new 3000ms timeout. When the timeout fires, it means 3000ms have passed since the last note. This is more efficient than polling every 500ms.
- **Insight Quality**: The key insight is the most user-facing output in this story. It must be specific and data-driven, never generic. If insufficient data exists, the fallback insight should still reference what was played (key, tempo) rather than a truly generic statement.
- **Growth Mindset Language**: This is a hard constraint. Every text string generated by the snapshot must pass a language check. Consider a utility function `applyGrowthMindset(text: string): string` that can be reused across the codebase.
- **Canvas Transitions**: The fade animations (300ms in, 200ms out) should use `requestAnimationFrame` interpolation, not CSS transitions (Canvas does not support CSS). Store a transition progress value and interpolate alpha.
- **Dependencies**: Requires Stories 2.1 (notes/chords), 2.2 (timing/tempo), 2.3 (key/harmonic analysis), and 2.4 (tendencies/genres) for full snapshot data. Can produce partial snapshots if some analyzers have not yet produced results.
- **Library Versions**: No external libraries. Snapshot generation is pure data aggregation.
- **Testing**: Vitest unit tests. Create fixture analysis state objects to test snapshot generation with various data profiles.

### Project Structure Notes

- `src/features/analysis/snapshot-generator.ts` — snapshot generation (pure function)
- `src/features/analysis/snapshot-generator.test.ts` — co-located tests (new file)
- `src/features/analysis/analysis-types.ts` — extended with snapshot types
- `src/components/viz/visualization-canvas.tsx` — extended with snapshot display mode and transitions
- `src/stores/session-store.ts` — extended with currentSnapshot and snapshots array
- `src/lib/constants.ts` — SILENCE_THRESHOLD_MS (may already exist)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — Canvas/Zustand integration pattern, vanilla subscribe
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — immutable Zustand state updates
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.5] — acceptance criteria, FR13 coverage
- [Source: _bmad-output/planning-artifacts/prd.md#Real-Time Analysis] — FR13: session snapshot with key, chords, timing, tempo, key insight
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Emotional Design Principles] — "Amber, Not Red", growth mindset framing, UX12 silence-triggered snapshot transformation
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Core User Experience] — "Silence Is Respect" principle, feedback at natural pause points

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
