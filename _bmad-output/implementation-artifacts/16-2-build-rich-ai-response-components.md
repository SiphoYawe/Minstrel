# Story 16.2: Build Rich AI Response Components

Status: ready-for-dev

## Story

As a musician chatting with the AI coach,
I want to see inline visualizations (chord diagrams, scale displays, timing graphs) in AI responses,
So that coaching advice is visual and immediately actionable, not just text.

## Acceptance Criteria

1. Given the AI response references a specific chord, When the response is rendered in the chat panel, Then an inline Chord Diagram Card is displayed showing the chord's notes on a mini keyboard visual
2. Given the AI response references a scale, When the response is rendered, Then an inline Scale Display component shows highlighted notes on a one-octave piano keyboard visual
3. Given the AI response includes timing or accuracy feedback, When the response is rendered, Then an inline Timing Graph component shows the user's timing distribution
4. Given the AI response includes a practice recommendation, When the response is rendered, Then a Practice Tip Callout card is displayed with distinct visual style
5. Given the AI response suggests a drill, When the response is rendered, Then a Drill Suggestion Card with a "Start This Drill" button is displayed inline
6. Given the AI response contains no structured data markers, When the response is rendered, Then it falls back to existing text rendering (no regression)

## Tasks / Subtasks

1. Define structured response markers in AI system prompt (AC: 1-5)
2. Create chord-diagram.tsx component (AC: 1)
3. Create scale-display.tsx component (AC: 2)
4. Create timing-graph.tsx component (AC: 3)
5. Create practice-tip.tsx callout component (AC: 4)
6. Create drill-suggestion.tsx with "Start This Drill" button (AC: 5)
7. Update response-processor.ts to parse markers into component renders (AC: 1-6)
8. Ensure fallback to text rendering for unmarked responses (AC: 6)
9. Add tests for all new chat components

## Dev Notes

**Architecture Layer**: Presentation Layer (UI Components) + Application Layer (Response Processing)

**Technical Details**:

- Primary files: src/components/ai-chat-panel.tsx, src/features/coaching/response-processor.ts
- Define structured markers in AI system prompt (e.g., [CHORD:Dm7], [SCALE:D_dorian], [TIP:...])
- Alternative: use Vercel AI SDK tool/function calling for structured data
- Create: src/components/chat/chord-diagram.tsx, src/components/chat/scale-display.tsx, src/components/chat/timing-graph.tsx, src/components/chat/practice-tip.tsx, src/components/chat/drill-suggestion.tsx
- All components must use dark aesthetic: #0F0F0F backgrounds, #7CB9E8 accents, sharp corners, monospace metrics

### Project Structure Notes

**Key Files to Create**:

- `src/components/chat/chord-diagram.tsx` - mini keyboard showing chord notes
- `src/components/chat/scale-display.tsx` - one-octave keyboard with scale highlighted
- `src/components/chat/timing-graph.tsx` - timing distribution visualization
- `src/components/chat/practice-tip.tsx` - callout card for tips
- `src/components/chat/drill-suggestion.tsx` - drill card with CTA button

**Key Files to Modify**:

- `src/features/coaching/response-processor.ts` - add marker parsing logic
- `src/components/ai-chat-panel.tsx` - integrate rich components
- `src/features/coaching/system-prompt.ts` - add structured marker instructions

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
