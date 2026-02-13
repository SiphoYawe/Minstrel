# Story 9.5: Fix Accessibility Gaps

Status: ready-for-dev

## Story

As a user who relies on assistive technology,
I want the application to be accessible with screen readers and keyboard navigation,
So that I can use all features effectively.

## Acceptance Criteria

1. **Given** the `VisualizationCanvas` renders (`src/components/viz/visualization-canvas.tsx`), **When** it is in the DOM, **Then** it has `role="img"` and a descriptive `aria-label` that reflects the current session state (e.g., "Real-time MIDI visualization showing C Major at 120 BPM"). The canvas already has `role="img"` and `aria-label="MIDI note visualization"` at lines 257-258 — enhance the label to be dynamic based on current key and tempo from the session store.

2. **Given** the `ModeSwitcher` renders (`src/features/modes/mode-switcher.tsx`), **When** a mode is selected, **Then** it has `role="tablist"` semantics with `aria-selected="true"` on the active mode tab. The component already has `role="tablist"` (line 62), `role="tab"` (line 74), and `aria-selected` (line 75). Verify these are functioning correctly and add `aria-current="page"` if appropriate.

3. **Given** a session snapshot appears on silence, **When** the `SnapshotCTA` renders (`src/components/snapshot-cta.tsx`), **Then** an `aria-live="polite"` region announces the key insight to screen readers. Currently the component has no aria-live region — add one.

4. **Given** drill phases transition in `DrillController` (`src/components/drill-controller.tsx`), **When** a new phase starts (Demonstrate/Listen/Attempt/Analyze), **Then** an `aria-live="assertive"` region announces the current phase. Verify the component already has phase announcements (check `getPhaseAnnouncement` function at line 45) and ensure they are wired to an `aria-live` region.

5. **Given** any page in the app, **When** it loads, **Then** a visually-hidden "Skip to main content" link is the first focusable element. Add a `SkipToContent` component to `src/app/layout.tsx` that links to `#main-content`, and add `id="main-content"` to the main content area of each layout.

6. **Given** the AI chat panel renders (`src/components/ai-chat-panel.tsx`), **When** messages are added, **Then** the message container has `role="log"` and `aria-live="polite"`. The component already has `role="log"` and `aria-live="polite"` at lines 127-128 — verify these are correctly placed and functioning.

7. **Given** keyboard shortcuts exist (Alt+1/2/3 for mode switching), **When** the user needs to discover them, **Then** the shortcuts are at minimum documented in `aria-keyshortcuts` attributes. The `ModeSwitcher` already has `aria-keyshortcuts` at line 76. A full keyboard shortcuts help panel is deferred to a future story.

8. **Given** the user has `prefers-reduced-motion: reduce`, **When** Canvas animations render, **Then** animations are disabled or simplified. The `globals.css` already has a `prefers-reduced-motion` media query (lines 71-80) that reduces CSS animations. For the Canvas (which uses `requestAnimationFrame` directly), add a JS-level check using `window.matchMedia('(prefers-reduced-motion: reduce)')` to simplify or disable fading note animations.

## Tasks / Subtasks

- [ ] 1. Enhance VisualizationCanvas aria-label to be dynamic (AC: 1)
  - [ ] 1.1 Open `src/components/viz/visualization-canvas.tsx` — the canvas at line 255-266 has static `aria-label="MIDI note visualization"`
  - [ ] 1.2 Since this component bypasses React rendering (vanilla Zustand subscriptions), add a sibling `<span>` element with `role="status"` and `aria-live="polite"` that is visually hidden (`sr-only`)
  - [ ] 1.3 Subscribe to `sessionStore.currentKey` and `sessionStore.currentTempo` to update the hidden status text (e.g., "MIDI visualization: C Major, 120 BPM")
  - [ ] 1.4 Keep the static `aria-label` on the canvas element as a fallback

- [ ] 2. Verify ModeSwitcher accessibility (AC: 2)
  - [ ] 2.1 Open `src/features/modes/mode-switcher.tsx` and confirm `role="tablist"` (line 62), `role="tab"` (line 74), `aria-selected` (line 75), and `aria-keyshortcuts` (line 76) are all present
  - [ ] 2.2 Test with screen reader: verify mode changes are announced
  - [ ] 2.3 The component already has an `aria-live="polite"` announcement span (line 59) — verify it updates on mode change

- [ ] 3. Add aria-live to SnapshotCTA (AC: 3)
  - [ ] 3.1 Open `src/components/snapshot-cta.tsx` and add an `aria-live="polite"` visually-hidden region
  - [ ] 3.2 When the snapshot appears (when `currentSnapshot` is not null), populate the hidden region with the snapshot's `keyInsight` text
  - [ ] 3.3 Add a `<span className="sr-only" aria-live="polite">` that reads the key insight, e.g., "Session insight: You're gravitating toward C Major with strong timing"

- [ ] 4. Verify DrillController phase announcements (AC: 4)
  - [ ] 4.1 Open `src/components/drill-controller.tsx` and review the `getPhaseAnnouncement` function (line 45)
  - [ ] 4.2 Verify that an `aria-live="assertive"` region exists in the component's JSX and is populated with the phase announcement text
  - [ ] 4.3 If not present, add a visually-hidden `<div aria-live="assertive" className="sr-only">` that updates when `currentPhase` changes

- [ ] 5. Add skip-to-content link (AC: 5)
  - [ ] 5.1 Create `src/components/skip-to-content.tsx`:
    ```tsx
    export function SkipToContent() {
      return (
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:text-sm"
        >
          Skip to main content
        </a>
      );
    }
    ```
  - [ ] 5.2 Add `<SkipToContent />` as the first child inside `<body>` in `src/app/layout.tsx` (before `<AuthProvider>`)
  - [ ] 5.3 Add `id="main-content"` and `tabIndex={-1}` to the main content wrapper in:
    - `src/app/(marketing)/layout.tsx` — on the `<main>` element
    - `src/features/modes/silent-coach.tsx` — on the outer `<div>`
    - `src/features/modes/dashboard-chat.tsx` — on the outer `<div>`
    - `src/features/modes/replay-studio.tsx` — on the outer container

- [ ] 6. Verify AI chat panel accessibility (AC: 6)
  - [ ] 6.1 Open `src/components/ai-chat-panel.tsx` and confirm `role="log"` (line 127), `aria-live="polite"` (line 128), and `aria-busy` (line 129) are present on the message container
  - [ ] 6.2 Confirm the textarea has `aria-label="Chat message input"` (line 199) and the submit button has `aria-label="Send message"` (line 205)
  - [ ] 6.3 Test with screen reader: verify new messages are announced

- [ ] 7. Add prefers-reduced-motion check to Canvas rendering (AC: 8)
  - [ ] 7.1 In `src/components/viz/visualization-canvas.tsx`, add a ref to track reduced motion preference:
    ```tsx
    const reducedMotionRef = useRef(false);
    ```
  - [ ] 7.2 In the `useEffect`, add a media query listener:
    ```tsx
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mql.matches;
    const handleChange = (e: MediaQueryListEvent) => {
      reducedMotionRef.current = e.matches;
    };
    mql.addEventListener('change', handleChange);
    ```
  - [ ] 7.3 Pass `reducedMotionRef.current` to `renderNotes` — when true, skip fading note animations (instant appear/disappear instead of gradual fade)
  - [ ] 7.4 Clean up the media query listener in the effect cleanup

- [ ] 8. Testing (AC: 1-8)
  - [ ] 8.1 Test all accessibility enhancements with VoiceOver (macOS) or NVDA
  - [ ] 8.2 Verify skip-to-content link works by tabbing from page load
  - [ ] 8.3 Verify keyboard navigation through all interactive elements (Tab, Enter, Escape)
  - [ ] 8.4 Run axe-core audit on session page, replay page, and marketing page

## Dev Notes

- **Architecture Layer**: Presentation (Layer 1) — accessibility attributes and ARIA semantics
- Several accessibility features are already partially implemented:
  - `VisualizationCanvas` has `role="img"` and `aria-label` (static) at lines 257-258
  - `ModeSwitcher` has full ARIA tablist semantics at lines 62-76 and an `aria-live` announcement span at line 59
  - `AIChatPanel` has `role="log"` and `aria-live` at lines 127-128
  - `globals.css` has `prefers-reduced-motion` media query at lines 71-80
- The main gaps are: dynamic canvas aria-label, snapshot CTA announcements, skip-to-content link, and Canvas JS-level reduced motion check.
- The Canvas component (`visualization-canvas.tsx`) is a special case because it bypasses React rendering for 60fps performance. Any dynamic aria content must use a sibling element or ref-based updates, not re-renders.
- The drill controller's `getPhaseAnnouncement` function (line 45) generates appropriate screen reader text — need to verify it is connected to an `aria-live` region in the JSX.

### Project Structure Notes

- `src/components/viz/visualization-canvas.tsx` — Canvas element (lines 254-266), enhance aria-label
- `src/features/modes/mode-switcher.tsx` — tablist semantics (lines 56-106), verify
- `src/components/snapshot-cta.tsx` — add aria-live region
- `src/components/drill-controller.tsx` — verify phase announcements (line 45+)
- `src/components/ai-chat-panel.tsx` — verify role="log" (lines 127-128)
- `src/components/skip-to-content.tsx` — new component (create)
- `src/app/layout.tsx` — add skip-to-content link (before AuthProvider, line 39)
- `src/app/(marketing)/layout.tsx` — add `id="main-content"` to main
- `src/features/modes/silent-coach.tsx` — add `id="main-content"` to container
- `src/features/modes/dashboard-chat.tsx` — add `id="main-content"` to container
- `src/features/modes/replay-studio.tsx` — add `id="main-content"` to container
- `src/components/viz/piano-roll-renderer.ts` — may need reduced-motion parameter

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility]
- [Source: _bmad-output/planning-artifacts/architecture.md#Non-Functional Requirements (NFR19, NFR22, NFR23)]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-Accessibility]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
