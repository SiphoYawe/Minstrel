# Story 20.7: Fix AI Observability and Logging

Status: ready-for-dev

## Story

As a developer operating Minstrel,
I want error parsing decoupled from store mutation, accurate analytics user IDs, and logging for dropped message parts,
So that code is maintainable, analytics are accurate, and data loss is visible.

## Acceptance Criteria

1. Given `parseChatError` processes an error, When it identifies an invalid key, Then it returns the error info without directly mutating global store
2. Given a PostHog event is captured from the drill route, When `distinctId` is set, Then it uses `authResult.userId` (not hardcoded `'server'`)
3. Given `uiMessagesToSimple` filters messages, When non-text parts are encountered, Then a warning is logged

## Tasks / Subtasks

1. Decouple parseChatError from store mutation (AI-M7)
   - Return `{ type: string, action?: string }` instead of mutating store
   - Caller handles store update
2. Fix PostHog distinctId (AI-M10)
   - Use `authResult.userId` instead of `'server'`
3. Log dropped message parts (AI-M11)
   - Add `console.warn` when non-text parts are filtered
4. Add unit tests

## Dev Notes

**Findings Covered**: AI-M7, AI-M10, AI-M11
**Files**: `src/features/coaching/chat-error-handler.ts`, `src/app/api/ai/drill/route.ts`, `src/features/coaching/message-adapter.ts`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
