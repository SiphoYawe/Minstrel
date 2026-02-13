# Story 20.5: Fix Data Export Completeness

Status: ready-for-dev

## Story

As a user exporting my data,
I want clear status flags for incomplete exports and token usage breakdowns,
So that I know if any data is missing and can audit my AI spending.

## Acceptance Criteria

1. Given IndexedDB query fails during data export, When the export completes, Then it includes status flags indicating which sections are incomplete
2. Given the server export route queries ai_conversations, When it runs, Then it includes an aggregated token usage summary by provider and model
3. Given the user downloads their data export, When they review it, Then they can see cost breakdown per provider

## Tasks / Subtasks

1. Add export status flags (AI-M1)
   - Add `status` field to ExportData interface with 'complete' | 'failed' per section
   - Wrap IndexedDB queries in try/catch, set status on failure
2. Add token usage breakdown (AI-M2)
   - Query ai_token_usage table, aggregate by provider/model
   - Include in export data
3. Add unit tests

## Dev Notes

**Findings Covered**: AI-M1, AI-M2
**Files**: `src/features/auth/data-export.ts`, `src/app/api/user/export/route.ts`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
