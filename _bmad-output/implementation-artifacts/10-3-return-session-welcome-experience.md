# Story 10.3: Return Session Welcome Experience

Status: ready-for-dev

## Story

As a returning musician,
I want to see a brief personalized welcome when I start a new session,
so that I feel the continuity of my practice journey.

## Acceptance Criteria

1. Given a returning user with at least one previous session in IndexedDB or Supabase, When they navigate to the session page (before playing), Then a brief welcome card appears showing: (a) time since last session (e.g., "2 days ago"), (b) what they worked on last (key, genre, primary activity), and (c) a suggestion for today's session. And the card appears within 500ms of page load (no perceptible delay).

2. Given the welcome card renders, When it shows last session data, Then it references the user's most recent session context (e.g., "Last session: 2 days ago — you were working on ii-V-I voicings in Bb" or "Last session: yesterday — 23 minutes of jazz improvisation in C minor"). And the description is assembled from stored session metadata, not AI-generated (no API key required).

3. Given the welcome card includes a suggestion, When it renders, Then the suggestion is sourced from the Difficulty Engine's next recommendation via `progressive-overload.ts` or `continuity-service.ts` (e.g., "Pick up where you left off?" or "Try a warm-up first — you've been away 5 days"). And if no Difficulty Engine data is available, the suggestion defaults to "Play freely — Minstrel is listening".

4. Given the welcome card appears, When the user starts playing (first MIDI note-on detected) or clicks a dismiss button, Then the card fades out with a CSS transition (200ms ease-out) and the normal session view takes over. And the card does not reappear for this session.

5. Given the user is a first-time user (zero sessions, `hasCompletedFirstSession` flag not set), When they navigate to the session page, Then the welcome card does NOT appear. And the onboarding empty state from Story 10.1 is shown instead.

## Tasks / Subtasks

- [ ] 1. Create return welcome card component (AC: 1, 2, 4)
  - [ ] 1.1 Create `src/components/return-welcome.tsx` — `'use client'` component (Layer 1 Presentation)
  - [ ] 1.2 Layout: a card overlay positioned at center-top of the session page, with subtle shadow and dark studio aesthetic (`bg-[#1A1A1A]`, `border border-[#2A2A2A]`, `rounded-none`)
  - [ ] 1.3 Sections: top line (time since last session in muted text), middle (last session description in `#7CB9E8` accent), bottom (today's suggestion with optional action buttons)
  - [ ] 1.4 Add dismiss button (X icon, top-right corner) and fade-out animation via CSS `transition: opacity 200ms ease-out`
  - [ ] 1.5 Add `aria-label="Welcome back"` and `role="complementary"` for screen reader accessibility

- [ ] 2. Build last-session data retriever (AC: 1, 2)
  - [ ] 2.1 Create `src/features/session/use-return-welcome.ts` — hook (Layer 2 Application Logic) that retrieves the most recent session's metadata
  - [ ] 2.2 Query `db.guest_sessions.orderBy('startedAt').reverse().first()` from Dexie for local data
  - [ ] 2.3 For authenticated users, also check `continuity-service.ts` `getLocalSessionSummaries()` for richer cross-session context
  - [ ] 2.4 Compute `timeSinceLastSession` using `Date.now() - lastSession.endedAt`, format as relative time ("2 days ago", "yesterday", "5 hours ago")
  - [ ] 2.5 Assemble `lastSessionDescription` from session metadata: key, tempo, session type, duration
  - [ ] 2.6 Return `{ lastSession, timeSince, description, suggestion, isFirstTime, isLoading }`

- [ ] 3. Integrate Difficulty Engine suggestion (AC: 3)
  - [ ] 3.1 Query the Difficulty Engine for the next recommended activity via `progressive-overload.ts` `getNextRecommendation()` or equivalent
  - [ ] 3.2 If Difficulty Engine data is available, format as a suggestion string (e.g., "Pick up where you left off with Bb chord transitions?" or "Try a warm-up — you've been away 5 days")
  - [ ] 3.3 If no Difficulty Engine data exists (new user or no profile), use fallback: "Play freely — Minstrel is listening"
  - [ ] 3.4 If the user has been away more than 3 days, suggest warm-up first: "Try a warm-up first?" linking to Story 10.7

- [ ] 4. Integrate into session page (AC: 1, 4, 5)
  - [ ] 4.1 Update `src/app/(auth)/session/page.tsx` to render `ReturnWelcome` when `useReturnWelcome` returns `isFirstTime === false` and session has not started
  - [ ] 4.2 Subscribe to `midiStore.lastNoteOn` to trigger auto-dismiss on first MIDI input
  - [ ] 4.3 Ensure mutual exclusivity with Story 10.1: if `isFirstTime` is true, render onboarding empty state; if false, render return welcome card
  - [ ] 4.4 Update `src/app/(guest)/play/page.tsx` with same logic (guest users with previous sessions also see welcome)

- [ ] 5. Write co-located tests (AC: 1, 2, 3, 4, 5)
  - [ ] 5.1 Create `src/components/return-welcome.test.tsx` — test rendering with mock session data, time-since formatting, dismiss behavior, and MIDI auto-dismiss
  - [ ] 5.2 Create `src/features/session/use-return-welcome.test.ts` — test Dexie query, relative time calculation, Difficulty Engine integration fallback, and first-time user exclusion

## Dev Notes

- **Architecture Layer**: `return-welcome.tsx` is Layer 1 (Presentation). `use-return-welcome.ts` is Layer 2 (Application Logic) — orchestrates between Dexie, continuity-service, and Difficulty Engine. No new domain logic; it consumes existing services.
- **No AI Required**: The welcome card content is assembled from stored session metadata and the Difficulty Engine's recommendation. No LLM API call is made. This ensures the feature works for users without an API key configured.
- **Continuity Service Integration**: The `continuity-service.ts` (from Story 6.4) provides `getLocalSessionSummaries()` which returns structured session history. The welcome card uses the most recent entry for context.
- **Relative Time Formatting**: Use a simple utility function (not a library like `date-fns`). The app already has timestamp handling. Acceptable formats: "just now" (<1 hour), "X hours ago" (1-23h), "yesterday" (24-47h), "X days ago" (2-30d), "X weeks ago" (>30d).
- **MIDI Auto-Dismiss**: The same pattern used in Story 10.1 — subscribe to `midiStore.lastNoteOn` and trigger fade-out. The musician starts playing and the card disappears. No interaction required.
- **Warm-Up Suggestion Threshold**: If `timeSinceLastSession > 3 days`, the suggestion prioritizes warm-up. This threshold aligns with muscle memory research — after 3+ days, a warm-up is beneficial.
- **Performance**: The Dexie query and store reads should complete in <100ms. The component should render within the 500ms target from page load. No waterfall queries — fire Dexie and store reads in parallel.
- **Library Versions**: React 19.x, Zustand 5.x, Dexie.js 4.x, Tailwind CSS v4.

### Project Structure Notes

- `src/components/return-welcome.tsx` — return welcome card component (create)
- `src/components/return-welcome.test.tsx` — co-located component tests (create)
- `src/features/session/use-return-welcome.ts` — welcome data hook (create)
- `src/features/session/use-return-welcome.test.ts` — co-located hook tests (create)
- `src/app/(auth)/session/page.tsx` — modify to render welcome card
- `src/app/(guest)/play/page.tsx` — modify to render welcome card for returning guests
- `src/features/session/continuity-service.ts` — existing, consumed for session history
- `src/features/difficulty/progressive-overload.ts` — existing, consumed for next recommendation

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Cross-Session Continuity] — FR38: AI references prior sessions, continuity context
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Emotional Design Principles] — growth mindset, continuity, "pick up where you left off"
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — IndexedDB `guest_sessions`, Supabase `sessions` table
- [Source: _bmad-output/implementation-artifacts/6-4-cross-session-continuity.md] — continuity-service.ts, session summaries
- [Source: _bmad-output/implementation-artifacts/5-3-progressive-overload-and-cross-session-recalibration.md] — progressive-overload.ts, next recommendation
- [Source: _bmad-output/implementation-artifacts/10-1-first-run-onboarding-empty-state.md] — mutual exclusivity with onboarding empty state

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
