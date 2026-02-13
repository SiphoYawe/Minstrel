# Story 15.4: Add Drill Persistence to IndexedDB

Status: ready-for-dev

## Story

As a musician,
I want my generated drills to be saved so I can replay them later and track my progress,
So that I build a library of personalized exercises over time.

## Acceptance Criteria

1. Given a drill is generated via the drill API, When the generation completes successfully, Then the drill is automatically saved to IndexedDB with: drill ID, name, target skill, difficulty, note sequences, generation timestamp, and the snapshot context that triggered it
2. Given saved drills exist in IndexedDB, When the user navigates to a drill history view, Then a list of past drills is displayed with: drill name, target skill, date, number of attempts, and best score
3. Given the user views a past drill in the history, When they click "Restart", Then the drill loads into the DrillController with full phase flow
4. Given the user completes a drill attempt, When the results are computed, Then the attempt results are appended to the drill's attempts array in IndexedDB
5. Given a drill has been attempted multiple times, When the user views the drill in history, Then a progress indicator shows improvement over time
6. Given drills are stored in IndexedDB, When the user is authenticated with Supabase, Then drill data syncs to the server for cross-device persistence

## Tasks / Subtasks

1. Add drills table to Dexie.js schema (AC: 1)
2. Auto-save drill on generation completion (AC: 1)
3. Create drill history view component (AC: 2)
4. Implement "Restart" drill from history (AC: 3)
5. Append attempt results to drill record (AC: 4)
6. Add progress indicator for multi-attempt drills (AC: 5)
7. Implement Dexie → Supabase sync for drills (AC: 6)
8. Add tests for drill persistence

## Dev Notes

**Architecture Layer**: Infrastructure + Application

- Add new Dexie.js table for drill persistence
- Implement drill history UI component
- Add Supabase sync for cross-device drill library

### Project Structure Notes

**Primary files to modify/create**:

- `src/stores/session-store.ts` (add drills table to Dexie schema)
- `src/features/drills/drill-generator.ts` (auto-save on generation)
- `src/components/drill-history.tsx` (NEW - drill history view)
- `src/features/drills/drill-sync.ts` (NEW - Dexie → Supabase sync)
- `src/features/drills/types.ts` (drill and attempt types)

**Technical implementation details**:

- Add a drills table to the Dexie.js schema with fields: id, name, targetSkill, difficulty, notes, generationContext, attempts, createdAt
- Drill history view should be a tab or section within the Dashboard (Epic 14.1)
- Sync pattern: follow existing Dexie → Supabase sync from session store
- Drill results model: `{ attemptId, timestamp, score, timingAccuracy, notesHit, notesMissed, duration }`
- Drill schema:
  ```typescript
  interface DrillRecord {
    id: string;
    name: string;
    targetSkill: string;
    difficulty: number;
    notes: DrillNote[];
    generationContext: {
      snapshotId: string;
      weakness: string;
      suggestedFocus: string;
    };
    attempts: AttemptResult[];
    createdAt: number;
    updatedAt: number;
    syncedAt?: number;
  }
  ```
- Progress indicator: show trend line of scores over attempts, with visual indicator for improvement/decline
- Supabase sync: create `drills` table in Supabase with same schema, sync on auth state change + after each attempt

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]
- [Source: _bmad-output/planning-artifacts/architecture.md - Dexie.js + Supabase sync patterns]
- [Source: src/stores/session-store.ts - Existing Dexie schema and sync]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
