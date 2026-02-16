# Story 24.4: Add IndexedDB Write Error Handling and Feedback

Status: ready-for-dev

## Story

As a user,
I want to know when my practice data can't be saved,
So that I'm aware of potential data loss and can take action.

## Acceptance Criteria

1. Given IndexedDB write fails, When error occurs, Then amber notification appears: "Some practice data couldn't be saved"
2. Given high-frequency note input (>50 notes/sec), When events arrive, Then batched into 100ms write windows
3. Given storage quota near capacity (>90%), When threshold reached, Then warning: "Storage is getting full. Export your data to free space."

## Tasks / Subtasks

1. Add error handling to recordEvent() with catch (MIDI-C13)
   - Wrap IndexedDB write calls in try/catch
   - Emit amber notification on write failure
2. Implement 100ms write batching
   - Buffer incoming note events in memory
   - Flush buffer to IndexedDB every 100ms
   - Ensure no data loss if flush fails (retain buffer)
3. Add storage quota monitoring
   - Use `navigator.storage.estimate()` to check quota usage
   - Trigger warning notification at >90% capacity
   - Suggest data export to free space
4. Create amber notification for write failures
   - Use existing notification system with amber styling
   - Include actionable message text
5. Add unit tests

## Dev Notes

**Findings Covered**: MIDI-C13, IndexedDB throttling (HIGH)
**Files**: `src/lib/dexie-client.ts`, `src/stores/session-store.ts`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
