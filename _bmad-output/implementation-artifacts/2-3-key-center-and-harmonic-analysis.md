# Story 2.3: Key Center and Harmonic Analysis

Status: ready-for-dev

## Story

As a musician,
I want Minstrel to detect what key I'm playing in and analyze the harmonic function of my chords,
so that I can understand the music theory behind what I'm playing.

## Acceptance Criteria

1. Given the user has played 8 or more notes or 3 or more chords, When enough harmonic data has accumulated, Then `harmonic-analyzer.ts` detects the likely key center (e.g., "C major", "A minor") using pitch-class frequency distribution. And the detected key is dispatched to `sessionStore.currentKey`.

2. Given a key center has been detected and chords are being played, When `harmonic-analyzer.ts` processes each detected chord, Then each chord is analyzed for its harmonic function in the detected key (e.g., I, IV, V, vi, ii, iii, vii). And roman numeral analysis is dispatched alongside the chord data in `sessionStore.detectedChords`.

3. Given a key center is established, When individual notes are played over a detected chord, Then the harmonic analyzer distinguishes chord tones from passing tones/non-chord tones (FR33). And each note is tagged as `chordTone: boolean` in the analysis data for the harmonic overlay renderer.

4. Given chord-tone vs passing-tone data is available, When `harmonic-overlay-renderer.ts` renders on the Canvas, Then chord tones and passing tones are visually distinguished using the #B4A7D6 harmonic color palette. And the overlay integrates with the existing piano roll and timing grid layers.

5. Given the user modulates to a new key (e.g., plays chords and notes from a different key center), When the harmonic analyzer detects a sustained shift (3+ chords in a new key), Then the key detection updates dynamically. And the previous key segment is finalized and stored. And roman numeral analysis updates to reflect the new key.

6. Given common chord progressions are played, When co-located tests execute, Then key detection is validated for: I-IV-V-I in C major, ii-V-I in multiple keys, I-vi-IV-V pop progression, and minor key progressions (i-iv-v). And roman numeral assignment is correct for each chord in the detected key. And modulation detection triggers correctly on sustained key change.

## Tasks / Subtasks

- [ ] 1. Define harmonic analysis types (AC: 1, 2, 3)
  - [ ] 1.1 Extend `src/features/analysis/analysis-types.ts` with types: `KeyCenter` (root, mode: 'major' | 'minor', confidence: number), `HarmonicFunction` (romanNumeral: string, quality: string, isSecondary: boolean), `NoteAnalysis` (note: DetectedNote, isChordTone: boolean, chordContext: DetectedChord | null), `KeySegment` (key: KeyCenter, startTimestamp, endTimestamp, chordCount)
  - [ ] 1.2 Define pitch class constants: `PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']`
  - [ ] 1.3 Define key profiles (major and minor pitch-class distributions) for the Krumhansl-Schmuckler key-finding algorithm

- [ ] 2. Implement key detection (AC: 1, 5)
  - [ ] 2.1 Create `src/features/analysis/harmonic-analyzer.ts` — pure domain logic (Layer 3)
  - [ ] 2.2 Implement `detectKey(pitchClasses: number[], weights?: number[]): KeyCenter | null` — uses Krumhansl-Schmuckler algorithm: correlates the pitch-class frequency distribution of played notes against 24 major/minor key profiles, returns the highest-correlation key with confidence score.
  - [ ] 2.3 Return `null` if fewer than 8 notes or if confidence is below a threshold (e.g., correlation < 0.6)
  - [ ] 2.4 Implement `detectModulation(currentKey: KeyCenter, recentChords: DetectedChord[]): KeyCenter | null` — checks if the last 3+ chords fit a new key better than the current key. Returns new key or null.
  - [ ] 2.5 Handle enharmonic key equivalents: prefer flats for flat keys (F, Bb, Eb) and sharps for sharp keys (G, D, A)

- [ ] 3. Implement harmonic function analysis (AC: 2)
  - [ ] 3.1 Implement `analyzeHarmonicFunction(chord: DetectedChord, key: KeyCenter): HarmonicFunction` — maps chord root to scale degree in the detected key, assigns roman numeral (uppercase for major/dominant, lowercase for minor/diminished)
  - [ ] 3.2 Handle diatonic chords (I, ii, iii, IV, V, vi, vii) for both major and natural minor keys
  - [ ] 3.3 Handle common chromatic chords: secondary dominants (V/V, V/vi), borrowed chords (bVII, bVI in major), Neapolitan (bII)
  - [ ] 3.4 For chords that do not fit any recognized function in the key, label as the interval from tonic (e.g., "bIII" for Eb in C major)

- [ ] 4. Implement chord-tone vs passing-tone analysis (AC: 3)
  - [ ] 4.1 Implement `classifyNote(note: DetectedNote, currentChord: DetectedChord | null): NoteAnalysis` — determines if a note is a chord tone (matches one of the chord's pitch classes) or a passing/non-chord tone
  - [ ] 4.2 If no current chord context exists, all notes are classified as unanalyzed (not tagged as either)
  - [ ] 4.3 Track the "current chord" by using the most recently detected chord until a new chord is detected or silence resets

- [ ] 5. Integrate with sessionStore (AC: 1, 2, 3)
  - [ ] 5.1 Add `currentKey: KeyCenter | null`, `keyHistory: KeySegment[]`, and extend `detectedChords` entries with `harmonicFunction: HarmonicFunction | null` in `sessionStore`
  - [ ] 5.2 Wire harmonic analyzer into the analysis pipeline: receive note data from note-detector (Story 2.1), chord data from chord-analyzer (Story 2.1), feed through harmonic analysis, dispatch to sessionStore
  - [ ] 5.3 Run key detection after each new note when note count >= 8, and after each new chord when chord count >= 3
  - [ ] 5.4 Update note-detector output in Story 2.1 integration to optionally use key context for enharmonic spelling (e.g., use Db instead of C# when in Db major)

- [ ] 6. Implement harmonic overlay Canvas renderer (AC: 4)
  - [ ] 6.1 Create `src/components/viz/harmonic-overlay-renderer.ts` — Canvas rendering module
  - [ ] 6.2 Render chord tones with solid #B4A7D6 color, passing tones with a dimmer/dashed version of the same color
  - [ ] 6.3 Display current key center label (e.g., "Key: C Major") in the Canvas overlay area
  - [ ] 6.4 Display roman numeral labels above/below detected chords (e.g., "IV" above an F chord in C major)
  - [ ] 6.5 Subscribe to `sessionStore.currentKey` and chord-tone analysis data via vanilla Zustand subscribe
  - [ ] 6.6 Layer the harmonic overlay on top of the piano roll (Story 2.1) and behind the timing grid (Story 2.2) in the Canvas render order

- [ ] 7. Write co-located unit tests (AC: 6)
  - [ ] 7.1 Create `src/features/analysis/harmonic-analyzer.test.ts`
  - [ ] 7.2 Test `detectKey`: C major from C major scale notes, A minor from A natural minor scale, G major from G major pentatonic
  - [ ] 7.3 Test key detection from chord progressions: I-IV-V-I -> C major (given C, F, G, C chords), ii-V-I -> detect correct key
  - [ ] 7.4 Test `analyzeHarmonicFunction`: C chord in C major = I, Am in C major = vi, Dm in C major = ii, G7 in C major = V7
  - [ ] 7.5 Test `classifyNote`: E over Cmaj = chord tone, D over Cmaj = passing tone
  - [ ] 7.6 Test `detectModulation`: playing I-IV-V-I in C then I-IV-V-I in G should detect modulation to G major
  - [ ] 7.7 Test insufficient data: <8 notes returns null key, <3 chords returns null key

## Dev Notes

- **Architecture Layer**: Harmonic analysis is Layer 3 (Domain Logic). All functions are pure — accept pitch data, return analysis results. No framework or infrastructure dependencies.
- **Key Detection Algorithm**: The Krumhansl-Schmuckler key-finding algorithm is the standard computational approach. It correlates the frequency distribution of pitch classes in the played music against known major and minor key profiles. Profiles are 12-element vectors (one weight per pitch class). Correlation is computed against all 24 possible keys (12 major + 12 minor). The highest correlation wins. This is well-established music cognition research with readily available profile data.
- **Performance**: Key detection involves 24 correlation computations against 12-element vectors — trivial. Runs once per note or chord (not per frame). Well within the 50ms budget.
- **Chord-Tone Classification**: This is straightforward — compare the note's pitch class against the chord's pitch classes. The challenge is maintaining accurate "current chord" context, especially during fast passages where notes and chords overlap.
- **Modulation Detection**: Conservative approach — require 3+ chords in the new key before switching. This prevents false positives from accidental chromaticism or borrowed chords. Confidence threshold can be tuned.
- **Dependencies on Story 2.1**: This story extends the note and chord detection from Story 2.1. The chord analyzer output is the primary input for harmonic analysis. The note detector output is used for key detection and chord-tone classification.
- **Library Versions**: No external libraries. Krumhansl-Schmuckler profiles are hand-coded constants.
- **Testing**: Vitest unit tests. Create test fixtures with known key progressions. Use MIDI note numbers that clearly establish keys.

### Project Structure Notes

- `src/features/analysis/harmonic-analyzer.ts` — key detection, harmonic function, chord-tone classification
- `src/features/analysis/harmonic-analyzer.test.ts` — co-located tests
- `src/features/analysis/analysis-types.ts` — extended with harmonic types
- `src/components/viz/harmonic-overlay-renderer.ts` — Canvas harmonic overlay visualization
- `src/stores/session-store.ts` — extended with key center and harmonic function state

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — Canvas render layers, Zustand vanilla subscribe
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — Layer 3 pure domain logic rules
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3] — acceptance criteria, FR10 and FR33 coverage
- [Source: _bmad-output/planning-artifacts/prd.md#Real-Time Analysis] — FR10: key/tonal/harmonic detection; FR33: chord tones vs passing tones overlay
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX Pattern Analysis] — #B4A7D6 harmonic color, Canvas layering

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
