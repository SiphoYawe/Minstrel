# Story 10.8: Offline Mode Indicator

Status: ready-for-dev

## Story

As a user with intermittent internet,
I want to see when I'm offline and what still works,
so that I can continue practicing without confusion.

## Acceptance Criteria

1. Given the user loses internet connection, When the app detects offline status via `navigator.onLine` and the `offline` window event, Then a subtle indicator appears in the StatusBar showing "Offline — MIDI & practice active, AI features paused". And the indicator uses an amber tone (`--accent-warm` or `#F59E0B`) consistent with the "trajectory, not failure" design philosophy. And the indicator does not use red, does not flash, and does not modal-block the user.

2. Given the user is offline, When they attempt to use an AI feature (open chat panel, request drill generation, trigger warm-up generation), Then a contextual inline message appears in the relevant panel: "AI features require an internet connection — connect to use coaching and drill generation". And the message replaces the loading state, not appended as an error. And the user can dismiss or ignore the message.

3. Given the user reconnects to the internet, When online status is restored via the `online` window event, Then the offline indicator disappears from the StatusBar with a smooth fade transition. And any queued Supabase sync operations resume automatically via the existing `sync.ts` module. And no manual refresh is required.

4. Given the offline indicator renders in the StatusBar, When it is displayed, Then it uses amber coloring (`#F59E0B` or similar warm amber), not red. And the message tone is informational, not alarming. And the design matches the dark studio aesthetic: `0px` border radius, Inter font, small/medium text size consistent with other StatusBar elements.

## Tasks / Subtasks

- [ ] 1. Create online/offline detection hook (AC: 1, 3)
  - [ ] 1.1 Create `src/hooks/use-online-status.ts` — custom hook (Layer 2 Application Logic)
  - [ ] 1.2 Initialize state from `navigator.onLine` on mount
  - [ ] 1.3 Register `online` and `offline` event listeners on `window` in a `useEffect`
  - [ ] 1.4 Return `{ isOnline: boolean, wasOffline: boolean }` — `wasOffline` is true for 3 seconds after reconnecting (used for brief "Back online" confirmation)
  - [ ] 1.5 Cleanup event listeners on unmount
  - [ ] 1.6 Handle SSR: default to `true` if `navigator` is not available (server-side rendering safety)

- [ ] 2. Create StatusBar offline indicator (AC: 1, 4)
  - [ ] 2.1 Update `src/components/status-bar.tsx` — add a conditional offline indicator element
  - [ ] 2.2 When `isOnline === false`, render amber indicator: small amber dot + "Offline" text, expandable to full message "MIDI & practice active, AI features paused"
  - [ ] 2.3 When `wasOffline === true` (just reconnected), briefly show "Back online" in green for 3 seconds, then fade out
  - [ ] 2.4 Styling: amber text `text-[#F59E0B]`, amber dot `bg-[#F59E0B]`, `rounded-none` container, Inter font, inline with other StatusBar elements
  - [ ] 2.5 Position: in the right section of the StatusBar, before the session timer, after the help button
  - [ ] 2.6 Add `aria-live="polite"` so screen readers announce connectivity changes

- [ ] 3. Add graceful degradation to AI features (AC: 2)
  - [ ] 3.1 Update `src/components/ai-chat-panel.tsx` — check `useOnlineStatus().isOnline` before sending messages. When offline, display inline message instead of attempting the API call
  - [ ] 3.2 Create `src/components/offline-message.tsx` — reusable inline message component: "AI features require an internet connection" with an amber Wi-Fi-off icon
  - [ ] 3.3 Update drill generation flow — when offline and user requests a drill, show the offline message instead of calling the API
  - [ ] 3.4 Update warm-up generation flow (Story 10.7) — when offline, disable the "Start warm-up" button with tooltip: "Requires internet connection"
  - [ ] 3.5 Ensure all offline messages use informational tone, not error tone. No "Error:", no red, no exclamation marks.

- [ ] 4. Integrate auto-sync on reconnection (AC: 3)
  - [ ] 4.1 In `use-online-status.ts`, expose a callback `onReconnect` that fires once when transitioning from offline to online
  - [ ] 4.2 In the app's root or auth layout, listen for `onReconnect` and trigger `syncPendingSessions()` from `src/lib/dexie/sync.ts`
  - [ ] 4.3 Log sync activity to console in development mode for debugging

- [ ] 5. Write co-located tests (AC: 1, 2, 3, 4)
  - [ ] 5.1 Create `src/hooks/use-online-status.test.ts` — test initial state from `navigator.onLine`, event listener registration, state transitions on online/offline events, `wasOffline` temporary state, and SSR fallback
  - [ ] 5.2 Create `src/components/offline-message.test.tsx` — test rendering with amber styling, dismissibility, and informational tone (no "error" or "failed" language)
  - [ ] 5.3 Update `src/components/status-bar.test.tsx` — add tests for offline indicator rendering, "Back online" temporary state, and `aria-live` attribute
  - [ ] 5.4 Update `src/components/ai-chat-panel.test.tsx` — add tests for offline state handling (message display instead of API call)

## Dev Notes

- **Architecture Layer**: `use-online-status.ts` is Layer 2 (Application Logic) — manages browser state and exposes it to React. `offline-message.tsx` is Layer 1 (Presentation). StatusBar modifications are Layer 1.
- **No External Dependencies**: The `navigator.onLine` API and `online`/`offline` window events are standard browser APIs. No additional library is needed for connectivity detection.
- **Amber, Not Red**: This is a core UX principle from the design specification. Offline status is a state, not an error. The user's MIDI input, visualization, local recording, and analysis pipeline all continue working offline. Only cloud features (AI chat, drill generation, Supabase sync) are affected. The indicator communicates this distinction.
- **`navigator.onLine` Limitations**: `navigator.onLine` detects whether the device has a network connection, not whether the internet is reachable. A device connected to a router with no internet will report `online: true`. For Minstrel's purposes, this is acceptable — if a Supabase or AI API call fails, the existing error handling in those services will catch it. The offline indicator is a best-effort UX improvement, not a guarantee.
- **Auto-Sync**: The existing `syncPendingSessions()` from `src/lib/dexie/sync.ts` handles the actual sync logic. This story only needs to trigger it on reconnection. The sync function is already idempotent and handles conflicts.
- **StatusBar Real Estate**: The StatusBar already contains: MIDI status (left), key/tempo (center), session timer (right). The offline indicator should be compact — an amber dot and "Offline" text, not a full banner. It appears between the session timer and the help button.
- **SSR Safety**: Next.js server-side rendering does not have access to `navigator` or `window`. The hook must return a safe default (`isOnline: true`) during SSR and hydrate correctly on the client.
- **Library Versions**: React 19.x, Next.js 16, Tailwind CSS v4.

### Project Structure Notes

- `src/hooks/use-online-status.ts` — online/offline detection hook (create)
- `src/hooks/use-online-status.test.ts` — co-located hook tests (create)
- `src/components/offline-message.tsx` — reusable offline message component (create)
- `src/components/offline-message.test.tsx` — co-located component tests (create)
- `src/components/status-bar.tsx` — modify to add offline indicator
- `src/components/status-bar.test.tsx` — modify to add offline indicator tests
- `src/components/ai-chat-panel.tsx` — modify to handle offline state
- `src/components/ai-chat-panel.test.tsx` — modify to add offline state tests
- `src/lib/dexie/sync.ts` — existing, consumed for `syncPendingSessions()`

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Emotional Design Principles] — "Amber, not red", trajectory not failure, no panic states
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#StatusBar] — P0 component, persistent floating overlay, compact indicators
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — Dexie.js offline-first, Supabase sync, `syncPendingSessions()`
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — `'use client'` directive, SSR considerations
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements] — NFR: offline-first data architecture, graceful degradation
- [Source: _bmad-output/implementation-artifacts/2-8-session-recording-to-indexeddb.md] — IndexedDB session storage, offline recording capability

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
