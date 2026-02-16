# Story 26.3: Fix Chat Input Overflow and Mobile UX

Status: ready-for-dev

## Story

As a mobile user,
I want the chat input to work properly on small screens,
So that I can interact with AI coaching on any device.

## Acceptance Criteria

1. Given viewport <768px, When chat input renders, Then has max-height of 120px with scroll
2. Given chat panel on mobile, When active, Then takes full viewport width with no horizontal overflow
3. Given timing graph on mobile, When displayed, Then uses minimum 12px font and contrasting segment colors

## Tasks / Subtasks

1. Add max-height and overflow-y:auto to chat textarea (DASH-C2)
   - Set max-height: 120px on viewports below 768px
   - Enable vertical scroll when content exceeds max-height
2. Fix chat panel responsive layout for mobile
   - Ensure full viewport width with no horizontal overflow
   - Test on common mobile breakpoints (320px, 375px, 414px)
3. Fix timing graph font size and colors for mobile
   - Set minimum 12px font size for timing graph labels
   - Use contrasting segment colors that pass WCAG AA on small screens

## Dev Notes

**Findings Covered**: DASH-C2, timing graph mobile (HIGH)
**Files**: `src/components/chat/ai-chat-panel.tsx`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
