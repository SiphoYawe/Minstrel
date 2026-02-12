# Story 2.6: Silent Coach Mode Layout

Status: ready-for-dev

## Story

As a musician,
I want a full-screen immersive visualization while I play,
so that I can focus on my instrument with minimal screen distraction.

## Acceptance Criteria

1. Given the user is in an active session, When Silent Coach mode is active (default mode on session start), Then the VisualizationCanvas occupies approximately 90% of the viewport area (UX5). And the remaining space is used for minimal floating overlays (StatusBar, ModeSwitcher). And no sidebars, panels, or data cards are visible.

2. Given Silent Coach mode is active, When the StatusBar renders, Then it displays: MIDI connection status (green dot + device name), current detected key and tempo (from sessionStore), and session timer (elapsed time since first note). And the StatusBar is a floating overlay positioned at the top of the viewport. And the StatusBar has a subtle background (semi-transparent dark) to ensure readability over Canvas content.

3. Given Silent Coach mode is active, When the ModeSwitcher component renders, Then it is accessible in a corner position (top-right) or via keyboard shortcut. And it is visually unobtrusive — small, dimmed, and does not draw attention. And clicking/activating it allows switching to Dashboard + Chat or Replay Studio modes.

4. Given Silent Coach mode is active, When the musician is playing, Then no AI chat panel, no data cards, no side panels, and no modal dialogs are visible. And the only on-screen elements are the VisualizationCanvas, StatusBar, and ModeSwitcher. And the visualization experience is immersive with minimal chrome.

5. Given the browser viewport is at the minimum supported width (1024px), When Silent Coach mode renders, Then the layout remains functional. And the StatusBar does not overlap critical Canvas content. And all floating overlay elements are positioned correctly. And the VisualizationCanvas fills the available space.

6. Given Silent Coach mode is active, When the user navigates via keyboard, Then all visible controls (StatusBar actions, ModeSwitcher) are reachable via Tab key. And the ModeSwitcher can be activated via a keyboard shortcut (e.g., Cmd/Ctrl+1/2/3 for each mode). And focus indicators are visible and meet WCAG 2.1 AA contrast requirements (NFR20).

7. Given the UX design principle of 70/30 attention split (instrument 70%, screen 30%), When visualization renders in Silent Coach mode, Then the Canvas content is designed for peripheral vision — large, clear shapes and colors rather than small text or dense data. And the visualization does not demand focused reading. And the visual design prioritizes glanceability.

## Tasks / Subtasks

- [ ] 1. Define mode types and state (AC: 1, 3)
  - [ ] 1.1 Create `src/features/modes/mode-types.ts` with: `SessionMode` enum (`SilentCoach`, `DashboardChat`, `ReplayStudio`), `ModeConfig` type (name, layout, canvasPercentage, showChat, showDataCards)
  - [ ] 1.2 Add `currentMode: SessionMode` to `sessionStore` (default: `SessionMode.SilentCoach`)
  - [ ] 1.3 Create `src/features/modes/index.ts` barrel export

- [ ] 2. Implement Silent Coach mode layout component (AC: 1, 4, 5)
  - [ ] 2.1 Create `src/features/modes/silent-coach.tsx` — `'use client'` component (Layer 1)
  - [ ] 2.2 Layout structure: full-viewport container with CSS Grid or Flexbox. Canvas element takes `100vw x 100vh` minus StatusBar height.
  - [ ] 2.3 No conditional rendering of chat panels, data cards, or sidebars — they are not mounted at all in Silent Coach mode (not hidden, not rendered)
  - [ ] 2.4 Apply responsive handling: test at 1024px, 1280px, 1440px, 1920px viewport widths
  - [ ] 2.5 Use Tailwind CSS v4 classes for layout. Dark background (#0F0F0F) fills any gaps.

- [ ] 3. Implement StatusBar floating overlay (AC: 2)
  - [ ] 3.1 Create StatusBar component at `src/components/status-bar.tsx` (P0 priority per UX) — `'use client'` component
  - [ ] 3.2 StatusBar sections: left (MIDI status: green/amber dot + device name), center (detected key + BPM), right (session timer HH:MM:SS)
  - [ ] 3.3 Position: fixed at top of viewport, full width, height ~40-48px
  - [ ] 3.4 Background: semi-transparent dark (e.g., `bg-[#0F0F0F]/80 backdrop-blur-sm`)
  - [ ] 3.5 Subscribe to `sessionStore` for key/tempo data and `midiStore` for connection status using Zustand selectors (not full store)
  - [ ] 3.6 Session timer: use `useEffect` with `setInterval` (1s) starting from session start timestamp stored in `sessionStore`
  - [ ] 3.7 Typography: Inter font, small size (12-14px), muted color for minimal distraction

- [ ] 4. Implement ModeSwitcher component (AC: 3, 6)
  - [ ] 4.1 Create `src/features/modes/mode-switcher.tsx` (P0 priority per UX) — `'use client'` component
  - [ ] 4.2 Render as a compact button group or icon bar in the top-right corner
  - [ ] 4.3 Display mode options: Silent Coach (default, active state), Dashboard + Chat, Replay Studio
  - [ ] 4.4 Active mode has a subtle highlight (e.g., #7CB9E8 primary accent underline or border)
  - [ ] 4.5 Inactive modes are dimmed (low opacity) to avoid drawing attention
  - [ ] 4.6 On click: dispatch `sessionStore.currentMode` update
  - [ ] 4.7 Keyboard shortcuts: bind Cmd/Ctrl+1 (Silent Coach), Cmd/Ctrl+2 (Dashboard), Cmd/Ctrl+3 (Replay) using `useEffect` + `addEventListener('keydown')`. Prevent default browser behavior for these shortcuts.
  - [ ] 4.8 Focus management: Tab-navigable, visible focus ring using Tailwind `focus-visible:ring-2 ring-[#7CB9E8]`

- [ ] 5. Wire mode switching into session page (AC: 1, 3)
  - [ ] 5.1 Update `src/app/(auth)/session/page.tsx` (or `src/app/(guest)/play/page.tsx`) to read `sessionStore.currentMode` and render the appropriate mode layout component
  - [ ] 5.2 Silent Coach renders: VisualizationCanvas + StatusBar + ModeSwitcher
  - [ ] 5.3 Dashboard + Chat and Replay Studio layouts are placeholder components for now (implemented in Epic 4 and Epic 6)
  - [ ] 5.4 Mode switching preserves all session state — no analysis reset, no recording interruption

- [ ] 6. Ensure Canvas visualization supports glanceability (AC: 7)
  - [ ] 6.1 Review Canvas rendering from Stories 2.1-2.3 for Silent Coach context
  - [ ] 6.2 Ensure note visualizations use large shapes (minimum 20px elements at 1024px viewport) viewable with peripheral vision
  - [ ] 6.3 Key and chord labels on Canvas use large, high-contrast text (16-20px) readable at arm's length
  - [ ] 6.4 Avoid dense data tables, small numbers, or fine-detail visualizations in Silent Coach mode — those belong in Dashboard mode

- [ ] 7. Implement accessibility features (AC: 6)
  - [ ] 7.1 All interactive elements (StatusBar buttons, ModeSwitcher buttons) have `role`, `aria-label`, and keyboard event handlers
  - [ ] 7.2 Focus order follows visual layout: StatusBar left-to-right, then ModeSwitcher
  - [ ] 7.3 Keyboard shortcuts have corresponding `aria-keyshortcuts` attributes
  - [ ] 7.4 Screen reader announces mode changes: `aria-live="polite"` region for mode status
  - [ ] 7.5 Focus indicators meet 3:1 contrast ratio against the dark background

- [ ] 8. Write co-located tests (AC: 1, 2, 3, 6)
  - [ ] 8.1 Create `src/features/modes/silent-coach.test.tsx` — component tests using React Testing Library
  - [ ] 8.2 Test that Silent Coach renders VisualizationCanvas, StatusBar, and ModeSwitcher
  - [ ] 8.3 Test that no chat panel, data cards, or side panels are rendered
  - [ ] 8.4 Test keyboard shortcut: Cmd+1 activates Silent Coach, Cmd+2 activates Dashboard
  - [ ] 8.5 Test StatusBar displays MIDI connection status, key/tempo, and timer
  - [ ] 8.6 Test responsive layout at 1024px viewport width

## Dev Notes

- **Architecture Layer**: Mode layouts are Layer 1 (Presentation). StatusBar and ModeSwitcher are presentation components that subscribe to Layer 2 stores. No domain logic in this story.
- **Component Priority**: StatusBar and ModeSwitcher are P0 components (Phase 1, Weeks 1-3). They must be implemented with production quality from the start.
- **Canvas Space**: The ~90% canvas target means the StatusBar takes ~40-48px from the top, and the ModeSwitcher takes a small corner space. At 1080p (1920x1080), this gives roughly 1920x1032 for Canvas — well within "~90%".
- **No Lazy Loading Needed**: Silent Coach is the default mode — it loads immediately. Dashboard + Chat and Replay Studio can be lazy-loaded via `next/dynamic` when first selected (not in this story).
- **Attention Split**: The 70/30 principle means the screen should NOT compete for attention. Large, ambient visualizations. No reading required during play. The musician glances at the screen between phrases, not during them.
- **Mode Switching State Preservation**: Critical that switching modes does not reset the analysis pipeline, recording, or any session state. The mode only controls which UI layout is rendered — all background processing continues unchanged.
- **shadcn/ui Usage**: StatusBar may use shadcn/ui Badge for status indicators, Tooltip for mode descriptions. ModeSwitcher may use Button or ToggleGroup. All components restyled to 0px border radius per UX spec.
- **Library Versions**: React 19.x, Tailwind CSS v4, shadcn/ui (source-owned), Zustand 5.x selectors.
- **Testing**: React Testing Library for component tests. Mock Zustand stores using test utilities. Test keyboard events with `fireEvent.keyDown`.

### Project Structure Notes

- `src/features/modes/mode-types.ts` — mode enum and configuration types
- `src/features/modes/silent-coach.tsx` — Silent Coach mode layout component
- `src/features/modes/silent-coach.test.tsx` — co-located component tests
- `src/features/modes/mode-switcher.tsx` — mode switching component (P0)
- `src/features/modes/index.ts` — barrel export
- `src/components/status-bar.tsx` — StatusBar floating overlay component (P0)
- `src/stores/session-store.ts` — extended with `currentMode: SessionMode`
- `src/app/(auth)/session/page.tsx` — updated to render mode-specific layouts

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — component architecture, `'use client'` directive, Zustand selectors
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure] — mode components in `src/features/modes/`
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.6] — acceptance criteria, FR29 coverage, UX5 reference
- [Source: _bmad-output/planning-artifacts/prd.md#Interaction Modes] — FR29: Silent Coach with real-time visualization, no AI interruptions
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Core User Experience] — UX5 mode layouts (~90% canvas for Silent Coach), 70/30 attention split, P0 component priority
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Emotional Design Principles] — "Silence Is Respect", minimal chrome during play

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
