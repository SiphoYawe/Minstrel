# Story 11.2: Add Genre Terminology for All 13 Genres

Status: ready-for-dev

## Story

As a musician playing in any genre,
I want the AI to use genre-appropriate musical terminology,
So that coaching advice feels relevant to my style.

## Acceptance Criteria

1. Given the genre detector identifies one of 13 supported genres, When the AI coaching builds context, Then genre-specific terminology is available for ALL 13 genres. And `getTerminologyForGenre()` returns a populated `GenreTerminology` object for each genre.

2. Given the `GENRE_MAP` in `genre-terminology.ts`, When it is updated, Then it includes terminology maps for 8 new genres: Latin, Country, Electronic, Funk, Gospel, Metal, Folk, Reggae — in addition to the existing 5: Jazz, Blues, Pop/Rock, Classical, R&B/Soul. And each new genre has appropriate aliases in the map (e.g., "EDM" -> Electronic, "Heavy Metal" -> Metal).

3. Given each genre terminology map, When it provides terms, Then it includes genre-specific values for all 5 fields: `chordTerms`, `scaleTerms`, `conceptTerms`, `commonProgressions`, and `styleDescriptors`. And each field has at least 3 entries.

4. Given a genre has no detected match, When the system falls back, Then the `GENERIC` terminology set is used with populated fields (not empty objects/arrays). And the GENERIC object includes universal music theory terms usable across all genres.

## Tasks / Subtasks

- [ ] 1. Add 8 new GenreTerminology objects (AC: 1, 2, 3)
  - [ ] 1.1 In `src/features/coaching/genre-terminology.ts`, after the `RNB_SOUL` const (line 144), add `LATIN: GenreTerminology` with Latin music terminology (montuno, clave, tumbao, son, bossa nova patterns, salsa, rumba, etc.)
  - [ ] 1.2 Add `COUNTRY: GenreTerminology` with country music terminology (Nashville number system, pedal steel, chicken pickin', train beat, honky-tonk, etc.)
  - [ ] 1.3 Add `ELECTRONIC: GenreTerminology` with electronic music terminology (synthesis, filter sweep, sidechain, drop, build, sequencer, arpeggiation, etc.)
  - [ ] 1.4 Add `FUNK: GenreTerminology` with funk terminology (the one, slap bass, chicken scratch, muted strums, pocket, sixteenth-note groove, etc.)
  - [ ] 1.5 Add `GOSPEL: GenreTerminology` with gospel music terminology (shout chord, passing diminished, tritone sub, worship progression, call and response, etc.)
  - [ ] 1.6 Add `METAL: GenreTerminology` with metal terminology (palm mute, gallop picking, power chord, tritone, blast beat, tremolo picking, etc.)
  - [ ] 1.7 Add `FOLK: GenreTerminology` with folk music terminology (fingerpicking, open tuning, drone, modal, Travis picking, DADGAD, etc.)
  - [ ] 1.8 Add `REGGAE: GenreTerminology` with reggae terminology (skank, one drop, riddim, dub, offbeat, bubble organ, etc.)

- [ ] 2. Update GENRE_MAP with new genres and aliases (AC: 2)
  - [ ] 2.1 In `src/features/coaching/genre-terminology.ts`, update `GENRE_MAP` (line 155) to add entries for all 8 new genres
  - [ ] 2.2 Add aliases: `EDM` -> ELECTRONIC, `Dance` -> ELECTRONIC, `Heavy Metal` -> METAL, `Bluegrass` -> FOLK, `Americana` -> FOLK, `Dancehall` -> REGGAE, `Ska` -> REGGAE, `Southern Gospel` -> GOSPEL

- [ ] 3. Populate the GENERIC fallback (AC: 4)
  - [ ] 3.1 In `src/features/coaching/genre-terminology.ts`, update the `GENERIC` const (line 146) to include universal music theory terms in `chordTerms` (major, minor, dominant, diminished, augmented), `scaleTerms` (major scale, minor scale, pentatonic, chromatic), `conceptTerms` (melody, harmony, rhythm, dynamics, phrasing), `commonProgressions` (I-IV-V-I, I-vi-IV-V, ii-V-I), and `styleDescriptors` (legato, staccato, dynamic, expressive, rhythmic)

- [ ] 4. Add/update tests (AC: 1, 2, 3, 4)
  - [ ] 4.1 Update `src/features/coaching/genre-terminology.test.ts` to verify all 13 genres resolve to non-generic terminology
  - [ ] 4.2 Test each genre alias resolves to its parent genre's terminology
  - [ ] 4.3 Test that the GENERIC fallback now returns populated fields (not empty)
  - [ ] 4.4 Test `getTerminologyForGenre(null)` returns the populated GENERIC terminology
  - [ ] 4.5 Test `getGenreTerminologyHints()` returns non-empty hints for all 13 genres

## Dev Notes

- **Architecture Layer**: Layer 3 (Domain Logic) — pure data and lookup functions, no side effects.
- The current `GENRE_MAP` at `src/features/coaching/genre-terminology.ts:155-165` only maps 9 keys (5 genres + 4 aliases): Jazz, Blues, Pop/Rock, Pop, Rock, Classical, R&B/Soul, R&B, Soul.
- The existing `GENERIC` const at line 146-153 has empty objects `{}` and empty arrays `[]` for all fields — this is the fallback when a genre is not found, and it currently provides zero terminology hints.
- The `getTerminologyForGenre()` function at line 167-170 returns `GENERIC` when genre is null or not in the map — this is the correct fallback behavior, but GENERIC needs to be populated.
- The `getGenreTerminologyHints()` function at line 172-192 builds a string from conceptTerms, commonProgressions, and styleDescriptors — this will automatically work with new genres once terminology is added.
- The `GenreTerminology` interface at line 1-8 defines the shape: `genre`, `chordTerms`, `scaleTerms`, `conceptTerms`, `commonProgressions`, `styleDescriptors`.
- The genre detector (not in this file) identifies 13 genres. The AI system prompt at `src/lib/ai/prompts.ts:63-87` (`formatGenreSection`) uses `getGenreTerminologyHints()` to include genre-specific hints.

### Project Structure Notes

- `src/features/coaching/genre-terminology.ts` — add 8 new genre objects, update GENRE_MAP, populate GENERIC
- `src/features/coaching/genre-terminology.test.ts` — update tests for all 13 genres + aliases + populated GENERIC

### References

- [Source: _bmad-output/planning-artifacts/prd.md] — FR24-28: Genre-aware AI coaching, FR33: Genre pattern tracking
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.5] — Genre-aware advice and growth mindset framing
- [Source: _bmad-output/planning-artifacts/architecture.md] — Domain logic layer, pure functions

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
