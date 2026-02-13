# Story 18.7: Fix Token Usage Extraction and Growth Mindset Stream Filtering

Status: ready-for-dev

## Story

As a cost-conscious musician using BYOK,
I want accurate token billing and real-time growth mindset filtering,
So that my token usage tracking is precise and I never see discouraging language during coaching.

## Acceptance Criteria

1. Given the chat API route processes a streaming response, When `onFinish` fires, Then `extractTokenUsage` receives `result.usage` (the actual token counts from the AI SDK), not a text object
2. Given the AI SDK returns actual token usage data, When extracted, Then the token count is accurate (not character-based estimation)
3. Given the AI streams a response containing prohibited words ("wrong", "bad", "failed"), When the text reaches the client, Then the words have been replaced by growth-mindset alternatives via a TransformStream applied before the response is sent
4. Given the `createGrowthMindsetTransform()` function exists, When wired into the chat route, Then it processes every text chunk before it reaches the client

## Tasks / Subtasks

1. Fix token usage extraction (AI-C1)
   - Change `extractTokenUsage({ text })` to `extractTokenUsage(result.usage)` in chat route
   - Update extractTokenUsage signature to accept AI SDK usage object
2. Create TransformStream for growth mindset filtering (AI-C3)
   - Create `createGrowthMindsetTransform()` in `src/features/coaching/growth-mindset-rules.ts`
   - Implement TransformStream that decodes chunks, applies word replacement, re-encodes
   - Handle chunk boundaries (word split across chunks)
3. Wire transform into chat route
   - Pipe result.textStream through growth mindset transform before sending to client
4. Add unit tests
   - AI response uses 1000 tokens → extractTokenUsage receives correct usage object
   - Stream contains "That was wrong" → client receives "That's not quite there yet"
   - All prohibited words replaced before reaching client

## Dev Notes

**Architecture Layer**: Application Layer (AI chat), Domain Layer (coaching)
**Findings Covered**: AI-C1, AI-C3
**File**: `src/app/api/ai/chat/route.ts` (lines 153-174)
**Current Issue**: `extractTokenUsage` called with `{ text }` but Vercel AI SDK `streamText` result has usage in `result.usage`. Growth mindset replacement only in `onFinish` — users see prohibited words in stream.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
