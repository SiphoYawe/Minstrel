# Story 20.9: Fix Chat UX — Scroll, Form Submit, Color Logic

Status: ready-for-dev

## Story

As a musician using the AI chat,
I want auto-scroll to respect my reading position, form validation to run properly, and drill improvement to have distinct visual feedback,
So that reading isn't interrupted, submissions are validated, and negative progress is visually distinguishable.

## Acceptance Criteria

1. Given a new message arrives in the chat panel, When the user is NOT scrolled to the bottom, Then auto-scroll does NOT fire
2. Given the chat form submission handler, When Enter is pressed, Then `form.requestSubmit()` is used instead of dispatching synthetic Event
3. Given drill improvement is negative, When displayed, Then it uses a distinct color from zero improvement

## Tasks / Subtasks

1. Fix auto-scroll to check position (UI-M4)
   - Check `scrollHeight - scrollTop === clientHeight` before scrolling
2. Fix form submission (UI-M5)
   - Replace `form.dispatchEvent(new Event('submit'))` with `form.requestSubmit()`
3. Add distinct color for negative improvement (UI-M6)
   - Negative: `text-accent-warm`, Zero: `text-muted-foreground`, Positive: `text-accent-success`
4. Add unit tests

## Dev Notes

**Findings Covered**: UI-M4, UI-M5, UI-M6
**Files**: `src/components/ai-chat-panel.tsx`, `src/components/drill-controller.tsx`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
