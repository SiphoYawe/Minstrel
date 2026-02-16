# Story 26.5: Improve Skill Radar, Token Usage, and Difficulty Display

Status: ready-for-dev

## Story

As a user,
I want to understand my skill profile, monitor AI costs, and see readable difficulty settings,
So that feedback is contextual and costs are transparent.

## Acceptance Criteria

1. Given skill radar chart renders, When displayed, Then each axis has readable label (e.g. "Timing", "Harmony", "Dynamics")
2. Given user in chat session, When tokens consumed, Then small counter shows approximate tokens used in chat panel header
3. Given difficulty card renders, When showing parameters, Then human-readable labels: "Tempo Variation" not "tempoVariability"

## Tasks / Subtasks

1. Add axis labels to skill radar chart component (Skill Radar finding)
   - Add readable text labels to each radar axis
   - Position labels to avoid overlap with chart data
2. Add token usage counter to chat panel header (Token usage finding)
   - Display approximate token count in chat panel header
   - Update in real-time as tokens are consumed during streaming
3. Replace camelCase parameter names with human-readable labels in difficulty card (Difficulty card finding)
   - Create label mapping for all difficulty parameters
   - Render human-readable labels in difficulty card UI

## Dev Notes

**Findings Covered**: Skill Radar (HIGH), Token usage (HIGH), Difficulty card (HIGH)
**Files**: `src/components/dashboard/skill-radar.tsx`, `src/components/chat/`, `src/components/dashboard/difficulty-card.tsx`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
