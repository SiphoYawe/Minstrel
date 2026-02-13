# Story 17.5: Design Better Empty States

Status: ready-for-dev

## Story

As a new musician opening Minstrel,
I want empty screens to show me what I will see once I start using the app,
So that I understand the app's value and am motivated to take the first action.

## Acceptance Criteria

1. Given the user has no sessions yet, When the Session History page renders, Then an empty state shows a mock/preview visualization image with "Play your first note to see your music come alive" and a "Start Playing" CTA
2. Given the user has no API key configured, When the coaching chat renders, Then an empty state shows a preview of AI coaching with "Connect your API key to unlock AI coaching insights" and a "Configure API Key" CTA
3. Given the user has no achievements, When the Achievements page renders, Then an empty state shows silhouettes of locked achievement badges with "Your first achievement is just a session away" and a "Start Playing" CTA
4. Given the user has no MIDI device connected, When the session page renders without MIDI, Then the empty state shows a stylized MIDI keyboard illustration with connection instructions and a "Troubleshoot Connection" CTA
5. Given empty states are rendered, When viewed on all supported viewport sizes, Then illustrations/previews scale responsively and text remains legible
6. Given empty state CTA buttons are clicked, When the user interacts, Then navigation goes to the appropriate page

## Tasks / Subtasks

1. Create reusable empty-state.tsx component (AC: 1-6)
2. Design session history empty state with mock visualization (AC: 1)
3. Design coaching chat empty state with AI preview (AC: 2)
4. Design achievements empty state with locked badge silhouettes (AC: 3)
5. Design MIDI connection empty state with keyboard illustration (AC: 4)
6. Add responsive scaling for all empty states (AC: 5)
7. Wire CTA buttons to navigation (AC: 6)
8. Add tests for empty state rendering

## Dev Notes

**Architecture Layer**: Presentation Layer (UI components)

**Technical Details**:

- Create reusable src/components/empty-state.tsx component accepting: icon/illustration, title, description, ctaText, ctaHref props
- Replace existing minimal empty states across: src/components/session-history-list.tsx, src/components/ai-chat-panel.tsx, src/app/(auth)/achievements/page.tsx
- Mock visualization preview: use static SVG of piano roll with sample notes
- Dark aesthetic — #0F0F0F background, accent-blue and muted tones
- CTA buttons: shadcn/ui Button with variant="default"

### Project Structure Notes

**Key files to modify/create**:

- Create: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/components/empty-state.tsx`
- Modify: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/components/session-history-list.tsx`
- Modify: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/components/ai-chat-panel.tsx`
- Modify: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/app/(auth)/achievements/page.tsx`
- Create: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/components/illustrations/` (SVG illustrations)
- Create: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/components/illustrations/mock-visualization.tsx`
- Create: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/components/illustrations/midi-keyboard.tsx`

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
