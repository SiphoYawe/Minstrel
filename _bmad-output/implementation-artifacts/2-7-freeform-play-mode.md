# Story 2.7: Freeform Play Mode

Status: done

## Story

As a musician,
I want to just play with no structured objectives,
so that I can warm up, noodle, or practice freely while Minstrel listens.

## Acceptance Criteria

1. Given the user enters a session (either authenticated at `/session` or guest at `/play`), When they begin playing without selecting any drill, exercise, or structured activity, Then the system enters freeform play mode automatically. And `sessionStore.sessionType` is set to `'freeform'`. And no prompt or dialog asks the user to choose an activity.

2. Given freeform play mode is active, When the user plays, Then all analysis engines run in the background: note-detector (Story 2.1), chord-analyzer (Story 2.1), timing-analyzer (Story 2.2), harmonic-analyzer (Story 2.3), genre-detector (Story 2.4), and tendency-tracker (Story 2.4). And results are dispatched to `sessionStore` as in any other mode.

3. Given freeform play mode is active, When the Silent Coach visualization is rendered, Then the Canvas responds in real time to the user's playing (notes, chords, timing grid, harmonic overlay). And visualization is identical to any other play mode — freeform is not a degraded experience.

4. Given freeform play mode is active, When the user pauses (silence for 3+ seconds), Then session snapshots trigger as normal per Story 2.5. And the snapshot key insight may reference freeform-specific observations (e.g., "You explored 4 different keys this session -- your range is growing").

5. Given freeform play mode is active, When the user is playing, Then no interruptions, prompts, structured exercises, drill suggestions, or "what would you like to work on?" dialogs appear. And the only way structured content appears is if the user explicitly requests it (e.g., switching to Dashboard mode and asking the AI). And the system respects the musician's flow state.

6. Given freeform play data is being generated, When the session continues, Then all MIDI events, analysis results, snapshots, and tendency data are captured and stored (via session-recorder, Story 2.8). And this data is available for later analysis, drill generation (Epic 5), and progress tracking (Epic 7). And no data is discarded because the session is "just freeform."

## Tasks / Subtasks

- [ ] 1. Define session type state (AC: 1)
  - [ ] 1.1 Extend `src/features/session/session-types.ts` with: `SessionType` enum (`Freeform`, `Drill`, `MicroSession`, `Warmup`)
  - [ ] 1.2 Add `sessionType: SessionType` to `sessionStore` (default: `SessionType.Freeform`)
  - [ ] 1.3 Add `sessionStartTimestamp: number | null` to `sessionStore` (set on first MIDI event)

- [ ] 2. Implement freeform session initialization (AC: 1, 5)
  - [ ] 2.1 Create or extend `src/features/session/session-manager.ts` — manages session lifecycle
  - [ ] 2.2 Implement `startFreeformSession(): void` — called when the user's first MIDI note-on event is detected without any prior drill/exercise selection
  - [ ] 2.3 On first note: set `sessionStore.sessionType = 'Freeform'`, set `sessionStore.sessionStartTimestamp = performance.now()`, initialize analysis pipeline, start session recording
  - [ ] 2.4 No UI prompt, no selection dialog, no "choose mode" screen — the session starts silently on the first note
  - [ ] 2.5 If a drill or exercise is later requested (from Dashboard + Chat in Epic 4 or Difficulty Engine in Epic 5), the session type can transition mid-session from Freeform to the structured type

- [ ] 3. Wire analysis pipeline for freeform mode (AC: 2)
  - [ ] 3.1 Ensure the analysis pipeline (from Stories 2.1-2.4) starts processing on the first MIDI event in freeform mode
  - [ ] 3.2 Verify that all analyzers (note-detector, chord-analyzer, timing-analyzer, harmonic-analyzer, genre-detector, tendency-tracker) activate and produce output
  - [ ] 3.3 No analysis engine is disabled or downgraded in freeform mode — full analysis runs identically to any other mode

- [ ] 4. Ensure visualization works in freeform (AC: 3)
  - [ ] 4.1 Verify that the VisualizationCanvas (piano roll, timing grid, harmonic overlay from Stories 2.1-2.3) renders correctly in freeform mode within the Silent Coach layout (Story 2.6)
  - [ ] 4.2 No "freeform" watermark, badge, or indicator on the Canvas — the experience is identical to structured play
  - [ ] 4.3 The StatusBar (Story 2.6) displays the same info regardless of session type

- [ ] 5. Ensure snapshot triggers work in freeform (AC: 4)
  - [ ] 5.1 Verify that silence detection and snapshot generation (Story 2.5) trigger correctly in freeform mode
  - [ ] 5.2 Add freeform-specific insight templates to snapshot-generator: e.g., "You explored {n} different keys this session", "Your playing spanned {range} BPM -- you're comfortable across tempos", "Strong tendency toward {genre} patterns"
  - [ ] 5.3 Freeform insights emphasize exploration and breadth rather than specific drill-like targets

- [ ] 6. Ensure data capture completeness (AC: 6)
  - [ ] 6.1 Verify that session-recorder (Story 2.8) captures all MIDI events during freeform play
  - [ ] 6.2 Verify that analysis snapshots are stored alongside session data
  - [ ] 6.3 Tag all stored data with `sessionType: 'freeform'` so downstream consumers (drill generation, progress tracking) can differentiate freeform data from structured drill data
  - [ ] 6.4 Freeform data is NOT second-class — it feeds the Difficulty Engine (Epic 5) and progress tracking (Epic 7) identically to drill data

- [ ] 7. Implement no-interruption guard (AC: 5)
  - [ ] 7.1 Add a `sessionStore.interruptionsAllowed: boolean` flag (default: false in freeform)
  - [ ] 7.2 Any component that would show a prompt, suggestion, or structured content checks this flag before rendering
  - [ ] 7.3 In freeform mode, only user-initiated actions (clicking ModeSwitcher, opening chat) can trigger structured content
  - [ ] 7.4 Silence-triggered snapshots are NOT considered interruptions — they appear during natural pauses

- [ ] 8. Write co-located tests (AC: 1, 2, 5, 6)
  - [ ] 8.1 Extend `src/features/session/session-manager.test.ts` (create if not exists)
  - [ ] 8.2 Test freeform auto-start: first MIDI event sets session type to Freeform
  - [ ] 8.3 Test no-interruption: verify `interruptionsAllowed` is false in freeform mode
  - [ ] 8.4 Test session type transition: freeform can transition to drill when explicitly requested
  - [ ] 8.5 Test data tagging: all stored data includes `sessionType: 'freeform'` metadata

## Dev Notes

- **Architecture Layer**: Session management is Layer 2 (Application Logic) — orchestrates between domain logic (analysis pipeline) and presentation (modes). Session types are Layer 3 domain types.
- **Design Philosophy**: Freeform mode is NOT a "lesser" mode. It is the default and arguably the most important mode. It is where the "it hears me" moment happens, where habits are built, and where the musician is most in flow. The code should reflect this: freeform is not a fallback or absence of structure — it is a deliberate, full-featured mode.
- **UX Principle**: "Play First, Everything Else Follows" and "Silence Is Respect" — freeform mode is the purest expression of these principles. No prompts, no configuration, no interruptions.
- **Session Type Transitions**: A freeform session can transition to a structured session (drill, micro-session) if the user explicitly requests one. The transition preserves all existing session data and simply changes the mode/type context. This transition logic is minimal in this story and is fully developed in Epic 5.
- **Interruption Guard**: The `interruptionsAllowed` flag is a simple but important mechanism. It prevents future features (drill suggestions, coaching prompts) from accidentally breaking the freeform experience. Components should check this flag rather than checking session type directly, to allow the guard to be applied in other contexts if needed.
- **Dependencies**: This story is primarily an integration story that verifies Stories 2.1-2.6 work together in the freeform context. The implementation is lightweight — mostly state initialization and guards. The heavy lifting was done in prior stories.
- **Library Versions**: No new libraries. Uses existing Zustand 5.x stores, React components, and analysis pipeline.
- **Testing**: Vitest for unit tests, React Testing Library for component integration tests. Focus on state management and pipeline activation.

### Project Structure Notes

- `src/features/session/session-types.ts` — extended with SessionType enum
- `src/features/session/session-manager.ts` — session lifecycle management (created or extended)
- `src/features/session/session-manager.test.ts` — co-located tests
- `src/stores/session-store.ts` — extended with sessionType, sessionStartTimestamp, interruptionsAllowed
- `src/features/analysis/snapshot-generator.ts` — extended with freeform-specific insight templates

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Flow Architecture] — MIDI event flow through analysis pipeline to stores
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — Zustand immutable updates, selector patterns
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.7] — acceptance criteria, FR34 coverage
- [Source: _bmad-output/planning-artifacts/prd.md#Session Management] — FR34: freeform play with no structured objectives
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Experience Principles] — "Play First, Everything Else Follows", "Silence Is Respect"
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Effortless Interactions] — session starts on first note, no configuration

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
