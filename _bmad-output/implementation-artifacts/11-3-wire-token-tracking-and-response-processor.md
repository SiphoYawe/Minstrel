# Story 11.3: Wire Token Tracking and Response Processor into Chat Flow

Status: ready-for-dev

## Story

As a musician,
I want my AI token usage to be tracked and my coaching responses to be richly formatted,
So that I can manage costs and easily parse coaching advice.

## Acceptance Criteria

1. Given the AI chat route processes a response, When it completes (onFinish callback), Then `recordTokenUsage()` is called with the response's token count metadata from the Vercel AI SDK `usage` object. And the token count is sourced from the SDK's actual usage data (not estimated) when available.

2. Given token usage is recorded, When the user views Settings -> Usage Summary, Then actual (not estimated) usage data is displayed via the existing `TokenUsageDisplay` component at `src/app/(auth)/settings/page.tsx:228`. And the `getTotalTokenUsage()` and `getRecentSessionUsage()` functions return data from the `ai_conversations` table.

3. Given the AI returns a coaching response with musical data, When `segmentResponseText()` processes it, Then metrics (e.g., "85%"), timing values (e.g., "120 BPM", "45ms"), chord names (e.g., "Cmaj7", "Dm"), and key references (e.g., "C major") are visually highlighted in the chat using the `HIGHLIGHT_CLASSES` map defined at `src/components/ai-chat-panel.tsx:29-34`.

4. Given the AIChatPanel renders assistant messages, When it displays assistant messages, Then it uses the `HighlightedMessage` component (already implemented at `src/components/ai-chat-panel.tsx:36-57`) which calls `segmentResponseText()`. And this is already wired — verify it works correctly with actual AI responses.

5. Given the token tracker records usage, When data is stored, Then it persists to the Supabase `ai_conversations` table via `recordTokenUsage()` at `src/features/coaching/token-tracker.ts:68`. And the data includes `session_id`, `user_id`, `role`, `content`, `token_count`, `model`, and `provider`.

## Tasks / Subtasks

- [ ] 1. Wire recordTokenUsage into the server-side chat API route (AC: 1, 5)
  - [ ] 1.1 Open `src/app/api/ai/chat/route.ts` line 61-67
  - [ ] 1.2 Add `onFinish` callback to the `streamText()` call that extracts token usage from the response
  - [ ] 1.3 In `onFinish`, call `extractTokenUsage()` from `src/features/coaching/token-tracker.ts:24` to extract `promptTokens`, `completionTokens`, `totalTokens` from the Vercel AI SDK response's `usage` field
  - [ ] 1.4 Call `recordTokenUsage()` from `src/features/coaching/token-tracker.ts:68` with the extracted data. Note: the server-side route needs to use `@/lib/supabase/server` (not client) — either modify `recordTokenUsage` to accept a supabase client, or create a server-specific version
  - [ ] 1.5 Pass `authResult.userId` (from line 52) as `userId`, use `providerId` and the model name, and include the full response text as `content`

- [ ] 2. Fix recordTokenUsage for server-side use (AC: 1, 5)
  - [ ] 2.1 `src/features/coaching/token-tracker.ts` currently imports `createClient` from `@/lib/supabase/client` (browser client, line 1). The chat API route runs server-side.
  - [ ] 2.2 Option A: Refactor `recordTokenUsage` to accept a Supabase client as a parameter so it works in both environments
  - [ ] 2.3 Option B: Create a server-specific version `recordTokenUsageServer()` that imports from `@/lib/supabase/server`
  - [ ] 2.4 Ensure the `ai_conversations` table insert includes all fields: `session_id`, `user_id`, `role`, `content`, `token_count`, `model`, `provider`, `metadata`

- [ ] 3. Verify response processor integration in AIChatPanel (AC: 3, 4)
  - [ ] 3.1 The `HighlightedMessage` component at `src/components/ai-chat-panel.tsx:36-57` already calls `segmentResponseText()` from `src/features/coaching/response-processor.ts:74`
  - [ ] 3.2 Verify the highlight CSS classes at `src/components/ai-chat-panel.tsx:29-34` (`text-metric`, `text-achieved`) are defined in the Tailwind config or global CSS
  - [ ] 3.3 If `text-metric` and `text-achieved` classes are not defined, add them to the design system (amber/gold for metrics, pastel blue for chords/keys)
  - [ ] 3.4 Test with actual AI responses containing percentages, BPM values, chord names, and key references to verify highlighting works

- [ ] 4. Verify token usage data flows to Settings page (AC: 2)
  - [ ] 4.1 Confirm `getTotalTokenUsage()` at `src/features/coaching/token-usage.ts:84` queries the `ai_conversations` table by `user_id`
  - [ ] 4.2 Confirm `getRecentSessionUsage()` at `src/features/coaching/token-usage.ts:97` finds the most recent session's usage
  - [ ] 4.3 Verify the Settings page at `src/app/(auth)/settings/page.tsx:68-86` fetches and displays usage data via `TokenUsageDisplay`
  - [ ] 4.4 Test end-to-end: send a chat message -> token usage recorded -> navigate to Settings -> usage displayed

- [ ] 5. Add tests (AC: 1, 2, 3)
  - [ ] 5.1 Add integration test in `src/app/api/ai/chat/route.test.ts` verifying `onFinish` calls `recordTokenUsage`
  - [ ] 5.2 Update `src/features/coaching/token-tracker.test.ts` with tests for the refactored `recordTokenUsage` (server-compatible)
  - [ ] 5.3 Add test in `src/features/coaching/response-processor.test.ts` verifying real-world AI response strings are correctly segmented

## Dev Notes

- **Architecture Layer**: Layer 4 (Infrastructure) for token tracking persistence; Layer 2 (Presentation) for response formatting in the chat panel.
- The `extractTokenUsage()` function at `src/features/coaching/token-tracker.ts:24-59` already handles the Vercel AI SDK usage object format and has a fallback estimation (~4 chars per token). It expects `{ usage?: { promptTokens, completionTokens, totalTokens }, text?: string }`.
- The `recordTokenUsage()` function at `src/features/coaching/token-tracker.ts:68-85` inserts into the `ai_conversations` Supabase table. **Critical**: It currently uses the browser Supabase client (line 1: `import { createClient } from '@/lib/supabase/client'`). The chat API route at `src/app/api/ai/chat/route.ts` runs server-side and needs `@/lib/supabase/server`.
- The Vercel AI SDK `streamText()` `onFinish` callback provides `{ usage, text, finishReason }` — use this to extract token counts.
- The `HighlightedMessage` component at `src/components/ai-chat-panel.tsx:36-57` is already wired to use `segmentResponseText()`. The rendering path is: `msg.parts` -> extract text -> `segmentResponseText()` -> map segments to `<span>` elements with highlight classes. This is likely already working but needs verification.
- The Settings page at `src/app/(auth)/settings/page.tsx:68-86` already calls `getTotalTokenUsage()` and `getRecentSessionUsage()` and displays them via `TokenUsageDisplay`. The data pipeline needs `recordTokenUsage()` to actually be called to populate the `ai_conversations` table.
- The `sessionId` parameter needed by `recordTokenUsage` is not currently passed in the chat request body. The `ChatRequestSchema` at `src/lib/ai/schemas.ts` may need to include `sessionId`, or it can be derived from the session context.

### Project Structure Notes

- `src/features/coaching/token-tracker.ts` — refactor for server-side compatibility (lines 1, 68-85)
- `src/app/api/ai/chat/route.ts` — add `onFinish` callback to `streamText()` (lines 61-67)
- `src/components/ai-chat-panel.tsx` — verify `HighlightedMessage` component works (lines 29-57)
- `src/features/coaching/response-processor.ts` — reference for `segmentResponseText()` (lines 74-96)
- `src/features/coaching/token-usage.ts` — reference for Settings data flow (lines 84-111)
- `src/app/(auth)/settings/page.tsx` — verify usage display (lines 68-86, 216-241)

### References

- [Source: _bmad-output/planning-artifacts/prd.md] — FR48: Token usage tracking and cost estimation
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.6] — Token usage estimation display
- [Source: _bmad-output/planning-artifacts/architecture.md] — Vercel AI SDK streaming patterns, Supabase server vs client

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
