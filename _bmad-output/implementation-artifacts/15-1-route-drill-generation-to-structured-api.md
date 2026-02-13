# Story 15.1: Route Drill Generation to Structured API

Status: ready-for-dev

## Story

As a musician,
I want the "Generate Drill" action to produce an actual playable drill with note sequences,
So that I can practice targeted exercises instead of reading chat text about what I should practice.

## Acceptance Criteria

1. Given the user clicks "Generate Drill" on the SnapshotCTA, When the drill request is initiated, Then it calls the /api/ai/drill endpoint directly with structured output parameters, NOT the chat endpoint
2. Given the drill API returns a structured response, When the response is parsed, Then it contains a DrillController-compatible format with: drill name, target skill, difficulty level, note sequences (as MIDI note numbers with timing and velocity), and phase instructions
3. Given the drill response is received, When the UI updates, Then a dedicated Drill Panel opens (not the chat panel) showing the drill card with drill name, target skill tag, difficulty indicator, Preview button, and Start button
4. Given the drill API call is in progress, When the user sees the UI, Then a loading indicator appears on the "Generate Drill" button itself
5. Given the drill API call fails, When the error is returned, Then a clear error message is shown on the drill card with a "Retry" option
6. Given no API key is configured, When the user clicks "Generate Drill", Then the graceful degradation prompt is shown

## Tasks / Subtasks

1. Remove pendingDrillRequest → chat message flow from dashboard-chat.tsx (AC: 1)
2. Create useDrillGeneration hook calling /api/ai/drill directly (AC: 1)
3. Parse structured drill response into DrillController format (AC: 2)
4. Create Drill Panel component for drill display (AC: 3)
5. Add loading indicator on Generate Drill button (AC: 4)
6. Add error handling with Retry option (AC: 5)
7. Add API key guard with graceful degradation (AC: 6)
8. Add tests for drill generation flow

## Dev Notes

**Architecture Layer**: Application + Presentation

- Remove broken chat-based drill generation flow
- Implement direct API call to structured drill endpoint
- Create dedicated drill UI component separate from chat

### Project Structure Notes

**Primary files to modify/create**:

- `src/features/modes/dashboard-chat.tsx` (lines 24-35 — the broken effect that sends drill as chat)
- `src/components/snapshot-cta.tsx`
- `src/app/api/ai/drill/route.ts`
- `src/features/drills/drill-generator.ts`
- `src/hooks/use-drill-generation.ts` (NEW)
- `src/components/drill-panel.tsx` (NEW)

**Technical implementation details**:

- Remove the pendingDrillRequest → chat message flow in dashboard-chat.tsx
- Call drill-generator.ts directly from snapshot-cta.tsx or a new useDrillGeneration hook
- The /api/ai/drill endpoint uses structured output schema — ensure the response shape matches DrillController expectations
- Drill Panel should be a new component that renders outside the chat panel area
- DrillController-compatible format includes: `{ name: string, targetSkill: string, difficulty: number, notes: Array<{ midi: number, timing: number, velocity: number, duration: number }>, phases: string[] }`

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]
- [Source: _bmad-output/planning-artifacts/architecture.md - Drill generation patterns]
- [Source: src/features/modes/dashboard-chat.tsx - Current broken implementation]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
