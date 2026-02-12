# Story 5.5: MIDI Output Demonstration Playback

Status: ready-for-dev

## Story

As a musician,
I want to hear drills played through my own instrument,
So I have clear auditory target.

## Acceptance Criteria

1. **Given** a drill has been generated (Story 5.4), **When** the Demonstrate phase begins, **Then** `midi-output.ts` sends MIDI `noteOn`/`noteOff` events through the Web MIDI API output port to the user's connected MIDI device. **And** the drill plays through the instrument's speakers (not laptop speakers) at the drill's target tempo. **And** note velocity, duration, and timing match the drill specification exactly.

2. **Given** MIDI output is active, **When** the drill demonstrates, **Then** the VisualizationCanvas shows a clear "Demonstrating..." visual phase with notes lighting up in sequence as each note plays (UX13). **And** a progress indicator shows how far through the demonstration the playback is. **And** the Canvas visualization syncs precisely with the MIDI output timing.

3. **Given** the demonstration completes, **When** the last note finishes, **Then** the system transitions to "Your turn" with a clear visual cue on the VisualizationCanvas. **And** there is a brief pause (1-2 seconds) between demonstration end and "Your turn" prompt to give the musician time to prepare. **And** the MIDI input capture resumes for the user's attempt.

4. **Given** the user's MIDI device does not support MIDI output (input-only device), **When** the Demonstrate phase begins, **Then** `midi-output.ts` detects the lack of output capability. **And** a fallback audio playback system plays the drill through laptop speakers using Web Audio API oscillator synthesis. **And** the user sees "Playing through speakers — connect a MIDI output device for playback through your instrument."

5. **Given** the full drill choreography (UX13), **When** a drill cycle executes, **Then** the flow proceeds through distinct visual phases: Setup (drill description, "Listen first") → Demonstrate (MIDI plays, notes animate) → Listen/Prepare ("Your turn" pause) → Attempt (user plays, comparison active) → Analyze (results shown). **And** each phase has a visually distinct state on the VisualizationCanvas and DrillController component. **And** phase transitions are announced via `aria-live="polite"` for screen readers.

## Tasks / Subtasks

- [ ] Task 1: Implement MIDI output core in `src/features/midi/midi-output.ts` (AC: 1)
  - [ ] Implement `getMidiOutputPort(): MIDIOutput | null` — queries Web MIDI API for available output ports
  - [ ] Implement `detectOutputCapability(): { hasOutput: boolean; portName: string | null }` — checks if connected device supports output
  - [ ] Implement `sendNoteOn(port: MIDIOutput, note: number, velocity: number, channel?: number): void` — sends MIDI noteOn message (status byte 0x90)
  - [ ] Implement `sendNoteOff(port: MIDIOutput, note: number, channel?: number): void` — sends MIDI noteOff message (status byte 0x80)
  - [ ] Implement `sendAllNotesOff(port: MIDIOutput, channel?: number): void` — panic: sends noteOff for all notes (safety)
  - [ ] Add MIDI output port state to `midiStore`: `outputPort: MIDIOutput | null`, `hasOutputCapability: boolean`

- [ ] Task 2: Implement drill playback scheduler in `src/features/drills/drill-player.ts` (AC: 1, 2, 3)
  - [ ] Create `src/features/drills/drill-player.ts`
  - [ ] Implement `DrillPlayer` class or module:
    - `playDrill(drill: GeneratedDrill, outputPort: MIDIOutput): Promise<void>` — schedules and plays all notes
    - `stop(): void` — immediately stops playback and sends allNotesOff
    - `onNotePlay(callback: (note: DrillNote, index: number, total: number) => void)` — callback for Canvas sync
    - `onComplete(callback: () => void)` — callback when demonstration ends
  - [ ] Use high-precision timing with `performance.now()` and `setTimeout` compensation for accurate tempo:
    ```typescript
    // Scheduler pattern for precise timing
    const beatDurationMs = 60000 / targetTempo;
    for (const note of drill.sequence.notes) {
      const targetTime = startTime + (note.startBeat * beatDurationMs);
      const delay = targetTime - performance.now();
      await preciseDelay(delay);
      sendNoteOn(port, note.midiNote, note.velocity);
      // Schedule noteOff
      setTimeout(() => sendNoteOff(port, note.midiNote), note.duration * beatDurationMs);
    }
    ```
  - [ ] Implement `preciseDelay(ms)` — uses `requestAnimationFrame` + `performance.now()` for sub-ms accuracy when needed
  - [ ] Dispatch note-play events to `midiStore` for Canvas visualization sync

- [ ] Task 3: Implement audio fallback for devices without MIDI output (AC: 4)
  - [ ] Create fallback synthesizer using Web Audio API `OscillatorNode`:
    ```typescript
    function midiNoteToFrequency(note: number): number {
      return 440 * Math.pow(2, (note - 69) / 12);
    }
    ```
  - [ ] Implement `playDrillWithAudio(drill: GeneratedDrill, audioContext: AudioContext): Promise<void>` — mirrors `playDrill` but outputs through speakers
  - [ ] Use simple sine/triangle wave for clean tone (not aiming for instrument realism)
  - [ ] Apply velocity as gain (0-1 mapped from MIDI velocity 0-127)
  - [ ] Apply ADSR envelope for natural note shape (attack: 10ms, decay: 50ms, sustain: 0.7, release: 100ms)

- [ ] Task 4: Implement drill phase choreography (AC: 2, 3, 5)
  - [ ] Add `DrillPhase` state to `sessionStore`: `currentDrillPhase: DrillPhase`
  - [ ] Add phase transition actions: `setDrillPhase(phase: DrillPhase)`
  - [ ] Implement phase flow orchestrator in `drill-player.ts`:
    1. `DrillPhase.Setup` — display drill info, wait for user acknowledgment or auto-start timer
    2. `DrillPhase.Demonstrate` — call `playDrill`, update Canvas with note-play callbacks
    3. `DrillPhase.Listen` — 1.5-second pause after demonstration, "Your turn" visual transition
    4. `DrillPhase.Attempt` — enable MIDI input capture, start performance comparison
    5. `DrillPhase.Analyze` — show results (handled by Story 5.6)
    6. `DrillPhase.Complete` — summary and next-action options
  - [ ] Each phase transition updates `sessionStore.currentDrillPhase`
  - [ ] Canvas subscribes to `currentDrillPhase` via Zustand vanilla subscribe (not React)

- [ ] Task 5: Implement Canvas demonstration visualization (AC: 2, 3)
  - [ ] Extend `VisualizationCanvas` (or create a demonstration renderer in `src/components/viz/`):
    - During `Demonstrate` phase: notes light up in sequence on the piano roll as they play
    - Show "Demonstrating..." label overlay with progress (note X of Y)
    - During `Listen` phase: show "Your turn" label with subtle pulse animation
    - During `Attempt` phase: show live user input alongside target notes (comparison mode)
  - [ ] Use the note-play callback from `DrillPlayer` to drive Canvas updates
  - [ ] Ensure Canvas updates bypass React cycle (architecture pattern: vanilla Zustand subscribe)

- [ ] Task 6: Implement accessibility for phase transitions (AC: 5)
  - [ ] Add `aria-live="polite"` region that announces phase changes:
    - "Demonstrating drill: [drill title]. Listen carefully."
    - "Your turn. Play the exercise now."
    - "Results: [summary]"
  - [ ] Ensure all DrillController buttons are keyboard accessible
  - [ ] Phase indicator in DrillController is screen-reader friendly: "Phase 2 of 5: Demonstrate"

- [ ] Task 7: Write co-located tests (AC: 1, 4)
  - [ ] Create `src/features/midi/midi-output.test.ts`
  - [ ] Test: `sendNoteOn` generates correct MIDI byte sequence: `[0x90 | channel, note, velocity]`
  - [ ] Test: `sendNoteOff` generates correct MIDI byte sequence: `[0x80 | channel, note, 0]`
  - [ ] Test: `detectOutputCapability` returns `false` when no output ports available
  - [ ] Test: `sendAllNotesOff` sends noteOff for all 128 notes (panic function)
  - [ ] Test: audio fallback `midiNoteToFrequency(69)` returns 440 (A4)
  - [ ] Test: audio fallback `midiNoteToFrequency(60)` returns ~261.63 (C4)
  - [ ] Mock Web MIDI API for output tests using `e2e/fixtures/mock-midi-device.ts`

## Dev Notes

- **This story delivers the "signature moment" of Minstrel** — hearing a drill played through your own instrument. The UX spec calls this the "Demonstrate → Attempt Loop as Signature Moment" and identifies it as a design opportunity with no established UX precedent.

- **Architecture Layer**: `midi-output.ts` is Layer 3 domain logic (pure MIDI byte construction). `drill-player.ts` is Layer 2/3 (orchestration + timing). Canvas visualization is Layer 1. The Web MIDI API itself is Layer 5 (external).

- **Web MIDI API Output**: The output API is straightforward but requires careful timing:
  ```typescript
  // Web MIDI API output
  const output: MIDIOutput = midiAccess.outputs.values().next().value;

  // noteOn: status byte (0x90 + channel), note number, velocity
  output.send([0x90, 60, 100]);  // C4, velocity 100

  // noteOff: status byte (0x80 + channel), note number, velocity (usually 0)
  output.send([0x80, 60, 0]);    // C4 off

  // With timestamp (for precise scheduling):
  output.send([0x90, 60, 100], performance.now() + 500); // play in 500ms
  ```

- **MIDI Output Port Discovery**: Not all MIDI devices support output. Many MIDI controllers are input-only. The code must gracefully handle this:
  ```typescript
  async function getMidiOutputPort(): Promise<MIDIOutput | null> {
    const access = await navigator.requestMIDIAccess();
    for (const output of access.outputs.values()) {
      return output; // Return first available output
    }
    return null; // No output ports
  }
  ```

- **Precise Timing**: JavaScript `setTimeout` has ~4ms minimum delay and can jitter. For musical timing at 120 BPM (500ms per beat), this is usually acceptable. For faster tempos or more precise needs, use the Web MIDI API's built-in timestamp parameter:
  ```typescript
  // Schedule notes ahead of time using Web MIDI API timestamps
  const now = performance.now();
  drill.sequence.notes.forEach(note => {
    const noteTime = now + (note.startBeat * beatDurationMs);
    output.send([0x90, note.midiNote, note.velocity], noteTime);
    output.send([0x80, note.midiNote, 0], noteTime + (note.duration * beatDurationMs));
  });
  ```
  This is the preferred approach — schedule all notes upfront and let the MIDI API handle timing.

- **Audio Fallback Quality**: The Web Audio API oscillator fallback is intentionally simple. It is NOT trying to replicate the instrument's sound — it is a functional fallback so the user can hear the drill. A sine wave at the correct frequency and velocity is sufficient. Future enhancement could use sampled sounds.

- **DrillController Component Integration**: The DrillController (P1 component from UX spec) manages the UI for this choreography. Its anatomy from the UX spec:
  ```
  ┌─────────────────────────────────────────┐
  │  Chord Transition Drill                 │
  │  Target: C → Am smooth voice leading    │
  │                                         │
  │  Phase: [*Demonstrate] [○Your Turn] [○Results] │
  │                                         │
  │  Rep 3/5    380ms → 220ms   +42%        │
  │                                         │
  │  [One more]              [Complete]     │
  └─────────────────────────────────────────┘
  ```
  The DrillController component itself may be partially built in this story (phase indicator, demonstrate UI) with full completion tracking added in Story 5.6.

- **Canvas/Zustand Synchronization**: The Canvas must show notes lighting up in real time during demonstration. Use the architecture's vanilla subscribe pattern:
  ```typescript
  // In Canvas component setup (not in React render cycle)
  useMidiStore.subscribe(
    (state) => state.demonstrationNote,
    (note) => {
      if (note) highlightNoteOnCanvas(note);
    }
  );
  ```

- **Dependency**: Requires Story 5.4 (drill data to play), Story 1.3 (MIDI engine for output ports), Story 1.4 (Canvas for visualization). The DrillController component should follow the P1 implementation timeline from the UX spec.

### Project Structure Notes

```
src/features/midi/
├── midi-output.ts               # MIDI output core (this story)
├── midi-output.test.ts          # Co-located tests (this story)
├── midi-engine.ts               # Story 1.3 (input)
├── midi-parser.ts               # Story 1.3
├── midi-types.ts                # MIDI types (may need output additions)
└── ...

src/features/drills/
├── drill-player.ts              # Drill playback scheduler + phase orchestrator (this story)
├── drill-types.ts               # Extended with DrillPhase (Story 5.4 base)
├── drill-generator.ts           # Story 5.4
└── ...

src/components/viz/
├── visualization-canvas.tsx     # Extended with demonstration rendering (this story)
├── demonstration-renderer.ts    # Optional: dedicated demonstration Canvas renderer (this story)
└── ...

src/stores/
├── midi-store.ts                # Add outputPort, hasOutputCapability, demonstrationNote
├── session-store.ts             # Add currentDrillPhase state
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#External Integrations] — Web MIDI API bidirectional
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — Canvas/Zustand vanilla subscribe pattern
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Flow Architecture] — MIDI output in data flow
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.5] — Full story definition with AC
- [Source: _bmad-output/planning-artifacts/prd.md#FR5] — MIDI output for demonstration playback
- [Source: _bmad-output/planning-artifacts/prd.md#FR20] — Drill demonstration through instrument
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#DrillController] — DrillController component spec, phases, anatomy
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Novel Interaction Patterns] — Demonstrate → Listen → Attempt → Analyze choreography
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Opportunities] — "Demonstrate → Attempt Loop as Signature Moment"

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
