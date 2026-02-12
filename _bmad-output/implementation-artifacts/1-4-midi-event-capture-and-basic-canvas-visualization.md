# Story 1.4: MIDI Event Capture and Basic Canvas Visualization

Status: ready-for-dev

## Story

As a musician,
I want to see visual feedback on screen when I play notes on my MIDI device,
So that I know Minstrel is listening and responding to my playing.

## Acceptance Criteria

1. **Given** a MIDI device is connected (from Story 1.3), **When** the user plays a note on their instrument, **Then** the MIDI event is captured with note number, velocity, and high-resolution timestamp (via `performance.now()`) and dispatched to `midiStore` within 50ms of the physical key press (NFR1).

2. **Given** MIDI events are flowing into `midiStore`, **When** the VisualizationCanvas component is mounted, **Then** it renders a Canvas element that displays notes visually at a consistent 60fps (NFR2) using `requestAnimationFrame`.

3. **Given** the Architecture mandates Canvas/Zustand integration via vanilla subscribe (AR13), **When** the VisualizationCanvas subscribes to `midiStore`, **Then** it uses `useMidiStore.subscribe()` (Zustand vanilla API) to receive state updates directly, NOT through React re-renders or `useEffect`. The Canvas rendering loop is decoupled from React's reconciliation cycle.

4. **Given** the user plays a note, **When** a `note-on` MIDI message is received, **Then** the note is visualized on the Canvas (e.g., as a highlighted key on a piano roll, a colored bar, or a light-up element). **When** a `note-off` MIDI message is received, **Then** the visual element fades or transitions to indicate the note has been released.

5. **Given** MIDI events include velocity data (0-127), **When** notes are rendered on the Canvas, **Then** velocity is reflected visually: louder notes (higher velocity) appear brighter and/or larger; softer notes (lower velocity) appear dimmer and/or smaller.

6. **Given** a practice session runs for 30 minutes, **When** MIDI events are continuously captured and rendered, **Then** client memory usage stays under 200MB (NFR8). Old events are pruned from the in-memory buffer after rendering (they will be persisted to IndexedDB in Story 2.8).

7. **Given** the MIDI parser processes raw MIDI messages, **When** tested with known MIDI byte sequences, **Then** co-located unit tests validate correct parsing of note-on (status byte `0x90`), note-off (status byte `0x80`), and velocity extraction.

## Tasks / Subtasks

- [ ] Task 1: Implement MIDI event parser (AC: 1, 7)
  - [ ] Create `src/features/midi/midi-parser.ts` with:
    - `parseMidiMessage(data: Uint8Array, timestamp: number): MidiEvent | null`
    - Parse status byte to determine message type (note-on, note-off, control change, etc.)
    - Extract note number (0-127), velocity (0-127), and channel (0-15)
    - Map note number to note name and octave (e.g., 60 = "C4")
    - Attach `performance.now()` timestamp for high-resolution timing
    - Handle running status (consecutive messages with same status byte)
    - Handle note-on with velocity 0 as note-off (common MIDI convention)
  - [ ] Define `MidiEvent` type in `src/features/midi/midi-types.ts`:
    ```typescript
    interface MidiEvent {
      type: 'note-on' | 'note-off' | 'control-change';
      note: number;        // 0-127 MIDI note number
      noteName: string;    // e.g., "C4", "G#3"
      velocity: number;    // 0-127
      channel: number;     // 0-15
      timestamp: number;   // performance.now() DOMHighResTimeStamp
    }
    ```

- [ ] Task 2: Wire MIDI input to midiStore (AC: 1, 3)
  - [ ] Update `src/features/midi/midi-engine.ts`:
    - Add `onmidimessage` handler to the active MIDI input port
    - Call `parseMidiMessage()` on incoming data
    - Dispatch parsed events to `midiStore` via `useMidiStore.setState()`
  - [ ] Update `src/stores/midi-store.ts`:
    - Add `currentEvents: MidiEvent[]` (ring buffer of recent events for visualization)
    - Add `latestEvent: MidiEvent | null` (most recent event for quick access)
    - Add `activeNotes: Map<number, MidiEvent>` or `activeNotes: Record<number, MidiEvent>` (currently held notes)
    - Add actions: `addEvent(event)`, `removeNote(noteNumber)`, `clearEvents()`
  - [ ] Implement ring buffer logic: keep only last N events (e.g., 500) in memory to prevent unbounded growth (AC: 6)
  - [ ] Update `use-midi.ts` hook to expose event subscription

- [ ] Task 3: Create VisualizationCanvas component (AC: 2, 3, 4, 5)
  - [ ] Create `src/components/viz/visualization-canvas.tsx` (P0 priority):
    - `'use client'` directive
    - Renders a `<canvas>` element that fills its container
    - Uses `useRef` for Canvas element reference
    - On mount, obtains 2D rendering context
    - Starts `requestAnimationFrame` render loop
    - Subscribes to `useMidiStore.subscribe()` (vanilla API) for state changes
    - Cleans up subscription and animation frame on unmount
  - [ ] Implement responsive canvas sizing: listen for container resize, update canvas dimensions
  - [ ] Add `role="img"` and `aria-label` for accessibility (NFR21: text alternative for visual content)

- [ ] Task 4: Implement piano roll renderer (AC: 4, 5)
  - [ ] Create `src/components/viz/piano-roll-renderer.ts`:
    - Pure rendering logic (no React, no DOM -- receives Canvas context and data)
    - `renderNotes(ctx: CanvasRenderingContext2D, activeNotes: MidiEvent[], canvasWidth: number, canvasHeight: number): void`
    - Map MIDI note numbers to vertical positions (pitch axis)
    - Render active notes as rectangles or bars on the canvas
    - Apply velocity-based visual scaling:
      - Brightness/opacity: `velocity / 127` mapped to alpha or lightness
      - Size: base width + (velocity / 127) * bonus width
    - Use `#7CB9E8` (primary accent) as the note color, with velocity modulating brightness
    - Render note-off as a fade-out animation (reduce opacity over ~200ms)
  - [ ] Create `src/components/viz/canvas-utils.ts`:
    - `clearCanvas(ctx, width, height)`: Clear with background color `#0F0F0F`
    - `noteNumberToY(noteNumber, canvasHeight)`: Map MIDI note to canvas Y position
    - `velocityToAlpha(velocity)`: Map velocity 0-127 to opacity 0.3-1.0
    - `velocityToSize(velocity)`: Map velocity to visual size multiplier

- [ ] Task 5: Integrate Canvas subscription with Zustand vanilla API (AC: 3)
  - [ ] In `visualization-canvas.tsx`, implement the critical pattern:
    ```typescript
    useEffect(() => {
      const unsubscribe = useMidiStore.subscribe(
        (state) => state.activeNotes,
        (activeNotes) => {
          // Direct Canvas render call -- NOT a React state update
          renderFrame(activeNotes);
        }
      );
      return () => unsubscribe();
    }, []);
    ```
  - [ ] Ensure the `requestAnimationFrame` loop reads from the latest subscribed state (not React state)
  - [ ] Verify that React does NOT re-render the VisualizationCanvas component on every MIDI event
  - [ ] Store active notes in a mutable ref (`useRef`) updated by the subscription, read by the render loop

- [ ] Task 6: Implement memory management for event buffer (AC: 6)
  - [ ] In `midiStore`, implement a ring buffer with configurable max size (default: 500 events)
  - [ ] When new events arrive and buffer is full, drop oldest events
  - [ ] Active notes (currently held down) are tracked separately from the event buffer and never pruned while held
  - [ ] Add a comment noting that persistent storage (Dexie.js) will be added in Story 2.8

- [ ] Task 7: Write co-located tests (AC: 7)
  - [ ] Create `src/features/midi/midi-parser.test.ts`:
    - Test parsing note-on message: `[0x90, 60, 100]` => `{ type: 'note-on', note: 60, noteName: 'C4', velocity: 100, channel: 0 }`
    - Test parsing note-off message: `[0x80, 60, 0]` => `{ type: 'note-off', note: 60, ... }`
    - Test note-on with velocity 0 treated as note-off
    - Test parsing different channels: `[0x91, 60, 100]` => channel 1
    - Test note name mapping for edge cases: note 0 = "C-1", note 127 = "G9"
    - Test invalid/malformed MIDI data returns null
  - [ ] Create `src/components/viz/visualization-canvas.test.tsx`:
    - Test component mounts and renders a canvas element
    - Test canvas has correct accessibility attributes (`role`, `aria-label`)
    - Test cleanup on unmount (subscription removed, animation frame cancelled)
  - [ ] Create `src/components/viz/piano-roll-renderer.test.ts`:
    - Test velocity-to-alpha mapping returns values in expected range
    - Test note-number-to-Y mapping covers full MIDI range

## Dev Notes

- **Critical Architecture Pattern (AR13)**: The Canvas MUST subscribe to Zustand via `useMidiStore.subscribe()` (vanilla API), NOT through React hooks like `useMidiStore((s) => s.events)`. This is the most important architectural decision for performance. React re-renders on every MIDI event would destroy 60fps rendering. The vanilla subscription feeds data directly to the Canvas 2D context.
- **Data Flow**:
  ```
  MIDI Device -> Web MIDI API -> midi-engine.ts (onmidimessage) -> midi-parser.ts -> midiStore.setState() -> Canvas subscribe() -> renderToCanvas()
  ```
- **performance.now()**: Use `performance.now()` for all MIDI event timestamps, NOT `Date.now()`. `performance.now()` provides sub-millisecond precision (DOMHighResTimeStamp) which is critical for timing analysis in later stories.
- **MIDI Message Format**: MIDI messages are `Uint8Array` with 1-3 bytes. Status byte (first byte) has the message type in the high nibble and channel in the low nibble. Note messages have 3 bytes: `[status, note, velocity]`.
- **Velocity 0 Convention**: Many MIDI devices send note-on with velocity 0 instead of note-off. The parser MUST handle this as a note-off.
- **Memory Budget (NFR8)**: 200MB for 30 minutes. At typical playing speed (4 notes/sec), that is ~7,200 events. Each `MidiEvent` object is ~100-200 bytes in memory. 7,200 events = ~1.4MB. The ring buffer of 500 events in memory is well within budget. The concern is Canvas objects and rendering state, not event data.
- **Canvas Sizing**: Use `ResizeObserver` on the canvas container to handle window resizes. Set `canvas.width` and `canvas.height` to match container pixel dimensions (accounting for device pixel ratio for sharp rendering).
- **Device Pixel Ratio**: For crisp rendering on Retina displays, scale the canvas by `window.devicePixelRatio` and use CSS to constrain the visual size.
- **No React State for MIDI Events**: NEVER store MIDI events in React component state. NEVER use `useState` or `useReducer` for real-time MIDI data. All real-time data goes through Zustand and is consumed by the Canvas via vanilla subscription.
- **`'use client'`**: The VisualizationCanvas component must have `'use client'` directive because it uses `useRef`, `useEffect`, browser Canvas API, and Zustand hooks.

### Project Structure Notes

- MIDI parser: `src/features/midi/midi-parser.ts`
- MIDI parser tests: `src/features/midi/midi-parser.test.ts`
- MIDI types (updated): `src/features/midi/midi-types.ts`
- MIDI engine (updated): `src/features/midi/midi-engine.ts`
- MIDI store (updated): `src/stores/midi-store.ts`
- VisualizationCanvas: `src/components/viz/visualization-canvas.tsx`
- VisualizationCanvas test: `src/components/viz/visualization-canvas.test.tsx`
- Piano roll renderer: `src/components/viz/piano-roll-renderer.ts`
- Piano roll renderer test: `src/components/viz/piano-roll-renderer.test.ts`
- Canvas utilities: `src/components/viz/canvas-utils.ts`

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] (Canvas/Zustand Integration pattern with code example)
- [Source: _bmad-output/planning-artifacts/architecture.md#Communication Patterns] (Zustand vanilla subscribe, selector patterns)
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Flow Architecture] (MIDI Device -> midiStore -> Canvas flow)
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure] (viz/ component paths)
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Critical Success Moments] (First Note Response: <50ms latency, clear visual response)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Core User Experience] (Real-time visualization: flawless, instant, visually compelling)
- [Source: _bmad-output/planning-artifacts/prd.md#FR4] (Capture all MIDI events)
- NFR1: <50ms MIDI processing latency
- NFR2: 60fps visualization
- NFR8: <200MB memory during 30-minute session
- AR13: Canvas subscribes to Zustand directly via vanilla subscribe

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
