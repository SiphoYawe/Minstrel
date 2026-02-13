# Story 17.2: Surface Progress Data Prominently

Status: ready-for-dev

## Story

As a musician,
I want my progress data (streaks, XP, achievements) always visible and prominent,
So that I feel motivated by my ongoing improvement.

## Acceptance Criteria

1. Given the WeeklySummary and PersonalRecords components are currently hidden behind a toggle button, When this story is completed, Then the toggle is removed and a compact progress summary is always visible in the Dashboard view
2. Given the user has an active practice streak, When the Dashboard renders, Then a streak flame icon with the streak count is displayed as a persistent UI element
3. Given the user has earned XP, When the Dashboard renders, Then an XP bar showing current level progress is displayed as a persistent element
4. Given the user has unlocked achievements, When the Dashboard renders, Then an achievement count badge is displayed as a persistent element
5. Given the progress elements are rendered, When the user clicks on any progress element, Then it navigates to the relevant detailed view
6. Given the user has no progress data yet (new user), When the progress elements render, Then they show starter state messages

## Tasks / Subtasks

1. Remove progress toggle button (AC: 1)
2. Create persistent progress summary component (AC: 1)
3. Add streak flame icon with count (AC: 2)
4. Add XP progress bar (AC: 3)
5. Add achievement count badge (AC: 4)
6. Add navigation on click to detailed views (AC: 5)
7. Implement starter state for new users (AC: 6)
8. Add tests for progress display

## Dev Notes

**Architecture Layer**: Presentation Layer (UI components) + Application Layer (progress state management)

**Technical Details**:

- Current progress toggle: locate the + button labeled "Progress" with text-[10px] uppercase — in src/features/modes/dashboard-chat.tsx or session page
- Move progress display from behind toggle into Dashboard page as persistent cards
- Streak flame: use amber emoji/icon or SVG flame with count in JetBrains Mono
- XP bar: shadcn/ui Progress component styled with accent-blue fill on dark background
- Data sources: sessionStore.streakData, sessionStore.xpData, sessionStore.achievements

### Project Structure Notes

**Key files to modify/create**:

- Modify: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/features/modes/dashboard-chat.tsx` (remove toggle)
- Create: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/components/progress-summary.tsx`
- Modify: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/app/(auth)/dashboard/page.tsx`
- Create: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/components/streak-display.tsx`
- Create: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/components/xp-bar.tsx`
- Create: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/components/achievement-badge.tsx`

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
