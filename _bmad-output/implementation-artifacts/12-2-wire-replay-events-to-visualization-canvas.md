# Story 12.2: Wire Replay Events to Visualization Canvas

Status: ready-for-dev

## Story

As a musician reviewing a past session,
I want to see my replayed notes rendered on the piano roll, timing grid, and harmonic overlay,
So that I can visually analyze my performance during replay.

## Acceptance Criteria

1. Given the replay event dispatcher is emitting note-on/note-off events, When visualization-canvas.tsx renders during replay mode, Then notes appear on the piano roll with correct pitch position, timing, and velocity-based brightness
2. Given the canvas is in replay mode, When notes are dispatched from the replay engine, Then the timing grid renderer shows timing accuracy marks for replayed notes just as it does for live notes
3. Given the canvas is in replay mode, When chords are formed by simultaneous replayed notes, Then the harmonic overlay renderer displays chord labels and key center information
4. Given the user switches from live mode to replay mode, When the mode transition occurs, Then the canvas clears all live note state and begins rendering exclusively from replay events
5. Given the user switches from replay mode back to live mode, When the mode transition occurs, Then the canvas clears all replay state and resubscribes to live MIDI input
6. Given the canvas is rendering in replay mode, When compared to the same session during live play, Then the visual output is materially equivalent

## Tasks / Subtasks

1. Add replay-aware subscription path in visualization-canvas.tsx
   - Check appStore.currentMode or isReplayActive flag in subscribe callback
   - Route to replayActiveNotes or activeNotes based on mode
   - Maintain vanilla Zustand subscribe pattern (no React re-renders)
2. Update piano-roll-renderer to accept replay notes source
   - Modify render function to accept notes source parameter
   - Ensure pitch position, timing, and velocity-based brightness work for replay notes
   - Test rendering with both live and replay note sources
3. Update timing-grid-renderer for replay mode
   - Accept replay notes source
   - Render timing accuracy marks for replayed notes
   - Ensure visual consistency with live mode
4. Update harmonic-overlay-renderer for replay mode
   - Accept replay notes source
   - Detect chords from simultaneous replayed notes
   - Display chord labels and key center information
5. Add mode transition cleanup logic
   - Clear all live note state when entering replay mode
   - Clear all replay state when entering live mode
   - Unsubscribe and resubscribe appropriately
6. Add tests verifying visual equivalence between live and replay rendering
   - Create test fixtures with identical note sequences
   - Render in both live and replay modes
   - Assert visual output matches

## Dev Notes

**Architecture Layer**: Presentation Layer (visualization-canvas.tsx) and Infrastructure Layer (renderers)

**Technical Details**:

- Primary file: `src/components/viz/visualization-canvas.tsx` (lines 86-106) — currently subscribes exclusively to useMidiStore.activeNotes; needs a replay-aware subscription path
- The vanilla Zustand subscribe call (AR13 pattern) must check appStore.currentMode or a isReplayActive flag to decide which note source to render
- Renderers affected: `src/components/viz/piano-roll-renderer.ts`, `src/components/viz/harmonic-overlay-renderer.ts`, `src/components/viz/timing-grid-renderer.ts`
- Must NOT break the 60fps render loop (NFR2) — avoid React re-renders; keep the vanilla subscribe pattern

### Project Structure Notes

**Files to Modify**:

- `/Users/siphoyawe/Desktop/Projects/Minstrel/src/components/viz/visualization-canvas.tsx` — add replay-aware subscription
- `/Users/siphoyawe/Desktop/Projects/Minstrel/src/components/viz/piano-roll-renderer.ts` — accept replay notes source
- `/Users/siphoyawe/Desktop/Projects/Minstrel/src/components/viz/timing-grid-renderer.ts` — accept replay notes source
- `/Users/siphoyawe/Desktop/Projects/Minstrel/src/components/viz/harmonic-overlay-renderer.ts` — accept replay notes source
- `/Users/siphoyawe/Desktop/Projects/Minstrel/src/stores/app-store.ts` — may need to add isReplayActive flag if not already present

**Files to Create**:

- `/Users/siphoyawe/Desktop/Projects/Minstrel/src/components/viz/__tests__/replay-rendering.test.ts` — visual equivalence tests

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
