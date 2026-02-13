---
status: 'active'
createdAt: '2026-02-13'
inputDocuments:
  - '_bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md'
  - '_bmad-output/planning-artifacts/epics.md'
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
workflowType: 'epics-and-stories'
project_name: 'Minstrel'
user_name: 'Melchizedek'
date: '2026-02-13'
---

# Minstrel - Epics 12-17: Bug Fix, UX Overhaul & Feature Completion

## Overview

This document defines Epics 12-17 for Minstrel, covering critical bug fixes, UX overhaul, and feature completion based on the comprehensive audit conducted on 2026-02-13. These epics address launch-blocking bugs (session replay completely broken), navigation and layout failures, data accuracy problems, a broken drill system, AI chat enrichment needs, and UX polish gaps.

**Source:** `_bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md`

## Audit Issue Coverage Map

| Audit ID   | Epic | Brief Description                         |
| ---------- | ---- | ----------------------------------------- |
| BUG-01     | 12   | Replay does not work at all               |
| NAV-01     | 13   | No in-app navigation                      |
| NAV-02     | 13   | Element overlap / mode switcher overlap   |
| NAV-03     | 13   | Replay trackbar overlapping side drawer   |
| DASH-01    | 14   | Dashboard tab data completely wrong       |
| DASH-02    | 14   | No proper user dashboard with stats       |
| BUG-02     | 14   | Key detection not always accurate         |
| BUG-03     | 14   | Dashboard out of sync with sessions       |
| BUG-05     | 14   | BPM/timing accuracy not accurate          |
| BUG-06     | 14   | Snapshot data inaccurate / not helpful    |
| BUG-04     | 14   | Session history data incomplete           |
| DRILL-01   | 15   | Drill only generates prompt, no content   |
| DRILL-02   | 15   | No way to hear drill sound                |
| DRILL-03   | 15   | Drills not stored properly                |
| DRILL-04   | 15   | Drill prompt textarea gets cut off        |
| CHAT-01    | 16   | AI chat needs more/better visualizations  |
| CHAT-02    | 16   | Chord and note visualizations too small   |
| UX-02      | 16   | Studio Engineer persona needs presence    |
| UX-03      | 16   | Visual hierarchy — everything same size   |
| UX-06      | 16   | Canvas visualization needs legend         |
| UX-04      | 17   | Progress section buried and hidden        |
| UX-05      | 17   | Mode switching is confusing               |
| UX-07      | 17   | Empty states are uninspiring              |
| UX-08      | 17   | Amber overused, no positive color         |
| UX-10      | 17   | Session end experience missing            |
| UX-11      | 17   | Chord visualization text-only             |
| UX-13      | 17   | No visual feedback for MIDI input quality |
| MISSING-01 | 17   | No warm-up drills section visible         |
| MISSING-02 | 14   | No user profile / account dashboard       |

## Epic List

### Epic 12: Session Replay Resurrection (P0)

Session replay is completely broken. The visualization canvas only watches live MIDI input, and the replay engine never feeds events to the visual system. Users cannot see, hear, or interact with replayed sessions.
**Source:** BUG-01 from audit

### Epic 13: Navigation & Layout Overhaul (P0)

No in-app navigation exists, the mode switcher overlaps content at multiple viewport sizes, and z-index stacking conflicts cause interactive elements to be hidden or unreachable.
**Source:** NAV-01, NAV-02, NAV-03 from audit

### Epic 14: User Dashboard & Data Accuracy (P0/P1)

The "Dashboard" is just a chat panel with tiny metrics. No proper user dashboard with stats, difficulty, or style info exists. Multiple data accuracy bugs affect BPM, key detection, snapshots, and session history.
**Source:** DASH-01, DASH-02, BUG-02, BUG-03, BUG-05, BUG-06, BUG-04, MISSING-02 from audit

### Epic 15: Drill System Overhaul (P0/P1)

The drill generation flow is completely broken: it routes through the chat endpoint instead of the structured drill API. No audio preview, no persistence, and the drill prompt textarea truncates content.
**Source:** DRILL-01, DRILL-02, DRILL-03, DRILL-04 from audit

### Epic 16: AI Chat & Visualization Enrichment (P1/P2)

Chat responses are plain text with no inline visualizations. Canvas elements are too small. The Studio Engineer persona has no visual presence. Typography hierarchy is flat.
**Source:** CHAT-01, CHAT-02, UX-02, UX-03, UX-06 from audit

### Epic 17: UX Polish & Missing Features (P2/P3)

Warm-up drills are invisible, progress data is buried, mode switching lacks context, there is no session end experience, empty states are uninspiring, color usage lacks positive reinforcement, and MIDI input quality feedback is missing.
**Source:** UX-04, UX-05, UX-07, UX-08, UX-10, UX-11, UX-13, MISSING-01, MISSING-02 from audit

## Dependencies

```
Epic 12 ─── (standalone, highest priority)
Epic 13 ─── (standalone, highest priority)
Epic 14 ─── Epic 13 partial (navigation needed to access dashboard)
Epic 15 ─── Epic 14.1 (dashboard needed for drill history view)
Epic 16 ─── Epic 13 (layout must be fixed), Epic 14.4 (BPM accuracy)
Epic 17 ─── Epics 13, 14, 16 (layout, dashboard, viz must exist)
```

---

## Epic 12: Session Replay Resurrection

Session replay is completely broken. The visualization canvas subscribes exclusively to `useMidiStore.activeNotes` for rendering. During replay, the replay engine only advances `replayPosition` via `requestAnimationFrame` but never reads replay events at the current position and never feeds them into the MIDI store or any visual system. The canvas remains blank. This epic makes replay fully functional: visual, audible, and navigable.

**Source:** BUG-01 from audit
**Priority:** P0 — Must fix before any user testing

### Story 12.1: Build Replay Event Dispatcher

As a musician reviewing a past session,
I want the replay engine to dispatch note events at the correct playback position,
So that the visualization system receives the same events it would during live play.

**Acceptance Criteria:**

1. **Given** a session is loaded into replay mode with `replayEvents` populated in `sessionStore`
   **When** the replay engine's `requestAnimationFrame` loop advances from `previousPosition` to `currentPosition`
   **Then** all events with timestamps between `previousPosition` and `currentPosition` are identified and dispatched in chronological order

2. **Given** a replay event is a note-on event
   **When** the dispatcher processes it
   **Then** the note is added to `useMidiStore.activeNotes` (or a dedicated replay notes state) with correct note number, velocity, and channel

3. **Given** a replay event is a note-off event
   **When** the dispatcher processes it
   **Then** the corresponding note is removed from the active notes state

4. **Given** replay is paused
   **When** the animation frame fires
   **Then** no events are dispatched and `previousPosition` does not advance

5. **Given** the user scrubs the timeline to a new position
   **When** the scrub completes
   **Then** all active notes are cleared and the dispatcher resets `previousPosition` to the new scrub position

6. **Given** replay reaches the end of the session
   **When** the last event has been dispatched
   **Then** replay stops, all active notes are cleared, and the play/pause control shows the stopped state

**Technical Notes:**

- Primary file: `src/features/session/replay-engine.ts` — the `tick()` method in the animation frame loop needs to binary-search or linearly scan `replayEvents` between `previousPosition` and `currentPosition`
- Must track `previousPosition` (last dispatched timestamp) separately from `replayPosition` (current playback head)
- Events are stored in `sessionStore.replayEvents` as `MidiEvent[]` with `timestamp`, `type`, `note`, `velocity` fields
- Consider dispatching to `useMidiStore` directly or creating a parallel `replayActiveNotes` state to avoid conflicts when switching between live and replay modes
- Performance: binary search for start index since events are sorted by timestamp; avoid scanning full array each frame

### Story 12.2: Wire Replay Events to Visualization Canvas

As a musician reviewing a past session,
I want to see my replayed notes rendered on the piano roll, timing grid, and harmonic overlay,
So that I can visually analyze my performance during replay.

**Acceptance Criteria:**

1. **Given** the replay event dispatcher is emitting note-on/note-off events
   **When** `visualization-canvas.tsx` renders during replay mode
   **Then** notes appear on the piano roll with correct pitch position, timing, and velocity-based brightness

2. **Given** the canvas is in replay mode
   **When** notes are dispatched from the replay engine
   **Then** the timing grid renderer shows timing accuracy marks for replayed notes just as it does for live notes

3. **Given** the canvas is in replay mode
   **When** chords are formed by simultaneous replayed notes
   **Then** the harmonic overlay renderer displays chord labels and key center information

4. **Given** the user switches from live mode to replay mode
   **When** the mode transition occurs
   **Then** the canvas clears all live note state and begins rendering exclusively from replay events

5. **Given** the user switches from replay mode back to live mode
   **When** the mode transition occurs
   **Then** the canvas clears all replay state and resubscribes to live MIDI input

6. **Given** the canvas is rendering in replay mode
   **When** compared to the same session during live play
   **Then** the visual output is materially equivalent (same notes, same positions, same chord labels) accounting for timing grid differences

**Technical Notes:**

- Primary file: `src/components/viz/visualization-canvas.tsx` (lines 86-106) — currently subscribes exclusively to `useMidiStore.activeNotes`; needs a replay-aware subscription path
- The vanilla Zustand `subscribe` call (AR13 pattern) must check `appStore.currentMode` or a `isReplayActive` flag to decide which note source to render
- Renderers affected: `src/components/viz/piano-roll-renderer.ts`, `src/components/viz/harmonic-overlay-renderer.ts`, `src/components/viz/timing-grid-renderer.ts`
- Must NOT break the 60fps render loop (NFR2) — avoid React re-renders; keep the vanilla subscribe pattern

### Story 12.3: Add MIDI Output Playback During Replay

As a musician reviewing a past session,
I want to hear the replayed notes through my instrument's speakers (via MIDI output),
So that I can listen to my performance as well as see it.

**Acceptance Criteria:**

1. **Given** a MIDI output device is connected and replay is playing
   **When** the replay event dispatcher emits a note-on event
   **Then** the corresponding MIDI note-on message is sent to the connected MIDI output device with correct note number, velocity, and channel

2. **Given** a MIDI output device is connected and replay is playing
   **When** the replay event dispatcher emits a note-off event
   **Then** the corresponding MIDI note-off message is sent to the MIDI output device

3. **Given** no MIDI output device is connected and replay is playing
   **When** the replay event dispatcher emits note events
   **Then** the system falls back to Web Audio API synthesis (oscillator-based) to produce audible playback

4. **Given** replay is paused
   **When** the pause occurs
   **Then** all currently sounding notes receive note-off messages immediately (both MIDI output and Web Audio)

5. **Given** the user scrubs the timeline during replay
   **When** the scrub repositions the playback head
   **Then** all sounding notes are stopped immediately before resuming from the new position

6. **Given** replay is playing with MIDI output
   **When** the replay speed is adjusted (if supported)
   **Then** note timing is adjusted proportionally but note durations and velocities remain correct

**Technical Notes:**

- Leverage existing MIDI output infrastructure in `src/stores/midi-store.ts` (the `outputDevice` state and `sendMidiMessage` action)
- Web Audio fallback: reference `src/features/drills/drill-player.ts` which already has oscillator-based synthesis code — extract shared utility
- Must send all-notes-off (CC 123) on pause/scrub to prevent stuck notes on the MIDI output device
- MIDI output should be toggle-able (some users may want visual-only replay)

### Story 12.4: Populate Timeline Markers from Session Data

As a musician reviewing a past session,
I want to see markers on the replay timeline for snapshots, drills, and key changes,
So that I can quickly navigate to interesting moments in my session.

**Acceptance Criteria:**

1. **Given** a session is loaded into replay mode
   **When** the timeline scrubber renders
   **Then** snapshot markers appear at the timestamps where session snapshots were generated

2. **Given** the session contains drill events
   **When** the timeline renders
   **Then** drill start/end markers appear at the timestamps of each drill attempt

3. **Given** the session contains key changes (metadata updates with changed key values)
   **When** the timeline renders
   **Then** key change markers appear at the timestamps where the detected key changed

4. **Given** markers are rendered on the timeline
   **When** the user hovers over a marker
   **Then** a tooltip shows the marker type and relevant data (e.g., "Snapshot: C Major, 120 BPM, 78% timing")

5. **Given** markers are rendered on the timeline
   **When** the user clicks a marker
   **Then** the playback position jumps to that marker's timestamp

6. **Given** a session has no snapshots, drills, or key changes
   **When** the timeline renders
   **Then** no markers appear but the timeline remains fully functional

**Technical Notes:**

- Primary fix: `src/features/modes/replay-studio.tsx` line 80 — replace `const markers = useMemo<TimelineMarker[]>(() => [], [])` with actual marker generation from session data
- Session data sources: `session.snapshots` (snapshot markers), `session.drills` (drill markers), `session.metadata` changes (key change markers)
- `TimelineMarker` type defined in `src/components/timeline-scrubber.tsx` — ensure it supports `type: 'snapshot' | 'drill' | 'keyChange'` with associated metadata
- Markers should be visually distinct by type (different colors or icons using the design token palette)

### Story 12.5: Add Replay Mode Visual Indicator

As a musician,
I want a clear visual distinction when I am in replay mode versus live mode,
So that I never confuse replayed content with my current live playing.

**Acceptance Criteria:**

1. **Given** the user enters replay mode
   **When** the visualization canvas renders
   **Then** a subtle "REPLAY" label is displayed in the top-left corner of the canvas with reduced opacity (e.g., 40%)

2. **Given** the user is in replay mode
   **When** the canvas renders
   **Then** the canvas border or outline uses a distinct color (e.g., `accent-warm` amber) to differentiate from live mode (which uses `accent-blue` or no border)

3. **Given** replay is actively playing (not paused)
   **When** the canvas renders
   **Then** a playback-head indicator (vertical line or glow bar) sweeps across the canvas in sync with the replay position

4. **Given** replay is paused
   **When** the canvas renders
   **Then** the playback-head indicator stops at the current position and pulses subtly to indicate the paused state

5. **Given** the user switches from replay mode to live mode
   **When** the mode transition occurs
   **Then** the "REPLAY" label, distinct border, and playback-head indicator are immediately removed

**Technical Notes:**

- The "REPLAY" label should be rendered on the Canvas (not as a DOM overlay) for consistency with the 60fps render loop
- Playback-head indicator: a semi-transparent vertical line rendered by the canvas at the x-position corresponding to `replayPosition` relative to total session duration
- Border color change can be applied via a CSS class toggled on the canvas container element in `src/components/viz/visualization-canvas.tsx`
- Keep visual additions subtle per the 70/30 attention split principle (UX11) — instrument is primary, screen is secondary

---

## Epic 13: Navigation & Layout Overhaul

No in-app navigation exists beyond the three-tab mode switcher. Users cannot navigate to Settings, History, Achievements, or any page without manually typing URLs. The mode switcher uses `fixed` positioning that causes it to overlap content in all three modes. Z-index stacking conflicts between the status bar, mode switcher, snapshot CTA, and warm-up prompt create a broken layout at multiple viewport sizes.

**Source:** NAV-01, NAV-02, NAV-03 from audit
**Priority:** P0 — Must fix before any user testing

### Story 13.1: Add Persistent App Navigation Sidebar

As a musician using Minstrel,
I want a persistent navigation sidebar with links to all major sections,
So that I can navigate the app without typing URLs or using the browser back button.

**Acceptance Criteria:**

1. **Given** the user is authenticated and on any page within the `(auth)` layout
   **When** the page renders
   **Then** a collapsible sidebar is displayed on the left edge with navigation links to: Session (Play), Dashboard, History, Achievements, and Settings

2. **Given** the sidebar is rendered
   **When** the user views the sidebar
   **Then** each navigation item shows an icon and label, with the currently active route highlighted using `accent-blue`

3. **Given** the sidebar is rendered
   **When** the user clicks the collapse toggle
   **Then** the sidebar collapses to icon-only mode (approximately 60px wide) and the main content area expands to fill the freed space

4. **Given** the sidebar is rendered at the bottom
   **When** the user views the bottom of the sidebar
   **Then** a user avatar/icon is displayed with a dropdown menu containing: Profile, API Key Settings, Sign Out

5. **Given** the sidebar is in collapsed state
   **When** the user hovers over a navigation icon
   **Then** a tooltip shows the full navigation label

6. **Given** the viewport width is less than 1024px
   **When** the sidebar renders
   **Then** it defaults to collapsed (icon-only) mode to preserve horizontal space for the visualization canvas

**Technical Notes:**

- Create new component: `src/components/app-sidebar.tsx`
- Modify `src/app/(auth)/layout.tsx` to include the sidebar in the layout grid
- Use shadcn/ui sidebar component (if available) or build with standard nav + collapsible pattern
- The sidebar must NOT conflict with the visualization canvas — use CSS Grid with `grid-template-columns: auto 1fr` so the canvas column is always `1fr`
- Collapse state should be persisted to `localStorage` via `appStore`
- Navigation links: `/session` (Play), `/dashboard` (new route), `/history` (existing), `/achievements` (existing), `/settings` (existing)

### Story 13.2: Integrate Mode Switcher into Layout Flow

As a musician,
I want the mode switcher tabs to be part of the page layout flow instead of floating over content,
So that tabs never overlap data cards, chat panels, or other interactive elements.

**Acceptance Criteria:**

1. **Given** the mode switcher currently uses `fixed right-4 top-12 z-30` positioning
   **When** this story is completed
   **Then** the mode switcher is repositioned into the layout flow, either as part of the StatusBar or as inline tabs at the top of the session page content area

2. **Given** the mode switcher is integrated into the layout flow
   **When** the right panel is visible (Dashboard or Replay modes)
   **Then** the mode switcher does not overlap any panel content at 1024px, 1280px, or 1440px viewport widths

3. **Given** the mode switcher is in the layout flow
   **When** the user switches modes
   **Then** the mode transition occurs smoothly with the tabs remaining in their fixed layout position (no jumping or repositioning)

4. **Given** the mode switcher is integrated
   **When** rendered alongside the StatusBar
   **Then** the combined height of StatusBar + mode switcher does not exceed 80px to preserve vertical space for the canvas

5. **Given** the mode switcher no longer uses fixed positioning
   **When** the page scrolls (if any content area scrolls)
   **Then** the mode switcher remains visible and accessible at all times (sticky within the session page, not the viewport)

**Technical Notes:**

- Primary file: `src/features/modes/mode-switcher.tsx` — remove `fixed right-4 top-12 z-30` classes
- Consider integrating into `src/components/status-bar.tsx` as a right-aligned element within the status bar flex container
- Alternative: place as the first child inside the session page content area with `sticky top-0`
- The StatusBar is currently `fixed top-0 z-40` — if mode switcher goes inside it, the StatusBar height may need adjustment
- Test layout at 1024px, 1280px, and 1440px breakpoints with all three modes active

### Story 13.3: Fix Element Overlap and Z-Index Stacking

As a musician,
I want all UI elements to be properly layered so nothing overlaps interactive controls,
So that I can click buttons, read data, and interact with all features without obstruction.

**Acceptance Criteria:**

1. **Given** the current z-index conflicts between StatusBar (z-40), ModeSwitcher (z-30), SnapshotCTA (z-20), and WarmUpPrompt (z-20)
   **When** this story is completed
   **Then** a z-index scale is defined and documented: base content (z-0), overlays (z-10), navigation (z-20), modals (z-30), toasts (z-40)

2. **Given** the SnapshotCTA uses `absolute bottom-16 z-20`
   **When** it appears during a session pause
   **Then** it does not overlap the mode switcher, data cards, or any interactive element in any of the three modes

3. **Given** the WarmUpPrompt uses `absolute top-24 z-20`
   **When** it appears before session start
   **Then** it does not overlap the mode switcher or status bar

4. **Given** all z-index values are audited and fixed
   **When** testing at 1024px viewport width
   **Then** no interactive elements are hidden behind other elements in Silent Coach, Dashboard+Chat, or Replay Studio modes

5. **Given** all z-index values are audited and fixed
   **When** testing at 1280px and 1440px viewport widths
   **Then** the same no-overlap guarantee holds

6. **Given** a modal or dialog opens (e.g., keyboard shortcuts, confirmation dialogs)
   **When** the modal renders
   **Then** it sits above all other content including the navigation sidebar and status bar

**Technical Notes:**

- Files to audit: `src/features/modes/mode-switcher.tsx` (z-30), `src/components/status-bar.tsx` (z-40), `src/components/snapshot-cta.tsx` (z-20), `src/components/warm-up-prompt.tsx` (z-20)
- Define a z-index scale in CSS custom properties or Tailwind config: `--z-base: 0`, `--z-overlay: 10`, `--z-nav: 20`, `--z-modal: 30`, `--z-toast: 40`
- Converting SnapshotCTA and WarmUpPrompt from `absolute` to flow-based positioning may be preferable to z-index fixes alone
- Test with DevTools responsive mode at 1024px, 1280px, 1440px widths and heights down to 700px

### Story 13.4: Fix Replay Trackbar and Panel Positioning

As a musician in Replay Studio,
I want the timeline scrubber to be properly contained and not overlap the right panel,
So that I can use both the timeline and the session details panel without visual conflicts.

**Acceptance Criteria:**

1. **Given** the Replay Studio uses `grid-cols-[3fr_1fr]` layout
   **When** the timeline scrubber renders at the bottom of the canvas column
   **Then** the scrubber is visually contained within the canvas/left column and does not extend into the right panel area

2. **Given** the right panel contains session tabs (Insights, Chat, Sessions)
   **When** the viewport height is less than 700px
   **Then** the timeline scrubber and right panel content do not overlap vertically

3. **Given** the timeline scrubber and right panel are rendered side by side
   **When** the user views the layout
   **Then** a clear visual separator (border, background contrast, or spacing) distinguishes the scrubber area from the right panel

4. **Given** the scrubber uses `shrink-0` in a flex column
   **When** the content area above it has overflow
   **Then** the scrubber maintains its full height and functionality without being compressed

5. **Given** the Replay Studio grid layout
   **When** the right panel minimum width is enforced
   **Then** the right panel is at least 320px wide to prevent cramped tab labels and session cards

**Technical Notes:**

- Primary files: `src/components/timeline-scrubber.tsx`, `src/features/modes/replay-studio.tsx`
- The current `grid-cols-[3fr_1fr]` makes the right panel only ~256px at 1024px viewport — consider `grid-cols-[2fr_1fr]` or `min-w-[320px]` on the right panel
- Ensure the timeline scrubber is a child of the left grid column only, not spanning both columns
- The `shrink-0` on the scrubber is correct — the issue is likely the grid span, not the flex behavior

### Story 13.5: Add Keyboard Navigation and Focus Management

As a musician with accessibility needs,
I want to navigate the entire application using only a keyboard,
So that Minstrel meets WCAG 2.1 AA accessibility requirements.

**Acceptance Criteria:**

1. **Given** the user presses Tab from the top of any page
   **When** a skip-to-content link is focused
   **Then** pressing Enter skips focus past the sidebar and status bar to the main content area

2. **Given** the user switches modes via the mode switcher
   **When** the mode transition completes
   **Then** focus is moved to the main content area of the newly active mode (the canvas in Silent Coach, the chat input in Dashboard, the timeline in Replay)

3. **Given** the Replay Studio tab list (Insights, Chat, Sessions)
   **When** focus is on one of the tabs
   **Then** arrow keys (left/right) move between tabs and Enter/Space activates the focused tab (WCAG tab panel pattern)

4. **Given** any interactive element in the application
   **When** the user tabs to it
   **Then** a visible focus indicator is displayed (minimum 2px outline using `accent-blue` color)

5. **Given** the navigation sidebar
   **When** the user tabs into the sidebar
   **Then** up/down arrow keys navigate between sidebar items and Enter activates the focused item

6. **Given** a modal or overlay is open (keyboard shortcuts panel, confirmation dialog)
   **When** the user presses Escape
   **Then** the modal closes and focus returns to the element that triggered it (focus trap pattern)

**Technical Notes:**

- Add `<a href="#main-content" class="sr-only focus:not-sr-only">Skip to content</a>` at the top of `src/app/(auth)/layout.tsx`
- Focus management on mode switch: use `useEffect` in `src/features/modes/mode-switcher.tsx` to call `.focus()` on the new mode's primary element after transition
- Tab panel pattern for Replay Studio: ensure `role="tablist"`, `role="tab"`, `role="tabpanel"` attributes and `aria-selected` are set in `src/features/modes/replay-studio.tsx`
- Focus indicator: add global CSS for `*:focus-visible { outline: 2px solid var(--accent-blue); outline-offset: 2px; }` in `globals.css`
- Existing keyboard shortcuts overlay (`?` key) should be discoverable — add a hint in the sidebar footer

---

## Epic 14: User Dashboard & Data Accuracy

The current "Dashboard" mode is actually just a chat panel with four tiny, stale metric cards. There is no proper user dashboard showing skill profile, difficulty level, session statistics, improvement trends, or playing style. Multiple data accuracy bugs affect BPM detection, key detection, snapshots, and session history. This epic creates a proper data-driven dashboard and fixes all data accuracy issues.

**Source:** DASH-01, DASH-02, BUG-02, BUG-03, BUG-05, BUG-06, BUG-04, MISSING-02 from audit
**Priority:** P0/P1
**Dependencies:** Epic 13 partially (navigation sidebar needed to access dashboard route)

### Story 14.1: Create Proper User Dashboard View

As a musician,
I want a dedicated Dashboard view showing my skill profile, difficulty level, session stats, improvement trends, and achievements,
So that I can see my musical identity and progress at a glance — the "Strava for Musicians" experience.

**Acceptance Criteria:**

1. **Given** the user navigates to the Dashboard (via sidebar navigation or `/dashboard` route)
   **When** the dashboard renders
   **Then** it displays distinct sections for: Skill Profile Radar, Difficulty Level, Session Stats Summary, Improvement Trends, Recent Achievements, and Playing Style Profile

2. **Given** the user has completed at least one session with note data
   **When** the dashboard renders
   **Then** the Session Stats Summary shows: total practice time, total sessions, total notes played, current practice streak, and average session length

3. **Given** the user has a skill profile computed from session data
   **When** the dashboard renders
   **Then** the Difficulty Level section shows the current level with a visual progression indicator (e.g., "Intermediate — Level 12") and growth trajectory arrow

4. **Given** the user has sessions spanning multiple days
   **When** the Improvement Trends section renders
   **Then** it shows a line or bar chart of timing accuracy, session duration, and notes per session over the last 7/30/90 days (selectable)

5. **Given** the user has unlocked achievements
   **When** the Recent Achievements section renders
   **Then** the latest 3-5 achievement badges are displayed with names, icons, and unlock dates

6. **Given** the user has no sessions yet
   **When** the dashboard renders
   **Then** each section shows an appropriate empty state with a CTA (e.g., "Play your first session to see your skill profile")

**Technical Notes:**

- Create new route: `src/app/(auth)/dashboard/page.tsx`
- Pull session stats from `sessionStore` and IndexedDB via Dexie.js
- Skill profile data sourced from `sessionStore.skillProfile` (dimensions: timing, harmony, technique, speed, consistency)
- Difficulty level from the Difficulty Engine state in `sessionStore`
- The dashboard is a SEPARATE view from the Dashboard+Chat mode — consider renaming Dashboard+Chat to "Coach" to avoid confusion (per UX-01 recommendation)
- Follow the dark aesthetic: `#0F0F0F` background, `#7CB9E8` accent, sharp corners, Inter + JetBrains Mono fonts

### Story 14.2: Build Skill Profile Radar Visualization

As a musician,
I want a radar chart showing my skill dimensions (timing, harmony, technique, speed, consistency),
So that I can see at a glance where I am strong and where I need to improve.

**Acceptance Criteria:**

1. **Given** the user has a `skillProfile` with values for timing, harmony, technique, speed, and consistency
   **When** the radar chart renders on the dashboard
   **Then** each dimension is plotted as a point on a 5-axis radar chart with values from 0-100

2. **Given** the radar chart is rendered
   **When** the user views it
   **Then** the chart uses the dark aesthetic: `#7CB9E8` (pastel blue) fill with 20% opacity, `#7CB9E8` stroke, `#0F0F0F` background, `#2A2A2A` grid lines

3. **Given** the radar chart is rendered
   **When** the user hovers over a dimension axis or data point
   **Then** a tooltip shows the dimension name and exact value (e.g., "Timing: 78/100")

4. **Given** the user has multiple sessions over time
   **When** the radar chart supports comparison mode
   **Then** a secondary (ghosted) polygon shows the previous week's/session's skill profile for comparison

5. **Given** the skill profile data has not been computed yet (new user)
   **When** the radar chart renders
   **Then** a placeholder outline (all axes at 0) is shown with a label "Play more to build your skill profile"

6. **Given** the radar chart renders on different viewport sizes
   **When** viewed at 1024px through 1440px
   **Then** the chart scales responsively while maintaining legible axis labels and data points

**Technical Notes:**

- Implement as Canvas (for consistency with visualization system) or SVG (for easier tooltip/hover interaction) — SVG recommended for this use case since it is a static chart, not 60fps animation
- Data source: `useSessionStore.getState().skillProfile` — ensure this is populated from the Difficulty Engine output
- If using Canvas: create `src/components/viz/skill-radar-renderer.ts`; if SVG: create `src/components/skill-radar-chart.tsx`
- Axis labels should use JetBrains Mono at 12px, dimension values at 14px mono
- Sharp corners on container card (0px border radius per UX2)

### Story 14.3: Fix DataCard Session Sync

As a musician viewing the Dashboard+Chat mode,
I want the data cards to show accurate session summary statistics instead of stale live-analysis values,
So that the metrics I see actually reflect my session performance.

**Acceptance Criteria:**

1. **Given** the user has completed a session and switches to Dashboard+Chat mode
   **When** the data cards render
   **Then** they show session summary statistics: predominant key (most frequent), average tempo, timing accuracy trend (improving/declining/stable), total notes played, and most common chord progression

2. **Given** the user starts a new session
   **When** the session begins (first note played)
   **Then** all data card metrics reset to their default "detecting..." state instead of carrying over values from the previous session

3. **Given** the data card shows a chord progression value
   **When** the text is longer than the card width
   **Then** a tooltip on hover reveals the full chord progression text

4. **Given** the data card shows timing accuracy
   **When** the value is computed
   **Then** it reflects the session-wide trend (improving, stable, declining with directional indicator) rather than the last instantaneous measurement

5. **Given** the data card shows tempo
   **When** the value is computed
   **Then** it shows the session average BPM with a "range" indicator (e.g., "120 BPM (112-128)") rather than the last instantaneous reading

6. **Given** the user is in live play mode (Silent Coach)
   **When** the data cards update
   **Then** they show live values with a "LIVE" indicator, clearly distinguished from the session summary shown in Dashboard mode

**Technical Notes:**

- Primary file: `src/components/data-card.tsx` — currently reads `currentKey`, `currentTempo`, `timingAccuracy`, `detectedChords` from `useSessionStore` which are live-analysis values
- Add a `computeSessionSummary()` function to `src/stores/session-store.ts` that aggregates across `replayEvents` or session metadata
- Reset logic: add a `resetMetrics()` action to `sessionStore` called on session start
- Tooltip implementation: use shadcn/ui `Tooltip` component wrapping the truncated chord text
- Consider adding `sessionMode: 'live' | 'summary'` flag to `DataCard` props

### Story 14.4: Fix BPM Detection Accuracy

As a musician,
I want the displayed BPM to accurately reflect my playing tempo,
So that timing-related coaching advice is meaningful and trustworthy.

**Acceptance Criteria:**

1. **Given** the tempo detection algorithm processes inter-onset intervals
   **When** an interval falls outside the plausible BPM range (30-300 BPM)
   **Then** the interval is discarded as an outlier and not included in the BPM calculation

2. **Given** the tempo detection uses a rolling window
   **When** the rolling calculation is performed
   **Then** a rolling median is used instead of a rolling average to resist outlier distortion from trills, ornaments, and pauses

3. **Given** the BPM has been computed
   **When** the confidence level is below a defined threshold (e.g., fewer than 8 consistent intervals)
   **Then** the BPM display shows "detecting..." or a low-confidence indicator instead of an unreliable number

4. **Given** the timing accuracy percentage is computed
   **When** the value is stored or displayed
   **Then** it is clamped to the valid range 0-100 using `Math.max(0, Math.min(100, value))`

5. **Given** the `timingAccuracy` field in `lib/ai/schemas.ts` expects 0-1
   **When** the context builder divides by 100
   **Then** the source value is validated and clamped BEFORE division to prevent NaN or >1.0 values in the AI context

6. **Given** the user plays with consistent tempo for 10+ seconds
   **When** the BPM stabilizes
   **Then** the displayed BPM fluctuates by no more than +/-3 BPM between consecutive updates (smoothed output)

**Technical Notes:**

- Primary files: `src/features/analysis/tempo-detection.ts`, `src/features/analysis/timing-analysis.ts`
- Replace rolling average with rolling median: sort the window values and take the middle element
- BPM plausibility: convert inter-onset interval to BPM first (`60000 / intervalMs`), reject if <30 or >300
- Schema mismatch fix: `src/lib/ai/schemas.ts` line 8 — ensure the context builder in `src/features/coaching/context-builder.ts` clamps before sending to AI
- Add a `confidence` field to the tempo detection output: `confidence = consistentIntervals / totalIntervals`

### Story 14.5: Fix Snapshot Accuracy and Enrich Content

As a musician,
I want session snapshots to contain accurate, useful data with multiple insights,
So that the snapshot actually helps me understand my playing.

**Acceptance Criteria:**

1. **Given** the silence trigger fires for a session snapshot
   **When** the note sample size is fewer than 20 notes
   **Then** the snapshot is generated with a "limited data" indicator and avoids making specific claims about timing accuracy, key detection, or playing style

2. **Given** the snapshot is generated with sufficient data (20+ notes)
   **When** the snapshot content is assembled
   **Then** it includes: detected key with confidence percentage, average BPM with range, timing accuracy trend, top 3 chord progressions, and playing style tendencies

3. **Given** the snapshot generates insights
   **When** the insights are displayed
   **Then** there are 2-3 distinct insights instead of a single `keyInsight` string (e.g., "Timing tends late on off-beats", "Strong ii-V-I vocabulary", "Tempo increases during improvised sections")

4. **Given** the snapshot includes BPM, key, and timing values
   **When** any value has low confidence (below defined thresholds)
   **Then** that value is marked with a confidence indicator or omitted from the snapshot entirely

5. **Given** the snapshot is generated
   **When** it includes chord progression data
   **Then** the progression shows the 3 most common sequences (e.g., "ii-V-I (5x), I-IV-V (3x), vi-IV-I-V (2x)") with frequency counts

6. **Given** the snapshot is generated from a long session (5+ minutes)
   **When** the early session data is processed
   **Then** initial notes are included in the trend analysis (not excluded by the rolling window reset)

**Technical Notes:**

- Primary files: `src/features/analysis/use-analysis-pipeline.ts`, `src/components/snapshot-cta.tsx`, `src/components/viz/snapshot-renderer.ts`
- Add `minimumSampleSize: 20` constant and check before generating detailed insights
- Replace single `keyInsight: string` with `insights: Array<{ category: string; text: string; confidence: number }>`
- Chord progression enrichment: aggregate from `sessionStore.detectedChords` into frequency-sorted sequences
- Snapshot data model change may require updating `src/types/` — check `SnapshotData` type definition
- `SNAPSHOT_FADE_IN_MS` and `SNAPSHOT_FADE_OUT_MS` in `lib/constants.ts` are imported by `visualization-canvas.tsx` — verify fade timing is appropriate

### Story 14.6: Fix Key Detection Confidence

As a musician,
I want the detected key to accurately reflect what I am playing with a confidence indicator,
So that I can trust the harmonic analysis shown on screen.

**Acceptance Criteria:**

1. **Given** the key detection algorithm processes note events
   **When** scoring notes for key correlation
   **Then** velocity-weighted scoring is used: louder notes (higher velocity) contribute more to the key score than ghost notes and passing tones

2. **Given** the key detection produces a result
   **When** the confidence score is below 60%
   **Then** the key display shows "detecting..." or the previous high-confidence key, rather than flickering to a low-confidence result

3. **Given** the detected key changes
   **When** fewer than 3 seconds have elapsed since the last key change
   **Then** the display does not update (debounce/hysteresis) to prevent flickering during transitional passages

4. **Given** the key detection produces a result
   **When** the key is displayed in the harmonic overlay and data cards
   **Then** a confidence indicator is shown alongside (e.g., "C Major (92%)" or a filled/unfilled confidence bar)

5. **Given** the session recorder writes metadata updates
   **When** a key change matches the cached `lastMetadataKey`
   **Then** the metadata is still written on the scheduled interval (fix the caching bug that skips writes for rapid C->D->C changes)

6. **Given** the user plays a passage with clear tonal center
   **When** the key detection stabilizes
   **Then** the detected key matches the expected tonal center for common progressions (I-IV-V, ii-V-I) with at least 80% accuracy

**Technical Notes:**

- Primary files: `src/features/analysis/key-detection.ts`, `src/features/analysis/chord-detection.ts`
- Velocity weighting: multiply each note's contribution to the Krumhansl-Schmuckler (or similar) key profile by `velocity / 127`
- Confidence threshold: after scoring all 24 major/minor keys, confidence = `(topScore - secondScore) / topScore` — suppress below 0.6
- Debounce: store `lastKeyChangeTime` and `lastConfidentKey`; only update display if `now - lastKeyChangeTime > 3000ms`
- Metadata caching bug: `src/features/session/session-recorder.ts` lines 149-159 — remove the `if (key === lastMetadataKey) return` guard, or change to always write on interval regardless of change

### Story 14.7: Fix Session History Completeness

As a musician,
I want to see all my past sessions in the history view with complete metadata,
So that I can review any session from my practice history.

**Acceptance Criteria:**

1. **Given** the user has more than 20 sessions
   **When** the session history list loads
   **Then** the first 20 sessions are displayed with a "Load More" button to fetch the next page

2. **Given** the user clicks "Load More"
   **When** additional sessions are fetched
   **Then** the next 20 sessions are appended to the list without removing previously loaded sessions

3. **Given** sessions exist with various statuses (completed, active, abandoned)
   **When** the session history list renders
   **Then** all session statuses are shown with visual indicators (green dot for completed, amber dot for active, gray dot for abandoned)

4. **Given** a session is shorter than 10 seconds
   **When** the session is saved
   **Then** metadata (key, tempo, duration) is written immediately on first detection, not delayed until the 10-second metadata update interval

5. **Given** session history items are displayed
   **When** each item renders
   **Then** it shows: date/time, duration, note count, detected key, average tempo, and session status

6. **Given** the session history list is loaded
   **When** sorted by date (most recent first)
   **Then** the sort order is correct and sessions from all time periods are accessible via pagination

**Technical Notes:**

- Primary files: `src/features/modes/replay-studio.tsx` (line 520 — hardcoded `limit(20)`), `src/components/session-history-list.tsx` (lines 54-56 — only loads `status === 'completed'`), `src/features/session/use-replay-session.ts` (line 26)
- Remove the hardcoded `limit(20)` and replace with paginated query: `offset` + `limit` parameters
- Remove `status === 'completed'` filter — show all statuses
- Immediate metadata write: in `src/features/session/session-recorder.ts` lines 149-159, write metadata on first detection (first key detected, first tempo detected) in addition to the 10-second interval writes
- Pagination state: add `sessionHistoryPage` and `hasMoreSessions` to component state or `appStore`

---

## Epic 15: Drill System Overhaul

The drill generation flow is completely broken. When a user clicks "Generate Drill," the system constructs a text prompt and sends it as a chat message instead of calling the structured drill API endpoint. The result is plain AI text, not a structured drill with notes, phases, and playback. There is no way to hear what a drill sounds like, no drill persistence, and the drill prompt textarea truncates long prompts.

**Source:** DRILL-01, DRILL-02, DRILL-03, DRILL-04 from audit
**Priority:** P0/P1
**Dependencies:** Epic 14.1 (dashboard needed for drill history view)

### Story 15.1: Route Drill Generation to Structured API

As a musician,
I want the "Generate Drill" action to produce an actual playable drill with note sequences,
So that I can practice targeted exercises instead of reading chat text about what I should practice.

**Acceptance Criteria:**

1. **Given** the user clicks "Generate Drill" on the SnapshotCTA
   **When** the drill request is initiated
   **Then** it calls the `/api/ai/drill` endpoint directly with structured output parameters, NOT the chat endpoint

2. **Given** the drill API returns a structured response
   **When** the response is parsed
   **Then** it contains a `DrillController`-compatible format with: drill name, target skill, difficulty level, note sequences (as MIDI note numbers with timing and velocity), and phase instructions (Demonstrate, Listen, Attempt, Analyze)

3. **Given** the drill response is received
   **When** the UI updates
   **Then** a dedicated Drill Panel opens (not the chat panel) showing the drill card with: drill name, target skill tag, difficulty indicator, Preview button, and Start button

4. **Given** the drill API call is in progress
   **When** the user sees the UI
   **Then** a loading indicator appears on the "Generate Drill" button itself (not a separate loading screen)

5. **Given** the drill API call fails (invalid API key, rate limit, provider error)
   **When** the error is returned
   **Then** a clear error message is shown on the drill card (not in the chat) with a "Retry" option

6. **Given** no API key is configured
   **When** the user clicks "Generate Drill"
   **Then** the graceful degradation prompt is shown: "Connect your API key to generate AI-powered drills"

**Technical Notes:**

- Primary files: `src/features/modes/dashboard-chat.tsx` (lines 24-35 — the broken effect that sends drill as chat), `src/components/snapshot-cta.tsx`, `src/app/api/ai/drill/route.ts`, `src/features/drills/drill-generator.ts`
- Remove the `pendingDrillRequest` → chat message flow in `dashboard-chat.tsx`
- Call `drill-generator.ts` directly from `snapshot-cta.tsx` or a new `useDrillGeneration` hook
- The `/api/ai/drill` endpoint uses structured output schema — ensure the response shape matches `DrillController` expectations
- The drill panel should be a new component or a mode within the session page, not embedded in the chat

### Story 15.2: Build Drill Preview and Audio Playback

As a musician,
I want to hear what a generated drill sounds like before I attempt it,
So that I know the target sound and can practice accurately.

**Acceptance Criteria:**

1. **Given** a drill has been generated with note sequences
   **When** the user clicks the "Preview" button on the drill card
   **Then** the drill notes are played through the connected MIDI output device at the drill's target tempo

2. **Given** no MIDI output device is connected
   **When** the user clicks "Preview"
   **Then** the drill notes are played using Web Audio API synthesis (oscillator-based fallback) with clear, audible tones

3. **Given** the drill's Demonstrate phase begins (after clicking "Start Drill")
   **When** the demonstration plays
   **Then** the notes are played with emphasized velocity (louder than practice tempo) and the UI shows which note is currently being demonstrated with visual highlighting

4. **Given** a drill is being previewed or demonstrated
   **When** the user clicks "Stop" or the preview/demonstration completes
   **Then** all sounding notes are immediately stopped (note-off or all-notes-off CC 123)

5. **Given** the drill demonstration has completed
   **When** the user wants to hear it again
   **Then** a "Repeat Demonstration" button is available to replay the drill notes

6. **Given** the drill preview plays via Web Audio
   **When** compared to MIDI output playback
   **Then** the timing and rhythm are equivalent (only the timbre differs)

**Technical Notes:**

- Primary files: `src/features/drills/drill-player.ts` (has existing oscillator synthesis and MIDI output code), `src/components/drill-controller.tsx`
- `drill-player.ts` already has `playNote()` with both MIDI output and oscillator paths — ensure the Preview button invokes this for each note in sequence
- Add a `previewDrill(notes: DrillNote[])` method to `drill-player.ts` that schedules notes with `setTimeout` or `requestAnimationFrame` at the target tempo
- Visual highlighting during demonstration: pass current-note index to `DrillController` for CSS highlight
- All-notes-off on stop: send MIDI CC 123 on the active channel, or call `oscillator.stop()` for Web Audio

### Story 15.3: Wire DrillController with Full Phase Flow

As a musician,
I want the drill to guide me through the complete Demonstrate, Listen, Attempt, Analyze flow,
So that I get structured practice with clear feedback at each stage.

**Acceptance Criteria:**

1. **Given** a drill is loaded into the DrillController
   **When** the user clicks "Start Drill"
   **Then** the Demonstrate phase begins: drill notes are played via MIDI output/Web Audio with visual note highlighting on the drill card

2. **Given** the Demonstrate phase completes
   **When** the phase transitions to Listen
   **Then** the UI shows "Your turn — listen first" and the drill notes play again at reduced velocity for the user to internalize

3. **Given** the Listen phase completes
   **When** the phase transitions to Attempt
   **Then** the UI shows "Now you try" and the system listens for the user's MIDI input, comparing played notes against the drill's expected notes

4. **Given** the user completes their attempt
   **When** the phase transitions to Analyze
   **Then** the UI shows accuracy results: notes hit/missed, timing accuracy, velocity accuracy, and an overall drill score

5. **Given** the Analyze phase displays results
   **When** the user views the results
   **Then** options are available: "Try Again" (restart from Attempt), "New Drill" (generate another targeting same skill), and "Done" (close drill panel)

6. **Given** the drill is displayed
   **When** rendered in the UI
   **Then** it appears in a dedicated drill panel within the session page, NOT in the AI chat panel

**Technical Notes:**

- Primary files: `src/components/drill-controller.tsx`, `src/features/drills/drill-player.ts`
- The `DrillController` component likely already has phase state management — verify and wire up the actual `drill-player.ts` playback calls
- Attempt analysis: compare user's MIDI input (from `midiStore`) against the drill's expected notes within a timing tolerance window (e.g., +/-100ms)
- The drill panel should coexist with the canvas — consider placing it as an overlay panel on the right side or as a bottom drawer
- Phase transitions should use the UX13 "Demonstrate, Listen, Attempt, Analyze" choreography from the UX spec

### Story 15.4: Add Drill Persistence to IndexedDB

As a musician,
I want my generated drills to be saved so I can replay them later and track my progress,
So that I build a library of personalized exercises over time.

**Acceptance Criteria:**

1. **Given** a drill is generated via the drill API
   **When** the generation completes successfully
   **Then** the drill is automatically saved to IndexedDB with: drill ID, name, target skill, difficulty, note sequences, generation timestamp, and the snapshot context that triggered it

2. **Given** saved drills exist in IndexedDB
   **When** the user navigates to a drill history view (in the Dashboard)
   **Then** a list of past drills is displayed with: drill name, target skill, date, number of attempts, and best score

3. **Given** the user views a past drill in the history
   **When** they click "Restart"
   **Then** the drill loads into the DrillController with full phase flow (Demonstrate, Listen, Attempt, Analyze) using the saved note sequences

4. **Given** the user completes a drill attempt
   **When** the results are computed
   **Then** the attempt results (score, timing accuracy, notes hit) are appended to the drill's `attempts` array in IndexedDB

5. **Given** a drill has been attempted multiple times
   **When** the user views the drill in history
   **Then** a progress indicator shows improvement over time (e.g., "Attempt 1: 60% → Attempt 4: 88%")

6. **Given** drills are stored in IndexedDB
   **When** the user is authenticated with Supabase
   **Then** drill data syncs to the server for cross-device persistence (using the existing Dexie-Supabase sync pattern)

**Technical Notes:**

- Primary files: `src/stores/session-store.ts`, `src/features/drills/drill-generator.ts`
- Add a `drills` table to the Dexie.js schema (in the IndexedDB configuration file) with fields: `id`, `name`, `targetSkill`, `difficulty`, `notes`, `generationContext`, `attempts`, `createdAt`
- Drill history view should be a tab or section within the Dashboard (Epic 14.1)
- Sync pattern: follow the existing Dexie → Supabase sync used for sessions — check `src/lib/db/` or similar for the sync layer
- Drill results model: `{ attemptId, timestamp, score, timingAccuracy, notesHit, notesMissed, duration }`

### Story 15.5: Fix Drill Prompt Textarea

As a musician,
I want drill request text to be fully visible without truncation,
So that I can read and edit the drill prompt before it is sent.

**Acceptance Criteria:**

1. **Given** the drill prompt is pasted into the chat textarea
   **When** the prompt text exceeds the current visible area
   **Then** the textarea expands to at least 200px max height (up from 120px) before showing a scrollbar

2. **Given** the textarea has reached its max height
   **When** content overflows
   **Then** a visible scroll indicator (scrollbar or fade gradient at the bottom) clearly signals that more content exists below

3. **Given** the drill generation flow is routed to the structured API (Story 15.1)
   **When** the user triggers a drill
   **Then** the drill request is shown in a dedicated drill request card with full visibility, not crammed into the chat textarea

4. **Given** the drill request card is displayed
   **When** the user views it
   **Then** the full context is visible: identified weakness, suggested focus area, and any editable parameters (difficulty, duration)

5. **Given** the chat textarea is used for regular chat messages (not drill requests)
   **When** the user types a long message
   **Then** the same 200px+ max height and scroll indicator apply

**Technical Notes:**

- Primary file: `src/components/ai-chat-panel.tsx` (lines 205-214 for textarea, lines 93-98 for auto-resize)
- Change max height from `120px` to `200px` in the auto-resize logic
- Add `overflow-y: auto` to the textarea when content exceeds max height
- The better fix (AC3/AC4) depends on Story 15.1 — once drill requests bypass the chat, the textarea overflow is less critical for drills but still needed for long chat messages
- Consider adding a subtle bottom fade gradient (`bg-gradient-to-t from-surface-1`) as a scroll indicator

---

## Epic 16: AI Chat & Visualization Enrichment

Chat responses are plain text with basic segment highlighting. The visualization canvas elements (notes, chords, key labels) are too small to be useful at a glance. The Studio Engineer AI persona is defined in product docs but invisible in the UI. Typography hierarchy is flat — everything uses similar tiny text sizes. The canvas provides no context about what users are looking at.

**Source:** CHAT-01, CHAT-02, UX-02, UX-03, UX-06 from audit
**Priority:** P1/P2
**Dependencies:** Epic 13 (layout must be fixed first), Epic 14.4 (BPM accuracy must be fixed for reliable data display)

### Story 16.1: Increase Chord and Note Visualization Sizing

As a musician,
I want the chord labels, note bars, and harmonic indicators on the canvas to be larger and more noticeable,
So that I can read them at a glance during play without leaning toward the screen.

**Acceptance Criteria:**

1. **Given** the piano roll renderer draws note bars on the canvas
   **When** notes are rendered
   **Then** note bar height is increased by approximately 30% from the current size while maintaining proportional spacing

2. **Given** the harmonic overlay renders chord labels
   **When** chord labels are drawn on the canvas
   **Then** the font size is at least 16px logical (scaled appropriately for the canvas DPI) — increased from the current smaller size

3. **Given** the harmonic overlay renders the key center label
   **When** the key is displayed
   **Then** the label is larger and more prominent than chord labels (e.g., 20px) with higher contrast against the dark background

4. **Given** notes are active (currently being played)
   **When** the piano roll renders them
   **Then** a subtle glow or bloom effect (semi-transparent larger rectangle behind the note bar) is applied to active notes for improved visibility

5. **Given** notes are rendered on the piano roll
   **When** active notes are displayed
   **Then** note name labels (e.g., "C4", "G#3") appear adjacent to active note bars in 10px JetBrains Mono font

6. **Given** the harmonic overlay renders Roman numeral indicators
   **When** harmonic function labels are drawn
   **Then** they are sized at least 14px and positioned with clear visual connection to their corresponding chord

**Technical Notes:**

- Primary files: `src/components/viz/piano-roll-renderer.ts`, `src/components/viz/harmonic-overlay-renderer.ts`
- All sizing changes must account for canvas DPI scaling (`window.devicePixelRatio`) — multiply logical pixels by DPR for sharp rendering on Retina displays
- Glow effect: draw a second rectangle at the same position with `globalAlpha = 0.15` and 4px padding on each side before drawing the main note bar
- Note name labels: use canvas `fillText()` positioned to the left or right of the note bar depending on pitch position
- Keep the existing dark aesthetic (#0F0F0F background, pastel blue accents) — only increase element sizes and add subtle emphasis

### Story 16.2: Build Rich AI Response Components

As a musician chatting with the AI coach,
I want to see inline visualizations (chord diagrams, scale displays, timing graphs) in AI responses,
So that coaching advice is visual and immediately actionable, not just text.

**Acceptance Criteria:**

1. **Given** the AI response references a specific chord (e.g., "Try a Dm7")
   **When** the response is rendered in the chat panel
   **Then** an inline Chord Diagram Card is displayed showing the chord's notes on a mini keyboard visual

2. **Given** the AI response references a scale (e.g., "Practice the D Dorian scale")
   **When** the response is rendered
   **Then** an inline Scale Display component shows highlighted notes on a one-octave piano keyboard visual

3. **Given** the AI response includes timing or accuracy feedback
   **When** the response is rendered
   **Then** an inline Timing Graph component shows the user's timing distribution (early/on-time/late histogram)

4. **Given** the AI response includes a practice recommendation
   **When** the response is rendered
   **Then** a Practice Tip Callout card is displayed with a distinct visual style (left border accent, icon, structured content)

5. **Given** the AI response suggests a drill
   **When** the response is rendered
   **Then** a Drill Suggestion Card with a "Start This Drill" button is displayed inline in the chat

6. **Given** the AI response contains no structured data markers
   **When** the response is rendered
   **Then** it falls back to the existing text rendering with segment highlighting (no regression)

**Technical Notes:**

- Primary files: `src/components/ai-chat-panel.tsx`, `src/features/coaching/response-processor.ts`
- Approach: define structured markers in the AI system prompt (e.g., `[CHORD:Dm7]`, `[SCALE:D_dorian]`, `[TIP:...]`) that the response processor parses into component renders
- Alternative: use the Vercel AI SDK's tool/function calling to return structured data alongside text
- Create component files: `src/components/chat/chord-diagram.tsx`, `src/components/chat/scale-display.tsx`, `src/components/chat/timing-graph.tsx`, `src/components/chat/practice-tip.tsx`, `src/components/chat/drill-suggestion.tsx`
- All components must use the dark aesthetic: `#0F0F0F` backgrounds, `#7CB9E8` accents, sharp corners, monospace metrics
- Drill Suggestion Card's "Start This Drill" button should trigger the drill generation flow from Epic 15

### Story 16.3: Fix Visual Hierarchy and Typography

As a musician,
I want clear typographic hierarchy so that important metrics stand out and labels are subordinate,
So that I can instantly identify the most important information at a glance.

**Acceptance Criteria:**

1. **Given** the DataCard component displays metrics
   **When** rendered
   **Then** primary metrics (Key, BPM) use 24px JetBrains Mono with high contrast (white or near-white on dark background)

2. **Given** the DataCard component displays secondary metrics
   **When** rendered
   **Then** secondary metrics (Timing %, Chord) use 16px JetBrains Mono with medium contrast

3. **Given** any label text in the application
   **When** rendered
   **Then** labels use 10px uppercase Inter with tracking (letter-spacing) as currently defined — no change to labels

4. **Given** the AI chat panel displays messages
   **When** chat text is rendered
   **Then** body text uses 14px Inter (increased from current 12-13px) for comfortable reading

5. **Given** section headings appear in the dashboard, replay, or drill panels
   **When** rendered
   **Then** headings use 18-20px Inter semibold for clear section delineation

6. **Given** the entire application's typography is updated
   **When** viewed at 1024px through 1440px viewports
   **Then** the hierarchy is consistent and no text overflows its container

**Technical Notes:**

- Primary files: `src/components/data-card.tsx` (metric sizing), `src/components/ai-chat-panel.tsx` (chat text sizing), all panel components for heading sizing
- Current metric text uses `text-xs` and `text-[10px]` — change to `text-2xl font-mono` for primary and `text-base font-mono` for secondary
- Chat text: change from `text-xs` / `text-[13px]` to `text-sm` (14px) in `ai-chat-panel.tsx`
- Consider defining typography scale in Tailwind config or CSS custom properties for consistency: `--text-metric-primary: 24px`, `--text-metric-secondary: 16px`, `--text-body: 14px`, `--text-label: 10px`, `--text-heading: 18px`
- Test that larger metric text doesn't overflow DataCard containers — may need to adjust card width or use responsive text sizing

### Story 16.4: Add Studio Engineer Visual Persona

As a musician,
I want the AI coach to have a distinct visual identity in the chat,
So that interactions feel like working with a Studio Engineer, not a generic chatbot.

**Acceptance Criteria:**

1. **Given** the AI sends a message in the coaching chat
   **When** the message is rendered
   **Then** an avatar/icon representing the Studio Engineer appears to the left of the AI message (a subtle audio-engineering-themed icon)

2. **Given** the AI message is rendered
   **When** the user views it
   **Then** a left accent bar in `accent-blue` (#7CB9E8) color distinguishes AI messages from user messages

3. **Given** the user opens the coaching chat for the first time in a session
   **When** no messages exist yet
   **Then** a contextual greeting from the Studio Engineer is displayed: "Studio Engineer online. What are you working on?" (or similar session-aware greeting)

4. **Given** the AI generates a coaching response
   **When** the response is rendered
   **Then** it uses structured formatting: headers for sections, bullet points for lists, callout boxes for key advice — not a single prose paragraph

5. **Given** the user sends a message
   **When** the user message is rendered
   **Then** it appears right-aligned with a different background (subtle differentiation) and no avatar/accent bar

6. **Given** the Studio Engineer avatar is displayed
   **When** viewed at all supported viewport sizes
   **Then** the avatar is consistently sized (24px-32px) and does not compress or overlap message text

**Technical Notes:**

- Primary file: `src/components/ai-chat-panel.tsx`
- Avatar: use a simple SVG icon (mixing console fader, waveform, or headphones) — add to `src/components/icons/` or use an existing icon library
- Left accent bar: add `border-l-2 border-accent-blue pl-3` to AI message containers
- Contextual greeting: add a conditional first message in the chat that is not sent to the API but rendered locally based on session state
- Structured responses: update the AI system prompt (in `src/features/coaching/` or `src/app/api/ai/chat/route.ts`) to instruct the model to use markdown headers, bullets, and structured formatting
- Response processor (`src/features/coaching/response-processor.ts`) may need updates to render markdown properly

### Story 16.5: Add Canvas Visualization Legend

As a new musician using Minstrel,
I want to understand what the piano roll, timing grid, and harmonic overlay represent,
So that I can interpret the visualization correctly from my first session.

**Acceptance Criteria:**

1. **Given** the user enters Silent Coach mode for the first time (or has not dismissed the legend)
   **When** the canvas renders
   **Then** a subtle legend overlay appears showing labeled arrows pointing to: "Notes" (piano roll area), "Timing" (timing grid area), "Key" (harmonic overlay area)

2. **Given** the legend is displayed
   **When** 30 seconds elapse OR the user plays their first note
   **Then** the legend automatically fades out with a smooth transition

3. **Given** the legend has been auto-hidden
   **When** the user wants to see it again
   **Then** an info button (small "i" icon) in the corner of the canvas re-shows the legend on click

4. **Given** the legend is displayed
   **When** rendered on the canvas
   **Then** it uses semi-transparent background panels with the dark aesthetic and does not obscure more than 20% of the canvas area

5. **Given** the legend has been dismissed by the user
   **When** the user returns to Silent Coach mode in the same session
   **Then** the legend does not reappear automatically (persisted to session state or `localStorage`)

6. **Given** the legend info button is present
   **When** the user tabs to it with keyboard navigation
   **Then** the button is focusable and activates on Enter/Space

**Technical Notes:**

- The legend can be either a DOM overlay positioned over the canvas (simpler, better for accessibility) or rendered on the canvas itself (consistent with viz system but harder to make accessible)
- Recommended: DOM overlay with `pointer-events: none` on non-interactive elements, `pointer-events: auto` on the info button
- Auto-hide logic: set a `setTimeout(30000)` on mount; clear on first note (listen to `midiStore.activeNotes` change)
- Persistence: store `legendDismissed: boolean` in `localStorage` via `appStore`
- Info button: position as `absolute bottom-4 right-4` within the canvas container, using a shadcn/ui `Button` with `variant="ghost"` and an info icon

---

## Epic 17: UX Polish & Missing Features

Multiple UX gaps remain: warm-up drills are invisible due to strict visibility conditions, progress data is buried behind a tiny toggle, mode switching lacks descriptive context, there is no session end experience, empty states are uninspiring, amber is overused as a color with no positive reinforcement color, chord visualization is text-only, and there is no visual feedback for MIDI input quality during live play.

**Source:** UX-04, UX-05, UX-07, UX-08, UX-10, UX-11, UX-13, MISSING-01, MISSING-02 from audit
**Priority:** P2/P3
**Dependencies:** Epics 13, 14, 16 (layout, dashboard, and visualization must exist first)

### Story 17.1: Surface Warm-Up Drills Section

As a musician starting a practice session,
I want to easily find and start warm-up exercises,
So that I can prepare properly before diving into focused practice.

**Acceptance Criteria:**

1. **Given** the WarmUpPrompt component's current visibility conditions require authentication, no notes played, skill profile, recent sessions, and not currently warming up
   **When** the conditions are relaxed
   **Then** the warm-up prompt shows for any authenticated user with at least 1 previous session (remove `skillProfile` and `totalNotesPlayed` requirements from initial display)

2. **Given** the user navigates to the Dashboard
   **When** the Dashboard renders
   **Then** a dedicated "Warm-Up" section is visible with available warm-up exercises (not just a "Warm up first?" prompt)

3. **Given** the warm-up section displays exercises
   **When** the user views an exercise
   **Then** the exercise content is shown: name, target area, estimated duration, and a visual preview of the exercise pattern

4. **Given** the user completes a warm-up exercise
   **When** the warm-up finishes
   **Then** the completion is tracked and the warm-up section updates to show "Completed today" with a checkmark

5. **Given** the navigation sidebar exists (Epic 13.1)
   **When** the user wants a quick warm-up
   **Then** a "Quick Warm-Up" shortcut is accessible from the sidebar or session page header

6. **Given** the user has no previous sessions
   **When** the warm-up section renders
   **Then** it shows a generic beginner warm-up option: "Start with a basic warm-up to calibrate your skill profile"

**Technical Notes:**

- Primary files: `src/components/warm-up-prompt.tsx` (lines 42-52 — strict visibility conditions), `src/features/session/warm-up-flow.ts`
- Relax conditions in `warm-up-prompt.tsx`: remove the `skillProfile` and `totalNotesPlayed > 0` checks from the display condition
- Warm-up section in Dashboard: add as a card component in `src/app/(auth)/dashboard/page.tsx`
- Warm-up exercise content should come from `warm-up-flow.ts` — the generator already exists but is rarely triggered
- Completion tracking: add a `warmUpCompleted` timestamp to `sessionStore` or IndexedDB for daily tracking

### Story 17.2: Surface Progress Data Prominently

As a musician,
I want my progress data (streaks, XP, achievements) always visible and prominent,
So that I feel motivated by my ongoing improvement.

**Acceptance Criteria:**

1. **Given** the WeeklySummary and PersonalRecords components are currently hidden behind a toggle button
   **When** this story is completed
   **Then** the toggle is removed and a compact progress summary is always visible in the Dashboard view

2. **Given** the user has an active practice streak
   **When** the Dashboard renders
   **Then** a streak flame icon with the streak count is displayed as a persistent UI element (visible without interaction)

3. **Given** the user has earned XP
   **When** the Dashboard renders
   **Then** an XP bar showing current level progress is displayed as a persistent element

4. **Given** the user has unlocked achievements
   **When** the Dashboard renders
   **Then** an achievement count badge is displayed as a persistent element

5. **Given** the progress elements are rendered
   **When** the user clicks on any progress element (streak, XP, or achievements)
   **Then** it navigates to the relevant detailed view (achievements gallery, progress trends)

6. **Given** the user has no progress data yet (new user)
   **When** the progress elements render
   **Then** they show starter state: "0-day streak — play today to start!", "Level 1 — 0 XP", "0 achievements — your first one is just a session away"

**Technical Notes:**

- Current progress toggle: locate the `+` button labeled "Progress" with `text-[10px]` uppercase — this is in `src/features/modes/dashboard-chat.tsx` or the session page
- Move progress display from behind toggle into the Dashboard page (Epic 14.1) as persistent cards
- Streak flame: use an amber emoji/icon or SVG flame with the count in JetBrains Mono
- XP bar: shadcn/ui `Progress` component styled with `accent-blue` fill on dark background
- Achievement count: shadcn/ui `Badge` component with the count
- Data sources: `sessionStore.streakData`, `sessionStore.xpData`, `sessionStore.achievements`

### Story 17.3: Improve Mode Switching UX

As a musician new to Minstrel,
I want the mode names to have descriptive subtitles so I understand what each mode does,
So that I can choose the right mode for my current activity.

**Acceptance Criteria:**

1. **Given** the mode switcher displays three mode tabs
   **When** rendered
   **Then** each tab shows a subtitle below the mode name: Play ("Live visualization"), Coach ("AI-assisted practice"), Replay ("Session review")

2. **Given** the user switches from one mode to another
   **When** the transition occurs
   **Then** a brief crossfade animation (150-200ms) provides visual continuity between modes

3. **Given** the user is using Minstrel for the first time
   **When** they first see the mode switcher
   **Then** a brief onboarding tooltip appears explaining: "Switch between modes to visualize, get coaching, or replay your sessions"

4. **Given** the onboarding tooltip is displayed
   **When** the user clicks any mode tab or dismisses the tooltip
   **Then** the tooltip does not appear again (persisted to `localStorage`)

5. **Given** the mode subtitles are rendered
   **When** the viewport is narrow (1024px)
   **Then** subtitles gracefully hide or truncate to maintain compact tab sizing

6. **Given** the mode switcher renders with subtitles
   **When** compared to the current design
   **Then** the overall mode switcher height increases by no more than 12px to accommodate subtitles

**Technical Notes:**

- Primary file: `src/features/modes/mode-switcher.tsx`
- Mode renaming from audit UX-01 recommendation: "Silent Coach" → "Play", "Dashboard+Chat" → "Coach", "Replay Studio" → "Replay"
- Subtitles: add a `<span className="text-[9px] text-muted-foreground">` below each mode name
- Crossfade: use CSS `transition: opacity 150ms ease-in-out` on mode content containers
- Onboarding tooltip: use shadcn/ui `Tooltip` or a custom popover anchored to the mode switcher; store `modeTooltipDismissed` in `localStorage`

### Story 17.4: Add Session End Experience

As a musician finishing a practice session,
I want to see a summary of what I just practiced with my stats and a motivational message,
So that I feel a sense of accomplishment and know what to work on next.

**Acceptance Criteria:**

1. **Given** the user has been playing and stops for 60 seconds (silence detected)
   **When** the silence threshold is reached
   **Then** a session summary card automatically appears with a smooth slide-up animation

2. **Given** the session summary card is displayed
   **When** the user views it
   **Then** it shows: session duration, total notes played, detected key, average tempo, timing accuracy percentage, and improvement vs last session (e.g., "+5% timing accuracy")

3. **Given** the session summary card is displayed
   **When** the user views the bottom section
   **Then** a growth-mindset motivational message is displayed (e.g., "Every session builds your ear. You played 340 notes in C Major today.")

4. **Given** the session summary card is displayed
   **When** the user views the action buttons
   **Then** three options are available: "View Replay" (opens Replay Studio for this session), "Continue Playing" (dismisses summary and resumes), "End Session" (saves and returns to Dashboard)

5. **Given** the user clicks "Continue Playing"
   **When** the summary is dismissed
   **Then** the session continues and the 60-second silence timer resets

6. **Given** the user clicks "End Session"
   **When** the session ends
   **Then** the session is saved automatically to IndexedDB/Supabase and the user is navigated to the Dashboard

**Technical Notes:**

- Primary file: `src/components/session-summary.tsx` (already exists but `showSummary` is initialized to `false` and never set to `true`)
- The silence detection logic exists in `src/features/analysis/use-analysis-pipeline.ts` — add a secondary timer (60s) that triggers `setShowSummary(true)` in the session page
- `src/app/(auth)/session/page.tsx` has `showSummary` state — wire it to the silence timer
- Session summary stats: compute from `sessionStore` current session data (reuse logic from Story 14.3)
- Improvement comparison: compare current session metrics against the most recent completed session in IndexedDB
- Growth mindset message: randomize from a set of 10-15 positive messages stored in `src/lib/constants.ts`

### Story 17.5: Design Better Empty States

As a new musician opening Minstrel,
I want empty screens to show me what I will see once I start using the app,
So that I understand the app's value and am motivated to take the first action.

**Acceptance Criteria:**

1. **Given** the user has no sessions yet
   **When** the Session History page renders
   **Then** an empty state shows a mock/preview visualization image with the text "Play your first note to see your music come alive" and a "Start Playing" CTA button

2. **Given** the user has no API key configured
   **When** the coaching chat renders
   **Then** an empty state shows a preview of what AI coaching looks like (mock conversation screenshot) with "Connect your API key to unlock AI coaching insights" and a "Configure API Key" CTA button

3. **Given** the user has no achievements
   **When** the Achievements page renders
   **Then** an empty state shows silhouettes of locked achievement badges with "Your first achievement is just a session away" and a "Start Playing" CTA button

4. **Given** the user has no MIDI device connected
   **When** the session page renders without MIDI
   **Then** the empty state shows a stylized MIDI keyboard illustration with clear connection instructions and a "Troubleshoot Connection" CTA

5. **Given** empty states are rendered
   **When** viewed on all supported viewport sizes
   **Then** illustrations/previews scale responsively and text remains legible

6. **Given** empty state CTA buttons are clicked
   **When** the user interacts
   **Then** navigation goes to the appropriate page (session page, settings page, etc.)

**Technical Notes:**

- Create reusable `src/components/empty-state.tsx` component accepting: `icon` or `illustration`, `title`, `description`, `ctaText`, `ctaHref` props
- Replace existing minimal empty states across: `src/components/session-history-list.tsx`, `src/components/ai-chat-panel.tsx`, `src/app/(auth)/achievements/page.tsx` (if exists)
- Mock visualization preview: use a static SVG or pre-rendered screenshot of the piano roll with sample notes
- Keep the dark aesthetic — empty state backgrounds should match `#0F0F0F`, illustrations should use `accent-blue` and muted tones
- CTA buttons: shadcn/ui `Button` with `variant="default"` (primary blue)

### Story 17.6: Fix Color Usage — Add Success States

As a musician,
I want positive outcomes to be visually reinforced with a distinct success color,
So that amber is reserved for "attention needed" and green/success is used for positive reinforcement.

**Acceptance Criteria:**

1. **Given** the current color system uses amber for multiple purposes (errors, warnings, improvement indicators, labels)
   **When** this story is completed
   **Then** amber (`accent-warm`) is reserved strictly for "attention needed" states: warnings, "listen first" indicators, and items requiring user action

2. **Given** a positive improvement percentage is displayed (e.g., "+5% timing accuracy")
   **When** rendered
   **Then** it uses `accent-success` (muted green) instead of amber

3. **Given** a streak milestone is reached
   **When** the milestone notification renders
   **Then** it uses `accent-success` color for the streak count and celebration indicator

4. **Given** timing accuracy exceeds 85%
   **When** displayed in data cards or snapshots
   **Then** the value uses `accent-success` color to indicate "good" performance

5. **Given** the `accent-success` color token exists but is rarely used
   **When** this story is completed
   **Then** `accent-success` is used consistently across all positive outcome indicators and its HSL value is confirmed to be a muted green that passes WCAG AA contrast on `#0F0F0F` background

6. **Given** a confirmed positive outcome is displayed (e.g., drill passed, achievement unlocked)
   **When** rendered
   **Then** it uses a muted green visual treatment distinct from both amber and blue

**Technical Notes:**

- Check `globals.css` for `--accent-success` definition — ensure it is a muted green (not bright neon) that passes 4.5:1 contrast on `#0F0F0F`
- Audit files for amber color usage: search for `accent-warm`, `text-amber`, `bg-amber` across the codebase
- Key files to update: `src/components/data-card.tsx`, `src/components/snapshot-cta.tsx`, `src/components/streak-badge.tsx` (if exists), `src/components/achievement-toast.tsx` (if exists)
- Do NOT remove amber entirely — it remains for warnings, "not yet" states, and attention indicators per the growth mindset principle

### Story 17.7: Add Visual Chord Indicators

As a musician,
I want chords displayed as visual shapes (not just text labels) with color-coded harmonic function,
So that I can quickly understand chord quality and harmonic movement at a glance.

**Acceptance Criteria:**

1. **Given** a chord is detected during live play
   **When** the chord indicator renders on the canvas
   **Then** a colored block represents the chord quality: solid fill for major, outlined for minor, fill with dot/accent for 7th chords, dashed outline for diminished

2. **Given** chord indicators are rendered
   **When** displayed on the canvas
   **Then** they are color-coded by harmonic function: tonic chords use `accent-blue`, dominant chords use `accent-warm` (amber), subdominant use a third distinct color

3. **Given** chords have been detected in sequence
   **When** the chord progression strip renders
   **Then** the last 8 detected chords are shown as a horizontal strip of colored blocks with small text labels underneath (e.g., "Cm", "Bbm", "Eb")

4. **Given** the chord progression strip is rendered
   **When** a new chord is detected
   **Then** the strip scrolls/shifts left smoothly to accommodate the new chord block

5. **Given** the chord indicator blocks are rendered
   **When** the user views them at normal distance (arm's length)
   **Then** they are at least 32px wide and 24px tall with legible labels (per the 70/30 glanceable design principle)

6. **Given** the chord visualization enhancement is active
   **When** rendering performance is measured
   **Then** the additional rendering does not drop frame rate below 55fps (staying within the 60fps target with reasonable margin)

**Technical Notes:**

- Primary file: `src/components/viz/harmonic-overlay-renderer.ts` — add chord block rendering alongside existing text labels
- Chord quality → visual style mapping: define in `src/lib/constants.ts` or directly in the renderer
- Harmonic function detection: the key detection system already identifies tonal center — use the relationship between detected chord root and key to determine function (I=tonic, V=dominant, IV=subdominant, etc.)
- Chord progression strip: can be rendered as a DOM element below the canvas (simpler) or as a dedicated canvas region (more integrated)
- Keep blocks simple — no complex shapes that could impact render performance

### Story 17.8: Add MIDI Input Quality Feedback

As a musician,
I want subtle visual feedback on the canvas about my timing quality as I play,
So that I get ambient awareness of my performance without being distracted from my instrument.

**Acceptance Criteria:**

1. **Given** the user plays a note with good timing (within +/-50ms of the detected beat)
   **When** the timing grid renderer processes the note
   **Then** a subtle green pulse briefly appears on the timing grid area of the canvas (200ms fade-in, 400ms fade-out)

2. **Given** the user plays a note late (>50ms after the beat)
   **When** the timing grid renderer processes the note
   **Then** a subtle amber pulse briefly appears on the timing grid area

3. **Given** the user plays a note early (>50ms before the beat)
   **When** the timing grid renderer processes the note
   **Then** a subtle amber pulse briefly appears (same treatment as late — both are "not quite on the beat")

4. **Given** the user has been playing consistently well (>85% timing accuracy over the last 30 seconds)
   **When** the "flow state" is detected
   **Then** a subtle ambient glow effect appears around the canvas edges (very low opacity, slowly pulsing) indicating sustained good performance

5. **Given** visual timing feedback is displayed
   **When** the pulses render
   **Then** they are subtle background effects (10-15% opacity) that do not distract from the primary piano roll, chord, and harmonic visualizations

6. **Given** the user has `prefers-reduced-motion` enabled
   **When** timing feedback would render
   **Then** pulses are replaced with static color shifts (no animation) per NFR23

**Technical Notes:**

- Primary file: `src/components/viz/timing-grid-renderer.ts` — add pulse rendering layer behind the existing timing grid
- Green pulse: use `fillStyle` with `rgba(success-green, 0.12)` filling the timing grid region, animated via `globalAlpha` interpolation
- Amber pulse: same pattern with `rgba(accent-warm, 0.12)`
- Flow state detection: track a rolling 30-second window of timing deviations; if >85% are within threshold, set `isFlowState = true`
- Flow glow: render a radial gradient at canvas edges with very low opacity (5-8%), pulsing between 5% and 8% over 2-second cycles
- All effects must be computed in the render loop without triggering React re-renders (use the vanilla Zustand subscribe pattern)
- `prefers-reduced-motion`: check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` and skip animations

---

## Summary

| Epic      | Title                              | Stories | Priority | Dependencies      |
| --------- | ---------------------------------- | ------- | -------- | ----------------- |
| 12        | Session Replay Resurrection        | 5       | P0       | None              |
| 13        | Navigation & Layout Overhaul       | 5       | P0       | None              |
| 14        | User Dashboard & Data Accuracy     | 7       | P0/P1    | Epic 13 (partial) |
| 15        | Drill System Overhaul              | 5       | P0/P1    | Epic 14.1         |
| 16        | AI Chat & Visualization Enrichment | 5       | P1/P2    | Epics 13, 14.4    |
| 17        | UX Polish & Missing Features       | 8       | P2/P3    | Epics 13, 14, 16  |
| **Total** |                                    | **35**  |          |                   |
