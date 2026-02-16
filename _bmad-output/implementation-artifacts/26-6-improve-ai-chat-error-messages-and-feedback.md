# Story 26.6: Improve AI Chat Error Messages and Feedback

Status: ready-for-dev

## Story

As a user encountering chat errors,
I want specific guidance on how to fix the problem,
So that I can resolve issues and continue my practice.

## Acceptance Criteria

1. Given AI chat error occurs, When error shows, Then includes specific action: "API key may have expired — check Settings" or "Rate limit reached — try again in [countdown]"
2. Given chat input placeholder, When empty, Then accurately describes capability: "Ask about your playing, request a drill, or get coaching tips"
3. Given Studio Engineer icon, When displayed, Then 40px minimum with clear visual identity

## Tasks / Subtasks

1. Create error type mapping with actionable messages (Chat errors finding)
   - Map error codes/types to user-facing messages with specific actions
   - Include API key expiry, rate limit (with countdown), network errors, and generic fallback
2. Update placeholder text to be accurate (placeholder finding)
   - Change chat input placeholder to "Ask about your playing, request a drill, or get coaching tips"
3. Increase Studio Engineer icon to 40px+ (icon size finding)
   - Set minimum icon size to 40px
   - Ensure clear visual identity at that size

## Dev Notes

**Findings Covered**: Chat errors (HIGH), placeholder (HIGH), icon size (HIGH)
**Files**: `src/components/chat/ai-chat-panel.tsx`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
