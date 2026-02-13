# Story 4.3: AI Coaching Chat with Streaming Responses

Status: ready-for-dev

## Story

As a musician,
I want streaming AI responses to my questions,
So that conversation feels natural.

## Acceptance Criteria

1. **Given** the user is in Dashboard + Chat mode with an API key configured, **When** they type a question in the AIChatPanel input and submit it, **Then** the message is sent to `/api/ai/chat` as a POST request with the current session context (from `sessionStore`) and conversation history. **And** the request is initiated via the Vercel AI SDK `useChat` hook.

2. **Given** a chat request has been sent, **When** the LLM begins generating a response, **Then** the first token appears in the AIChatPanel within 1 second of submission (NFR3). **And** subsequent tokens stream in progressively, rendering as they arrive without waiting for the full response.

3. **Given** a chat request has been sent, **When** the user is waiting for the first token, **Then** a typing indicator (three animated dots) appears immediately in the message area below the user's message. **And** the indicator disappears when the first token of the response arrives.

4. **Given** the user has exchanged multiple messages in a session, **When** they view the chat, **Then** the full conversation history within the current session is displayed in chronological order (user messages and AI responses). **And** the most recent message is auto-scrolled into view.

5. **Given** the user asks a follow-up question, **When** the system sends the request to `/api/ai/chat`, **Then** all previous messages in the session are included in the `messages` array. **And** the AI response accounts for the full conversation context (the LLM receives the complete thread).

6. **Given** the user's API key is invalid (provider returns 401/403), **When** the error response arrives, **Then** a clear, non-technical error message appears in the chat: "Your API key appears to be invalid. Check your key in Settings." **And** a link to the Settings page is provided. **And** no stack traces, error codes, or technical jargon are shown to the user.

7. **Given** the LLM provider is experiencing an outage (5xx or timeout), **When** the error response arrives, **Then** a clear message appears: "The AI service is temporarily unavailable. Your MIDI features still work perfectly. Try again in a moment." **And** the chat input remains enabled so the user can retry.

## Tasks / Subtasks

- [ ] Task 1: Create the coaching client using Vercel AI SDK `useChat` hook (AC: 1, 2, 5)
  - [ ] Create `src/features/coaching/coaching-client.ts`
  - [ ] Import `useChat` from `ai/react` (Vercel AI SDK client-side hook)
  - [ ] Implement `useCoachingChat()` custom hook that wraps `useChat`:
    - [ ] Configure `api: '/api/ai/chat'`
    - [ ] Configure `body` to dynamically include `sessionContext` from `sessionStore` and `providerId` from `appStore`
    - [ ] Configure `onError` to handle and classify error responses
    - [ ] Return `{ messages, input, handleInputChange, handleSubmit, isLoading, error }`
  - [ ] Build session context payload from `sessionStore` selectors: `currentKey`, `currentTempo`, `timingAccuracy`, `recentChords`, `recentSnapshots`, `tendencies`, `detectedGenre`
  - [ ] Write co-located test `src/features/coaching/coaching-client.test.ts` verifying hook configuration and context assembly

- [ ] Task 2: Integrate `useCoachingChat` with AIChatPanel (AC: 1, 2, 3, 4, 5)
  - [ ] Modify `src/components/ai-chat-panel.tsx` (created in Story 4.2)
  - [ ] Replace props-based interface with `useCoachingChat()` hook integration:
    - [ ] `messages` from hook drives the message display
    - [ ] `input` and `handleInputChange` bind to the text input
    - [ ] `handleSubmit` binds to the form submit
    - [ ] `isLoading` drives the typing indicator
  - [ ] Implement streaming message display: as tokens arrive, the latest assistant message content updates progressively
  - [ ] Auto-scroll to bottom of message area when new content arrives (use `useRef` + `scrollIntoView`)
  - [ ] Display user messages with Inter font, right-aligned with subtle background (`#1A1A1A`)
  - [ ] Display AI messages with JetBrains Mono font, left-aligned with `#141414` background
  - [ ] Implement typing indicator: three dots with CSS animation (`@keyframes pulse`), shown when `isLoading && !latestAssistantMessage`
  - [ ] Disable submit button while `isLoading` to prevent double submission
  - [ ] Clear input field on successful submit

- [ ] Task 3: Sync chat messages with sessionStore (AC: 4, 5)
  - [ ] When `useChat` hook's `messages` array updates, sync to `sessionStore.chatHistory` for cross-mode persistence
  - [ ] On mount, initialize `useChat` with existing messages from `sessionStore.chatHistory` via `initialMessages` prop
  - [ ] Use `useChat`'s `onFinish` callback to persist the completed AI message to `sessionStore`
  - [ ] Ensure chat history persists when switching modes (user goes to Silent Coach and back to Dashboard + Chat)
  - [ ] Write test verifying chat history survives mode switches

- [ ] Task 4: Implement error display in chat (AC: 6, 7)
  - [ ] Create `src/features/coaching/chat-error-handler.ts`
  - [ ] Implement `parseChatError(error: Error): ChatErrorInfo` that extracts the error code and user-friendly message from the API response
  - [ ] Map error codes to display messages:
    - [ ] `INVALID_KEY` -> "Your API key appears to be invalid. [Check your key in Settings](/settings)."
    - [ ] `RATE_LIMITED` -> "Too many requests right now. Give it a moment and try again."
    - [ ] `PROVIDER_DOWN` -> "The AI service is temporarily unavailable. Your MIDI features still work perfectly. Try again in a moment."
    - [ ] `GENERATION_FAILED` -> "Could not generate a response right now. Try again in a moment."
    - [ ] Unknown errors -> "Something unexpected happened. Try again."
  - [ ] Display error messages as system messages in the chat (distinct styling: amber text on dark background, no avatar)
  - [ ] For `INVALID_KEY`, include a clickable link to Settings page
  - [ ] After displaying an error, re-enable the input so the user can retry
  - [ ] Write co-located test `src/features/coaching/chat-error-handler.test.ts` verifying error message mapping

- [ ] Task 5: Implement keyboard interactions for chat (AC: 1)
  - [ ] Enter key submits the message (form default behavior)
  - [ ] Shift+Enter inserts a newline (allow multi-line input)
  - [ ] Use `<textarea>` instead of `<input>` to support multi-line, with auto-resize
  - [ ] Escape key blurs the input (returns focus to instrument playing)
  - [ ] Tab navigation works correctly through all chat elements

- [ ] Task 6: Add session context provider for AI requests (AC: 1, 5)
  - [ ] Create `src/features/coaching/session-context-provider.ts`
  - [ ] Implement `getSessionContextForAI(): SessionContext` that reads from `sessionStore` and `midiStore`:
    - [ ] `currentKey` from `sessionStore`
    - [ ] `currentTempo` from `sessionStore`
    - [ ] `timingAccuracy` from `sessionStore`
    - [ ] `recentChords` from `sessionStore`
    - [ ] `recentSnapshots` from `sessionStore` (last 3 snapshots)
    - [ ] `tendencies` from `sessionStore`
    - [ ] `detectedGenre` from `sessionStore`
    - [ ] `sessionDuration` computed from session start time
  - [ ] Return a `SessionContext` object matching the `SessionContextSchema` from `src/lib/ai/schemas.ts`
  - [ ] Write co-located test verifying context assembly from mock store state

## Dev Notes

- **Vercel AI SDK `useChat` Pattern**: The `useChat` hook from `ai/react` is the primary client-side integration point. It manages the message array, handles streaming, provides input binding, and manages loading state. Configuration:

  ```typescript
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/ai/chat',
    body: {
      sessionContext: getSessionContextForAI(),
      providerId: useAppStore.getState().providerId,
    },
    initialMessages: sessionStore.getState().chatHistory,
    onFinish: (message) => {
      sessionStore.getState().addChatMessage(message);
    },
    onError: (error) => {
      // Error handling
    },
  });
  ```

- **Streaming Rendering**: The AI SDK's `useChat` automatically handles streaming. The `messages` array updates as tokens arrive -- the latest assistant message's `content` field grows incrementally. React re-renders naturally display the growing text. No manual SSE parsing is needed.

- **Body Payload**: The `body` option in `useChat` sends additional data alongside the messages. Session context is included here so the API route can build the system prompt with actual playing data. The `body` is re-evaluated on each submit, so it always includes the latest session state.

- **Message Persistence Strategy**: Vercel AI SDK manages its own message state. To persist across mode switches, we sync from `useChat`'s messages to `sessionStore.chatHistory`. On remount (mode switch back), we initialize `useChat` with `initialMessages` from the store. This creates a clean round-trip.

- **Error Handling UX**: Errors must feel like part of the conversation, not system alerts. Display them inline as "system messages" with distinct styling (amber text, no user/assistant role). The chat should remain functional after errors -- the user just retries.

- **NFR3 - First Token Latency**: The <1 second target for first token is primarily determined by the LLM provider, not the application. Our responsibility is to minimize overhead: use streaming (not waiting for full response), minimize request payload, and ensure the API route processes quickly (session validation, key decryption, rate check should all be <100ms combined).

- **Accessibility**:
  - Message area: `role="log"`, `aria-live="polite"` for screen reader updates
  - Submit button: `aria-label="Send message"`
  - Loading state: `aria-busy="true"` on the message area
  - Error messages: `role="alert"` for immediate screen reader notification

- **Dependencies on Previous Stories**:
  - Story 4.1: `/api/ai/chat/route.ts`, AI SDK, provider setup, error codes
  - Story 4.2: AIChatPanel component shell, Dashboard + Chat layout, sessionStore fields
  - Story 3.5: `appStore.hasApiKey` for graceful degradation

### Project Structure Notes

Files created or modified in this story:

```
src/features/coaching/
  coaching-client.ts              # useCoachingChat hook wrapping useChat (NEW)
  coaching-client.test.ts         # Hook tests (NEW)
  session-context-provider.ts     # Session context assembly for AI (NEW)
  session-context-provider.test.ts # Context tests (NEW)
  chat-error-handler.ts           # Error classification for chat UI (NEW)
  chat-error-handler.test.ts      # Error handler tests (NEW)

src/components/
  ai-chat-panel.tsx               # Wire useCoachingChat, streaming, errors (MODIFY)
  ai-chat-panel.test.tsx          # Update tests for streaming behavior (MODIFY)
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] -- Vercel AI SDK streamText, client-side useChat
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] -- Loading state patterns (status field, typing indicator)
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Handling Standards] -- AI error codes, growth mindset messages
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.3]
- [Source: _bmad-output/planning-artifacts/prd.md#Technical Success] -- AI response time <1 second (NFR3)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Implications] -- Studio Engineer persona, precision is warmth

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
