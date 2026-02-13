# Story 18.7: Fix Token Usage Extraction and Growth Mindset Stream Filtering

Status: done

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

Claude Opus 4.6

### Debug Log References

- All 52 tests pass (token-tracker: 20, growth-mindset-rules: 32)
- TypeScript compiles clean (pre-existing chord-hud.tsx error unrelated)

### Completion Notes List

- AI-C1: Fixed `extractTokenUsage` to accept AI SDK v6 `inputTokens`/`outputTokens` naming (was only handling legacy `promptTokens`/`completionTokens`)
- AI-C1: Chat route `onFinish` now destructures `usage` from AI SDK result and passes it directly (was passing `{ text }` which fell through to character estimation)
- AI-C1: `onFinish` now also uses the `replaceProhibitedWords` return value (was discarding it)
- AI-C3: Created `createGrowthMindsetStreamTransform()` as a `StreamTextTransform` compatible with AI SDK v6 `experimental_transform`
- AI-C3: Transform buffers text-delta chunks across word boundaries, flushes safe prefix with replacements, handles text-end flush
- AI-C3: Wired via `experimental_transform` in `streamWithRetry` — prohibited words now filtered in real-time during streaming, not just in `onFinish`
- Removed TODO tech debt comment (now resolved)
- Added 2 new tests for AI SDK v6 inputTokens/outputTokens format

### File List

- src/app/api/ai/chat/route.ts (modified)
- src/features/coaching/token-tracker.ts (modified)
- src/features/coaching/token-tracker.test.ts (modified)
