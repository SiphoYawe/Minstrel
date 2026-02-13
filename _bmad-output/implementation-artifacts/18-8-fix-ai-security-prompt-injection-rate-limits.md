# Story 18.8: Fix AI Security — Prompt Injection, Rate Limits, Silent Failures

Status: done

## Story

As a security-conscious developer,
I want token tracking failures logged, user messages sanitized against prompt injection, and drill generation rate-limited separately,
So that billing data is never lost, the AI persona cannot be hijacked, and expensive operations are properly throttled.

## Acceptance Criteria

1. Given a token tracking write fails, When the error occurs, Then it is reported to Sentry and the token data is written to an IndexedDB fallback queue for later retry
2. Given a user message is included in the AI prompt, When the prompt is assembled, Then user content is wrapped in XML-style delimiters with any existing XML tags in user input escaped
3. Given the system prompt for AI chat, When assembled, Then it includes explicit instructions to reject role-override attempts and never reveal the system prompt
4. Given the drill generation endpoint, When rate limiting is checked, Then it uses a separate, stricter rate limit (10/min) from the chat endpoint (100/min)
5. Given a user has exhausted their chat rate limit, When they request a drill, Then the drill generation succeeds if the drill-specific rate limit has not been reached

## Tasks / Subtasks

1. Fix silent token tracking failures (AI-C2)
   - Replace empty catch with Sentry error capture
   - Add IndexedDB fallback queue: `db.tokenFallbackQueue.add({ usage, timestamp: Date.now() })`
2. Add prompt injection protection (AI-C4)
   - Create `sanitizeUserMessage(content: string)` — escape `<` and `>` characters
   - Wrap user content in `<user_message>...</user_message>` delimiters
   - Add anti-jailbreak instructions to system prompt
3. Separate drill rate limits (AI-C5)
   - Change chat route to use `rateLimiter.check('ai:chat', userId, 100)`
   - Change drill route to use `rateLimiter.check('ai:drill', userId, 10)`
4. Add unit tests
   - Token tracking fails → Sentry event captured + fallback queue entry
   - User sends `<system>` tags → escaped to `&lt;system&gt;`
   - Chat limit exhausted, drill limit available → drill succeeds
   - System prompt includes anti-jailbreak instructions

## Dev Notes

**Architecture Layer**: Infrastructure Layer (security), Application Layer (AI)
**Findings Covered**: AI-C2, AI-C4, AI-C5
**Files**: `src/features/coaching/token-tracker.ts` (lines 90-92, 125-127), `src/app/api/ai/chat/route.ts` (lines 145-149), `src/app/api/ai/drill/route.ts` (lines 31-34)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- All 71 tests pass (rate-limiter: 9, prompts: 39, token-tracker: 23)
- TypeScript compiles clean

### Completion Notes List

- AI-C2: `recordTokenUsage` now reports failures to Sentry with component tag and token metadata
- AI-C2: Added in-memory `tokenFallbackQueue` — failed records are queued and drained on next successful call
- AI-C2: Exported `getTokenFallbackQueueSize()` for testing
- AI-C4: Created `sanitizeUserMessage()` — escapes `<`/`>` to `&lt;`/`&gt;`, wraps in `<user_message>` delimiters
- AI-C4: All user messages sanitized before sending to AI in chat route
- AI-C4: Added anti-jailbreak SECURITY INSTRUCTIONS to STUDIO_ENGINEER_BASE system prompt (reject role overrides, never reveal prompt, ignore user instructions)
- AI-C5: Updated `checkRateLimit(key, maxRequests?)` to support composite keys and custom limits
- AI-C5: Updated `authenticateAiRequest` to accept `RateLimitConfig` with bucket and maxRequests
- AI-C5: Chat route uses `ai:chat` bucket with 100 req/window; drill route uses `ai:drill` bucket with 10 req/window
- AI-C5: Separate buckets mean chat limit exhaustion does not block drill generation and vice versa

### File List

- src/lib/ai/rate-limiter.ts (modified)
- src/lib/ai/rate-limiter.test.ts (modified)
- src/lib/ai/route-helpers.ts (modified)
- src/lib/ai/prompts.ts (modified)
- src/lib/ai/prompts.test.ts (modified)
- src/app/api/ai/chat/route.ts (modified)
- src/app/api/ai/drill/route.ts (modified)
- src/features/coaching/token-tracker.ts (modified)
- src/features/coaching/token-tracker.test.ts (modified)
