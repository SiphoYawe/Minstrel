# Story 1.6: Audio-Only Fallback Mode

Status: ready-for-dev

## Story

As a musician without a MIDI device,
I want to use my laptop microphone as an input source,
So that I can still get basic feedback from Minstrel.

## Acceptance Criteria

1. **Given** MIDI connection has failed or the user opts for audio input from the troubleshooting panel, **When** the user selects the audio fallback option, **Then** the system requests microphone permission via the Web Audio API (`navigator.mediaDevices.getUserMedia({ audio: true })`), and upon approval, initializes an audio capture pipeline.

2. **Given** the audio capture pipeline is active, **When** the user plays their instrument or sings into the microphone, **Then** basic pitch detection captures approximate note information (fundamental frequency mapped to the nearest MIDI note number) and dispatches events to `midiStore` with a source flag indicating `'audio'` rather than `'midi'`.

3. **Given** audio input is active, **When** the user plays at varying volumes, **Then** dynamics and volume levels are detected from the audio signal amplitude (RMS or peak level) and reflected in the VisualizationCanvas (brighter/larger for louder, dimmer/smaller for quieter), matching the velocity-based rendering from Story 1.4.

4. **Given** audio mode is active, **When** the UI renders, **Then** a persistent, non-dismissible banner is displayed: "Audio Mode -- connect a MIDI device for full precision." The banner uses amber accent styling (not red) and is positioned below the StatusBar or at the top of the visualization area.

5. **Given** audio mode is active, **When** MIDI-specific features are checked, **Then** MIDI-only capabilities (exact velocity values, precise timing below ~20ms, MIDI output for demonstrations, multi-note chord detection) are disabled with clear visual indicators showing "Requires MIDI connection" alongside each disabled feature.

6. **Given** audio mode is active, **When** a MIDI device is subsequently connected, **Then** the system detects the MIDI device, automatically switches from audio mode to MIDI mode, dismisses the audio mode banner, and updates the StatusBar to "Connected" (MIDI preferred over audio).

7. **Given** a user's browser does not support both Web MIDI API and Web Audio API, **When** the page loads, **Then** a message indicates that the current browser cannot capture instrument input, with a recommendation to use Chrome or Edge.

## Tasks / Subtasks

- [ ] Task 1: Implement audio capture engine (AC: 1)
  - [ ] Create `src/features/midi/audio-engine.ts` with:
    - `requestAudioAccess()`: Wraps `navigator.mediaDevices.getUserMedia({ audio: true })` with permission handling
    - `initAudioPipeline(stream: MediaStream)`: Creates `AudioContext`, connects `MediaStreamSource` to `AnalyserNode`
    - `startListening()`: Begins periodic analysis of audio data via `requestAnimationFrame` or `setInterval` at ~60Hz
    - `stopListening()`: Disconnects audio nodes and stops the stream
    - `getFrequencyData()`: Returns current frequency data from `AnalyserNode.getFloatFrequencyData()`
    - `getTimeDomainData()`: Returns current waveform data from `AnalyserNode.getFloatTimeDomainData()`
  - [ ] Handle microphone permission denied gracefully (set `connectionStatus: 'error'`, display user-friendly message)
  - [ ] Handle `AudioContext` state management (resume if suspended due to browser autoplay policy)

- [ ] Task 2: Implement basic pitch detection (AC: 2)
  - [ ] Create `src/features/midi/pitch-detector.ts` with:
    - `detectPitch(frequencyData: Float32Array, sampleRate: number): PitchResult | null`
    - Implement autocorrelation-based pitch detection (simplest reliable approach for monophonic input)
    - `frequencyToMidiNote(frequency: number): { note: number; noteName: string; centsOff: number }`
    - Map detected frequency to nearest MIDI note number and name
    - Return `null` when no clear pitch is detected (silence, noise, multiple pitches)
  - [ ] Define `PitchResult` type: `{ frequency: number; midiNote: number; noteName: string; confidence: number; centsOff: number }`
  - [ ] Set a minimum confidence threshold to avoid false detections from background noise
  - [ ] Note: This is monophonic pitch detection only -- chord detection requires MIDI

- [ ] Task 3: Implement volume/dynamics detection (AC: 3)
  - [ ] In `audio-engine.ts` or a separate `src/features/midi/audio-analyzer.ts`:
    - `calculateRMS(timeDomainData: Float32Array): number` -- compute root-mean-square amplitude
    - `rmsToVelocity(rms: number): number` -- map RMS (0.0-1.0) to MIDI velocity range (0-127)
  - [ ] Apply a noise gate: below a threshold RMS, treat as silence (no note detected)
  - [ ] Smooth the volume readings to avoid jitter (exponential moving average)

- [ ] Task 4: Dispatch audio events to midiStore (AC: 2, 3)
  - [ ] Update `src/features/midi/midi-types.ts`:
    - Add `source: 'midi' | 'audio'` field to `MidiEvent` type
    - Add `AudioModeState` type: `{ isAudioMode: boolean; audioStream: MediaStream | null }`
  - [ ] Update `src/stores/midi-store.ts`:
    - Add `inputSource: 'midi' | 'audio' | 'none'` state field
    - Add `isAudioMode: boolean` derived/computed field
    - Add action `setInputSource(source)`
  - [ ] In `audio-engine.ts`, when pitch + volume are detected:
    - Create a `MidiEvent` with `source: 'audio'`, estimated note, estimated velocity, and `performance.now()` timestamp
    - Dispatch to `midiStore` using the same `addEvent()` action as MIDI input
  - [ ] The VisualizationCanvas from Story 1.4 renders audio events identically to MIDI events (no code changes needed in Canvas)

- [ ] Task 5: Build audio mode banner (AC: 4)
  - [ ] Create `src/components/audio-mode-banner.tsx`:
    - `'use client'` directive
    - Renders persistent banner text: "Audio Mode -- connect a MIDI device for full precision"
    - Uses amber accent color (`#F5A623` or design token) for the banner background/border
    - Not dismissible (stays visible as long as audio mode is active)
    - Positioned below StatusBar or above the visualization area
    - 0px border radius, dark studio aesthetic
    - Small/compact height to minimize visual real estate
  - [ ] Conditionally rendered when `midiStore.inputSource === 'audio'`
  - [ ] Add `role="status"` and `aria-live="polite"` for accessibility

- [ ] Task 6: Disable MIDI-specific features with indicators (AC: 5)
  - [ ] Create `src/features/midi/audio-mode-limits.ts`:
    - `getDisabledFeatures(): DisabledFeature[]` -- returns list of features unavailable in audio mode
    - `DisabledFeature` type: `{ featureId: string; label: string; reason: string }`
    - Features disabled in audio mode:
      - Exact velocity tracking: "Requires MIDI connection"
      - Sub-20ms timing precision: "Requires MIDI connection"
      - MIDI output demonstrations: "Requires MIDI connection"
      - Multi-note chord detection: "Requires MIDI connection"
  - [ ] Provide a `useAudioModeLimits()` hook or utility that components can query to conditionally render disabled state
  - [ ] Visual treatment for disabled features: dimmed text, lock icon, tooltip with reason

- [ ] Task 7: Implement auto-switch from audio to MIDI (AC: 6)
  - [ ] In `src/features/midi/use-midi.ts`:
    - Continue listening for MIDI device connections even in audio mode
    - When a MIDI device is detected while in audio mode:
      - Stop the audio pipeline (`audioEngine.stopListening()`)
      - Switch `midiStore.inputSource` to `'midi'`
      - Banner auto-dismisses (conditional render)
      - StatusBar updates to "Connected"
    - Log the transition for debugging

- [ ] Task 8: Add audio fallback option to troubleshooting flow (AC: 1)
  - [ ] Update `src/features/midi/troubleshooting.ts`:
    - Add a final step or prominent option: "No MIDI device? Try Audio Mode"
    - Action: triggers `requestAudioAccess()` and initializes the audio pipeline
  - [ ] Update TroubleshootingPanel to display the audio fallback option

- [ ] Task 9: Write co-located tests (AC: 1, 2, 3)
  - [ ] Create `src/features/midi/audio-engine.test.ts`:
    - Test `requestAudioAccess()` succeeds with mocked `getUserMedia`
    - Test `requestAudioAccess()` handles permission denied
    - Test `initAudioPipeline()` creates AudioContext and AnalyserNode
    - Test `stopListening()` cleans up resources
  - [ ] Create `src/features/midi/pitch-detector.test.ts`:
    - Test `frequencyToMidiNote(440)` returns `{ note: 69, noteName: 'A4' }`
    - Test `frequencyToMidiNote(261.63)` returns `{ note: 60, noteName: 'C4' }`
    - Test pitch detection returns null for silence/noise input
    - Test confidence threshold filters low-confidence detections
  - [ ] Create `src/components/audio-mode-banner.test.tsx`:
    - Test banner renders with correct text
    - Test banner is not dismissible
    - Test banner has correct accessibility attributes

## Dev Notes

- **Web Audio API**: Available in all modern browsers (Chrome, Firefox, Safari, Edge). Unlike Web MIDI API, this is broadly supported. The `AudioContext` may be in a suspended state until a user gesture (click/keypress) due to browser autoplay policies -- handle this by calling `audioContext.resume()` after a user interaction.
- **Pitch Detection Algorithm**: Use autocorrelation (YIN or simple autocorrelation). This works well for monophonic signals (single notes). It will NOT work for chords -- that is a stated limitation of audio mode. Libraries like `pitchy` or `ml5.js` could be considered, but a lightweight custom implementation is preferred to keep bundle size small.
- **Performance Considerations**: Pitch detection runs at ~60Hz (every ~16ms) during audio mode. The `AnalyserNode.fftSize` should be 2048 or 4096 for good frequency resolution at the cost of some latency. This is acceptable since audio mode is inherently less precise than MIDI.
- **Audio Events as MidiEvents**: Audio-detected notes are wrapped in the same `MidiEvent` type with `source: 'audio'`. This allows the VisualizationCanvas and downstream analysis (in future stories) to consume them uniformly. The `source` flag lets specific features check if MIDI precision is available.
- **MIDI Takes Priority**: If a MIDI device is connected while in audio mode, MIDI should automatically take over. This follows the "MIDI preferred" principle since MIDI provides higher precision. The transition should be seamless.
- **Growth Mindset (UX9)**: The audio mode banner says "connect a MIDI device for full precision" not "audio mode is limited." Features are shown as "requires MIDI" not "unavailable." The framing is aspirational, not restrictive.
- **Layer Compliance**: `audio-engine.ts` and `pitch-detector.ts` are Layer 3 (Domain Logic) -- pure audio processing, no React. The banner component is Layer 1 (Presentation). The `use-midi.ts` hook orchestrates the audio/MIDI switch.
- **Bundle Consideration**: Pitch detection code should be dynamically imported (`next/dynamic` or `import()`) since it is only needed when audio mode is activated. This prevents adding to the initial bundle for users with MIDI devices.

### Project Structure Notes

- Audio engine: `src/features/midi/audio-engine.ts`
- Audio engine tests: `src/features/midi/audio-engine.test.ts`
- Pitch detector: `src/features/midi/pitch-detector.ts`
- Pitch detector tests: `src/features/midi/pitch-detector.test.ts`
- Audio mode limits: `src/features/midi/audio-mode-limits.ts`
- Audio mode banner: `src/components/audio-mode-banner.tsx`
- Audio mode banner tests: `src/components/audio-mode-banner.test.tsx`
- Updated files: `src/features/midi/midi-types.ts`, `src/stores/midi-store.ts`, `src/features/midi/use-midi.ts`, `src/features/midi/troubleshooting.ts`

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#External Integrations] (Web Audio API: Input only, dynamics/volume via laptop mic)
- [Source: _bmad-output/planning-artifacts/architecture.md#What the Starter Does NOT Provide] (Web Audio API integration layer)
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.6]
- [Source: _bmad-output/planning-artifacts/prd.md#FR6] (Audio-only fallback via laptop microphone)
- [Source: _bmad-output/planning-artifacts/prd.md#FR7] (Detect basic dynamics and volume through audio capture)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Platform Strategy] (Offline resilience, graceful degradation)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Emotional Design Principles] ("Amber, Not Red")

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
