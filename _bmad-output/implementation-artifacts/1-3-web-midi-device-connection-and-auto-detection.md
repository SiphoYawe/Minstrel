# Story 1.3: Web MIDI Device Connection and Auto-Detection

Status: done

## Story

As a musician,
I want my MIDI device to be automatically detected when I plug it in,
So that I can start playing immediately without configuration.

## Acceptance Criteria

1. **Given** a user opens Minstrel in Chrome/Edge with a MIDI device connected, **When** the Web MIDI API is available and permission is granted, **Then** the system auto-detects the connected MIDI device within 2 seconds and populates `midiStore` with device info (name, manufacturer, connection state).

2. **Given** a MIDI device is detected, **When** the connection is established, **Then** the device name, active MIDI channel, and connection status are displayed in a StatusBar component (P0 priority) at the top or bottom of the viewport.

3. **Given** a MIDI device is connected, **When** the StatusBar renders, **Then** a green status indicator dot shows with the label "Connected" next to the device name.

4. **Given** a MIDI device is connected, **When** the user unplugs the device, **Then** the StatusBar updates to show "Disconnected" with a neutral/amber indicator within 1 second, and `midiStore` connection state is updated.

5. **Given** a MIDI device was previously connected and then disconnected, **When** the device is reconnected (plugged back in), **Then** auto-reconnect occurs within 5 seconds (NFR28) without requiring a page refresh, and the StatusBar returns to "Connected" state.

6. **Given** a user opens Minstrel in a browser without Web MIDI API support (Firefox, Safari), **When** the page loads, **Then** a clear, non-technical message is displayed: "Minstrel works best in Chrome or Edge for full MIDI support" with a visual indicator and no JavaScript errors.

7. **Given** the MIDI engine is initialized, **When** multiple MIDI devices are connected simultaneously, **Then** all detected devices are listed and the first input device is selected as active by default, with the option to switch (future story scope -- for now, first device auto-selected).

## Tasks / Subtasks

- [ ] Task 1: Implement MIDI engine core (AC: 1, 5, 7)
  - [ ] Create `src/features/midi/midi-engine.ts` with:
    - `requestMidiAccess()`: Wraps `navigator.requestMIDIAccess()` with permission handling
    - `detectDevices()`: Enumerates connected MIDI input and output ports
    - `listenForStateChanges()`: Subscribes to `onstatechange` for hot-plug detection
    - `connectToDevice(inputPort)`: Sets the active input device
    - `disconnectDevice()`: Cleans up active connections
  - [ ] Handle the Web MIDI API permission prompt flow
  - [ ] Implement auto-reconnect logic: on `onstatechange` with state `'connected'`, re-bind to the device within 5 seconds (NFR28)
  - [ ] Handle multiple input devices: list all, select first by default

- [ ] Task 2: Define MIDI types (AC: 1, 2)
  - [ ] Create `src/features/midi/midi-types.ts` with:
    - `MidiDeviceInfo`: `{ id: string; name: string; manufacturer: string; state: 'connected' | 'disconnected'; type: 'input' | 'output' }`
    - `MidiConnectionStatus`: `'disconnected' | 'connecting' | 'connected' | 'error' | 'unsupported'`
    - `MidiStoreState`: Full typed interface for `midiStore`
  - [ ] Export types from `src/features/midi/index.ts` barrel

- [ ] Task 3: Populate midiStore with device state (AC: 1, 4, 5)
  - [ ] Update `src/stores/midi-store.ts` with full state shape:
    - `connectionStatus: MidiConnectionStatus`
    - `activeDevice: MidiDeviceInfo | null`
    - `availableDevices: MidiDeviceInfo[]`
    - `midiAccess: MIDIAccess | null` (not serializable, stored as ref)
  - [ ] Add actions: `setConnectionStatus()`, `setActiveDevice()`, `setAvailableDevices()`, `reset()`
  - [ ] Wire `midi-engine.ts` callbacks to update the store
  - [ ] Ensure store updates trigger on connect, disconnect, and reconnect events

- [ ] Task 4: Create `use-midi` React hook (AC: 1, 2, 6)
  - [ ] Create `src/features/midi/use-midi.ts`:
    - Custom hook that initializes the MIDI engine on mount
    - Checks for Web MIDI API availability (`navigator.requestMIDIAccess`)
    - Sets `connectionStatus: 'unsupported'` if API unavailable
    - Returns `{ connectionStatus, activeDevice, availableDevices, initMidi, isSupported }`
  - [ ] Use selective Zustand selectors (never select entire store)
  - [ ] Add cleanup on unmount (remove event listeners)

- [ ] Task 5: Build StatusBar component (AC: 2, 3, 4)
  - [ ] Create `src/components/status-bar.tsx` (P0 priority component):
    - Renders MIDI connection status with colored indicator dot (green = connected, amber = disconnected, grey = unsupported)
    - Shows device name when connected
    - Shows MIDI channel info if available
    - Shows session timer placeholder (for future stories)
    - Positioned as a fixed bar (top or bottom of viewport, minimal height)
  - [ ] Style with dark studio aesthetic: `#1A1A1A` background, `#3A3A3A` border, 0px radius
  - [ ] Use `useMidiStore` with selective selectors for reactive updates
  - [ ] Add `aria-live="polite"` for screen reader accessibility on status changes

- [ ] Task 6: Handle unsupported browsers (AC: 6)
  - [ ] Create `src/features/midi/midi-utils.ts` with `isMidiSupported()` check
  - [ ] Create a browser compatibility banner component that displays when `!isMidiSupported()`
  - [ ] Message: "Minstrel works best in Chrome or Edge for full MIDI support. Your current browser does not support the Web MIDI API."
  - [ ] Banner uses amber styling (not red), growth mindset framing
  - [ ] Banner does not block the rest of the UI (dismissible or non-modal)

- [ ] Task 7: Write co-located tests (AC: 1, 4, 5)
  - [ ] Create `src/features/midi/midi-engine.test.ts`:
    - Test `requestMidiAccess` succeeds and populates devices
    - Test `requestMidiAccess` handles permission denied gracefully
    - Test device disconnect triggers state update
    - Test auto-reconnect fires within 5s of device re-detection
    - Mock `navigator.requestMIDIAccess` for all tests
  - [ ] Create `src/stores/midi-store.test.ts`:
    - Test initial state is correct
    - Test `setConnectionStatus` updates state
    - Test `setActiveDevice` updates state
    - Test `reset` clears all device state
  - [ ] Create `src/components/status-bar.test.tsx`:
    - Test renders "Connected" with green dot when device connected
    - Test renders "Disconnected" with amber dot when device disconnected
    - Test renders unsupported browser message

- [ ] Task 8: Create barrel export (AC: 1)
  - [ ] Create `src/features/midi/index.ts` exporting: `MidiEngine` (or functions), `useMidi`, types, and `isMidiSupported`

## Dev Notes

- **Web MIDI API**: Only available in Chromium-based browsers (Chrome, Edge, Opera). Firefox and Safari do not support it. The `navigator.requestMIDIAccess()` call requires a user gesture or permission grant on first use.
- **`onstatechange` Event**: The `MIDIAccess` object fires `onstatechange` when devices are plugged/unplugged. Use this for hot-plug auto-detection. The `MIDIPort.state` property is `'connected'` or `'disconnected'`.
- **Zustand Store Pattern**: `midiStore` is the highest-frequency store. In this story, it only stores connection state. In Story 1.4, it will also store live MIDI events. The Canvas will subscribe to this store via vanilla `subscribe` (not React hooks) per AR13.
- **StatusBar is P0**: Per UX component priority tiers, StatusBar is a Phase 1 / P0 component. It must be implemented in this story as the primary visual feedback for connection state.
- **`MIDIAccess` Object**: This is a browser API object and is not serializable. Store it as a module-level variable in `midi-engine.ts` or via a ref, NOT directly in Zustand state. Only serializable data (device info, status strings) goes into the store.
- **Layer Compliance**: `midi-engine.ts` is Layer 3 (Domain Logic) -- it contains no React or UI code. `use-midi.ts` is Layer 2 (Application Logic) -- it bridges the engine to React. `status-bar.tsx` is Layer 1 (Presentation).
- **`'use client'` Directive**: The StatusBar component and `use-midi.ts` hook require `'use client'` because they use browser APIs and React hooks.
- **Growth Mindset**: All user-facing messages use helpful, never blaming language. "Your browser does not support..." not "Your browser is incompatible."
- **Error Handling**: If MIDI permission is denied, catch the `DOMException` and set `connectionStatus: 'error'` with a user-friendly message. Report to Sentry for tracking.
- **Testing**: Mock `navigator.requestMIDIAccess` in tests. Create a minimal mock that returns a `MIDIAccess`-like object with configurable inputs/outputs. The `e2e/fixtures/mock-midi-device.ts` placeholder from Story 1.1 can be expanded here for unit test mocks.

### Project Structure Notes

- MIDI engine: `src/features/midi/midi-engine.ts`
- MIDI types: `src/features/midi/midi-types.ts`
- MIDI hook: `src/features/midi/use-midi.ts`
- MIDI utils: `src/features/midi/midi-utils.ts`
- MIDI barrel: `src/features/midi/index.ts`
- MIDI store: `src/stores/midi-store.ts`
- StatusBar: `src/components/status-bar.tsx`
- Tests (co-located): `src/features/midi/midi-engine.test.ts`, `src/stores/midi-store.test.ts`, `src/components/status-bar.test.tsx`

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] (Zustand store architecture)
- [Source: _bmad-output/planning-artifacts/architecture.md#External Integrations] (Web MIDI API integration point)
- [Source: _bmad-output/planning-artifacts/architecture.md#Communication Patterns] (Zustand selector patterns)
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] (kebab-case files, PascalCase components)
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Effortless Interactions] (MIDI auto-detect: plug in USB cable)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Critical Success Moments] (First Note Response)
- [Source: _bmad-output/planning-artifacts/prd.md#FR1, FR2]
- NFR28: MIDI device auto-reconnect within 5 seconds

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
