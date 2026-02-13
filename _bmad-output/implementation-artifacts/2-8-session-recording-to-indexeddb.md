# Story 2.8: Session Recording to IndexedDB

Status: done

## Story

As a musician,
I want every note I play to be recorded for later replay,
so that I never lose a practice session.

## Acceptance Criteria

1. Given the user is in an active session (any mode, any session type), When MIDI events are captured by `midiStore`, Then `session-recorder.ts` streams all MIDI events (note-on, note-off, velocity, timing, control changes) to Dexie.js (IndexedDB) in real time. And events are written as they arrive, not batched at the end of the session.

2. Given the user starts playing, When the first MIDI note-on event is detected, Then recording starts automatically without any user action (no "record" button, no prompt). And a session record is created in the Dexie `sessions` table with: id (UUID), startTimestamp, sessionType, and status 'recording'.

3. Given an active recording session exists, When MIDI events continue to flow, Then session metadata is maintained alongside events: session start time, running duration, detected key (from harmonic-analyzer), detected tempo (from timing-analyzer), and session type. And metadata is updated in the Dexie `sessions` table as analysis data becomes available.

4. Given recording is in progress, When 30 seconds elapse since the last autosave, Then all buffered MIDI events and updated metadata are flushed to Dexie.js (NFR7). And the autosave operation is non-blocking — it does not cause frame drops or UI jank. And autosave uses a write-ahead buffer pattern: events are buffered in memory and bulk-written to IndexedDB on the 30-second interval.

5. Given recording integrity is a critical requirement (NFR26), When any MIDI event is captured, Then recording integrity is 100% — zero data loss during active recording. And events are written with monotonically increasing timestamps using `performance.now()`. And if an IndexedDB write fails, the buffer retains the events and retries on the next autosave cycle.

6. Given a 30-minute active session with sustained playing, When memory usage is measured, Then memory stays bounded by streaming events to IndexedDB and clearing the in-memory buffer after successful writes (NFR8, <200MB). And events are NOT accumulated indefinitely in JavaScript memory. And the buffer size is capped (e.g., max 10,000 events in memory at any time, flushing early if the cap is reached).

7. Given the Dexie.js database schema, When the database is initialized, Then it includes tables: `sessions` (id, startTimestamp, endTimestamp, duration, key, tempo, sessionType, status), `midi_events` (id, sessionId, type, note, velocity, timestamp, channel), and `analysis_snapshots` (id, sessionId, snapshotData, timestamp). And appropriate indexes exist for efficient querying: `midi_events` indexed on `[sessionId+timestamp]`, `sessions` indexed on `startTimestamp`.

8. Given recording functionality, When co-located tests execute, Then write integrity is validated: events written match events captured (no loss, no duplication). And autosave behavior is validated: buffer flushes every 30 seconds. And buffer overflow behavior is validated: early flush when buffer cap is reached. And Dexie schema is validated: all tables and indexes are created correctly.

## Tasks / Subtasks

- [ ] 1. Implement Dexie.js database schema (AC: 7)
  - [ ] 1.1 Create or extend `src/lib/dexie/db.ts` with the Dexie database class
  - [ ] 1.2 Define version 1 schema:
    ```
    sessions: '++id, startTimestamp, sessionType, status'
    midi_events: '++id, sessionId, timestamp, [sessionId+timestamp]'
    analysis_snapshots: '++id, sessionId, timestamp, [sessionId+timestamp]'
    ```
  - [ ] 1.3 Define TypeScript interfaces for each table record matching the schema: `SessionRecord`, `MidiEventRecord`, `AnalysisSnapshotRecord`
  - [ ] 1.4 Export the database instance as a singleton: `export const db = new MinstrelDB()`
  - [ ] 1.5 Handle database open errors gracefully — log to console, set a degraded flag (recording disabled if IndexedDB is unavailable)

- [ ] 2. Define session recording types (AC: 1, 2, 3)
  - [ ] 2.1 Create or extend `src/features/session/session-types.ts` with: `RecordingStatus` ('idle' | 'recording' | 'paused' | 'completed'), `SessionMetadata` (id, startTimestamp, endTimestamp?, duration, key?, tempo?, sessionType, status)
  - [ ] 2.2 Define `MidiEventRecord` type: (id?: number, sessionId: string, type: 'note-on' | 'note-off' | 'control-change', note: number, velocity: number, timestamp: number, channel: number)
  - [ ] 2.3 Define `RecordingBuffer` type: (events: MidiEventRecord[], lastFlushTimestamp: number, sessionId: string)

- [ ] 3. Implement session-recorder.ts core (AC: 1, 2, 4, 5, 6)
  - [ ] 3.1 Create `src/features/session/session-recorder.ts` — Application Logic (Layer 2) that bridges domain events to infrastructure (Dexie)
  - [ ] 3.2 Implement `startRecording(sessionType: SessionType): string` — creates a new session record in Dexie `sessions` table, returns the session ID (UUID via `crypto.randomUUID()`), initializes the event buffer
  - [ ] 3.3 Implement `recordEvent(event: MidiEvent): void` — adds a MIDI event to the in-memory buffer with the current session ID and a `performance.now()` timestamp
  - [ ] 3.4 Implement `flush(): Promise<void>` — bulk-writes all buffered events to Dexie `midi_events` table using `db.midi_events.bulkAdd(buffer)`, then clears the buffer. Uses a try/catch to retain buffer on failure.
  - [ ] 3.5 Implement autosave timer: `setInterval(flush, 30000)` started when recording begins, cleared when recording stops
  - [ ] 3.6 Implement buffer cap check: if buffer exceeds `MAX_BUFFER_SIZE = 10000` events, trigger an early flush regardless of the 30-second timer
  - [ ] 3.7 Implement `stopRecording(): Promise<SessionMetadata>` — performs a final flush, updates the session record with `endTimestamp`, `duration`, `status: 'completed'`, and any final analysis metadata (key, tempo)
  - [ ] 3.8 Implement write failure retry: on `flush()` failure, log error, keep events in buffer, attempt again on next cycle

- [ ] 4. Implement automatic recording start on first note (AC: 2)
  - [ ] 4.1 Integrate with the session-manager (Story 2.7): when `startFreeformSession()` is called on first note, also call `startRecording('freeform')`
  - [ ] 4.2 Store the active session ID in `sessionStore.activeSessionId`
  - [ ] 4.3 No UI indication that recording has started — it is invisible and automatic (per UX: "If it can be automatic, it must be automatic")

- [ ] 5. Wire MIDI event capture to recorder (AC: 1)
  - [ ] 5.1 Subscribe to `midiStore` MIDI events (note-on, note-off, control-change) in the analysis pipeline
  - [ ] 5.2 For each event, call `sessionRecorder.recordEvent(event)` to buffer it
  - [ ] 5.3 Ensure the recording subscription runs in addition to (not instead of) the analysis pipeline subscription — events flow to both analysis and recording simultaneously

- [ ] 6. Implement metadata updates during recording (AC: 3)
  - [ ] 6.1 When `sessionStore.currentKey` changes (from harmonic-analyzer), update the Dexie `sessions` record with the detected key
  - [ ] 6.2 When `sessionStore.currentTempo` changes (from timing-analyzer), update the Dexie `sessions` record with the detected tempo
  - [ ] 6.3 Throttle metadata updates to Dexie to avoid excessive writes (at most once per 10 seconds)

- [ ] 7. Implement snapshot recording (AC: 7)
  - [ ] 7.1 When a new `InstantSnapshot` is generated (Story 2.5), write it to the Dexie `analysis_snapshots` table linked to the current session ID
  - [ ] 7.2 Include the full snapshot data (key, chords, timing, tempo, key insight) as a JSON blob in the `snapshotData` column

- [ ] 8. Implement memory management (AC: 6)
  - [ ] 8.1 After a successful `flush()`, clear the events array in the buffer (set to empty `[]`)
  - [ ] 8.2 Monitor buffer size and trigger early flush at `MAX_BUFFER_SIZE` (10,000 events)
  - [ ] 8.3 Do NOT keep a separate copy of events in memory for analysis — analysis engines read from `midiStore` (transient, small window), not from the recording buffer
  - [ ] 8.4 Add `MAX_BUFFER_SIZE = 10000` and `AUTOSAVE_INTERVAL_MS = 30000` to `src/lib/constants.ts`

- [ ] 9. Write co-located unit tests (AC: 8)
  - [ ] 9.1 Create `src/features/session/session-recorder.test.ts`
  - [ ] 9.2 Test `startRecording`: creates a session record in Dexie with correct metadata
  - [ ] 9.3 Test `recordEvent`: events are buffered in memory (not immediately written to Dexie)
  - [ ] 9.4 Test `flush`: buffered events are bulk-written to Dexie, buffer is cleared
  - [ ] 9.5 Test autosave: after 30 seconds, flush is called automatically (use `vi.useFakeTimers()`)
  - [ ] 9.6 Test write integrity: 1000 events recorded, 1000 events retrieved from Dexie after flush
  - [ ] 9.7 Test buffer cap: buffer at 10,001 events triggers early flush
  - [ ] 9.8 Test write failure retry: simulated Dexie write failure retains buffer, next flush succeeds
  - [ ] 9.9 Test `stopRecording`: final flush occurs, session record updated with end time and status
  - [ ] 9.10 Create `src/lib/dexie/db.test.ts` — test schema creation, table existence, index creation
  - [ ] 9.11 Use `fake-indexeddb` (or Dexie's built-in testing support) to mock IndexedDB in Vitest environment

## Dev Notes

- **Architecture Layer**: The Dexie database schema (`src/lib/dexie/db.ts`) is Layer 4 (Infrastructure). The session-recorder (`src/features/session/session-recorder.ts`) is Layer 2 (Application Logic) — it orchestrates between domain events and infrastructure storage. Per boundary rules, only session-recorder (not analysis engines or components) imports from `@/lib/dexie/`.
- **Dexie.js 4.x**: Dexie 4.x provides a clean API for IndexedDB with schema versioning, compound indexes, and bulk operations. `bulkAdd()` is the most efficient way to write multiple records. The compound index `[sessionId+timestamp]` enables efficient range queries for replay (all events for a session, ordered by time).
- **Recording Integrity (NFR26)**: This is a hard requirement — zero data loss. The buffer-and-flush pattern provides durability: events are held in memory until confirmed written to IndexedDB. On write failure, the buffer is retained. The risk is a browser crash before flush — to mitigate, the 30-second interval and 10,000-event cap limit maximum data loss to ~30 seconds or 10,000 events (whichever comes first). For truly critical integrity, consider writing events individually (not batched) — but this trades off performance. Start with batched writes and measure.
- **Non-Blocking Writes (NFR7)**: IndexedDB writes are asynchronous by nature. However, bulk writes can still cause micro-stalls if the transaction is large. Writing 10,000 events at once should be fine (<50ms). If performance issues arise, split into smaller batches (e.g., 1000 events per transaction).
- **Memory Bound (NFR8)**: A MIDI event record is approximately 50-100 bytes. 10,000 events in buffer = ~500KB-1MB. Well within limits. The key is clearing the buffer after each flush.
- **Fake IndexedDB for Testing**: Use `fake-indexeddb` npm package to provide an in-memory IndexedDB implementation for Vitest tests. This allows testing Dexie operations without a real browser environment.
- **Session Lifecycle**: Recording starts on first note (Story 2.7 integration), runs continuously, and stops when the user explicitly ends the session or navigates away. The `beforeunload` event should trigger a final flush (not implemented here — consider in a polish pass).
- **Library Versions**: Dexie.js 4.x, `fake-indexeddb` for testing. Zustand 5.x for store integration.

### Project Structure Notes

- `src/lib/dexie/db.ts` — Dexie database schema definition and singleton export
- `src/lib/dexie/db.test.ts` — co-located schema tests
- `src/features/session/session-recorder.ts` — recording engine (buffer, flush, autosave)
- `src/features/session/session-recorder.test.ts` — co-located tests
- `src/features/session/session-types.ts` — extended with recording types
- `src/stores/session-store.ts` — extended with `activeSessionId`
- `src/lib/constants.ts` — MAX_BUFFER_SIZE, AUTOSAVE_INTERVAL_MS

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — Dexie.js 4.x for IndexedDB, schema design, sync strategy
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Flow Architecture] — MIDI events flow to session-recorder and Dexie
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — Layer 4 infrastructure accessed through `src/lib/` wrappers
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.8] — acceptance criteria, FR37 coverage, NFR7 and NFR26 references
- [Source: _bmad-output/planning-artifacts/prd.md#Session Management] — FR37: record complete sessions for later replay
- [Source: _bmad-output/planning-artifacts/prd.md#NonFunctional Requirements] — NFR7: autosave every 30s non-blocking; NFR8: <200MB memory; NFR26: 100% recording integrity
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Effortless Interactions] — session recording is always-on, no user action required

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
