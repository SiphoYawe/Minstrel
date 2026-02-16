# Story 27.3: Add Mid-Session Key Expiry Detection

Status: ready-for-dev

## Story

As a user practicing,
I want to be told if my API key expires mid-session,
So that I understand why AI features stopped working and can fix it.

## Acceptance Criteria

1. Given AI API call fails with auth error, When detected, Then non-disruptive banner shows: "Your API key may have expired. Update it in Settings to continue coaching."
2. Given key status changes from active to expired, Then key status badge updates immediately
3. Given key expiry during session, Then practice data continues recording (only AI features affected)

## Tasks / Subtasks

1. Detect auth errors in AI API call responses (SET-C5)
   - Intercept 401/403 responses from AI provider calls
   - Distinguish auth errors from other API failures
2. Show non-disruptive key expiry banner
   - Create dismissible banner component for key expiry
   - Include direct link to Settings for key update
3. Update key status badge in real-time
   - Sync key status state when auth error detected
   - Reflect expired state in all UI locations showing key status
4. Ensure practice recording continues independently
   - Verify MIDI recording pipeline is decoupled from AI calls
   - Add test confirming practice data persists during AI outage

## Dev Notes

**Findings Covered**: SET-C5
**Files**: `src/lib/api-key-validation.ts`, `src/components/chat/ai-chat-panel.tsx`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
