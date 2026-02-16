# Story 26.2: Fix Growth Mindset Streaming Pre-Filter Before UI

Status: ready-for-dev

## Story

As a user,
I want AI responses to always use growth mindset language from the start,
So that I never see discouraging words even briefly.

## Acceptance Criteria

1. Given AI response streams to chat, When each token arrives, Then growth mindset filtering applied BEFORE token rendered
2. Given word "wrong" appears in AI response, When token processed, Then user NEVER sees "wrong" — only "developing" or equivalent
3. Given streaming pipeline modified, When filtering added, Then no perceptible latency increase (<50ms per token)

## Tasks / Subtasks

1. Move growth mindset filter to pre-render position in streaming pipeline (DASH-C3, Theme 2)
   - Intercept tokens before they reach the UI layer
   - Apply word-boundary-aware replacement at the token level
2. Apply token-level filtering before UI update
   - Buffer partial tokens to handle word splits across chunk boundaries
   - Replace prohibited words before appending to displayed text
3. Benchmark latency impact
   - Measure per-token processing time with and without filter
   - Ensure <50ms overhead per token
4. Test with all prohibited words
   - Verify every word in the prohibited list is caught and replaced
   - Test edge cases: partial words, word boundaries, capitalization

## Dev Notes

**Findings Covered**: DASH-C3, Theme 2
**Files**: `src/lib/ai/growth-mindset.ts`, `src/components/chat/ai-chat-panel.tsx`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
