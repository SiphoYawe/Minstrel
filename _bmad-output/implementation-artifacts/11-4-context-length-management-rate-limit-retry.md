# Story 11.4: Context Length Management and Rate Limit Retry

Status: ready-for-dev

## Story

As a musician having a long coaching conversation,
I want the system to manage context length and handle rate limits gracefully,
So that the chat keeps working without errors.

## Acceptance Criteria

1. Given a coaching chat conversation has accumulated many messages, When the context builder prepares the prompt, Then it applies a sliding window strategy to keep total estimated tokens under the provider's context limit. And the sliding window retains the most recent messages plus the system prompt.

2. Given context truncation is needed, When older messages are trimmed, Then a summary of truncated context is prepended as a system-level note so the AI maintains conversational coherence. And the summary is concise (under 200 tokens) and includes key topics discussed.

3. Given the LLM provider returns a 429 rate limit error, When the error is caught in the chat API route, Then the system retries with exponential backoff (1s, 2s, 4s delays, max 3 retries) before returning an error to the client. And each retry re-invokes `streamText()` with the same parameters.

4. Given the rate limit retry is active, When retrying, Then the client sees a "Waiting for AI provider..." indicator instead of an error. And the existing `RATE_LIMITED` error from `chat-error-handler.ts:10-13` is only shown after all retries are exhausted.

5. Given different providers have different context limits, When the context manager runs, Then it reads the provider-specific limit from a configuration map: OpenAI GPT-4o = 128,000 tokens, Anthropic Claude Sonnet = 200,000 tokens. And the limit is used to calculate how many messages fit.

## Tasks / Subtasks

- [ ] 1. Create context length manager (AC: 1, 2, 5)
  - [ ] 1.1 Create `src/features/coaching/context-length-manager.ts`
  - [ ] 1.2 Export `PROVIDER_CONTEXT_LIMITS: Record<string, number>` mapping provider+model pairs to their context window sizes (OpenAI gpt-4o: 128000, Anthropic claude-sonnet: 200000)
  - [ ] 1.3 Export `estimateTokenCount(text: string): number` — simple estimation at ~4 chars per token (matching the existing pattern at `token-tracker.ts:53`)
  - [ ] 1.4 Export `trimMessagesToFit(messages: Array<{role: string, content: string}>, systemPromptTokens: number, maxContextTokens: number): { trimmedMessages: Array<{role: string, content: string}>, wasTruncated: boolean, truncationSummary: string | null }`
  - [ ] 1.5 The sliding window algorithm: keep the system prompt + always keep the last N messages that fit within `maxContextTokens - systemPromptTokens - summaryBudget`. When truncating, generate a brief summary of removed messages.
  - [ ] 1.6 The summary should capture: number of messages removed, key topics mentioned, any specific musical data referenced

- [ ] 2. Integrate context manager into chat API route (AC: 1, 2, 5)
  - [ ] 2.1 Open `src/app/api/ai/chat/route.ts` line 54-67
  - [ ] 2.2 After building the `systemPrompt` (line 56-59), call `trimMessagesToFit()` on the `messages` array
  - [ ] 2.3 Pass the provider-appropriate context limit based on `providerId` (from `parsed.data` at line 26)
  - [ ] 2.4 If `wasTruncated`, prepend the `truncationSummary` as an additional system message or append it to the system prompt
  - [ ] 2.5 Use the `trimmedMessages` in the `streamText()` call instead of the original messages

- [ ] 3. Add rate limit retry with exponential backoff (AC: 3, 4)
  - [ ] 3.1 Open `src/app/api/ai/chat/route.ts` line 54-68
  - [ ] 3.2 Wrap the `streamText()` call in a retry loop: attempt up to 3 times with delays of 1000ms, 2000ms, 4000ms
  - [ ] 3.3 Catch errors where `error.statusCode === 429` or `error.message` includes "rate" or "429"
  - [ ] 3.4 On non-429 errors, throw immediately (no retry)
  - [ ] 3.5 After all retries exhausted, let the error propagate to `withAiErrorHandling()` at `src/lib/ai/route-helpers.ts:87` which already classifies it as `RATE_LIMITED`

- [ ] 4. Add provider context limit configuration (AC: 5)
  - [ ] 4.1 In `src/features/coaching/context-length-manager.ts`, define context limits per provider
  - [ ] 4.2 Export `getContextLimit(providerId: string, modelId?: string): number` that returns the appropriate limit
  - [ ] 4.3 Default to 8,000 tokens for unknown providers (conservative fallback)

- [ ] 5. Add tests (AC: 1, 2, 3, 5)
  - [ ] 5.1 Create `src/features/coaching/context-length-manager.test.ts`
  - [ ] 5.2 Test: messages under the limit are returned unchanged, `wasTruncated` is false
  - [ ] 5.3 Test: messages over the limit are trimmed, most recent messages preserved, `wasTruncated` is true
  - [ ] 5.4 Test: truncation summary includes count of removed messages
  - [ ] 5.5 Test: system prompt tokens are accounted for in the budget
  - [ ] 5.6 Test: provider-specific limits are correctly applied
  - [ ] 5.7 Test: retry logic exhausts all attempts before failing

## Dev Notes

- **Architecture Layer**: Layer 3 (Domain Logic) for context length management; Layer 4 (Infrastructure) for retry logic in the API route.
- The chat API route at `src/app/api/ai/chat/route.ts` currently passes all messages directly to `streamText()` at line 64 with no truncation. Long conversations will exceed context limits and cause provider errors.
- The `withAiErrorHandling()` wrapper at `src/lib/ai/route-helpers.ts:87-97` catches errors and classifies them via `classifyAiError()`. The rate limit error code is already defined but there is no retry logic — errors are immediately returned.
- The existing `chat-error-handler.ts:10-13` has `RATE_LIMITED` error messaging: "Too many requests right now. Give it a moment and try again." This should only appear after retries are exhausted.
- The `coaching-client.ts` at line 56 calls `useChat()` with `onFinish` and `onError` callbacks. The `onError` handler at line 71-73 is a no-op — errors are shown via the hook's `error` state. No client-side retry indicator exists; the retry happens server-side, transparent to the client.
- Token estimation: `token-tracker.ts:53` uses `Math.ceil(text.length / 4)` — reuse this heuristic for consistency.
- The `DEFAULT_MODELS` at `src/lib/ai/provider.ts:6-9` maps: openai -> 'gpt-4o', anthropic -> 'claude-sonnet-4-20250514'.
- The `messages` array in the request is typed as `Array<{role: string, content: string}>` per the `ChatRequestSchema`.

### Project Structure Notes

- `src/features/coaching/context-length-manager.ts` — create new file for sliding window and provider limits
- `src/features/coaching/context-length-manager.test.ts` — create co-located test file
- `src/app/api/ai/chat/route.ts` — integrate context trimming (lines 54-67) and retry logic
- `src/lib/ai/provider.ts` — reference for DEFAULT_MODELS (lines 6-9)
- `src/lib/ai/route-helpers.ts` — reference for error handling (lines 87-97)
- `src/features/coaching/chat-error-handler.ts` — reference for RATE_LIMITED error (lines 10-13)

### References

- [Source: _bmad-output/planning-artifacts/prd.md] — FR24-28: AI coaching chat, robust error handling
- [Source: _bmad-output/planning-artifacts/architecture.md] — Vercel AI SDK 6.x patterns, error classification, provider abstraction
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — Graceful degradation, user-facing error messaging

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
