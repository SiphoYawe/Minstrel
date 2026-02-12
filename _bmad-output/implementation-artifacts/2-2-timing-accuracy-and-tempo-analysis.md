# Story 2.2: Timing Accuracy and Tempo Analysis

Status: ready-for-dev

## Story

As a musician,
I want to see how accurate my timing is relative to the tempo I'm playing at,
so that I can identify and improve timing weaknesses.

## Acceptance Criteria

1. Given the user is playing a sequence of notes, When the timing analyzer processes MIDI events, Then `timing-analyzer.ts` detects the current tempo (BPM) from note-on event intervals using autocorrelation or inter-onset interval (IOI) analysis. And the detected BPM is dispatched to `sessionStore.currentTempo` within 4+ note events.

2. Given a tempo has been detected, When subsequent notes are played, Then timing accuracy is measured as the deviation (in milliseconds) of each note-on event from the nearest expected beat position on the detected beat grid. And the deviation is stored as a signed value (negative = early, positive = late).

3. Given timing deviations are being calculated, When the timing grid overlay renders on the Canvas, Then `timing-grid-renderer.ts` visualizes the beat grid and the user's actual note positions relative to it. And the grid uses the #A8D5BA timing color from the design system. And notes landing on-beat appear centered, while early/late notes are visually offset.

4. Given a session of playing data exists, When timing accuracy is displayed in the UI, Then accuracy is expressed as a percentage (100% = all notes on beat within a tolerance of +/-30ms). And the accuracy percentage is dispatched to `sessionStore.timingAccuracy`.

5. Given the user changes tempo mid-session (speeds up or slows down gradually), When the timing analyzer detects a BPM shift exceeding 10% from the current value over 8+ beats, Then the beat grid re-calibrates to the new tempo. And the previous tempo segment is finalized and stored. And the transition does not produce false timing deviation spikes.

6. Given known test sequences with precise timing, When co-located tests execute, Then tempo detection is validated for: constant 60 BPM, constant 120 BPM, constant 180 BPM, gradual accelerando (80->120 BPM), and rubato/freeform (no stable tempo). And timing accuracy calculation is validated against hand-computed expected deviations.

## Tasks / Subtasks

- [ ] 1. Define timing analysis types (AC: 1, 2, 4)
  - [ ] 1.1 Extend `src/features/analysis/analysis-types.ts` with types: `TimingEvent` (noteTimestamp, expectedBeatTimestamp, deviationMs, beatIndex), `TempoSegment` (bpm, startTimestamp, endTimestamp, noteCount), `TimingAnalysis` (currentTempo, timingAccuracy, deviations[], tempoHistory[])
  - [ ] 1.2 Define constants in `src/lib/constants.ts`: `ON_BEAT_TOLERANCE_MS = 30`, `TEMPO_SHIFT_THRESHOLD = 0.10`, `MIN_NOTES_FOR_TEMPO = 4`, `MIN_BEATS_FOR_SHIFT = 8`

- [ ] 2. Implement timing-analyzer.ts core logic (AC: 1, 2, 4, 5)
  - [ ] 2.1 Create `src/features/analysis/timing-analyzer.ts` — pure domain logic (Layer 3)
  - [ ] 2.2 Implement `detectTempo(noteTimestamps: number[]): number | null` — uses inter-onset interval analysis on recent note-on timestamps. Returns BPM or null if insufficient data (<4 notes) or no stable tempo detected.
  - [ ] 2.3 Implement `buildBeatGrid(startTime: number, bpm: number): (beatIndex: number) => number` — returns a function that computes the expected timestamp for any beat index given a start time and BPM.
  - [ ] 2.4 Implement `measureDeviation(noteTimestamp: number, beatGrid: BeatGrid): TimingEvent` — snaps a note to the nearest beat position and computes signed deviation in milliseconds.
  - [ ] 2.5 Implement `calculateAccuracy(deviations: TimingEvent[]): number` — returns percentage (0-100) based on how many notes fall within ON_BEAT_TOLERANCE_MS of the beat grid.
  - [ ] 2.6 Implement `detectTempoShift(currentBpm: number, recentIntervals: number[]): number | null` — detects if BPM has shifted >10% over the last 8+ beats, returns new BPM or null.
  - [ ] 2.7 Handle rubato/freeform edge case: when no stable tempo is detectable (high IOI variance), return null for tempo and skip beat grid analysis.

- [ ] 3. Implement stateful timing analysis manager (AC: 1, 2, 4, 5)
  - [ ] 3.1 Create a `TimingAnalysisState` class or closure in `timing-analyzer.ts` that maintains running state: current beat grid, tempo segment history, rolling deviation window.
  - [ ] 3.2 Implement `processNoteOn(timestamp: number): TimingEvent | null` — main entry point called for each note-on event. Handles tempo detection, grid building, deviation measurement, and tempo shift detection as a single pipeline.
  - [ ] 3.3 Implement tempo segment finalization on shift: store completed `TempoSegment` with stats (avg accuracy, note count, duration).

- [ ] 4. Integrate with sessionStore (AC: 1, 4)
  - [ ] 4.1 Add `currentTempo: number | null`, `timingAccuracy: number`, `timingDeviations: TimingEvent[]`, `tempoHistory: TempoSegment[]` to `sessionStore` state shape.
  - [ ] 4.2 Wire timing analyzer into the analysis pipeline from Story 2.1 — receive note-on timestamps from `midiStore`, pass through timing analyzer, dispatch results to `sessionStore`.
  - [ ] 4.3 Throttle `sessionStore` updates for timing accuracy to avoid excessive state writes (update every 500ms or every 4 notes, whichever comes first).

- [ ] 5. Implement timing grid Canvas visualization (AC: 3)
  - [ ] 5.1 Create `src/components/viz/timing-grid-renderer.ts` — Canvas rendering module
  - [ ] 5.2 Render vertical beat grid lines at expected beat positions, using #A8D5BA color
  - [ ] 5.3 Render note markers at actual positions — centered on grid for on-beat, offset left (early) or right (late) for deviations
  - [ ] 5.4 Subscribe to `sessionStore.currentTempo` and `midiStore` events via vanilla Zustand subscribe for 60fps rendering
  - [ ] 5.5 Handle no-tempo state: when tempo is null (rubato/insufficient data), hide beat grid and show only raw note timing

- [ ] 6. Write co-located unit tests (AC: 6)
  - [ ] 6.1 Create `src/features/analysis/timing-analyzer.test.ts`
  - [ ] 6.2 Test `detectTempo`: constant 60 BPM (1000ms intervals), 120 BPM (500ms), 180 BPM (~333ms), insufficient data (<4 notes returns null)
  - [ ] 6.3 Test `measureDeviation`: perfectly on-beat note (0ms deviation), 20ms early (-20ms), 50ms late (+50ms)
  - [ ] 6.4 Test `calculateAccuracy`: all on-beat (100%), half on-beat (50%), all off-beat (0%)
  - [ ] 6.5 Test `detectTempoShift`: gradual accelerando 80->120 BPM detects shift, stable tempo with jitter does not false-trigger
  - [ ] 6.6 Test rubato handling: highly variable intervals return null tempo

## Dev Notes

- **Architecture Layer**: All timing analysis is Layer 3 (Domain Logic). Pure functions operating on `performance.now()` timestamps. No framework dependencies.
- **Tempo Detection Algorithm**: Inter-onset interval (IOI) analysis with median filtering to reject outliers. Autocorrelation is more robust but also more complex — start with IOI median and upgrade if needed. The median of recent note intervals gives a good BPM estimate for steady tempos.
- **Beat Grid Construction**: Once a tempo is detected, the beat grid is anchored to the first note's timestamp. All subsequent notes are measured against this grid. On tempo shift, a new grid is anchored to the shift point.
- **Performance Budget**: Timing analysis runs once per note-on event. With typical playing at 4-8 notes/second, this means 4-8 calls/second. Each call involves a few array operations — well within the 50ms budget. The rolling window should be capped (e.g., last 32 notes) to bound memory.
- **Timing Tolerance**: 30ms is a reasonable "on-beat" tolerance for human performance. Professional musicians typically achieve 10-15ms precision. This can be tuned later — store the raw deviation and compute accuracy with configurable tolerance.
- **Canvas Rendering**: The timing grid renderer is a separate module from the piano roll renderer. Both draw to the same Canvas context but in different layers/passes. The timing grid is a background layer (drawn first).
- **Library Versions**: No external libraries. All timing analysis is hand-implemented with standard math operations.
- **Testing**: Use `performance.now()` mock timestamps in tests. Create fixture sequences with known BPM and expected deviations.

### Project Structure Notes

- `src/features/analysis/timing-analyzer.ts` — core timing analysis (pure functions + stateful manager)
- `src/features/analysis/timing-analyzer.test.ts` — co-located tests
- `src/features/analysis/analysis-types.ts` — extended with timing types
- `src/components/viz/timing-grid-renderer.ts` — Canvas timing grid visualization
- `src/stores/session-store.ts` — extended with timing state
- `src/lib/constants.ts` — timing-related constants added

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — Zustand vanilla subscribe for Canvas, 60fps requirement
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — Layer 3 pure domain logic, co-located tests
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2] — acceptance criteria and FR9 coverage
- [Source: _bmad-output/planning-artifacts/prd.md#Real-Time Analysis] — FR9: timing accuracy relative to tempo
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Desired Emotional Response] — timing data as trajectory, #A8D5BA timing color

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
