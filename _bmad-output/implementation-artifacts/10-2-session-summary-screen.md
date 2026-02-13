# Story 10.2: Session Summary Screen

Status: ready-for-dev

## Story

As a musician,
I want to see a summary of my practice session when I finish,
so that I can review what I accomplished and what to work on next.

## Acceptance Criteria

1. Given a user ends a session (clicks end button, navigates away via ModeSwitcher, or idle timeout fires after configurable silence period), When the session ends, Then a session summary screen is displayed as a full-page overlay or route transition. And the session recording is finalized and saved to IndexedDB before the summary renders.

2. Given the summary screen renders, When it shows data, Then it displays: (a) total practice time (formatted as MM:SS or HH:MM:SS), (b) total notes played (count from MIDI events), (c) chords detected (list of unique chord names), (d) key(s) played in (from `sessionStore.detectedKey`), (e) average tempo in BPM (from `sessionStore.currentTempo`), (f) timing accuracy percentage (from timing analyzer), (g) XP earned this session (from XP calculator, Story 7.2), (h) a key coaching insight.

3. Given the summary includes a coaching insight, When it renders, Then the insight uses growth mindset framing (e.g., "Your timing on chord transitions improved from 400ms to 280ms — closing in" or "You spent 70% of your session in Bb major — building strong home key awareness"). And the insight never uses negative framing like "You struggled with..." or "Your weakness is...".

4. Given the summary screen is displayed, When the user reviews it, Then they can: (a) click "New Session" to start a fresh session, (b) click "Review in Replay" to navigate to `/replay/[id]` for this session, (c) click "Dashboard" to navigate to the Dashboard + Chat mode for deeper analysis. And all three actions are clearly visible as buttons using the design system.

5. Given the session summary, When it renders, Then it matches the dark studio aesthetic: `#0F0F0F` background, `#7CB9E8` accent for stat highlights and CTA buttons, `0px` border radius, Inter font for labels, JetBrains Mono for numeric values (time, BPM, counts). And the layout is a centered card or full-page with generous whitespace, not a dense data table.

## Tasks / Subtasks

- [ ] 1. Create session summary component (AC: 2, 3, 5)
  - [ ] 1.1 Create `src/components/session-summary.tsx` — `'use client'` component (Layer 1 Presentation)
  - [ ] 1.2 Define props interface: `SessionSummaryProps` with fields for all displayed stats (practiceTime, notesPlayed, chordsDetected, keysDetected, avgTempo, timingAccuracy, xpEarned, coachingInsight)
  - [ ] 1.3 Implement stat grid layout: two or three columns of stat cards, each with a label (Inter, muted) and a value (JetBrains Mono, `#7CB9E8` accent)
  - [ ] 1.4 Implement coaching insight section: a highlighted block at the bottom with growth mindset text, using `--accent-warm` or `#7CB9E8` left border accent
  - [ ] 1.5 Apply dark studio aesthetic: `bg-[#0F0F0F]`, `rounded-none` on all cards, centered layout with `max-w-2xl mx-auto`

- [ ] 2. Create session summary data assembler (AC: 2, 3)
  - [ ] 2.1 Create `src/features/session/session-summary-builder.ts` — Layer 2 (Application Logic) that aggregates stats from multiple sources
  - [ ] 2.2 Implement `buildSessionSummary(sessionId: number): Promise<SessionSummaryData>` — pulls data from `sessionStore`, `db.stored_midi_events`, analysis results, and XP calculator
  - [ ] 2.3 Implement `generateCoachingInsight(summary: SessionSummaryData): string` — pure function that selects the most relevant insight based on session data, using growth mindset framing templates
  - [ ] 2.4 Define `SessionSummaryData` type in `src/features/session/session-types.ts`

- [ ] 3. Implement navigation actions (AC: 4)
  - [ ] 3.1 Add "New Session" button that calls `resetSession()` from `session-manager.ts` and navigates to `/session` or `/play`
  - [ ] 3.2 Add "Review in Replay" button that navigates to `/replay/[sessionId]` using `next/navigation` `useRouter`
  - [ ] 3.3 Add "Dashboard" button that switches mode to `DashboardChat` via `sessionStore.setCurrentMode`

- [ ] 4. Integrate with session lifecycle (AC: 1)
  - [ ] 4.1 Update `src/features/session/session-manager.ts` — add `endSession()` function (or extend existing) that triggers summary display
  - [ ] 4.2 Hook session end events: explicit end button click, navigation away from session page, idle timeout (configurable, default 5 minutes of no MIDI input)
  - [ ] 4.3 Ensure session recording is finalized (written to IndexedDB, status set to 'completed') before summary data is assembled
  - [ ] 4.4 Update `src/app/(auth)/session/page.tsx` to render `SessionSummary` overlay when session state is 'ended'

- [ ] 5. Write co-located tests (AC: 1, 2, 3, 4)
  - [ ] 5.1 Create `src/components/session-summary.test.tsx` — test rendering of all stat fields, coaching insight display, navigation button presence, and design system compliance
  - [ ] 5.2 Create `src/features/session/session-summary-builder.test.ts` — test data aggregation from mock stores, coaching insight generation with growth mindset validation (ensure no negative framing patterns), edge cases (zero notes, very short sessions)

## Dev Notes

- **Architecture Layer**: `session-summary.tsx` is Layer 1 (Presentation) — receives props and renders. `session-summary-builder.ts` is Layer 2 (Application Logic) — orchestrates data from stores, Dexie, and analysis modules. `generateCoachingInsight` is a pure function within the builder (could be extracted to Layer 3 if it grows complex).
- **Session End Detection**: The session currently starts via `startFreeformSession()` but has no formal end. This story introduces the session end lifecycle. The idle timeout should be implemented as a `setTimeout` reset on each MIDI event, firing after 5 minutes of silence. The end button should be added to the StatusBar.
- **Growth Mindset Insight Generation**: The `generateCoachingInsight` function uses a template system, not AI. It selects the most notable stat (biggest improvement, longest key duration, best timing) and frames it positively. AI-generated insights require an API key and are deferred to the Dashboard + Chat mode.
- **XP Integration**: Depends on Story 7.2 (XP Calculation). If 7.2 is not yet implemented, the XP field should show a placeholder or be conditionally hidden. Use optional chaining and a fallback: `xpEarned ?? '--'`.
- **Replay Link**: The session must have a stable ID in IndexedDB before the replay link works. The `sessionId` from the `guest_sessions` auto-increment key is used for the replay URL.
- **No Auto-Dismiss**: The summary screen persists until the user takes an action. It does not auto-dismiss or have a countdown. The musician should have time to read and reflect.
- **Library Versions**: React 19.x, Zustand 5.x, Dexie.js 4.x, Next.js 16, Tailwind CSS v4.

### Project Structure Notes

- `src/components/session-summary.tsx` — session summary UI component (create)
- `src/components/session-summary.test.tsx` — co-located component tests (create)
- `src/features/session/session-summary-builder.ts` — data assembler and insight generator (create)
- `src/features/session/session-summary-builder.test.ts` — co-located tests (create)
- `src/features/session/session-types.ts` — extend with `SessionSummaryData` type
- `src/features/session/session-manager.ts` — extend with `endSession()` function
- `src/app/(auth)/session/page.tsx` — modify to render summary on session end
- `src/stores/session-store.ts` — extend with session end state if needed

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#SessionSummary] — P1 component, session recap card with stats and coaching insight
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Emotional Design Principles] — growth mindset framing, "amber not red", no failure states
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — IndexedDB `guest_sessions` table, session lifecycle
- [Source: _bmad-output/planning-artifacts/prd.md#Session Management] — session recording, session data persistence
- [Source: _bmad-output/implementation-artifacts/7-2-xp-calculation-and-awards.md] — XP calculation dependency
- [Source: _bmad-output/implementation-artifacts/2-8-session-recording-to-indexeddb.md] — session recording and IndexedDB storage

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
