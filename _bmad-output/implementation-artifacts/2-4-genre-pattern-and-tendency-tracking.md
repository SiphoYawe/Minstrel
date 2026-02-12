# Story 2.4: Genre Pattern and Tendency Tracking

Status: ready-for-dev

## Story

As a musician,
I want Minstrel to identify genre-specific patterns and track my playing tendencies,
so that I can discover my comfort zones and areas I'm avoiding.

## Acceptance Criteria

1. Given the user has played across multiple analysis windows (minimum one completed session or 2+ minutes of active play), When pattern analysis runs, Then `genre-detector.ts` identifies genre-characteristic patterns from the accumulated data, including: blues (I-IV-V with dominant 7ths, pentatonic scale, shuffle rhythm), jazz (ii-V-I, extended chords, chromaticism), pop (I-V-vi-IV, simple triads, steady 4/4), rock (power chords, pentatonic riffs), and classical (functional harmony, voice leading). And detected genre patterns are dispatched to `sessionStore.detectedGenres`.

2. Given the user has been playing over time, When `tendency-tracker.ts` processes accumulated session data, Then the tracker records: keys most played in (frequency distribution), chord types most used (major/minor/7th/etc.), tempo ranges most comfortable at (BPM histogram), intervals most played (interval frequency distribution), and rhythmic patterns (straight vs swing, common subdivisions). And tendency data is dispatched to `sessionStore.playingTendencies`.

3. Given tendency data is tracked, When avoidance patterns are analyzed, Then the tracker identifies: keys never or rarely played in, chord types never or rarely used, tempo ranges avoided (gaps in BPM histogram), and intervals rarely played. And avoidance data is dispatched alongside tendency data in `sessionStore.avoidancePatterns`.

4. Given tendency data is persisted in `sessionStore`, When snapshot generation runs (Story 2.5), Then tendency and avoidance data is available as input for generating the snapshot key insight.

5. Given all analysis engines are running, When pattern analysis executes, Then it runs in the background without affecting real-time MIDI processing performance. And analysis is performed on accumulated data at configurable intervals (e.g., every 30 seconds or on session snapshot trigger), not on every MIDI event. And the analysis does not block the main thread for more than 16ms per invocation (one frame budget).

## Tasks / Subtasks

- [ ] 1. Define genre and tendency types (AC: 1, 2, 3)
  - [ ] 1.1 Extend `src/features/analysis/analysis-types.ts` with types: `GenrePattern` (genre: string, confidence: number, matchedPatterns: string[]), `PlayingTendencies` (keyDistribution: Map<string, number>, chordTypeDistribution: Map<string, number>, tempoHistogram: number[], intervalDistribution: Map<number, number>, rhythmProfile: RhythmProfile), `AvoidancePatterns` (avoidedKeys: string[], avoidedChordTypes: string[], avoidedTempoRanges: TempoRange[], avoidedIntervals: number[])
  - [ ] 1.2 Define `RhythmProfile` type: (swingRatio: number, commonSubdivisions: string[], averageDensity: number)
  - [ ] 1.3 Define genre template constants: known chord progressions, scale patterns, and rhythmic characteristics for each genre

- [ ] 2. Implement genre-detector.ts (AC: 1)
  - [ ] 2.1 Create `src/features/analysis/genre-detector.ts` — pure domain logic (Layer 3)
  - [ ] 2.2 Implement `detectGenrePatterns(sessionData: AnalysisAccumulator): GenrePattern[]` — scores the accumulated data against genre templates and returns matches above a confidence threshold
  - [ ] 2.3 Define genre templates as declarative configuration objects:
    - Blues: I7-IV7-V7 progressions, minor pentatonic scale usage, shuffle/swing rhythm
    - Jazz: ii-V-I progressions, extended chords (9th, 11th, 13th), chromatic approach notes
    - Pop: I-V-vi-IV and related progressions, simple triads, steady straight rhythm
    - Rock: power chords (root+5th), pentatonic riffs, driving rhythms
    - Classical: voice leading patterns, functional harmony (predominant-dominant-tonic)
  - [ ] 2.4 Genre detection uses weighted scoring: chord progressions (40%), scale usage (30%), rhythm (20%), chord voicing complexity (10%)
  - [ ] 2.5 Return multiple genre matches with confidence scores (a player can exhibit traits of multiple genres)

- [ ] 3. Implement tendency-tracker.ts (AC: 2, 3)
  - [ ] 3.1 Create `src/features/analysis/tendency-tracker.ts` — pure domain logic (Layer 3)
  - [ ] 3.2 Implement `trackTendencies(sessionData: AnalysisAccumulator): PlayingTendencies` — computes frequency distributions across all tracked dimensions from accumulated data
  - [ ] 3.3 Implement key distribution tracking: count pitch classes weighted by duration (longer notes weighted more)
  - [ ] 3.4 Implement chord type distribution: count occurrences of each chord quality (major, minor, dom7, etc.)
  - [ ] 3.5 Implement tempo histogram: bucket BPM values into 10-BPM ranges (40-50, 50-60, ..., 190-200)
  - [ ] 3.6 Implement interval distribution: count the intervals between consecutive notes (in semitones)
  - [ ] 3.7 Implement rhythm profile: detect swing ratio (ratio of long-short beat subdivision), common subdivisions (quarter, eighth, triplet), and note density (notes per beat)

- [ ] 4. Implement avoidance pattern detection (AC: 3)
  - [ ] 4.1 Implement `detectAvoidance(tendencies: PlayingTendencies, sessionCount: number): AvoidancePatterns` — identifies dimensions where the user has zero or near-zero usage relative to their overall playing volume
  - [ ] 4.2 Keys with <2% of total pitch class usage are flagged as avoided
  - [ ] 4.3 Chord types with 0 occurrences despite sufficient playing time are flagged
  - [ ] 4.4 Tempo ranges with 0 notes in a BPM bucket despite adjacent buckets having activity are flagged
  - [ ] 4.5 Avoidance detection requires a minimum data threshold to be meaningful (e.g., 50+ chords, 200+ notes) — return empty patterns below threshold

- [ ] 5. Create analysis accumulator (AC: 1, 2, 5)
  - [ ] 5.1 Define `AnalysisAccumulator` type in `analysis-types.ts` — aggregates raw analysis data from Stories 2.1-2.3: all detected notes, chords, progressions, timing data, key segments
  - [ ] 5.2 Implement accumulator update function that appends new analysis results without re-processing old data (incremental accumulation)
  - [ ] 5.3 The accumulator is maintained in the analysis pipeline and passed to genre/tendency analysis at scheduled intervals

- [ ] 6. Integrate with analysis pipeline and sessionStore (AC: 4, 5)
  - [ ] 6.1 Add `detectedGenres: GenrePattern[]`, `playingTendencies: PlayingTendencies | null`, `avoidancePatterns: AvoidancePatterns | null` to `sessionStore`
  - [ ] 6.2 Schedule genre and tendency analysis to run at 30-second intervals during active play using `setInterval` in the analysis pipeline (not on every MIDI event)
  - [ ] 6.3 Also trigger analysis on silence detection (before snapshot generation in Story 2.5)
  - [ ] 6.4 Ensure analysis execution does not block the main thread: if processing exceeds 16ms, break into smaller chunks or use `requestIdleCallback` for non-critical portions

- [ ] 7. Write co-located tests (AC: 1, 2, 3)
  - [ ] 7.1 Create `src/features/analysis/genre-detector.test.ts` — omitted from architecture tree but follows co-located test convention
  - [ ] 7.2 Test blues detection: I7-IV7-V7 progression with pentatonic notes detects blues pattern
  - [ ] 7.3 Test jazz detection: ii-V-I progression with extended chords detects jazz pattern
  - [ ] 7.4 Test pop detection: I-V-vi-IV with simple triads detects pop pattern
  - [ ] 7.5 Create `src/features/analysis/tendency-tracker.test.ts`
  - [ ] 7.6 Test key distribution: playing only C major scale notes results in C as dominant key
  - [ ] 7.7 Test avoidance detection: all keys played except F# flags F# as avoided
  - [ ] 7.8 Test minimum data threshold: insufficient data returns empty patterns

## Dev Notes

- **Architecture Layer**: Genre detection and tendency tracking are Layer 3 (Domain Logic). Pure functions that operate on accumulated analysis data. No framework or infrastructure dependencies.
- **Performance Strategy**: This is the most computationally expensive analysis in Epic 2, but it only runs every 30 seconds (not per MIDI event). The 16ms budget per invocation ensures no frame drops. If processing grows complex, consider using `requestIdleCallback` for non-time-critical analysis or Web Workers for heavy computation (deferred optimization).
- **Incremental Accumulation**: The `AnalysisAccumulator` collects raw data incrementally. Genre and tendency analysis operates on the full accumulated data but only at scheduled intervals. This amortizes the cost over time.
- **Genre Templates**: Genre detection is template-based, not ML-based. Templates are declarative configurations that score musical features. This is simple, predictable, and debuggable. ML-based genre detection can be explored post-MVP.
- **Avoidance Detection**: Avoidance patterns are only meaningful with sufficient data. The minimum thresholds prevent false positives during short sessions. Over multiple sessions (cross-session aggregation), avoidance patterns become more reliable — this cross-session capability will be integrated in Epic 5 (Difficulty Engine).
- **Dependencies on Stories 2.1-2.3**: This story consumes output from note-detector (2.1), chord-analyzer (2.1), timing-analyzer (2.2), and harmonic-analyzer (2.3). All must be integrated before genre/tendency analysis can produce meaningful results.
- **Library Versions**: No external libraries. All analysis is hand-implemented.
- **Testing**: Vitest unit tests. Create fixture data sets representing clear genre patterns (e.g., a 12-bar blues progression, a jazz ii-V-I sequence).

### Project Structure Notes

- `src/features/analysis/genre-detector.ts` — genre pattern detection
- `src/features/analysis/genre-detector.test.ts` — co-located tests (new file, not in original architecture tree)
- `src/features/analysis/tendency-tracker.ts` — playing tendency tracking
- `src/features/analysis/tendency-tracker.test.ts` — co-located tests
- `src/features/analysis/analysis-types.ts` — extended with genre, tendency, avoidance, and accumulator types
- `src/stores/session-store.ts` — extended with genre, tendency, and avoidance state

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — performance requirements, Zustand state management
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — Layer 3 domain logic, co-located tests
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4] — acceptance criteria, FR11 and FR12 coverage
- [Source: _bmad-output/planning-artifacts/prd.md#Real-Time Analysis] — FR11: genre pattern identification; FR12: playing tendency tracking
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Experience Principles] — "Show, Don't Configure" (tendencies are observed, never configured)

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
