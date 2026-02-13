# Story 10.7: Warm-Up Generation Flow

Status: ready-for-dev

## Story

As a musician,
I want to request and experience a guided warm-up before my practice session,
so that I can prepare properly.

## Acceptance Criteria

1. Given a user starts a session (authenticated or guest with at least one prior session), When the session page loads and before they start playing, Then a "Warm up first?" option is available as a non-intrusive prompt. And the prompt does not block the session — the user can ignore it and start playing immediately. And the prompt appears below or alongside the return welcome card (Story 10.3) if both are rendered.

2. Given the user selects the warm-up option, When the warm-up generates, Then a ~2-minute warm-up exercise set is created based on their skill profile (from `skill-assessor.ts`) and recent session data (from `continuity-service.ts`). And the generation uses the existing `warmup-generator.ts` from Story 5.7. And a loading indicator is shown during generation (skeleton or spinner, not blocking).

3. Given the warm-up is generated, When it starts, Then the Demonstrate-Listen-Attempt-Analyze drill loop runs for the warm-up exercises using the existing `drill-player.ts` and `drill-controller.tsx` components. And the warm-up is presented in the VisualizationCanvas with the Silent Coach layout. And a progress indicator shows the warm-up progression (e.g., "Exercise 2 of 4").

4. Given the warm-up completes (all exercises finished), When the user finishes the last exercise, Then a brief completion message appears: "Warm-up complete — you're ready to go". And the session transitions seamlessly to freeform practice mode via `startFreeformSession()`. And the warm-up exercises are recorded as part of the session in IndexedDB.

5. Given the user declines the warm-up (clicks "Skip" or starts playing without selecting it), When they skip it, Then the normal session starts immediately. And the warm-up prompt disappears. And no warm-up data is generated or recorded.

## Tasks / Subtasks

- [ ] 1. Create warm-up prompt component (AC: 1, 5)
  - [ ] 1.1 Create `src/components/warm-up-prompt.tsx` — `'use client'` component (Layer 1 Presentation)
  - [ ] 1.2 Layout: a compact card or inline prompt with "Warm up first?" text, a "Start warm-up" button (`#7CB9E8` accent), and a "Skip" text link (muted color)
  - [ ] 1.3 Apply dark studio aesthetic: `bg-[#1A1A1A]`, `border border-[#2A2A2A]`, `rounded-none`, Inter font
  - [ ] 1.4 If the user has been away >3 days (from `use-return-welcome.ts` data), add context: "It's been a while — a warm-up can help"
  - [ ] 1.5 Auto-dismiss on MIDI input (subscribe to `midiStore.lastNoteOn`) — same pattern as Stories 10.1 and 10.3
  - [ ] 1.6 Add `aria-label="Warm-up suggestion"` for screen reader accessibility

- [ ] 2. Create warm-up session flow orchestrator (AC: 2, 3, 4)
  - [ ] 2.1 Create `src/features/session/warm-up-flow.ts` — Layer 2 (Application Logic) that orchestrates the warm-up lifecycle
  - [ ] 2.2 Implement `startWarmUp(): Promise<void>` — calls `warmup-generator.ts` `generateWarmUp()` with the user's skill profile and recent data, then transitions the session type to 'warmup' via `transitionSessionType('warmup')`
  - [ ] 2.3 Implement `onWarmUpComplete(): void` — displays completion message, then transitions session type to 'freeform' via `transitionSessionType('freeform')` after a brief delay (2 seconds)
  - [ ] 2.4 Track warm-up progress state: `currentExercise: number`, `totalExercises: number`, `isGenerating: boolean`, `isComplete: boolean`

- [ ] 3. Create warm-up progress indicator (AC: 3)
  - [ ] 3.1 Create `src/components/warm-up-progress.tsx` — small floating indicator in the StatusBar area showing "Exercise {n} of {total}"
  - [ ] 3.2 Display during warm-up only (conditionally rendered when session type is 'warmup')
  - [ ] 3.3 Apply dark studio aesthetic, JetBrains Mono for the exercise count, muted presentation

- [ ] 4. Integrate with existing drill infrastructure (AC: 3)
  - [ ] 4.1 Connect warm-up exercises to `drill-player.ts` from Story 5.5 for the Demonstrate-Listen-Attempt-Analyze loop
  - [ ] 4.2 Connect to `drill-controller.tsx` from Story 5.4 for the drill UI
  - [ ] 4.3 Ensure warm-up exercises are fed sequentially: when one exercise completes, the next begins automatically
  - [ ] 4.4 The warm-up uses the VisualizationCanvas in Silent Coach layout (no mode switch needed)

- [ ] 5. Integrate into session page (AC: 1, 4, 5)
  - [ ] 5.1 Update `src/app/(auth)/session/page.tsx` — render `WarmUpPrompt` alongside or below the return welcome card (Story 10.3) when the user has a skill profile
  - [ ] 5.2 On "Start warm-up" click, show loading state, generate warm-up, and transition to drill flow
  - [ ] 5.3 On warm-up complete, show completion message and transition to freeform
  - [ ] 5.4 On "Skip" or MIDI input, dismiss prompt and start normal session

- [ ] 6. Write co-located tests (AC: 1, 2, 3, 4, 5)
  - [ ] 6.1 Create `src/components/warm-up-prompt.test.tsx` — test rendering, start action, skip action, MIDI auto-dismiss, and design system compliance
  - [ ] 6.2 Create `src/features/session/warm-up-flow.test.ts` — test warm-up generation call, progress tracking, completion transition, and session type management
  - [ ] 6.3 Create `src/components/warm-up-progress.test.tsx` — test progress indicator rendering with various exercise counts

## Dev Notes

- **Architecture Layer**: `warm-up-prompt.tsx` and `warm-up-progress.tsx` are Layer 1 (Presentation). `warm-up-flow.ts` is Layer 2 (Application Logic) — orchestrates between warmup-generator (Layer 3), drill-player (Layer 3), and session-manager (Layer 2). No new domain logic; this story wires existing backend to a user-facing flow.
- **Dependency on Story 5.7**: The warm-up generation backend (`warmup-generator.ts`) is implemented in Story 5.7. This story provides the UI trigger and experience flow. If 5.7 is not yet available, the warm-up prompt can be shown but the "Start warm-up" button should be disabled with a tooltip: "Warm-up generation coming soon".
- **Dependency on Stories 5.4/5.5**: The drill controller and drill player are needed for the Demonstrate-Listen-Attempt-Analyze loop. These are implemented in Stories 5.4 and 5.5.
- **Non-Blocking UX**: The warm-up prompt must never block the session. If the user ignores it and starts playing, the prompt disappears and freeform mode starts. This is critical — musicians should never feel forced into a warm-up.
- **Warm-Up Duration**: The target is ~2 minutes. This typically translates to 3-5 short exercises. The `warmup-generator.ts` controls the exercise count and duration based on the user's profile. The UI simply displays what the generator produces.
- **Session Recording**: Warm-up exercises are part of the session recording. They are stored as MIDI events in IndexedDB with the same session ID. The session summary (Story 10.2) will include warm-up activity in the total stats.
- **Guest Users**: Guests without a skill profile (first session) do not see the warm-up prompt. The prompt requires at least one prior session to have meaningful data for the generator. This is gated by the `useReturnWelcome` hook's `isFirstTime` check.
- **Library Versions**: React 19.x, Zustand 5.x, Tailwind CSS v4.

### Project Structure Notes

- `src/components/warm-up-prompt.tsx` — warm-up suggestion prompt (create)
- `src/components/warm-up-prompt.test.tsx` — co-located component tests (create)
- `src/components/warm-up-progress.tsx` — exercise progress indicator (create)
- `src/components/warm-up-progress.test.tsx` — co-located component tests (create)
- `src/features/session/warm-up-flow.ts` — warm-up lifecycle orchestrator (create)
- `src/features/session/warm-up-flow.test.ts` — co-located tests (create)
- `src/app/(auth)/session/page.tsx` — modify to include warm-up prompt
- `src/features/session/warmup-generator.ts` — existing, consumed for exercise generation
- `src/features/drills/drill-player.ts` — existing, consumed for drill playback
- `src/components/drill-controller.tsx` — existing, consumed for drill UI

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Difficulty Engine] — FR23: auto-generated warm-ups based on skill profile
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Session Flow] — warm-up as optional pre-session activity
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — session lifecycle, drill infrastructure
- [Source: _bmad-output/implementation-artifacts/5-7-micro-sessions-and-auto-generated-warm-ups.md] — warmup-generator.ts implementation
- [Source: _bmad-output/implementation-artifacts/5-4-ai-drill-generation.md] — drill generation and drill-controller UI
- [Source: _bmad-output/implementation-artifacts/5-5-midi-output-demonstration-playback.md] — drill-player.ts, Demonstrate-Listen-Attempt-Analyze loop
- [Source: _bmad-output/implementation-artifacts/10-3-return-session-welcome-experience.md] — coordination with return welcome card

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
