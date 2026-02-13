# Story 19.5: Fix AI Token Budget, Context Management, and Error Classification

Status: ready-for-dev

## Story

As a musician chatting with the AI coach,
I want accurate token estimation, enforced budgets, proper context injection, and clear error messages,
So that AI requests stay within limits, context is handled correctly, and errors are meaningful.

## Acceptance Criteria

1. Given token estimation is needed, When the context length manager runs, Then it uses a more accurate estimation method (content-type awareness)
2. Given any chat request, When token budget is checked, Then a hardcoded maximum of ~8K tokens per request is enforced
3. Given context trimming produces a summary, When injected into the conversation, Then it uses `role: 'system'` (not `role: 'assistant'`)
4. Given an AI provider returns an error, When the error is classified, Then classification uses structured error response fields (`error.code`, `error.type`) not regex on message strings

## Tasks / Subtasks

1. Improve token estimation (AI-H1)
   - Add content-type multipliers (code: 1.2x, numbers: 0.8x)
   - Replace fixed 4 chars/token ratio with adaptive estimation
2. Add per-request token budget (AI-H2)
   - Calculate total tokens before sending
   - Trim context to 8K tokens if exceeded
3. Fix context summary role (AI-H3)
   - Change `role: 'assistant'` to `role: 'system'` for context trimming summaries
4. Fix error classification (AI-H5)
   - Use structured fields: `error.code`, `error.type`
   - Fallback to message matching only if structured fields absent
5. Add unit tests for all fixes

## Dev Notes

**Architecture Layer**: Application Layer (AI), Infrastructure Layer (errors)
**Findings Covered**: AI-H1, AI-H2, AI-H3, AI-H5
**Files**: `src/features/coaching/context-length-manager.ts` (lines 27-29), `src/app/api/ai/chat/route.ts` (lines 119-189), `src/lib/ai/errors.ts` (lines 43-62)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
