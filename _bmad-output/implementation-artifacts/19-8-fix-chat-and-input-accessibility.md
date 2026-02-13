# Story 19.8: Fix Chat and Input Accessibility

Status: ready-for-dev

## Story

As a user with accessibility needs,
I want visible labels on inputs, auto-focused CTAs, and announced layout changes,
So that speech input works, keyboard navigation flows properly, and screen readers track UI changes.

## Acceptance Criteria

1. Given the AI chat textarea, When rendered, Then a visible `<label>` element is associated with it
2. Given a snapshot CTA appears with animation, When the component mounts, Then focus is automatically moved to the first interactive button
3. Given the chat textarea auto-resizes, When its height changes, Then an `aria-live="polite"` region announces the size change

## Tasks / Subtasks

1. Add visible label to chat textarea (UI-H5)
   - Add sr-only `<label htmlFor="chat-input">Ask your coach</label>`
   - Add `id="chat-input"` to textarea
2. Auto-focus snapshot CTA on mount (UI-H6)
   - Add buttonRef and useEffect to focus on mount
3. Announce textarea resize (UI-H12)
   - Add aria-live="polite" sr-only region
   - Announce "Input expanded" when height increases
4. Add unit tests

## Dev Notes

**Architecture Layer**: Presentation Layer (accessibility)
**Findings Covered**: UI-H5, UI-H6, UI-H12
**Files**: `src/components/ai-chat-panel.tsx` (lines 93-98, 205-214), `src/components/snapshot-cta.tsx` (lines 14-41)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
