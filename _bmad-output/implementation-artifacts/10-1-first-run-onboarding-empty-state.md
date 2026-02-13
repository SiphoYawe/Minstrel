# Story 10.1: First-Run Onboarding Empty State

Status: ready-for-dev

## Story

As a first-time user,
I want to see a guided first-run experience when I have no session data,
so that I understand how to start using Minstrel.

## Acceptance Criteria

1. Given a new user (guest or authenticated) with zero sessions in IndexedDB, When they navigate to the session page, Then an empty state is displayed with clear guidance instead of a blank canvas. And the VisualizationCanvas is not rendered until the first MIDI event is detected.

2. Given the empty state renders, When the user sees it, Then it shows: (a) a "Connect your MIDI device" prompt with a visual connection indicator (green dot when connected, amber dot when scanning, grey when no device), (b) "Play anything — Minstrel listens" as the primary call-to-action in large, glanceable typography, (c) an optional link to the troubleshooting panel if no MIDI device is detected after 5 seconds.

3. Given the user connects a MIDI device and plays their first note, When MIDI input is detected via `midiStore.lastNoteOn`, Then the empty state transitions smoothly to the real-time VisualizationCanvas with a CSS fade-out animation (200ms ease-out). And the session starts via `startFreeformSession()` as normal.

4. Given the onboarding empty state, When it renders, Then it matches the dark studio aesthetic: `#0F0F0F` background, `#7CB9E8` accent for the primary CTA, `0px` border radius on all elements, Inter font for body text, JetBrains Mono for the device name indicator.

5. Given the user has completed at least one session (session count > 0 in IndexedDB `guest_sessions` table), When they return to the session page, Then the onboarding empty state never appears again. And a `hasCompletedFirstSession` flag is persisted in localStorage as a fast-check to avoid querying IndexedDB on every page load.

## Tasks / Subtasks

- [ ] 1. Create the onboarding empty state component (AC: 1, 2, 4)
  - [ ] 1.1 Create `src/components/onboarding-empty-state.tsx` — `'use client'` component (Layer 1 Presentation)
  - [ ] 1.2 Implement three-section layout: top (MIDI connection indicator), center (primary CTA "Play anything — Minstrel listens"), bottom (troubleshooting link, conditionally rendered)
  - [ ] 1.3 Subscribe to `midiStore.connectionStatus` for the MIDI connection indicator dot (green/amber/grey)
  - [ ] 1.4 Apply dark studio aesthetic: `bg-[#0F0F0F]`, `text-[#7CB9E8]` for accent, `rounded-none` on all elements, Inter font-family, large typography (text-2xl or text-3xl for CTA)
  - [ ] 1.5 Add `aria-label` and `role="status"` on the connection indicator for screen reader accessibility

- [ ] 2. Implement first-session detection logic (AC: 1, 5)
  - [ ] 2.1 Create `src/features/session/use-first-session.ts` — hook that checks `localStorage.getItem('hasCompletedFirstSession')` first, then falls back to querying `db.guest_sessions.count()` from Dexie
  - [ ] 2.2 Return `{ isFirstTime: boolean, isLoading: boolean }` state
  - [ ] 2.3 On session completion, set `localStorage.setItem('hasCompletedFirstSession', 'true')` and update the hook state

- [ ] 3. Implement MIDI-triggered transition (AC: 3)
  - [ ] 3.1 In the session page, subscribe to `midiStore.lastNoteOn` to detect first MIDI input
  - [ ] 3.2 On first note detection, trigger a CSS fade-out (opacity 1 to 0, 200ms ease-out) on the onboarding component
  - [ ] 3.3 After transition completes, unmount the onboarding component and render the VisualizationCanvas
  - [ ] 3.4 Call `startFreeformSession()` from `session-manager.ts` as part of the transition

- [ ] 4. Integrate into session pages (AC: 1, 3, 5)
  - [ ] 4.1 Update `src/app/(auth)/session/page.tsx` to conditionally render `OnboardingEmptyState` when `isFirstTime` is true and no MIDI input has been received
  - [ ] 4.2 Update `src/app/(guest)/play/page.tsx` with the same conditional rendering for guest users
  - [ ] 4.3 Ensure the troubleshooting link opens the existing `TroubleshootingPanel` component

- [ ] 5. Write co-located tests (AC: 1, 2, 3, 5)
  - [ ] 5.1 Create `src/components/onboarding-empty-state.test.tsx` — test rendering of all three sections, MIDI connection states, and accessibility attributes
  - [ ] 5.2 Create `src/features/session/use-first-session.test.ts` — test localStorage fast-check, Dexie fallback query, and flag persistence after first session

## Dev Notes

- **Architecture Layer**: `onboarding-empty-state.tsx` is Layer 1 (Presentation). `use-first-session.ts` is Layer 2 (Application Logic) — orchestrates between localStorage, Dexie, and component state. No domain logic introduced.
- **MIDI Store Integration**: The component subscribes to `midiStore` via Zustand selectors for connection status. It does NOT poll — it reacts to store changes. The `lastNoteOn` selector is used to detect first input without subscribing to the full event stream.
- **localStorage as Fast-Check**: Querying IndexedDB on every page load is unnecessary overhead for a boolean check. `hasCompletedFirstSession` in localStorage provides an O(1) synchronous check. The Dexie query is only used as a fallback if the localStorage key is missing (e.g., cleared storage).
- **Transition Animation**: Use CSS `transition: opacity 200ms ease-out` rather than a JavaScript animation library. The transition is simple enough to handle with CSS alone. After the transition, the component is unmounted (not hidden) to free memory.
- **Troubleshooting Link**: Links to the existing `TroubleshootingPanel` component from Story 1.5. Conditionally shown only when no MIDI device is detected after a 5-second timeout (using `setTimeout` in a `useEffect`).
- **No Confetti, No Celebration**: The transition from empty state to visualization is smooth and understated. No "Great job connecting!" popup. The app simply starts working when the musician plays.
- **Library Versions**: React 19.x, Zustand 5.x, Dexie.js 4.x, Tailwind CSS v4.

### Project Structure Notes

- `src/components/onboarding-empty-state.tsx` — new empty state component (create)
- `src/components/onboarding-empty-state.test.tsx` — co-located component tests (create)
- `src/features/session/use-first-session.ts` — first-session detection hook (create)
- `src/features/session/use-first-session.test.ts` — co-located hook tests (create)
- `src/app/(auth)/session/page.tsx` — modify to conditionally render onboarding
- `src/app/(guest)/play/page.tsx` — modify to conditionally render onboarding
- `src/components/troubleshooting-panel.tsx` — existing, linked from empty state

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Emotional Design Principles] — "Silence Is Respect", minimal chrome, no aggressive onboarding
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Anti-Patterns] — "Tutorial overload" anti-pattern, first-run should guide not lecture
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — Zustand selectors, `'use client'` directive, component patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — IndexedDB via Dexie.js, `guest_sessions` table
- [Source: _bmad-output/planning-artifacts/prd.md#First Note Experience] — FR6: instant feedback on first note, FR7: MIDI troubleshooting
- [Source: _bmad-output/implementation-artifacts/1-5-midi-troubleshooting-guidance.md] — existing TroubleshootingPanel component

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
