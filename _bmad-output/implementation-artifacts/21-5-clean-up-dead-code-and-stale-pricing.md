# Story 21.5: Clean Up Dead Code and Handle Stale Pricing

Status: ready-for-dev

## Story

As a developer maintaining Minstrel,
I want unused functions removed, broken references cleaned up, and stale pricing detected,
So that the codebase is clean and cost estimates stay accurate.

## Acceptance Criteria

1. Given `trackTokenUsage` is never imported, When code is cleaned up, Then the function is removed
2. Given `drill-parser.ts` is referenced but doesn't exist, When investigated, Then the reference is removed
3. Given `PRICING_LAST_UPDATED` is set, When the date is >30 days old, Then a warning fires

## Tasks / Subtasks

1. Remove unused trackTokenUsage (AI-L1)
   - Search codebase for imports, delete if unused
2. Clean up drill-parser reference (AI-L3)
   - Verify structured output handles parsing
   - Remove stale reference
3. Add pricing staleness check (AI-L4)
   - Calculate days since `PRICING_LAST_UPDATED`
   - Log warning if >30 days
4. Add unit tests

## Dev Notes

**Findings Covered**: AI-L1, AI-L3, AI-L4
**Files**: `src/features/coaching/token-tracker.ts`, `src/lib/ai/pricing.ts`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
