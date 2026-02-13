# Story 14.5: Fix Snapshot Accuracy and Enrich Content

Status: ready-for-dev

## Story

As a musician,
I want session snapshots to contain accurate, useful data with multiple insights,
So that the snapshot actually helps me understand my playing.

## Acceptance Criteria

1. Given the silence trigger fires for a session snapshot, When the note sample size is fewer than 20 notes, Then the snapshot is generated with a "limited data" indicator
2. Given the snapshot is generated with sufficient data (20+ notes), When the snapshot content is assembled, Then it includes: detected key with confidence, average BPM with range, timing accuracy trend, top 3 chord progressions, and playing style tendencies
3. Given the snapshot generates insights, When the insights are displayed, Then there are 2-3 distinct insights instead of a single keyInsight string
4. Given the snapshot includes BPM, key, and timing values, When any value has low confidence, Then that value is marked with a confidence indicator or omitted
5. Given the snapshot is generated, When it includes chord progression data, Then the progression shows the 3 most common sequences with frequency counts
6. Given the snapshot is generated from a long session (5+ minutes), When the early session data is processed, Then initial notes are included in the trend analysis

## Tasks / Subtasks

1. Add minimum sample size (20 notes) check (AC: 1)
2. Enrich snapshot content with multi-field data (AC: 2)
3. Replace single keyInsight with multi-insight array (AC: 3)
4. Add confidence indicators to snapshot values (AC: 4)
5. Add chord progression frequency analysis (AC: 5)
6. Fix rolling window to include early session data (AC: 6)
7. Update SnapshotData type definition
8. Add tests for snapshot generation accuracy

## Dev Notes

This story fixes the snapshot generation logic to produce richer, more accurate session summaries with multiple insights.

**Architecture Layer**: Application Layer (snapshot generation) + Domain Layer (analysis aggregation)

**Technical Details**:

- Primary files: src/features/analysis/use-analysis-pipeline.ts, src/components/snapshot-cta.tsx, src/components/viz/snapshot-renderer.ts
- Add minimumSampleSize: 20 constant and check before generating detailed insights
- Replace single keyInsight: string with insights: Array<{ category: string; text: string; confidence: number }>
- Chord progression enrichment: aggregate from sessionStore.detectedChords into frequency-sorted sequences
- Snapshot data model change may require updating src/types/
- Trend analysis: include all notes from session start, not just rolling window tail

### Project Structure Notes

**Key files to modify**:

- `src/features/analysis/use-analysis-pipeline.ts` - Add minimum sample size check
- `src/components/snapshot-cta.tsx` - Update snapshot trigger logic
- `src/components/viz/snapshot-renderer.ts` - Render enriched snapshot content
- `src/types/session.ts` - Update SnapshotData type definition
- `src/stores/session-store.ts` - Add chord progression frequency aggregation

**Key files to create**:

- `src/features/analysis/snapshot-generator.ts` - Centralized snapshot generation logic
- `src/features/analysis/snapshot-generator.test.ts` - Unit tests for snapshot accuracy

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
