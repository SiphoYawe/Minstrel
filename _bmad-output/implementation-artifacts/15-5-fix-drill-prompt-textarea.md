# Story 15.5: Fix Drill Prompt Textarea

Status: ready-for-dev

## Story

As a musician,
I want drill request text to be fully visible without truncation,
So that I can read and edit the drill prompt before it is sent.

## Acceptance Criteria

1. Given the drill prompt is pasted into the chat textarea, When the prompt text exceeds the current visible area, Then the textarea expands to at least 200px max height before showing a scrollbar
2. Given the textarea has reached its max height, When content overflows, Then a visible scroll indicator clearly signals that more content exists below
3. Given the drill generation flow is routed to the structured API (Story 15.1), When the user triggers a drill, Then the drill request is shown in a dedicated drill request card with full visibility
4. Given the drill request card is displayed, When the user views it, Then the full context is visible: identified weakness, suggested focus area, and any editable parameters
5. Given the chat textarea is used for regular chat messages, When the user types a long message, Then the same 200px+ max height and scroll indicator apply

## Tasks / Subtasks

1. Increase textarea max height from 120px to 200px (AC: 1)
2. Add visible scroll indicator for overflow (AC: 2)
3. Create dedicated drill request card component (AC: 3)
4. Show full context in drill request card (AC: 4)
5. Apply consistent max height to all textarea usage (AC: 5)
6. Add tests for textarea overflow behavior

## Dev Notes

**Architecture Layer**: Presentation

- Fix textarea overflow issues for long drill prompts
- Add visual scroll indicators
- Create dedicated drill request card (depends on Story 15.1)

### Project Structure Notes

**Primary files to modify/create**:

- `src/components/ai-chat-panel.tsx` (lines 205-214 for textarea, lines 93-98 for auto-resize)
- `src/components/drill-request-card.tsx` (NEW - dedicated drill request UI)

**Technical implementation details**:

- Change max height from 120px to 200px in the auto-resize logic
- Add overflow-y: auto to the textarea when content exceeds max height
- The better fix (AC3/AC4) depends on Story 15.1 — once drill requests bypass the chat, the textarea overflow is less critical
- Consider adding a subtle bottom fade gradient as a scroll indicator
- Scroll indicator implementation: use `data-scrollable` attribute + CSS gradient overlay
- Drill request card should show:
  - Header: "Drill Request"
  - Identified weakness (from snapshot analysis)
  - Suggested focus area
  - Editable parameters: difficulty slider, duration selector
  - "Generate" and "Cancel" buttons
- Auto-resize logic location: `src/components/ai-chat-panel.tsx` lines 93-98:
  ```typescript
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`; // Change 120 to 200
    }
  };
  ```
- Add scroll detection: compare `scrollHeight` vs `clientHeight` to show indicator

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]
- [Source: src/components/ai-chat-panel.tsx - Current textarea implementation]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
