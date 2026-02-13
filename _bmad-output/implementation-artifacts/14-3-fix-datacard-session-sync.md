# Story 14.3: Fix DataCard Session Sync

Status: ready-for-dev

## Story

As a musician viewing the Dashboard+Chat mode,
I want the data cards to show accurate session summary statistics instead of stale live-analysis values,
So that the metrics I see actually reflect my session performance.

## Acceptance Criteria

1. Given the user has completed a session and switches to Dashboard+Chat mode, When the data cards render, Then they show session summary statistics: predominant key, average tempo, timing accuracy trend, total notes played, and most common chord progression
2. Given the user starts a new session, When the session begins, Then all data card metrics reset to their default "detecting..." state instead of carrying over values from the previous session
3. Given the data card shows a chord progression value, When the text is longer than the card width, Then a tooltip on hover reveals the full chord progression text
4. Given the data card shows timing accuracy, When the value is computed, Then it reflects the session-wide trend (improving, stable, declining) rather than the last instantaneous measurement
5. Given the data card shows tempo, When the value is computed, Then it shows the session average BPM with a range indicator rather than the last instantaneous reading
6. Given the user is in live play mode, When the data cards update, Then they show live values with a "LIVE" indicator clearly distinguished from the session summary

## Tasks / Subtasks

1. Add computeSessionSummary() to session-store.ts (AC: 1)
2. Add resetMetrics() action for session start (AC: 2)
3. Add tooltip for truncated chord progression text (AC: 3)
4. Compute session-wide timing accuracy trend (AC: 4)
5. Compute session average BPM with range (AC: 5)
6. Add LIVE indicator for live mode values (AC: 6)
7. Update DataCard component with sessionMode prop
8. Add tests for session summary computation

## Dev Notes

This story fixes the data synchronization issue where Dashboard+Chat mode data cards show stale live-analysis values instead of computed session summaries.

**Architecture Layer**: Application Layer (state management) + Presentation Layer (UI)

**Technical Details**:

- Primary file: src/components/data-card.tsx — currently reads currentKey, currentTempo, timingAccuracy, detectedChords from useSessionStore which are live-analysis values
- Add a computeSessionSummary() function to src/stores/session-store.ts
- Reset logic: add a resetMetrics() action to sessionStore called on session start
- Tooltip: use shadcn/ui Tooltip component for truncated chord text
- Consider adding sessionMode: 'live' | 'summary' flag to DataCard props
- Timing accuracy trend: compute slope over session notes (improving: +, stable: 0, declining: -)
- Average BPM with range: compute mean, min, max from all tempo readings

### Project Structure Notes

**Key files to modify**:

- `src/components/data-card.tsx` - Add sessionMode prop and tooltip logic
- `src/stores/session-store.ts` - Add computeSessionSummary() and resetMetrics()
- `src/features/modes/dashboard-chat.tsx` - Call resetMetrics() on session start
- `src/features/analysis/timing-analysis.ts` - Add trend computation helper

**Key files to create**:

- `src/stores/session-store.test.ts` - Tests for session summary computation

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
