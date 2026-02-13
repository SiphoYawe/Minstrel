# Story 6.3: AI Questions About Replay Moments

Status: ready-for-dev

## Story

As a musician,
I want to ask the AI about specific moments in my recordings,
so that I can understand what happened musically at any point.

## Acceptance Criteria

1. Given the user is viewing a specific moment in Replay Studio (scrubbed or paused at a timestamp) and has an API key configured, When they type a question in the Chat tab of the detail panel, Then the question is sent to `/api/ai/chat` with timestamp-specific context. And the AI receives: the exact notes played at that moment, the detected chord, timing accuracy for the surrounding passage, harmonic analysis (key, chord function, chord tones vs passing tones), the tempo at that moment, and the user's question. And the context window includes a configurable range around the current timestamp (default +/- 10 seconds of MIDI events).

2. Given the AI receives timestamp-specific context, When it generates a response, Then the response explains what happened musically at that specific moment (e.g., "At 2:34, you played a b9 over the V chord -- that's a common bebop tension that adds color to the dominant"). And the AI references specific data from the moment: note names, chord quality, timing values, harmonic function. And the response is grounded in the actual session data, not generic music theory.

3. Given the user has asked a question about a replay moment, When the AI responds, Then the response references the specific moment's data, not just overall session statistics (FR32). And if the user asks about multiple moments in sequence, the AI maintains conversation context and can compare them (e.g., "Unlike at 1:22 where your timing was tight, here at 3:45 the transition slowed by 80ms").

4. Given the user is in Replay Studio without an API key configured, When they open the Chat tab, Then the chat input area is replaced with a graceful degradation prompt: "Connect your API key in Settings to ask questions about your playing." And a link navigates to `/settings` API Keys section. And no errors are thrown -- the degradation is smooth and informative.

5. Given the AI streaming response is in progress, When the user is viewing the Chat tab, Then the response streams in real time with a typing indicator (3 dots) shown immediately while waiting for the first token. And the first token arrives in <1 second (NFR3). And the conversation history within the replay session is preserved and scrollable. And the user can ask follow-up questions with full conversation context maintained.

6. Given the user scrubs to a new position after asking a question, When they ask another question, Then the AI context automatically updates to reflect the new timestamp position. And the new question's context includes the MIDI data around the new position. And previous chat messages remain visible in the conversation history.

## Tasks / Subtasks

- [ ] 1. Extend context-builder.ts with timestamp-specific context (AC: 1, 6)
  - [ ] 1.1 Extend `src/features/coaching/context-builder.ts` with a `buildReplayContext(sessionId: string, timestamp: number, events: MidiEvent[], snapshots: AnalysisSnapshot[], windowMs?: number): ReplayContext` function
  - [ ] 1.2 Implement the context window: extract MIDI events within `[timestamp - windowMs, timestamp + windowMs]` (default windowMs = 10000) using binary search on the sorted events array
  - [ ] 1.3 Build context object containing: `timestampFormatted` (e.g., "2:34"), `notesAtMoment` (notes active at exact timestamp), `chordAtMoment` (detected chord), `timingAccuracy` (for surrounding passage), `harmonicAnalysis` (key, chord function), `tempo` (detected BPM at that point), `nearbySnapshots` (any analysis snapshots within the window)
  - [ ] 1.4 Include preceding context: the chord progression leading up to this moment (last 4-8 chords) for harmonic trajectory
  - [ ] 1.5 Format the context as a structured system prompt section that the LLM can parse (using the Studio Engineer persona from `src/lib/ai/prompts.ts`)

- [ ] 2. Create replay-specific AI chat integration (AC: 1, 3, 5, 6)
  - [ ] 2.1 Create `src/features/coaching/use-replay-chat.ts` -- React hook for replay-mode AI chat
  - [ ] 2.2 On user message submission: read `sessionStore.replayPosition` to get the current timestamp, call `buildReplayContext` to assemble timestamp-specific context, send to `/api/ai/chat` with the replay context and user question
  - [ ] 2.3 Include a `mode: 'replay'` flag in the API request body so the server route can distinguish replay context from live session context
  - [ ] 2.4 Maintain conversation history as an array in component state (or sessionStore), appending each user message and AI response
  - [ ] 2.5 When the user scrubs to a new position and asks a new question, automatically rebuild the context with the new timestamp -- do not require the user to manually refresh context
  - [ ] 2.6 Include prior conversation messages in the API request to maintain cross-question continuity

- [ ] 3. Implement the Chat tab in Replay Studio detail panel (AC: 4, 5)
  - [ ] 3.1 Create the Chat tab content within the Replay Studio tabbed detail panel (from Story 6.1)
  - [ ] 3.2 Render conversation history using a scrollable area (shadcn/ui ScrollArea)
  - [ ] 3.3 Display user messages right-aligned with `--bg-tertiary` background and AI responses left-aligned with `--bg-secondary` background, both with 0px border radius
  - [ ] 3.4 Show typing indicator (3 animated dots, `--text-tertiary` color) immediately when a question is submitted and streaming has not yet started
  - [ ] 3.5 Render streaming AI responses progressively as tokens arrive (using Vercel AI SDK's `useChat` or equivalent streaming hook)
  - [ ] 3.6 Add a text input area at the bottom of the Chat tab with a send button, styled per dark studio aesthetic
  - [ ] 3.7 Show the current replay timestamp context indicator above the chat input: "Asking about moment at 2:34" (updates when the user scrubs)

- [ ] 4. Implement graceful degradation for no API key (AC: 4)
  - [ ] 4.1 Check `appStore.hasApiKey` before rendering the chat input
  - [ ] 4.2 If no API key: replace the chat input area with the degradation message and Settings link
  - [ ] 4.3 Use `--text-secondary` for the message text, `--accent-primary` for the Settings link
  - [ ] 4.4 The rest of the Chat tab (empty conversation area) remains visible but inactive

- [ ] 5. Update /api/ai/chat route for replay context (AC: 1, 2, 3)
  - [ ] 5.1 Extend `src/app/api/ai/chat/route.ts` to accept a `mode: 'replay'` request body field
  - [ ] 5.2 When `mode === 'replay'`, include the replay-specific context (timestamp, notes, chords, harmonic analysis) in the system prompt alongside the standard coaching persona
  - [ ] 5.3 The system prompt for replay mode should instruct the AI to reference specific timestamps and data points, not generalize
  - [ ] 5.4 Validate the request body using Zod: `{ message: string, mode: 'live' | 'replay', sessionId: string, replayContext?: ReplayContext, conversationHistory?: Message[] }`

- [ ] 6. Write co-located tests (AC: 1, 2, 4, 6)
  - [ ] 6.1 Extend `src/features/coaching/context-builder.test.ts` -- test `buildReplayContext`: correct event windowing, chord extraction at timestamp, harmonic analysis inclusion, edge cases (timestamp at session start/end, no events at timestamp)
  - [ ] 6.2 Create `src/features/coaching/use-replay-chat.test.ts` -- test context rebuilds on timestamp change, conversation history maintained, API key check
  - [ ] 6.3 Test graceful degradation: verify no API calls made when `hasApiKey` is false, degradation UI renders correctly
  - [ ] 6.4 Use `src/test-utils/session-fixtures.ts` for mock session data and `e2e/fixtures/mock-ai-responses.ts` for mock LLM responses

## Dev Notes

- **Context Builder Architecture**: The `context-builder.ts` already exists (from Epic 4, Story 4.4) for building live session context. This story extends it with a replay-specific function that takes a timestamp parameter. The replay context is more focused: instead of the full session state, it zeroes in on a specific moment with a surrounding window. Both live and replay context functions produce output compatible with the same `/api/ai/chat` endpoint.
- **Event Windowing Performance**: The `buildReplayContext` function must extract events within a time window from a potentially large event array. Use binary search (`findIndex` with comparison) to find the window boundaries in O(log n) rather than filtering the entire array. For a 30-minute session with ~3,600 events, this is the difference between <1ms and ~5ms per context build.
- **AI Prompt Structure for Replay**: The system prompt for replay mode should explicitly instruct the AI: "You are reviewing a specific moment in a recorded practice session. Reference the exact timestamp, notes, and analysis data provided. Do not make claims beyond what the data shows. If the data is insufficient, say so." This prevents hallucinated musical analysis.
- **Conversation History Management**: Conversation history is maintained in component state within the Chat tab. Each message includes: role ('user' | 'assistant'), content, and timestamp. When sending to the API, include the last N messages (configurable, default 10) to keep context manageable. The Vercel AI SDK's `useChat` hook handles this pattern natively.
- **Streaming Pattern**: Use Vercel AI SDK 6.x `streamText` for the API route and the corresponding client-side hook for streaming consumption. The typing indicator shows between user submit and first token arrival. The response text appends progressively as tokens stream in.
- **Timestamp Context Indicator**: The "Asking about moment at 2:34" indicator in the chat input area reads from `sessionStore.replayPosition` and formats it as `mm:ss`. This updates in real time as the user scrubs, giving visual confirmation that the AI will receive context for the displayed moment.
- **API Route Validation**: The Zod schema for the replay chat request must validate: `message` (string, non-empty), `mode` ('live' | 'replay'), `sessionId` (string UUID), and optionally `replayContext` (structured object with timestamp, notes, chords, etc.). The context is built client-side to avoid a server round-trip to load session data from Dexie.
- **Library Versions**: Vercel AI SDK 6.x (streamText, useChat), Zustand 5.x, Zod for request validation.
- **Dependencies**: This story depends on Story 6.1 (Replay Studio layout with Chat tab) and Story 6.2 (timeline scrubbing for position). It also depends on Epic 4 (Story 4.1 for AI SDK integration, Story 4.3 for streaming chat pattern, Story 4.4 for context-builder.ts).

### Project Structure Notes

- `src/features/coaching/context-builder.ts` -- extended with `buildReplayContext` function
- `src/features/coaching/context-builder.test.ts` -- extended with replay context tests
- `src/features/coaching/use-replay-chat.ts` -- hook for replay-mode AI chat (new)
- `src/features/coaching/use-replay-chat.test.ts` -- co-located tests (new)
- `src/features/coaching/coaching-types.ts` -- extended with `ReplayContext` type, `ReplayChatMessage` type
- `src/features/modes/replay-studio.tsx` -- Chat tab content updated to use `use-replay-chat`
- `src/app/api/ai/chat/route.ts` -- extended with `mode: 'replay'` handling
- `src/lib/ai/prompts.ts` -- extended with replay-mode system prompt
- `src/lib/ai/schemas.ts` -- extended with Zod schema for replay chat request
- `src/stores/session-store.ts` -- `replayPosition` read by replay chat hook
- `src/stores/app-store.ts` -- `hasApiKey` read for degradation check

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] -- `/api/ai/chat` route, Vercel AI SDK streamText, structured error responses
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] -- Zod validation at boundaries, ApiResponse envelope, error codes (INVALID_KEY, PROVIDER_DOWN)
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] -- Zustand selector patterns, `'use client'` directive
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Custom Components] -- AIChatPanel (P1) component spec, Chat tab in Replay Studio
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Navigation Patterns] -- Tab navigation within Replay Studio detail panel
- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.3] -- acceptance criteria, FR32 coverage
- [Source: _bmad-output/planning-artifacts/prd.md#Interaction Modes] -- FR32: AI questions about any specific moment in a recorded session
- [Source: _bmad-output/planning-artifacts/prd.md#AI Coaching Chat] -- FR24-28: session-grounded, genre-aware, growth mindset framing

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
