# Story 6.1: Replay Studio Mode Layout

Status: ready-for-dev

## Story

As a musician,
I want to review my past sessions in a dedicated replay view,
so that I can study my playing after the fact.

## Acceptance Criteria

1. Given the user has recorded sessions stored in Dexie.js, When they navigate to `/replay/[id]`, Then the Replay Studio layout renders with: VisualizationCanvas and timeline at the bottom (~20% viewport), canvas center (~60% viewport), and a tabbed detail panel on the right (~20% viewport), matching the UX5 Tabbed Workspace layout specification. And the layout is responsive down to 1024px minimum width.

2. Given the session ID in the route parameter, When the page loads, Then the session's MIDI events are loaded from Dexie.js for recent local sessions, or from Supabase for older synced sessions. And a loading state (`status: 'loading'`) is shown in `sessionStore` while data loads. And if the session is not found in either store, a clear empty state message is displayed: "Session not found. It may have been deleted or not yet synced."

3. Given the session MIDI events are loaded, When the VisualizationCanvas renders in replay mode, Then the canvas replays the recorded notes using the same piano-roll, timing-grid, and harmonic-overlay renderers used during live play. And the canvas is in a paused state by default, showing the first moment of the session. And the canvas subscribes to replay playback state via Zustand vanilla `subscribe` (not React re-renders) to maintain 60fps during playback.

4. Given a session is loaded, When the session metadata panel renders, Then the following metadata is displayed: session date (locale-formatted via `Intl.DateTimeFormat`), total duration, detected key, average tempo (BPM), timing accuracy percentage, chords used count, and session summary text (from the last snapshot). And the metadata is rendered in a DataCard component inside the tabbed detail panel.

5. Given the user is in Replay Studio, When they look at the ModeSwitcher in the StatusBar, Then Replay Studio is shown as the active mode with the `--accent-primary` underline indicator. And keyboard shortcut `3` activates Replay Studio mode. And switching modes preserves session context without data loss.

6. Given the user has multiple recorded sessions, When they access the session list (via a tab or navigation element in the detail panel), Then they see a scrollable list of sessions sorted by date (most recent first). And each session entry shows: date, duration, detected key, and a truncated summary. And selecting a session navigates to `/replay/[newId]` and loads the selected session. And the list is loaded from Dexie.js with a fallback to Supabase for synced sessions not in the local store.

## Tasks / Subtasks

- [ ] 1. Create Replay Studio route page and layout (AC: 1, 5)
  - [ ] 1.1 Create `src/app/(auth)/replay/[id]/page.tsx` as a `'use client'` component that extracts the session ID from route params
  - [ ] 1.2 Implement the Replay Studio layout using CSS grid/flexbox: timeline bar bottom-anchored (~20% viewport), VisualizationCanvas center (~60% viewport), tabbed detail panel right-anchored (~20% viewport)
  - [ ] 1.3 Wrap the page with an Error Boundary specific to Replay Studio mode (per architecture: one Error Boundary per mode)
  - [ ] 1.4 Add responsive breakpoints: at 1024px-1279px, canvas 55% / detail 25% / timeline 20%; at 1280px+, standard layout as designed
  - [ ] 1.5 Ensure the route is protected by auth middleware (inside `(auth)` route group)

- [ ] 2. Create replay-studio.tsx mode layout component (AC: 1)
  - [ ] 2.1 Create `src/features/modes/replay-studio.tsx` — the Replay Studio mode layout component
  - [ ] 2.2 Accept session data as props and orchestrate the three-panel layout (canvas, timeline, detail)
  - [ ] 2.3 Implement the tabbed detail panel with tabs: Insights, Chat, Session List (using shadcn/ui Tabs component, 0px radius, `--accent-primary` underline active indicator)
  - [ ] 2.4 Add keyboard shortcut `3` for mode switching via ModeSwitcher integration

- [ ] 3. Implement session loading from Dexie.js and Supabase (AC: 2, 6)
  - [ ] 3.1 Create `src/features/session/use-replay-session.ts` — React hook that loads a session by ID
  - [ ] 3.2 Implement load strategy: first check Dexie.js (local IndexedDB) for the session ID; if not found, query Supabase; if neither, return error state
  - [ ] 3.3 Load session metadata and MIDI events separately (metadata first for fast render, events for replay readiness)
  - [ ] 3.4 Update `sessionStore` with replay-specific state: `replaySession`, `replayEvents`, `replayStatus: 'idle' | 'loading' | 'success' | 'error'`
  - [ ] 3.5 Implement session list loader: query Dexie.js for all local sessions, merge with Supabase synced session metadata, deduplicate by session ID, sort by date descending

- [ ] 4. Implement VisualizationCanvas replay mode (AC: 3)
  - [ ] 4.1 Extend `src/components/viz/visualization-canvas.tsx` to accept a `mode: 'live' | 'replay'` prop
  - [ ] 4.2 In replay mode, the canvas reads from a replay playback position (timestamp) instead of live midiStore events
  - [ ] 4.3 Create a replay state slice in `sessionStore`: `replayPosition: number` (current timestamp in ms), `replayState: 'paused' | 'playing'`, `replaySpeed: number`
  - [ ] 4.4 Canvas subscribes to `sessionStore.replayPosition` via vanilla `subscribe` and renders the MIDI state at that timestamp using existing renderers (piano-roll-renderer, timing-grid-renderer, harmonic-overlay-renderer)
  - [ ] 4.5 Implement `getEventsAtTimestamp(events: MidiEvent[], timestamp: number): MidiEvent[]` utility that returns the set of active notes/chords at any point in time

- [ ] 5. Implement session metadata display (AC: 4)
  - [ ] 5.1 Create a session metadata section within the detail panel Insights tab using DataCard components
  - [ ] 5.2 Display date via `Intl.DateTimeFormat` (locale-aware), duration formatted as "mm:ss" or "hh:mm:ss", key, tempo, accuracy, chords count, and summary text
  - [ ] 5.3 Use `JetBrains Mono` for numerical values (tempo, accuracy, duration) per typography spec

- [ ] 6. Write co-located tests (AC: 1, 2, 3, 6)
  - [ ] 6.1 Create `src/features/modes/replay-studio.test.tsx` — test that layout renders three panels, tabs work, mode switcher shows active state
  - [ ] 6.2 Create `src/features/session/use-replay-session.test.ts` — test session loading from Dexie, Supabase fallback, error state, session list loading
  - [ ] 6.3 Test `getEventsAtTimestamp` utility with known MIDI event sequences — verify correct active notes at various timestamps
  - [ ] 6.4 Use `src/test-utils/session-fixtures.ts` for mock session data with MIDI events

## Dev Notes

- **Architecture Layer**: The route page (`src/app/(auth)/replay/[id]/page.tsx`) is Layer 1 (Presentation). The `replay-studio.tsx` mode layout is Layer 1. The `use-replay-session.ts` hook is Layer 2 (Application Logic). Session loading from Dexie/Supabase is Layer 4 (Infrastructure), accessed through `src/lib/dexie/db.ts` and `src/lib/supabase/client.ts` -- never imported directly from the mode component.
- **Canvas Replay Rendering**: The key architectural pattern is that the Canvas must NOT re-render via React for each frame of replay playback. Instead, replay playback updates `sessionStore.replayPosition` at 60fps using `requestAnimationFrame`, and the Canvas subscribes to this via Zustand vanilla `subscribe`. The `getEventsAtTimestamp` function must be efficient -- consider pre-indexing events by timestamp ranges during session load.
- **Dexie Session Loading**: Dexie.js 4.x provides `db.sessions.get(id)` for metadata and `db.midi_events.where('session_id').equals(id).toArray()` for events. For large sessions (30+ minutes at high event density), consider loading events in chunks or using a cursor to avoid blocking the main thread.
- **Memory Management**: A 30-minute session at moderate playing density (~2 notes/second average) produces ~3,600 MIDI events. At ~100 bytes per event, this is ~360KB -- well within the 200MB memory budget. However, the replay engine should not duplicate events in memory -- load once into a reference array, index it, and let the canvas read from it.
- **Layout Pattern**: The Replay Studio follows the UX spec's "Tabbed Workspace" direction. The timeline is bottom-anchored and spans full width. The canvas and detail panel split the remaining space. At tablet sizes (not primary target), the timeline becomes an overlay and the detail panel becomes a slide-up sheet.
- **Mode Transition**: Switching to Replay Studio from Silent Coach or Dashboard mode should use a 300ms ease CSS transition for canvas resize (0ms when `prefers-reduced-motion` is active). The `sessionStore` replay state should be initialized when entering replay mode and cleaned up when exiting.
- **Library Versions**: Next.js 16, Zustand 5.x, Dexie.js 4.x, shadcn/ui Tabs component (0px radius), React 19.
- **Dependencies**: This story depends on Epic 2 (session recording to IndexedDB via Story 2.8) for recorded session data. The VisualizationCanvas, StatusBar, and ModeSwitcher (P0 components from Epic 1/2) must be implemented.

### Project Structure Notes

- `src/app/(auth)/replay/[id]/page.tsx` -- Replay Studio route page (new)
- `src/features/modes/replay-studio.tsx` -- Replay Studio mode layout component (new)
- `src/features/modes/replay-studio.test.tsx` -- co-located tests (new)
- `src/features/session/use-replay-session.ts` -- hook for loading replay session data (new)
- `src/features/session/use-replay-session.test.ts` -- co-located tests (new)
- `src/components/viz/visualization-canvas.tsx` -- extended with replay mode support
- `src/components/viz/canvas-utils.ts` -- `getEventsAtTimestamp` utility added
- `src/stores/session-store.ts` -- extended with replay state slice (`replaySession`, `replayPosition`, `replayState`, `replaySpeed`, `replayEvents`, `replayStatus`)
- `src/lib/dexie/db.ts` -- session and event query methods used
- `src/lib/supabase/client.ts` -- Supabase query fallback for synced sessions
- `src/features/modes/mode-types.ts` -- ensure `'replay-studio'` is in the mode enum
- `src/test-utils/session-fixtures.ts` -- mock session data with MIDI events for testing

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] -- Zustand 5.x store patterns, Canvas vanilla subscribe, 5-layer boundaries
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] -- Dexie.js session/event schema, Supabase session tables
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns] -- feature-based dirs, co-located tests, `@/` imports
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Layout Directions] -- Tabbed Workspace (Dir 6) for Replay Studio, ~60% canvas
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#TimelineScrubber] -- timeline anatomy and states
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Navigation Patterns] -- Mode switcher with keyboard shortcut `3`, tab navigation within Replay Studio
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Behavior] -- 1024px-1279px layout adjustments
- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.1] -- acceptance criteria and FR31 coverage
- [Source: _bmad-output/planning-artifacts/prd.md#Interaction Modes] -- FR31: Replay Studio with timeline scrubbing

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
