# Story 3.6: Token Usage Estimation Display

Status: ready-for-dev

## Story

As a user,
I want to see estimated token usage and cost per session,
So that I can manage my LLM API spending transparently.

## Acceptance Criteria

1. **Given** a user has an API key configured and uses AI features (coaching chat, drill generation, analysis), **When** the Vercel AI SDK returns response metadata, **Then** the token count (prompt tokens + completion tokens) is extracted from the AI SDK response and stored per interaction in the `ai_conversations` table alongside the message content.

2. **Given** a user is viewing a session that involved AI interactions, **When** the session summary renders, **Then** cumulative token usage for that session is displayed in a clear, non-alarming format (e.g., "~2,400 tokens this session, est. $0.03").

3. **Given** the system needs to estimate costs, **When** calculating the cost display, **Then** estimated cost is calculated using a provider pricing configuration that maps provider + model to price-per-token (input and output separately), and the pricing config is easily updatable without code changes.

4. **Given** a user views the Settings page, **When** they scroll to the API Keys section, **Then** a "Usage Summary" subsection displays: total tokens used across all sessions, estimated total cost, and token count for the most recent session.

5. **Given** token data needs to be stored, **When** an AI interaction completes, **Then** the `ai_conversations` table row includes `token_count` (total tokens), `model` (model name used), and `provider` (provider name), enabling accurate historical cost calculation.

6. **Given** the cost estimation may be imprecise, **When** displaying costs, **Then** the display always uses the "approximately" indicator (~) and includes a disclaimer: "Cost estimates are approximate and based on published pricing. Check your provider dashboard for actual charges."

7. **Given** a user has made no AI interactions, **When** they view usage data, **Then** the display shows "No AI usage yet" rather than "$0.00" or empty space.

## Tasks / Subtasks

- [ ] Task 1: Create provider pricing configuration (AC: 3)
  - [ ] Create `src/lib/ai/pricing.ts` with pricing configuration object
  - [ ] Define `ProviderPricing` type: `{ [provider: string]: { [model: string]: { inputPer1kTokens: number, outputPer1kTokens: number } } }`
  - [ ] Populate with current pricing for supported providers:
    - OpenAI: `gpt-4o` ($2.50/$10.00 per 1M), `gpt-4o-mini` ($0.15/$0.60 per 1M), etc.
    - Anthropic: `claude-sonnet-4-20250514` ($3.00/$15.00 per 1M), `claude-3-5-haiku` ($0.25/$1.25 per 1M), etc.
  - [ ] Export `estimateCost(provider: string, model: string, inputTokens: number, outputTokens: number): number` function
  - [ ] Include a `DEFAULT_PRICING` fallback for unknown models (use average of known models)
  - [ ] Add `PRICING_LAST_UPDATED` constant with the date the pricing was last checked

- [ ] Task 2: Create token tracking utility (AC: 1, 5)
  - [ ] Create `src/features/coaching/token-tracker.ts` with `recordTokenUsage(params: TokenUsageParams): Promise<void>` function
  - [ ] Define `TokenUsageParams`: `{ sessionId: string, userId: string, role: string, content: string, tokenCount: number, model: string, provider: string, metadata?: Record<string, unknown> }`
  - [ ] Function inserts a row into `ai_conversations` table via Supabase client (server-side call from API route, or client-side with RLS)
  - [ ] Extract token data from Vercel AI SDK response: `response.usage?.promptTokens`, `response.usage?.completionTokens`, `response.usage?.totalTokens`
  - [ ] If token count is not provided by the SDK (some providers omit it), estimate using a character-based approximation: `Math.ceil(text.length / 4)` as a rough tokens estimate
  - [ ] Export `extractTokenUsage(aiResponse: any): { promptTokens: number, completionTokens: number, totalTokens: number }` utility

- [ ] Task 3: Create token usage aggregation queries (AC: 2, 4)
  - [ ] Create `src/features/coaching/token-usage.ts` with aggregation functions
  - [ ] `getSessionTokenUsage(sessionId: string): Promise<TokenUsageSummary>` — queries `ai_conversations` for a specific session, sums token counts, calculates estimated cost
  - [ ] `getTotalTokenUsage(userId: string): Promise<TokenUsageSummary>` — queries all `ai_conversations` for the user, aggregates totals
  - [ ] `getRecentSessionUsage(userId: string): Promise<TokenUsageSummary | null>` — gets usage for the most recent session
  - [ ] Define `TokenUsageSummary`: `{ totalTokens: number, promptTokens: number, completionTokens: number, estimatedCost: number, interactionCount: number, provider: string | null, model: string | null }`

- [ ] Task 4: Create TokenUsageDisplay component (AC: 2, 6, 7)
  - [ ] Create `src/features/coaching/token-usage-display.tsx` component
  - [ ] Accepts props: `{ summary: TokenUsageSummary | null, variant: 'session' | 'total' | 'compact' }`
  - [ ] `session` variant: "~2,400 tokens this session, est. $0.03"
  - [ ] `total` variant: "Total usage: ~48,200 tokens, est. $1.24" with interaction count
  - [ ] `compact` variant: "~$0.03" (for inline display in session cards)
  - [ ] When `summary` is null or `totalTokens === 0`: show "No AI usage yet"
  - [ ] Always prefix cost with "~" and format as currency with 2 decimal places
  - [ ] Include the disclaimer text below the total variant: "Cost estimates are approximate and based on published pricing. Check your provider dashboard for actual charges."
  - [ ] Style with dark studio aesthetic: muted text color (`#6B7280`), small font size for cost display, non-alarming presentation

- [ ] Task 5: Integrate token usage display into session summary (AC: 2)
  - [ ] Update the session summary component (placeholder from Epic 2, or create a minimal version if not yet built) to include `TokenUsageDisplay` with variant `'session'`
  - [ ] Fetch session token usage when session summary is rendered
  - [ ] Display below the session metrics (key, tempo, accuracy) in a separate "AI Usage" subsection

- [ ] Task 6: Integrate token usage into settings page (AC: 4)
  - [ ] Update `src/app/(auth)/settings/page.tsx` to add a "Usage Summary" subsection within the API Keys section
  - [ ] Fetch total usage and recent session usage on settings page load
  - [ ] Render `TokenUsageDisplay` with variant `'total'` for cumulative stats
  - [ ] Render `TokenUsageDisplay` with variant `'session'` for the most recent session
  - [ ] Only display the usage section when the user has an API key configured (`hasApiKey`)

- [ ] Task 7: Format helpers (AC: 2, 6)
  - [ ] Create `src/lib/format-utils.ts` (or add to `src/lib/utils.ts`) with formatting functions:
    - `formatTokenCount(tokens: number): string` — formats with commas and ~ prefix (e.g., "~2,400")
    - `formatEstimatedCost(cost: number): string` — formats as currency with ~ prefix (e.g., "~$0.03")
    - `formatTokenSummary(tokens: number, cost: number): string` — combined format (e.g., "~2,400 tokens, est. $0.03")

- [ ] Task 8: Write tests (AC: all)
  - [ ] Create `src/lib/ai/pricing.test.ts` testing: estimateCost for known models, fallback pricing for unknown models, zero tokens returns zero cost
  - [ ] Create `src/features/coaching/token-tracker.test.ts` testing: extractTokenUsage from mock AI SDK responses, estimation fallback when tokens not provided
  - [ ] Create `src/features/coaching/token-usage.test.ts` testing: session aggregation, total aggregation, empty results
  - [ ] Create `src/features/coaching/token-usage-display.test.tsx` testing: renders session variant, renders total variant with disclaimer, renders "No AI usage yet" for empty data, formats numbers correctly
  - [ ] Create `src/lib/format-utils.test.ts` testing: formatTokenCount, formatEstimatedCost, formatTokenSummary with various inputs

## Dev Notes

- **Vercel AI SDK Token Metadata**: The Vercel AI SDK 6.x `streamText` and `generateObject` responses include `usage` in their response metadata: `response.usage.promptTokens`, `response.usage.completionTokens`. However, availability depends on the provider. OpenAI consistently returns token counts; Anthropic also returns them. The fallback estimation is a safety net.
- **Cost Calculation Accuracy**: This feature provides estimates, not exact charges. Provider pricing changes frequently, and actual billing depends on factors like cached tokens, batching, and pricing tiers. The `~` prefix and disclaimer are critical to set correct user expectations.
- **Pricing Updates**: The pricing config is a TypeScript constant, not fetched dynamically. When providers update pricing, a code change is needed. Include `PRICING_LAST_UPDATED` so stale pricing is visible. Consider a future enhancement to fetch pricing from provider APIs.
- **Token Tracking Integration Point**: This story creates the tracking infrastructure but does NOT integrate it into the actual AI API routes (those are in Epic 4). The `recordTokenUsage` and `extractTokenUsage` functions are designed to be called from `/api/ai/chat/route.ts`, `/api/ai/drill/route.ts`, and `/api/ai/analyze/route.ts` when those routes are implemented. The integration is straightforward: after receiving the AI response, call `recordTokenUsage` with the response metadata.
- **Database Query Efficiency**: Token aggregation queries should use Supabase's aggregation capabilities: `SELECT SUM(token_count) as total_tokens FROM ai_conversations WHERE user_id = $1 AND session_id = $2`. Avoid loading all conversation rows into memory and summing client-side.
- **Non-Alarming Presentation**: Per the UX design principles, cost display should never feel like a warning. Use muted colors, small text, and approximate language. The goal is transparency, not anxiety. "~$0.03" is informative. "WARNING: You spent $0.03" is wrong.
- **Architecture Layer**: Pricing config is Layer 4 (Infrastructure). Token tracking is Layer 3 (Domain). Token usage display is Layer 1 (Presentation). Aggregation queries use Layer 4 (Supabase client via `@/lib/supabase/server`).

### Project Structure Notes

Files created/modified in this story:
```
src/lib/ai/pricing.ts                       (create)
src/features/coaching/token-tracker.ts       (create)
src/features/coaching/token-usage.ts         (create)
src/features/coaching/token-usage-display.tsx (create)
src/lib/format-utils.ts                     (create)
src/app/(auth)/settings/page.tsx            (update - add usage summary)
src/lib/ai/pricing.test.ts                  (create)
src/features/coaching/token-tracker.test.ts  (create)
src/features/coaching/token-usage.test.ts    (create)
src/features/coaching/token-usage-display.test.tsx (create)
src/lib/format-utils.test.ts               (create)
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns — Vercel AI SDK 6.x]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture — ai_conversations table]
- [Source: _bmad-output/planning-artifacts/architecture.md#Gap Analysis — Token usage estimation FR50]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.6]
- [Source: _bmad-output/planning-artifacts/prd.md#FR50]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Non-alarming presentation principles]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
