# Story 10.4: Session History Browser

Status: ready-for-dev

## Story

As a musician,
I want to browse my past practice sessions,
so that I can find and replay specific sessions.

## Acceptance Criteria

1. Given a user navigates to `/replay` (without a session ID in the URL), When the page loads, Then a session history list is displayed showing all past sessions sorted by date (newest first). And the list loads from IndexedDB (`guest_sessions` table) for all users, supplemented by Supabase `sessions` table for authenticated users with synced data.

2. Given the session history list renders, When sessions are displayed, Then each entry shows: (a) date and time (formatted as "Feb 10, 2026 at 3:45 PM"), (b) duration (formatted as "23 min" or "1h 12min"), (c) key(s) played in (e.g., "C major, Bb minor"), (d) average tempo in BPM, (e) timing accuracy percentage, and (f) a brief one-line summary (e.g., "Jazz improvisation — mostly ii-V-I progressions"). And each entry is a clickable card styled with the dark studio aesthetic.

3. Given the session history list, When the user clicks a session entry, Then they navigate to `/replay/[id]` to view and replay that specific session. And the navigation uses `next/navigation` `useRouter.push()` for client-side routing.

4. Given the session history list contains sessions only in IndexedDB (not yet synced to Supabase), When the page loads, Then those sessions are still displayed from the local Dexie database. And a subtle sync status indicator shows which sessions are local-only vs synced (using the `syncStatus` field from `GuestSession`).

5. Given the session history list is empty (new user with zero sessions), When the page loads, Then an empty state is displayed saying "No sessions yet — start practicing to build your history" with a CTA button linking to `/session` (authenticated) or `/play` (guest). And the empty state matches the dark studio aesthetic.

6. Given the user has many sessions (more than 20), When the list renders, Then it uses virtual scrolling or pagination to maintain performance. And the initial load displays the 20 most recent sessions, with a "Load more" button or infinite scroll for older sessions.

## Tasks / Subtasks

- [ ] 1. Create session history list component (AC: 2, 5)
  - [ ] 1.1 Create `src/components/session-history.tsx` — `'use client'` component (Layer 1 Presentation)
  - [ ] 1.2 Define `SessionHistoryEntry` type: `{ id: number, startedAt: number, endedAt: number, duration: number, key: string | null, tempo: number | null, timingAccuracy: number | null, summary: string | null, syncStatus: SyncStatus }`
  - [ ] 1.3 Implement session card layout: clickable card with date/time, duration, key, tempo, accuracy, and summary displayed in a vertical stack or grid row
  - [ ] 1.4 Apply dark studio aesthetic: `bg-[#1A1A1A]` card background, `border border-[#2A2A2A]`, `rounded-none`, hover state `bg-[#222222]`, `text-[#7CB9E8]` accent for key metrics
  - [ ] 1.5 Implement empty state component inline: centered text with CTA button
  - [ ] 1.6 Add sync status indicator: small badge showing "Local" (amber) or "Synced" (green) per session

- [ ] 2. Create session history data hook (AC: 1, 4, 6)
  - [ ] 2.1 Create `src/features/session/use-session-history.ts` — hook (Layer 2 Application Logic)
  - [ ] 2.2 Implement `useSessionHistory(limit: number = 20)` that queries `db.guest_sessions.orderBy('startedAt').reverse().limit(limit).toArray()` from Dexie
  - [ ] 2.3 For authenticated users, merge with any additional sessions from Supabase that may not be in IndexedDB (e.g., sessions from another device)
  - [ ] 2.4 Implement `loadMore()` function that fetches the next page of sessions using Dexie offset/limit
  - [ ] 2.5 Return `{ sessions: SessionHistoryEntry[], isLoading: boolean, hasMore: boolean, loadMore: () => void }`

- [ ] 3. Create session summary generator for list entries (AC: 2)
  - [ ] 3.1 Create `src/features/session/session-list-summary.ts` — utility (Layer 3 Domain Logic) that generates a one-line summary from session metadata
  - [ ] 3.2 Implement `generateListSummary(session: GuestSession, events?: StoredMidiEvent[]): string` — constructs summary from key, tempo, session type, and dominant patterns
  - [ ] 3.3 If analysis data is available (chords, genre), include it: "Jazz — mostly ii-V-I in Bb". If minimal data, use generic: "Freeform practice — 12 minutes"

- [ ] 4. Create or update replay index page (AC: 1, 3)
  - [ ] 4.1 Create `src/app/(auth)/replay/page.tsx` — server component that renders the session history as the default replay view (when no `[id]` param)
  - [ ] 4.2 Verify that existing `src/app/(auth)/replay/[id]/page.tsx` continues to work for individual session replay
  - [ ] 4.3 Add navigation from session history entries to replay detail: `useRouter().push(\`/replay/${session.id}\`)`
  - [ ] 4.4 Add a "Back to session list" link in the replay detail page header for return navigation

- [ ] 5. Handle guest users (AC: 1, 5)
  - [ ] 5.1 Create `src/app/(guest)/replay/page.tsx` if guest replay route exists, or link from guest play page to session history
  - [ ] 5.2 Guest session history pulls exclusively from IndexedDB (no Supabase query)
  - [ ] 5.3 Empty state CTA links to `/play` for guests

- [ ] 6. Write co-located tests (AC: 1, 2, 3, 5, 6)
  - [ ] 6.1 Create `src/components/session-history.test.tsx` — test rendering of session cards with mock data, empty state, click navigation, sync status indicators
  - [ ] 6.2 Create `src/features/session/use-session-history.test.ts` — test Dexie query, pagination (loadMore), authenticated user merge, empty result handling
  - [ ] 6.3 Create `src/features/session/session-list-summary.test.ts` — test summary generation for various session types and data completeness levels

## Dev Notes

- **Architecture Layer**: `session-history.tsx` is Layer 1 (Presentation). `use-session-history.ts` is Layer 2 (Application Logic). `session-list-summary.ts` is Layer 3 (Domain Logic) — pure function that generates summary text from data.
- **Dexie Query Performance**: Dexie's `orderBy('startedAt').reverse().limit(20)` uses the IndexedDB index efficiently. For users with hundreds of sessions, pagination is essential. The `offset` parameter in subsequent queries avoids loading the entire dataset.
- **Merge Strategy for Authenticated Users**: If a session exists in both IndexedDB and Supabase (same `supabaseId`), prefer the Supabase version (more complete metadata). Sessions only in IndexedDB (not yet synced) are included with `syncStatus: 'pending'`. Sessions only in Supabase (from another device) are appended.
- **Route Structure**: `/replay` (no params) shows the session list. `/replay/[id]` shows a specific session's replay. This follows standard Next.js nested route patterns. The `page.tsx` at `/replay/` is new; `/replay/[id]/page.tsx` already exists.
- **Summary Generation**: The one-line summary is generated client-side from stored metadata, not AI. It reads the session's key, tempo, session type, and any stored analysis snapshots. For sessions without rich analysis data (early sessions before analysis was implemented), it falls back to basic info: "Practice session — {duration}".
- **Virtual Scrolling Decision**: For the initial implementation, "Load more" button pagination (20 sessions per page) is simpler and more accessible than virtual scrolling. Virtual scrolling can be added later if users report performance issues with hundreds of sessions.
- **Library Versions**: React 19.x, Zustand 5.x, Dexie.js 4.x, Next.js 16, Tailwind CSS v4.

### Project Structure Notes

- `src/components/session-history.tsx` — session list component (create)
- `src/components/session-history.test.tsx` — co-located component tests (create)
- `src/features/session/use-session-history.ts` — session history data hook (create)
- `src/features/session/use-session-history.test.ts` — co-located hook tests (create)
- `src/features/session/session-list-summary.ts` — summary text generator (create)
- `src/features/session/session-list-summary.test.ts` — co-located tests (create)
- `src/app/(auth)/replay/page.tsx` — replay index page (create)
- `src/app/(auth)/replay/[id]/page.tsx` — existing replay detail page (modify: add back link)
- `src/lib/dexie/db.ts` — existing, consumed for `guest_sessions` queries

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Replay Studio] — tabbed workspace, session replay, timeline scrubbing
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — IndexedDB `guest_sessions` table schema, Supabase `sessions` table, sync status
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure] — Next.js route groups `(auth)` and `(guest)`
- [Source: _bmad-output/planning-artifacts/prd.md#Session Management] — FR31: session replay, FR32: session recording
- [Source: _bmad-output/implementation-artifacts/6-1-replay-studio-mode-layout.md] — replay studio layout, `/replay/[id]` route
- [Source: _bmad-output/implementation-artifacts/2-8-session-recording-to-indexeddb.md] — IndexedDB session storage, `GuestSession` schema

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
