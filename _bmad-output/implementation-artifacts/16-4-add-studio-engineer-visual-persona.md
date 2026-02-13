# Story 16.4: Add Studio Engineer Visual Persona

Status: ready-for-dev

## Story

As a musician,
I want the AI coach to have a distinct visual identity in the chat,
So that interactions feel like working with a Studio Engineer, not a generic chatbot.

## Acceptance Criteria

1. Given the AI sends a message in the coaching chat, When the message is rendered, Then an avatar/icon representing the Studio Engineer appears to the left of the AI message
2. Given the AI message is rendered, When the user views it, Then a left accent bar in accent-blue (#7CB9E8) color distinguishes AI messages from user messages
3. Given the user opens the coaching chat for the first time in a session, When no messages exist yet, Then a contextual greeting from the Studio Engineer is displayed
4. Given the AI generates a coaching response, When the response is rendered, Then it uses structured formatting: headers for sections, bullet points for lists, callout boxes for key advice
5. Given the user sends a message, When the user message is rendered, Then it appears right-aligned with a different background and no avatar/accent bar
6. Given the Studio Engineer avatar is displayed, When viewed at all supported viewport sizes, Then the avatar is consistently sized (24px-32px) and does not overlap message text

## Tasks / Subtasks

1. Create Studio Engineer SVG icon component (AC: 1)
2. Add avatar to AI message containers (AC: 1)
3. Add left accent bar to AI messages (AC: 2)
4. Add contextual session-aware greeting (AC: 3)
5. Update AI system prompt for structured formatting (AC: 4)
6. Style user messages with right-alignment and different background (AC: 5)
7. Ensure avatar sizing is consistent across viewports (AC: 6)
8. Add tests for chat persona rendering

## Dev Notes

**Architecture Layer**: Presentation Layer (UI Components) + Application Layer (AI System Prompt)

**Technical Details**:

- Primary file: src/components/ai-chat-panel.tsx
- Avatar: use simple SVG icon (mixing console fader, waveform, or headphones) — add to src/components/icons/
- Left accent bar: add border-l-2 border-accent-blue pl-3 to AI message containers
- Contextual greeting: add conditional first message rendered locally based on session state
- Update AI system prompt to use markdown headers, bullets, and structured formatting
- Response processor may need updates to render markdown properly

### Project Structure Notes

**Key Files to Create**:

- `src/components/icons/studio-engineer-icon.tsx` - SVG avatar icon

**Key Files to Modify**:

- `src/components/ai-chat-panel.tsx` - add avatar, accent bar, greeting, message styling
- `src/features/coaching/system-prompt.ts` - add structured formatting instructions
- `src/features/coaching/response-processor.ts` - ensure markdown rendering support

**Design Specs**:

- Avatar: 24-32px square SVG icon
- Accent bar: 2px solid #7CB9E8 on left edge
- AI messages: left-aligned, accent bar, avatar
- User messages: right-aligned, different background, no avatar/bar
- Greeting: "Studio Engineer here. Ready to analyze your session and help you improve."

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
