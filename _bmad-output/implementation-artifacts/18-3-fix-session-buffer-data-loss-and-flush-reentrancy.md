# Story 18.3: Fix Session Buffer Data Loss and Flush Reentrancy

Status: done

## Story

As a musician practicing with Minstrel,
I want my MIDI data to survive browser crashes and flush errors,
So that I never lose practice session data unexpectedly.

## Acceptance Criteria

1. Given an active recording session, When the browser tab closes unexpectedly, Then a `beforeunload` event handler flushes the current buffer using `navigator.sendBeacon` or synchronous IndexedDB write
2. Given the flush operation encounters an error, When the error handler runs, Then failed events are placed in a dedicated retry queue (not re-appended to the main buffer) and processed sequentially on the next flush cycle
3. Given concurrent flush attempts, When a flush is already in progress, Then the second flush waits for the first to complete (including error handling and queue processing) before starting
4. Given a recording session lasting 30+ minutes, When autosave runs every 30 seconds, Then zero events are lost between autosave intervals even under error conditions

## Tasks / Subtasks

1. Add `beforeunload` emergency flush handler
   - Add `window.addEventListener('beforeunload', emergencyFlush)`
   - Use `navigator.sendBeacon('/api/session/emergency', blob)` if available
   - Fallback: synchronous IndexedDB write
   - Clean up listener on component unmount
2. Add dedicated retry queue for failed flush events
   - Add `retryQueue: MIDIEvent[] = []` separate from `eventBuffer`
   - Flush error handler: `retryQueue.push(...failedEvents)` instead of `eventBuffer.push`
   - Next flush processes retry queue first before main buffer
3. Add async lock to prevent concurrent flush
   - Add `flushPromise: Promise<void> | null` field
   - Second flush awaits first flush promise completion
   - Ensure error handling completes before lock releases
4. Add unit tests
   - Close tab mid-recording → beforeunload fires → sendBeacon called with buffer
   - Flush fails → events move to retryQueue → next flush processes queue first
   - Concurrent flush while first flush erroring → second flush waits
   - 35-second session with 2 autosaves → all events persisted

## Dev Notes

**Architecture Layer**: Application Layer (session recording)
**Findings Covered**: STATE-C1, STATE-C4
**File**: `src/features/session/session-recorder.ts` (lines 126-143, 196-243)
**Issues**: eventBuffer only flushed on autosave (30s), cap (10K), or explicit stop. Flush error handler reentrancy causes data loss.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- All 28 session-recorder tests pass (5 new + 23 existing updated)
- TypeScript compiles clean

### Completion Notes List

- Added dedicated retryQueue separate from eventBuffer
- Flush errors move events to retryQueue (no data loss)
- Async lock via flushPromise — concurrent callers await first flush
- Retry queue processed before main buffer on each flush
- Added emergencyFlush() with sendBeacon + sync IndexedDB fallback
- beforeunload handler attached on startRecording, detached on stop
- Added getRetryQueueSize() for monitoring

### File List

- src/features/session/session-recorder.ts (modified)
- src/features/session/session-recorder.test.ts (modified)
