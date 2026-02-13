# Story 21.7: Expand Growth Mindset Rules

Status: ready-for-dev

## Story

As a musician receiving AI coaching,
I want a comprehensive growth mindset word list with accurate word boundary detection,
So that no discouraging language slips through while keeping false positives minimal.

## Acceptance Criteria

1. Given the growth mindset prohibited word list, When reviewed, Then additional words ("can't", "never", "impossible", "terrible", "awful") are added with replacements
2. Given the expanded word list, When tested against sample responses, Then false positive rate remains below 2%

## Tasks / Subtasks

1. Expand prohibited word list (AI-L6)
   - Add: can't → haven't yet, never → not yet, impossible → challenging, terrible → needs significant work, awful → has room for growth
   - Use word boundary regex: `\b{word}\b`
2. Test for false positives
   - Verify word boundaries prevent partial matches
   - Test with common music terms containing prohibited substrings
3. Add unit tests

## Dev Notes

**Findings Covered**: AI-L6
**File**: `src/features/coaching/growth-mindset-rules.ts`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
