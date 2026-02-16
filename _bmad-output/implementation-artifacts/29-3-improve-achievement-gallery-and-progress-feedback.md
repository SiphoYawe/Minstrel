# Story 29.3: Improve Achievement Gallery and Progress Feedback

Status: done

## Story

As a user,
I want achievements and progress to be motivating and clear,
So that I feel encouraged rather than overwhelmed.

## Acceptance Criteria

1. Given new user opens achievement gallery, When rendered, Then only 3-5 "next up" achievements with clear unlock conditions
2. Given achievement earned, When toast appears, Then persists for 8 seconds with "View" button
3. Given personal records display, When shown, Then specific: "Solid Tempo — 85% timing accuracy at 120 BPM"
4. Given progress trend insights, When shown, Then include action: "Timing peaked at 94% — try extending to scales"

## Tasks / Subtasks

1. Limit achievement gallery initial view to 3-5 next achievements
   - Filter to show only nearest unlockable achievements
   - Display clear unlock conditions for each
2. Extend achievement toast to 8 seconds with View button
   - Update toast duration from default to 8 seconds
   - Add "View" button that navigates to achievement gallery
3. Rewrite personal record descriptions with specific metrics
   - Include concrete values: accuracy %, BPM, note counts
   - Format: "Achievement Name — metric detail"
4. Add actionable suggestions to progress trend insights
   - Pair trend data with specific practice recommendations
5. Add unit tests

## Dev Notes

**Findings Covered**: Achievement gallery (HIGH), toast duration (HIGH), personal records (HIGH), progress trends (MEDIUM)
**Files**: `src/components/achievements/`, `src/components/progress/`

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes List

- Increased toast DISMISS_MS from 4000 to 8000 (8 seconds)
- Added "View" Link button to achievement toast navigating to /dashboard?tab=achievements
- Added UNLOCK_HINTS map with human-readable unlock conditions for all 19 achievements
- Locked gallery items now show "How to unlock: ..." text below "Not yet earned"
- Added getRecordDescription() generating specific metric descriptions per record type
- Record cards now show contextual descriptions like "Fastest clean tempo — 142 BPM with accurate timing"
- Added ACTION_SUGGESTIONS constant with dimension-specific actionable practice recommendations
- Progress trend insights now append actionable suggestions (e.g., "Try extending to scales or faster tempos")
- Updated toast test DISMISS_MS from 4000 to 8000
- Added 10 new tests across 4 test files (76 tests total, all passing)

### File List

- src/components/achievement-toast.tsx
- src/components/achievement-toast.test.tsx
- src/components/achievement-gallery.tsx
- src/components/achievement-gallery.test.tsx
- src/components/personal-records.tsx
- src/components/personal-records.test.tsx
- src/features/engagement/progress-aggregator.ts
- src/features/engagement/progress-aggregator.test.ts
