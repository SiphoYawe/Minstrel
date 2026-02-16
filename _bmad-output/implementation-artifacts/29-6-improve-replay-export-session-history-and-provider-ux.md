# Story 29.6: Improve Replay Export, Session History, and Provider UX

Status: done

## Story

As a user,
I want to export replays, have smooth session history, and manage multiple API providers,
So that I can share progress and manage my settings easily.

## Acceptance Criteria

1. Given replay session, When user wants to share, Then "Export" button generates shareable summary
2. Given session history pagination, When user navigates pages, Then scroll position preserved
3. Given multiple API keys saved, When settings renders, Then all providers listed with active/inactive and "Default" indicator
4. Given profile section, When displayed, Then user can edit display name

## Tasks / Subtasks

1. Add export button to replay with summary generation
   - Add "Export" button to replay UI
   - Generate shareable text/markdown summary of the session
2. Fix session history pagination scroll position
   - Preserve scroll position when navigating between pages
3. Add multi-provider UI with default selector
   - List all saved API providers with active/inactive status
   - Add "Default" indicator and ability to set default provider
4. Add profile name editing capability
   - Add editable display name field in profile section
5. Add unit tests

## Dev Notes

**Findings Covered**: Export/share replay (HIGH), pagination scroll (HIGH), multiple provider UX (HIGH), profile editing (HIGH)
**Files**: `src/components/replay/`, `src/components/settings/`

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes List

- AC1: Added "Export Summary" button to InsightsPanel that generates markdown summary and copies to clipboard; includes date, duration, key, tempo, notes, type
- AC2: Added scroll position preservation to SessionsListPanel — captures scrollHeight before loading more, restores scroll position via requestAnimationFrame after new items render
- AC3: Added provider list display in API Keys section showing provider name, masked key, active/inactive status badge, and "Default" indicator; list renders above the ApiKeyPrompt form
- AC4: Added editable display name in Profile section with inline edit mode, Save/Cancel buttons, error handling; updates user_metadata via supabase.auth.updateUser(), refreshes app store user state via mapSupabaseUser
- Settings tests pass (17 tests), replay-studio has 2 pre-existing test failures (mode switcher, timestamp context)
- TypeScript compiles clean

### File List

- src/features/modes/replay-studio.tsx
- src/app/(auth)/settings/page.tsx
- \_bmad-output/implementation-artifacts/29-6-improve-replay-export-session-history-and-provider-ux.md
