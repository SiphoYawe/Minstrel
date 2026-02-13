# Story 16.3: Fix Visual Hierarchy and Typography

Status: ready-for-dev

## Story

As a musician,
I want clear typographic hierarchy so that important metrics stand out and labels are subordinate,
So that I can instantly identify the most important information at a glance.

## Acceptance Criteria

1. Given the DataCard component displays metrics, When rendered, Then primary metrics (Key, BPM) use 24px JetBrains Mono with high contrast
2. Given the DataCard component displays secondary metrics, When rendered, Then secondary metrics (Timing %, Chord) use 16px JetBrains Mono with medium contrast
3. Given any label text in the application, When rendered, Then labels use 10px uppercase Inter with tracking — no change to labels
4. Given the AI chat panel displays messages, When chat text is rendered, Then body text uses 14px Inter (increased from current 12-13px)
5. Given section headings appear in the dashboard, replay, or drill panels, When rendered, Then headings use 18-20px Inter semibold
6. Given the entire application's typography is updated, When viewed at 1024px through 1440px viewports, Then the hierarchy is consistent and no text overflows its container

## Tasks / Subtasks

1. Update DataCard primary metrics to 24px JetBrains Mono (AC: 1)
2. Update DataCard secondary metrics to 16px JetBrains Mono (AC: 2)
3. Verify label styling unchanged (AC: 3)
4. Increase chat text to 14px Inter (AC: 4)
5. Add section heading styles at 18-20px Inter semibold (AC: 5)
6. Define typography scale in CSS custom properties (AC: 6)
7. Test across viewports for overflow issues (AC: 6)
8. Add visual regression tests

## Dev Notes

**Architecture Layer**: Presentation Layer (UI Components & Design System)

**Technical Details**:

- Primary files: src/components/data-card.tsx (metric sizing), src/components/ai-chat-panel.tsx (chat text sizing)
- Current metric text uses text-xs and text-[10px] — change to text-2xl font-mono for primary, text-base font-mono for secondary
- Chat text: change from text-xs / text-[13px] to text-sm (14px)
- Consider defining typography scale in Tailwind config or CSS custom properties
- Test that larger metric text doesn't overflow DataCard containers

### Project Structure Notes

**Key Files to Modify**:

- `src/components/data-card.tsx` - update metric text sizing
- `src/components/ai-chat-panel.tsx` - update chat text sizing
- `src/app/globals.css` or `tailwind.config.ts` - define typography scale
- All dashboard, replay, and drill panel components - add section heading styles

**Typography Scale to Define**:

```css
--font-size-metric-primary: 24px;
--font-size-metric-secondary: 16px;
--font-size-label: 10px;
--font-size-body: 14px;
--font-size-heading: 18-20px;
```

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
