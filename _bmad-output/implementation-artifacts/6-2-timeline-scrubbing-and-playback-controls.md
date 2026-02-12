# Story 6.2: Timeline Scrubbing and Playback Controls

Status: ready-for-dev

## Story

As a musician,
I want to scrub through a recorded session timeline,
so that I can jump to specific moments and review them.

## Acceptance Criteria

1. Given a session is loaded in Replay Studio, When the TimelineScrubber component (P2) renders, Then a full-width horizontal timeline bar is displayed at the bottom of the viewport showing the complete session duration. And the timeline displays start time (0:00) on the left and total session duration on the right. And a playback position indicator (scrub head) shows the current replay position. And the timeline bar uses 0px border radius, `--bg-secondary` background, and `--accent-primary` for the filled/played portion.

2. Given the TimelineScrubber is displayed, When the user clicks or drags on the timeline, Then the scrub head moves to the clicked/dragged position. And `sessionStore.replayPosition` updates to the corresponding timestamp in real time. And the VisualizationCanvas updates to show the musical state (active notes, chords, harmonic analysis) at that exact moment. And scrubbing is smooth with no perceptible lag (<16ms per frame update). And the scrub interaction uses `pointer` events for unified mouse/touch handling.

3. Given the user has scrubbed to a position, When they press the play button (or spacebar), Then replay playback begins from the current position at the selected speed. And `sessionStore.replayState` transitions from `'paused'` to `'playing'`. And the scrub head advances in real time, synchronized with the VisualizationCanvas. And MIDI events play back in chronological order from the current position. And when playback reaches the end of the session, it pauses automatically.

4. Given playback is active, When the user presses pause (or spacebar), Then playback stops at the current position. And `sessionStore.replayState` transitions from `'playing'` to `'paused'`. And the Canvas freezes at the current moment. And pressing play again resumes from the paused position.

5. Given playback controls are displayed, When the user selects a playback speed, Then available speeds are: 0.5x, 1x, 1.5x, 2x. And `sessionStore.replaySpeed` updates to the selected multiplier. And the playback engine adjusts event timing proportionally (e.g., at 0.5x, a 1-second gap becomes 2 seconds). And the current speed is displayed next to the play/pause button. And speed changes take effect immediately during active playback.

6. Given a session has analysis snapshots and key moments, When the timeline renders, Then event markers are displayed at their corresponding positions on the timeline. And markers are visually distinct: snapshot markers (diamond icon, `--accent-primary`), drill markers (circle icon, `--accent-success`), and insight markers (star icon, `--accent-warning`). And hovering a marker shows a tooltip with the event summary. And clicking a marker jumps the playback position to that moment.

7. Given the TimelineScrubber has accessibility requirements, When a keyboard user interacts with the timeline, Then the timeline is a `role="slider"` with `aria-valuemin="0"`, `aria-valuemax` set to session duration, and `aria-valuenow` set to current position. And left/right arrow keys move position by 1 second. And Page Up/Page Down keys move position by 10 seconds. And Home/End keys jump to start/end. And event markers are announced by screen readers when scrubbed past. And playback speed changes are announced on change.

## Tasks / Subtasks

- [ ] 1. Create the TimelineScrubber component (AC: 1, 6)
  - [ ] 1.1 Create `src/components/timeline-scrubber.tsx` as a `'use client'` component
  - [ ] 1.2 Implement the timeline bar layout: full-width container, filled track portion (0 to current position), unfilled track portion (current position to end), scrub head indicator
  - [ ] 1.3 Style with 0px border radius, `--bg-tertiary` for unfilled track, `--accent-primary` for filled track, `--accent-primary` scrub head (8px wide, full bar height)
  - [ ] 1.4 Display timestamps: "0:00" left-aligned, formatted duration right-aligned, current position near the scrub head
  - [ ] 1.5 Render event markers at their proportional positions on the timeline using distinct icons/colors per marker type
  - [ ] 1.6 Implement marker tooltips using shadcn/ui Tooltip component (200ms delay, `--bg-quaternary` background, 0px radius)

- [ ] 2. Implement drag-to-scrub interaction (AC: 2)
  - [ ] 2.1 Add `onPointerDown`, `onPointerMove`, `onPointerUp` handlers to the timeline bar for unified mouse/touch scrubbing
  - [ ] 2.2 On pointer down: capture pointer, calculate timestamp from click position relative to timeline width, update `sessionStore.replayPosition`
  - [ ] 2.3 On pointer move (while captured): continuously update `sessionStore.replayPosition` as the user drags, throttled to 60fps using `requestAnimationFrame`
  - [ ] 2.4 On pointer up: release capture, finalize position
  - [ ] 2.5 Implement pixel-to-timestamp conversion: `(pointerX / timelineWidth) * sessionDuration`
  - [ ] 2.6 Prevent default text selection during drag

- [ ] 3. Implement playback engine (AC: 3, 4, 5)
  - [ ] 3.1 Create `src/features/session/replay-engine.ts` -- pure playback logic (Layer 3)
  - [ ] 3.2 Implement `startPlayback(startPosition: number, speed: number, events: MidiEvent[]): void` -- starts a `requestAnimationFrame` loop that advances `sessionStore.replayPosition` based on elapsed real time multiplied by speed
  - [ ] 3.3 Implement `pausePlayback(): void` -- cancels the animation frame loop, stores current position
  - [ ] 3.4 Implement `setPlaybackSpeed(speed: number): void` -- updates speed multiplier, takes effect immediately if playing
  - [ ] 3.5 Implement automatic pause when `replayPosition >= sessionDuration`
  - [ ] 3.6 Use `performance.now()` for high-resolution timing to ensure accurate tempo-proportional playback
  - [ ] 3.7 The playback loop updates `sessionStore.replayPosition` via `setState` each frame -- the Canvas picks this up via its vanilla subscribe

- [ ] 4. Implement playback control UI (AC: 3, 4, 5)
  - [ ] 4.1 Add play/pause toggle button to the TimelineScrubber (left side, before timeline bar)
  - [ ] 4.2 Add speed selector dropdown next to play/pause: options 0.5x, 1x, 1.5x, 2x (using shadcn/ui Select or a custom toggle group)
  - [ ] 4.3 Style controls with `--bg-secondary` background, `--text-primary` icons, `--accent-primary` active states
  - [ ] 4.4 Implement spacebar keyboard shortcut for play/pause toggle (global when Replay Studio is active)

- [ ] 5. Implement keyboard accessibility (AC: 7)
  - [ ] 5.1 Set `role="slider"`, `aria-valuemin="0"`, `aria-valuemax={sessionDuration}`, `aria-valuenow={currentPosition}`, `aria-label="Session timeline"` on the timeline element
  - [ ] 5.2 Implement `onKeyDown` handler: ArrowLeft/ArrowRight for +/-1 second, PageUp/PageDown for +/-10 seconds, Home/End for start/end
  - [ ] 5.3 Announce marker events when scrub position passes them (use `aria-live="polite"` region)
  - [ ] 5.4 Announce speed changes via `aria-live="polite"` (e.g., "Playback speed: 1.5x")
  - [ ] 5.5 Ensure the scrub head is focusable and visible focus indicator is 2px `--accent-primary` outline

- [ ] 6. Integrate TimelineScrubber into Replay Studio layout (AC: 1)
  - [ ] 6.1 Import and render TimelineScrubber in `src/features/modes/replay-studio.tsx` bottom panel area
  - [ ] 6.2 Pass session duration, events, snapshots, and marker data as props
  - [ ] 6.3 Connect to `sessionStore` for `replayPosition`, `replayState`, `replaySpeed`

- [ ] 7. Write co-located tests (AC: 2, 3, 5, 7)
  - [ ] 7.1 Create `src/components/timeline-scrubber.test.tsx` -- test render with markers, click-to-scrub position calculation, keyboard navigation, ARIA attributes
  - [ ] 7.2 Create `src/features/session/replay-engine.test.ts` -- test playback start/pause/resume, speed adjustment, end-of-session auto-pause, timing accuracy
  - [ ] 7.3 Test pixel-to-timestamp conversion for various timeline widths and session durations
  - [ ] 7.4 Test marker tooltip rendering and marker click navigation

## Dev Notes

- **Performance-Critical Scrubbing**: The scrub interaction is the most performance-sensitive part of Replay Studio. When the user drags the scrub head, `sessionStore.replayPosition` updates every frame, and the Canvas must re-render the musical state at each new timestamp. The `getEventsAtTimestamp` function (from Story 6.1) must be O(log n) using binary search on the pre-sorted event array -- linear scanning would cause visible lag on sessions with thousands of events.
- **requestAnimationFrame Playback**: The replay engine uses `requestAnimationFrame` (not `setInterval`) for frame-accurate playback. Each frame calculates elapsed time via `performance.now()`, multiplies by the speed factor, and advances the replay position. This ensures smooth playback regardless of frame rate fluctuations.
- **Pointer Events Over Mouse Events**: Use `pointer` events (`onPointerDown`, `onPointerMove`, `onPointerUp`) with `setPointerCapture` for drag behavior. This handles both mouse and touch input with a single code path and ensures drag continues even if the pointer leaves the timeline element during fast scrubbing.
- **Event Marker Data**: Markers come from the session's analysis snapshots (stored in Dexie/Supabase). Each snapshot has a timestamp, type, and summary. The marker rendering is proportional: `(marker.timestamp / sessionDuration) * timelineWidth` pixels from the left edge.
- **Speed-Adjusted Playback**: At speed N, the replay position advances by `deltaTime * N` per frame. MIDI events are triggered when the replay position crosses their timestamp. At 2x speed, some events may cluster together -- the rendering must handle multiple events per frame gracefully.
- **Keyboard Shortcut Scope**: The spacebar play/pause shortcut must only be active when Replay Studio is the current mode. Use a `useEffect` that adds/removes the global keydown listener based on mode state. Ensure it does not conflict with text input in the chat panel (check `event.target` is not an input/textarea).
- **Memory Note**: The TimelineScrubber itself is lightweight -- it renders a single timeline bar with markers. The heavy data (MIDI events) is held in `sessionStore` once (from Story 6.1) and not duplicated by this component.
- **Library Versions**: Zustand 5.x, shadcn/ui (Tooltip, Select), React 19. No external timeline or media player libraries -- built from scratch for precise control over the interaction model.
- **Accessibility**: The ARIA slider pattern is critical. Screen reader users navigate the timeline via arrow keys, with position announced as time (e.g., "2 minutes 34 seconds"). Event markers are announced as the position crosses them (e.g., "Snapshot: timing accuracy 85%").

### Project Structure Notes

- `src/components/timeline-scrubber.tsx` -- TimelineScrubber component (new, P2 priority)
- `src/components/timeline-scrubber.test.tsx` -- co-located tests (new)
- `src/features/session/replay-engine.ts` -- playback engine, pure domain logic (new)
- `src/features/session/replay-engine.test.ts` -- co-located tests (new)
- `src/features/modes/replay-studio.tsx` -- updated to integrate TimelineScrubber
- `src/stores/session-store.ts` -- `replayPosition`, `replayState`, `replaySpeed` (added in Story 6.1, used here)
- `src/lib/constants.ts` -- `REPLAY_SPEEDS = [0.5, 1, 1.5, 2]`, `SCRUB_STEP_SMALL_MS = 1000`, `SCRUB_STEP_LARGE_MS = 10000`

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#TimelineScrubber] -- component anatomy, states (Paused, Playing, Scrubbing, Zoomed), ARIA slider pattern, marker types
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Keyboard Accessibility] -- Arrow key scrubbing, spacebar play/pause, focus indicators
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Navigation Patterns] -- keyboard shortcut scope, tab navigation within Replay Studio
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] -- Zustand vanilla subscribe for Canvas, requestAnimationFrame pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] -- performance.now() for MIDI timestamps, immutable state updates
- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.2] -- acceptance criteria and FR31 coverage
- [Source: _bmad-output/planning-artifacts/prd.md#Interaction Modes] -- FR31: timeline scrubbing in Replay Studio

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
