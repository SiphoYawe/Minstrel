# Story 14.7: Fix Session History Completeness

Status: ready-for-dev

## Story

As a musician,
I want to see all my past sessions in the history view with complete metadata,
So that I can review any session from my practice history.

## Acceptance Criteria

1. Given the user has more than 20 sessions, When the session history list loads, Then the first 20 sessions are displayed with a "Load More" button
2. Given the user clicks "Load More", When additional sessions are fetched, Then the next 20 sessions are appended without removing previously loaded sessions
3. Given sessions exist with various statuses, When the session history list renders, Then all session statuses are shown with visual indicators (green for completed, amber for active, gray for abandoned)
4. Given a session is shorter than 10 seconds, When the session is saved, Then metadata is written immediately on first detection
5. Given session history items are displayed, When each item renders, Then it shows: date/time, duration, note count, detected key, average tempo, and session status
6. Given the session history list is loaded, When sorted by date (most recent first), Then the sort order is correct and all sessions are accessible via pagination

## Tasks / Subtasks

1. Replace hardcoded limit(20) with paginated query (AC: 1)
2. Implement "Load More" append behavior (AC: 2)
3. Show all session statuses with visual indicators (AC: 3)
4. Add immediate metadata write on first detection (AC: 4)
5. Enrich session history items with full metadata (AC: 5)
6. Fix sort order and pagination (AC: 6)
7. Add pagination state management
8. Add tests for session history pagination

## Dev Notes

This story fixes the session history list to show all sessions with complete metadata and proper pagination.

**Architecture Layer**: Infrastructure Layer (data queries) + Presentation Layer (UI)

**Technical Details**:

- Primary files: src/features/modes/replay-studio.tsx (line 520 — hardcoded limit(20)), src/components/session-history-list.tsx (lines 54-56 — only loads status === 'completed'), src/features/session/use-replay-session.ts (line 26)
- Remove hardcoded limit(20) and replace with paginated query: offset + limit
- Remove status === 'completed' filter — show all statuses
- Immediate metadata write: in src/features/session/session-recorder.ts lines 149-159, write on first detection
- Pagination state: add sessionHistoryPage and hasMoreSessions to component state or appStore
- Visual indicators: use shadcn/ui Badge with color variants (green, amber, gray)

### Project Structure Notes

**Key files to modify**:

- `src/features/modes/replay-studio.tsx` - Remove hardcoded limit(20), add pagination logic
- `src/components/session-history-list.tsx` - Remove status filter, add "Load More" button
- `src/features/session/use-replay-session.ts` - Add offset parameter to query
- `src/features/session/session-recorder.ts` - Add immediate metadata write on first detection
- `src/lib/db/queries.ts` - Add paginated session history query
- `src/stores/app-store.ts` - Add pagination state (sessionHistoryPage, hasMoreSessions)

**Key files to create**:

- `src/components/session-history-list.test.tsx` - Tests for pagination behavior

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
