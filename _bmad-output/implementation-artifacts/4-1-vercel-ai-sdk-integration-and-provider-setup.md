# Story 4.1: Vercel AI SDK Integration and Provider Setup

Status: done

## Story

As a developer,
I want the AI service layer configured with Vercel AI SDK for provider-agnostic LLM access,
So that all AI features use a consistent, secure integration pattern.

## Acceptance Criteria

1. **Given** the Architecture specifies Vercel AI SDK 6.x (AR4), **When** the AI service layer is implemented, **Then** `src/lib/ai/provider.ts` initializes the Vercel AI SDK with dynamic provider selection based on the user's configured key (OpenAI, Anthropic, or other supported providers). **And** the provider is selected at request time, not at app startup.

2. **Given** the UX specification defines the Studio Engineer AI persona (UX10), **When** system prompts are created, **Then** `src/lib/ai/prompts.ts` contains the Studio Engineer persona system prompt: technical, precise, no filler, references specific data points, growth mindset language ("not yet" framing), and genre-aware contextual advice. **And** the system prompt is parameterizable with session context (key, chords, timing, tempo, tendencies, genre).

3. **Given** AI features require structured outputs for drills and analysis, **When** schemas are defined, **Then** `src/lib/ai/schemas.ts` contains Zod schemas for: `ChatMessageSchema`, `DrillGenerationSchema` (target skill, notes/chords, tempo, success criteria), `AnalysisRequestSchema`, and `SessionContextSchema`. **And** all schemas are exported for use in both API routes and client-side validation.

4. **Given** the Architecture specifies a streaming chat endpoint, **When** `/api/ai/chat/route.ts` is implemented, **Then** it accepts POST requests with `{ sessionContext, messages, providerId }`, decrypts the user's API key server-side via `src/lib/crypto.ts`, initializes the correct LLM provider, and streams the response using Vercel AI SDK's `streamText`. **And** the route returns a standard `ReadableStream` compatible with the AI SDK's `useChat` hook.

5. **Given** the Architecture requires session validation on all API routes, **When** the chat route receives a request, **Then** it validates the user session via Supabase server client, checks that an API key exists for the user, decrypts the key, and only then proxies to the LLM. **And** unauthenticated requests receive a 401 `UNAUTHORIZED` response.

6. **Given** the Architecture specifies rate limiting (NFR13), **When** any AI API route processes a request, **Then** rate limiting enforces a maximum of 100 requests per minute per authenticated user. **And** rate-limited requests receive a 429 response with error code `RATE_LIMITED` and a growth-mindset-friendly message.

7. **Given** the Architecture defines four distinct AI error codes, **When** errors occur during AI processing, **Then** the system distinguishes between: `INVALID_KEY` (400 — user's API key rejected by provider), `RATE_LIMITED` (429 — Minstrel or provider rate limit hit), `PROVIDER_DOWN` (502 — LLM provider unreachable or returning 5xx), and `GENERATION_FAILED` (500 — LLM returned but output was invalid/unparseable). **And** all error responses use the `ApiErrorResponse` envelope with human-readable, non-technical messages.

8. **Given** the Architecture defines additional AI API routes, **When** the service layer is complete, **Then** `/api/ai/drill/route.ts` and `/api/ai/analyze/route.ts` exist as route stubs that share the same provider initialization, key decryption, session validation, rate limiting, and error handling patterns from the chat route. **And** drill route uses `generateObject` with Zod schema for structured output. **And** analyze route uses `generateObject` for difficulty calibration output.

## Tasks / Subtasks

- [ ] Task 1: Install Vercel AI SDK and provider packages (AC: 1)
  - [ ] Run `pnpm add ai @ai-sdk/openai @ai-sdk/anthropic`
  - [ ] Verify AI SDK 6.x is installed in `package.json`
  - [ ] Verify TypeScript types resolve correctly for all SDK imports

- [ ] Task 2: Implement dynamic provider selection in `src/lib/ai/provider.ts` (AC: 1)
  - [ ] Create `src/lib/ai/provider.ts`
  - [ ] Define `SupportedProvider` type union: `'openai' | 'anthropic'`
  - [ ] Implement `createProvider(providerId: SupportedProvider, apiKey: string)` function that returns the correct AI SDK provider instance
  - [ ] Use `@ai-sdk/openai` `createOpenAI()` for OpenAI keys
  - [ ] Use `@ai-sdk/anthropic` `createAnthropic()` for Anthropic keys
  - [ ] Export `getModelForProvider(providerId, apiKey)` that returns a configured model (e.g., `gpt-4o` for OpenAI, `claude-sonnet-4-20250514` for Anthropic)
  - [ ] Define default model mappings per provider (configurable via constants)
  - [ ] Write co-located test `src/lib/ai/provider.test.ts` verifying provider selection logic

- [ ] Task 3: Create Studio Engineer system prompts in `src/lib/ai/prompts.ts` (AC: 2)
  - [ ] Create `src/lib/ai/prompts.ts`
  - [ ] Define `STUDIO_ENGINEER_SYSTEM_PROMPT` constant with persona instructions: technical precision, data references, growth mindset language, genre awareness, no filler
  - [ ] Implement `buildChatSystemPrompt(context: SessionContext)` function that interpolates session data (key, chords, timing, tempo, genre, tendencies) into the system prompt
  - [ ] Implement `buildDrillSystemPrompt(context: SessionContext)` function for drill generation context
  - [ ] Implement `buildAnalysisSystemPrompt(context: SessionContext)` function for difficulty calibration context
  - [ ] Include growth mindset directives: "Use 'not yet' instead of 'wrong'. Frame struggles as trajectory. Reference specific data points. Never make claims not supported by session data."
  - [ ] Include genre awareness directives: "Constrain advice to detected genre context. Use genre-appropriate terminology."
  - [ ] Write co-located test `src/lib/ai/prompts.test.ts` verifying prompt assembly with mock session context

- [ ] Task 4: Define Zod schemas in `src/lib/ai/schemas.ts` (AC: 3)
  - [ ] Create `src/lib/ai/schemas.ts`
  - [ ] Define `SessionContextSchema` — Zod schema for session context passed to AI: `{ key, chords, timingAccuracy, tempo, recentSnapshots, tendencies, genre, question }`
  - [ ] Define `ChatRequestSchema` — Zod schema for `/api/ai/chat` request body: `{ messages, sessionContext, providerId }`
  - [ ] Define `DrillGenerationSchema` — Zod schema for structured drill output: `{ targetSkill, noteSequence, chordSequence, targetTempo, successCriteria, difficultyLevel, variation }`
  - [ ] Define `AnalysisResultSchema` — Zod schema for difficulty calibration output: `{ skillDimensions, recommendedDifficulty, rationale }`
  - [ ] Define `DrillRequestSchema` — Zod schema for `/api/ai/drill` request body: `{ sessionContext, weakness, currentDifficulty, providerId }`
  - [ ] Define `AnalysisRequestSchema` — Zod schema for `/api/ai/analyze` request body: `{ sessionHistory, currentProfile, providerId }`
  - [ ] Export all schemas and their inferred TypeScript types via `z.infer<typeof Schema>`
  - [ ] Write co-located test `src/lib/ai/schemas.test.ts` verifying schema validation with valid and invalid data

- [ ] Task 5: Implement rate limiting utility (AC: 6)
  - [ ] Create `src/lib/ai/rate-limiter.ts`
  - [ ] Implement in-memory sliding window rate limiter: `checkRateLimit(userId: string): { allowed: boolean; retryAfterMs?: number }`
  - [ ] Configure limit at 100 requests per 60-second window per user
  - [ ] Use `Map<string, number[]>` with timestamp-based sliding window (clean up expired entries on each check)
  - [ ] Export `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_MS` constants from `src/lib/constants.ts`
  - [ ] Write co-located test `src/lib/ai/rate-limiter.test.ts` verifying limit enforcement and window expiry

- [ ] Task 6: Implement AI error handling utilities (AC: 7)
  - [ ] Create `src/lib/ai/errors.ts`
  - [ ] Define `AiErrorCode` type: `'INVALID_KEY' | 'RATE_LIMITED' | 'PROVIDER_DOWN' | 'GENERATION_FAILED'`
  - [ ] Define `AiError` class extending `Error` with `code: AiErrorCode` and `httpStatus: number`
  - [ ] Implement `classifyAiError(error: unknown): AiError` function that inspects error shape (HTTP status, message patterns) and returns the appropriate `AiError`
  - [ ] Map provider-specific errors: 401/403 from provider -> `INVALID_KEY`, 429 from provider -> `RATE_LIMITED`, 5xx/timeout from provider -> `PROVIDER_DOWN`, parse errors -> `GENERATION_FAILED`
  - [ ] Define user-friendly messages per code: `INVALID_KEY` -> "Your API key appears to be invalid. Check your key in Settings.", `RATE_LIMITED` -> "Too many requests right now. Give it a moment and try again.", `PROVIDER_DOWN` -> "The AI service is temporarily unavailable. Your MIDI features still work perfectly.", `GENERATION_FAILED` -> "Could not generate a response right now. Try again in a moment."
  - [ ] Implement `aiErrorToResponse(error: AiError): Response` helper that returns a proper `ApiErrorResponse` JSON response with correct HTTP status
  - [ ] Write co-located test `src/lib/ai/errors.test.ts` verifying error classification and response formatting

- [ ] Task 7: Implement `/api/ai/chat/route.ts` with streaming (AC: 4, 5, 6, 7)
  - [ ] Create `src/app/api/ai/chat/route.ts`
  - [ ] Implement POST handler:
    - [ ] Parse and validate request body with `ChatRequestSchema`
    - [ ] Get Supabase server client and validate user session
    - [ ] Return 401 `UNAUTHORIZED` if no valid session
    - [ ] Check rate limit via `checkRateLimit(userId)`; return 429 if exceeded
    - [ ] Fetch user's encrypted API key from Supabase `user_api_keys` table
    - [ ] Return 400 with "Connect your API key in Settings" message if no key found
    - [ ] Decrypt API key using `src/lib/crypto.ts` `decrypt()` function
    - [ ] Initialize provider via `getModelForProvider(providerId, decryptedKey)`
    - [ ] Build system prompt via `buildChatSystemPrompt(sessionContext)`
    - [ ] Call `streamText({ model, system, messages })` from Vercel AI SDK
    - [ ] Return `result.toDataStreamResponse()` for AI SDK client compatibility
    - [ ] Wrap in try/catch, classify errors via `classifyAiError`, return `aiErrorToResponse`
    - [ ] Log errors to Sentry (never log the API key)

- [ ] Task 8: Implement `/api/ai/drill/route.ts` stub with structured output (AC: 8)
  - [ ] Create `src/app/api/ai/drill/route.ts`
  - [ ] Implement POST handler following same pattern as chat route (validation, auth, rate limit, key decrypt)
  - [ ] Use `generateObject({ model, schema: DrillGenerationSchema, system, prompt })` from Vercel AI SDK
  - [ ] Build prompt via `buildDrillSystemPrompt(sessionContext)` with weakness description
  - [ ] Return `ApiResponse<DrillGeneration>` JSON envelope on success
  - [ ] Apply same error handling pattern (classify, respond, Sentry)

- [ ] Task 9: Implement `/api/ai/analyze/route.ts` stub with structured output (AC: 8)
  - [ ] Create `src/app/api/ai/analyze/route.ts`
  - [ ] Implement POST handler following same pattern (validation, auth, rate limit, key decrypt)
  - [ ] Use `generateObject({ model, schema: AnalysisResultSchema, system, prompt })` from Vercel AI SDK
  - [ ] Build prompt via `buildAnalysisSystemPrompt(sessionContext)` with session history
  - [ ] Return `ApiResponse<AnalysisResult>` JSON envelope on success
  - [ ] Apply same error handling pattern

- [ ] Task 10: Create shared API route helper for common patterns (AC: 4, 5, 6, 7)
  - [ ] Create `src/lib/ai/route-helpers.ts`
  - [ ] Implement `validateAndDecryptKey(userId: string): Promise<{ providerId, apiKey } | AiError>` that fetches, decrypts, and returns the key or an error
  - [ ] Implement `withAiAuth(handler: AuthenticatedHandler): RouteHandler` higher-order function that wraps session validation, rate limiting, and key decryption into a reusable pattern
  - [ ] Refactor all three routes to use the shared helper to eliminate duplication

## Dev Notes

- **Vercel AI SDK 6.x Patterns**: The AI SDK uses a provider-model pattern. You create a provider instance (`createOpenAI({ apiKey })`) and then get a model from it (`openai('gpt-4o')`). The `streamText` function accepts the model directly. For structured outputs, `generateObject` accepts a Zod schema and returns typed data.

- **Streaming Response Format**: Vercel AI SDK's `streamText` returns a result with `.toDataStreamResponse()` that produces a `Response` object compatible with the SDK's client-side `useChat` hook. Do NOT manually construct SSE streams -- use the SDK's built-in method.

- **Key Decryption Flow**: The user's API key is stored encrypted in Supabase `user_api_keys` table (set up in Story 3.4). The `src/lib/crypto.ts` module (created in Story 3.4) provides `encrypt(plaintext)` and `decrypt(ciphertext)` functions using AES-256 with the `ENCRYPTION_KEY` env var. API routes decrypt per-request. The decrypted key is NEVER logged, stored in memory beyond the request lifecycle, or included in Sentry breadcrumbs.

- **Rate Limiter Strategy**: In-memory sliding window is sufficient for MVP (single Vercel serverless instance per request). For scale, this would need to move to Redis/Upstash. The in-memory approach works because Vercel serverless functions may share memory within a warm instance, providing approximate rate limiting. Exact enforcement is a post-MVP concern.

- **Provider Error Classification**: Different LLM providers return errors differently. OpenAI returns HTTP 401 for invalid keys, 429 for rate limits, 5xx for outages. Anthropic uses similar patterns but with different error body structures. The `classifyAiError` function should inspect both HTTP status and error message/type to map correctly.

- **System Prompt Engineering**: The Studio Engineer persona prompt is critical to Minstrel's identity. It should:
  - Instruct the LLM to be technical, precise, and data-driven
  - Require specific data point references ("Your timing on beat 3 drifts 40ms late on F chord")
  - Prohibit filler phrases ("Great job!", "Keep it up!")
  - Mandate growth mindset language ("not yet", trajectory framing)
  - Inject session context as structured data the LLM can reference
  - Include genre awareness instructions

- **Dependencies on Previous Stories**: This story depends on:
  - Story 3.4 (API key encryption/storage) for `src/lib/crypto.ts` and `user_api_keys` table
  - Story 3.1 (Supabase Auth) for session validation via `@/lib/supabase/server.ts`
  - Story 1.1 (project setup) for Zustand stores, types, and project structure

- **Testing Strategy**: Unit tests for provider selection, prompt assembly, schema validation, rate limiting, and error classification. API route integration tests require mocking Supabase client and LLM provider responses. Use `vi.mock()` for external dependencies.

### Project Structure Notes

Files created or modified in this story:

```
src/lib/ai/
  provider.ts           # Dynamic provider selection (NEW)
  provider.test.ts      # Provider tests (NEW)
  prompts.ts            # Studio Engineer system prompts (NEW)
  prompts.test.ts       # Prompt assembly tests (NEW)
  schemas.ts            # Zod schemas for AI inputs/outputs (NEW)
  schemas.test.ts       # Schema validation tests (NEW)
  rate-limiter.ts       # Request rate limiting (NEW)
  rate-limiter.test.ts  # Rate limiter tests (NEW)
  errors.ts             # AI error classification + response helpers (NEW)
  errors.test.ts        # Error handling tests (NEW)
  route-helpers.ts      # Shared API route auth/decrypt pattern (NEW)

src/app/api/ai/
  chat/route.ts         # Streaming chat endpoint (NEW)
  drill/route.ts        # Structured drill generation endpoint (NEW)
  analyze/route.ts      # Difficulty calibration endpoint (NEW)

src/lib/constants.ts    # Add RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS (MODIFY)
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] -- Vercel AI SDK 6.x integration details
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] -- API key security and BYOK model
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] -- ApiResponse envelope, error codes, naming
- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions] -- AR4 (Vercel AI SDK), NFR13 (rate limiting)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Studio Engineer AI Persona] -- Persona behavior requirements
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
