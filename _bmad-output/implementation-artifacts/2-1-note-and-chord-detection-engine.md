# Story 2.1: Note and Chord Detection Engine

Status: ready-for-dev

## Story

As a musician,
I want Minstrel to identify the individual notes and chords I'm playing in real time,
so that I can see exactly what I'm playing displayed on screen.

## Acceptance Criteria

1. Given MIDI events are flowing into `midiStore` from a connected device, When the user plays individual notes, Then `note-detector.ts` identifies each note by name and octave (e.g., "C4", "G#3") within 50ms of the MIDI event timestamp. And the detected note is dispatched to `sessionStore.currentNotes` for downstream consumers.

2. Given the user plays 3 or more simultaneous notes (note-on events within a configurable window, default 50ms), When `chord-analyzer.ts` processes the note cluster, Then it identifies the chord quality (e.g., "Cmaj", "Am7", "Dm", "Gsus4"). And the chord is added to `sessionStore.detectedChords` with a timestamp.

3. Given a sequence of chords has been detected over time, When a new chord is identified, Then the chord progression is tracked as an ordered sequence (e.g., C -> Am -> F -> G) in `sessionStore.chordProgression`. And the progression resets on silence (3+ seconds with no MIDI input) or explicit session segment boundary.

4. Given detection results are dispatched to `sessionStore`, When the VisualizationCanvas is subscribed to `midiStore` via vanilla `subscribe`, Then the canvas renders detected notes and chords visually within the same 60fps render frame. And note names appear on the piano roll renderer.

5. Given various chord types are played, When co-located unit tests execute, Then detection accuracy is validated for: major triads, minor triads, dominant 7th chords, minor 7th chords, major 7th chords, suspended 2nd, suspended 4th, diminished, and augmented chords. And edge cases for enharmonic spellings (e.g., C# vs Db) are handled consistently.

## Tasks / Subtasks

- [ ] 1. Define analysis types for note and chord detection (AC: 1, 2, 3)
  - [ ] 1.1 Create `src/features/analysis/analysis-types.ts` with types: `DetectedNote` (name, octave, midiNumber, velocity, timestamp), `DetectedChord` (root, quality, notes, timestamp, romanNumeral?), `ChordProgression` (chords[], startTimestamp, endTimestamp)
  - [ ] 1.2 Define chord quality enum: `ChordQuality` (Major, Minor, Dominant7, Minor7, Major7, Sus2, Sus4, Diminished, Augmented, etc.)
  - [ ] 1.3 Export types via `src/features/analysis/index.ts` barrel export

- [ ] 2. Implement note-detector.ts (AC: 1)
  - [ ] 2.1 Create `src/features/analysis/note-detector.ts` — pure domain logic (Layer 3), no framework imports
  - [ ] 2.2 Implement `detectNote(midiNumber: number): DetectedNote` — maps MIDI note number (0-127) to note name + octave using standard MIDI mapping (C4 = 60)
  - [ ] 2.3 Handle enharmonic spelling: default to sharps (C#, not Db) with context-aware override when key is detected (deferred to Story 2.3)
  - [ ] 2.4 Ensure function completes in <1ms (trivial lookup, well within 50ms NFR1 budget)

- [ ] 3. Implement chord-analyzer.ts (AC: 2, 3)
  - [ ] 3.1 Create `src/features/analysis/chord-analyzer.ts` — pure domain logic (Layer 3)
  - [ ] 3.2 Implement `analyzeChord(notes: DetectedNote[]): DetectedChord | null` — accepts 3+ simultaneous notes, returns chord quality or null if unrecognizable
  - [ ] 3.3 Implement chord detection algorithm: normalize notes to pitch classes (0-11), compare interval patterns against known chord templates (root position + inversions)
  - [ ] 3.4 Handle chord inversions: detect root regardless of bass note position
  - [ ] 3.5 Implement `updateProgression(chord: DetectedChord, progression: ChordProgression): ChordProgression` — appends new chord to ordered sequence
  - [ ] 3.6 Implement silence-based progression reset logic (configurable silence threshold, default 3000ms)

- [ ] 4. Integrate detection with midiStore and sessionStore (AC: 1, 2, 3, 4)
  - [ ] 4.1 Add `currentNotes: DetectedNote[]`, `detectedChords: DetectedChord[]`, `chordProgression: ChordProgression | null` to `sessionStore` state shape
  - [ ] 4.2 Create analysis pipeline function that subscribes to `midiStore` note events and runs note-detector + chord-analyzer
  - [ ] 4.3 Define note clustering logic: group note-on events within a configurable simultaneity window (default 50ms) before passing to chord analyzer
  - [ ] 4.4 Dispatch results to `sessionStore` using immutable `setState` pattern

- [ ] 5. Update VisualizationCanvas to render detected notes/chords (AC: 4)
  - [ ] 5.1 Extend `src/components/viz/piano-roll-renderer.ts` to display note name labels alongside visual note representations
  - [ ] 5.2 Add chord label rendering to the canvas — display detected chord name (e.g., "Cmaj7") in a prominent but non-intrusive position
  - [ ] 5.3 Ensure all rendering happens within the Canvas vanilla subscribe pipeline — no React re-renders for note/chord display

- [ ] 6. Write co-located unit tests (AC: 5)
  - [ ] 6.1 Create `src/features/analysis/note-detector.test.ts` — test all 128 MIDI note numbers map correctly, edge cases (note 0, note 127)
  - [ ] 6.2 Create `src/features/analysis/chord-analyzer.test.ts` — test major, minor, dom7, min7, maj7, sus2, sus4, dim, aug chord detection in root position and inversions
  - [ ] 6.3 Test chord progression tracking: sequence building, silence-based reset
  - [ ] 6.4 Test simultaneity window: notes arriving within 50ms window form a chord, notes >50ms apart are separate

## Dev Notes

- **Architecture Layer**: All analysis code is Layer 3 (Domain Logic) — no React, no Zustand imports, no infrastructure. Pure functions that accept data and return results. Integration with stores happens at Layer 2 (Application Logic).
- **Performance Budget**: Note detection is a trivial O(1) lookup. Chord analysis is O(n) where n = number of notes (max ~10). Both well within the 50ms NFR1 latency budget. No async operations.
- **Chord Detection Approach**: Use interval-pattern matching against known templates rather than a music theory library. This keeps the bundle small and avoids external dependencies. The template set covers ~95% of common chords. Rare voicings can be handled as "unknown" and expanded later.
- **Simultaneity Window**: MIDI devices don't send perfectly simultaneous events even when keys are pressed together. A 50ms clustering window groups events into "simultaneous" sets. This value may need tuning per device — consider making it configurable via a constant in `src/lib/constants.ts`.
- **Zustand Pattern**: `sessionStore` updates for note/chord data should use selective updates. Canvas subscribes to `midiStore` directly for raw events (60fps render), while React components subscribe to `sessionStore` for derived chord/progression data (lower frequency).
- **Library Versions**: Zustand 5.x vanilla subscribe API. No external music theory libraries — all detection is hand-implemented.
- **Testing**: Vitest for unit tests. Use `src/test-utils/midi-fixtures.ts` for common MIDI event test data. Tests are co-located beside source files per project convention.

### Project Structure Notes

- `src/features/analysis/analysis-types.ts` — shared types for all analysis features (created here, extended in Stories 2.2-2.5)
- `src/features/analysis/note-detector.ts` — note identification (pure function)
- `src/features/analysis/note-detector.test.ts` — co-located tests
- `src/features/analysis/chord-analyzer.ts` — chord quality detection (pure function)
- `src/features/analysis/chord-analyzer.test.ts` — co-located tests
- `src/features/analysis/index.ts` — barrel export for analysis feature
- `src/stores/session-store.ts` — extended with note/chord/progression state
- `src/components/viz/piano-roll-renderer.ts` — extended with note/chord label rendering
- `src/lib/constants.ts` — `SIMULTANEITY_WINDOW_MS = 50`, `SILENCE_THRESHOLD_MS = 3000`

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — Zustand 5.x store patterns, Canvas vanilla subscribe
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — naming conventions, co-located tests, Layer 3 boundary rules
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1] — acceptance criteria and FR8 coverage
- [Source: _bmad-output/planning-artifacts/prd.md#Real-Time Analysis] — FR8: note/chord/progression detection
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Core User Experience] — <50ms latency requirement, 60fps visualization

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
