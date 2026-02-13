# Story 17.3: Improve Mode Switching UX

Status: ready-for-dev

## Story

As a musician new to Minstrel,
I want the mode names to have descriptive subtitles so I understand what each mode does,
So that I can choose the right mode for my current activity.

## Acceptance Criteria

1. Given the mode switcher displays three mode tabs, When rendered, Then each tab shows a subtitle below the mode name: Play ("Live visualization"), Coach ("AI-assisted practice"), Replay ("Session review")
2. Given the user switches from one mode to another, When the transition occurs, Then a brief crossfade animation (150-200ms) provides visual continuity between modes
3. Given the user is using Minstrel for the first time, When they first see the mode switcher, Then a brief onboarding tooltip appears explaining the modes
4. Given the onboarding tooltip is displayed, When the user clicks any mode tab or dismisses the tooltip, Then the tooltip does not appear again (persisted to localStorage)
5. Given the mode subtitles are rendered, When the viewport is narrow (<1024px), Then subtitles gracefully hide or truncate to maintain compact tab sizing
6. Given the mode switcher renders with subtitles, When compared to the current design, Then the overall mode switcher height increases by no more than 12px

## Tasks / Subtasks

1. Rename modes: Play, Coach, Replay (AC: 1)
2. Add subtitles below mode names (AC: 1)
3. Add crossfade animation on mode switch (AC: 2)
4. Create onboarding tooltip for first-time users (AC: 3)
5. Persist tooltip dismissal to localStorage (AC: 4)
6. Hide subtitles at narrow viewports (AC: 5)
7. Constrain height increase to ≤12px (AC: 6)
8. Add tests for mode switching UX

## Dev Notes

**Architecture Layer**: Presentation Layer (UI components)

**Technical Details**:

- Primary file: src/features/modes/mode-switcher.tsx
- Mode renaming from audit: "Silent Coach" → "Play", "Dashboard+Chat" → "Coach", "Replay Studio" → "Replay"
- Subtitles: add span with text-[9px] text-muted-foreground below each mode name
- Crossfade: use CSS transition: opacity 150ms ease-in-out on mode content containers
- Onboarding tooltip: use shadcn/ui Tooltip; store modeTooltipDismissed in localStorage

### Project Structure Notes

**Key files to modify/create**:

- Modify: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/features/modes/mode-switcher.tsx`
- Create: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/components/mode-onboarding-tooltip.tsx`
- Modify: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/lib/constants.ts` (add mode descriptions)
- Add: CSS transitions in component styles

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
