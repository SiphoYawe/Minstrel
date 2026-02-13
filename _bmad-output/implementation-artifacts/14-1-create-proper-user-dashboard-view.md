# Story 14.1: Create Proper User Dashboard View

Status: ready-for-dev

## Story

As a musician,
I want a dedicated Dashboard view showing my skill profile, difficulty level, session stats, improvement trends, and achievements,
So that I can see my musical identity and progress at a glance — the "Strava for Musicians" experience.

## Acceptance Criteria

1. Given the user navigates to the Dashboard, When the dashboard renders, Then it displays distinct sections for: Skill Profile Radar, Difficulty Level, Session Stats Summary, Improvement Trends, Recent Achievements, and Playing Style Profile
2. Given the user has completed at least one session with note data, When the dashboard renders, Then the Session Stats Summary shows: total practice time, total sessions, total notes played, current practice streak, and average session length
3. Given the user has a skill profile computed from session data, When the dashboard renders, Then the Difficulty Level section shows the current level with a visual progression indicator and growth trajectory arrow
4. Given the user has sessions spanning multiple days, When the Improvement Trends section renders, Then it shows a line or bar chart of timing accuracy, session duration, and notes per session over the last 7/30/90 days (selectable)
5. Given the user has unlocked achievements, When the Recent Achievements section renders, Then the latest 3-5 achievement badges are displayed with names, icons, and unlock dates
6. Given the user has no sessions yet, When the dashboard renders, Then each section shows an appropriate empty state with a CTA

## Tasks / Subtasks

1. Create /dashboard route with page.tsx (AC: 1)
2. Build Session Stats Summary section with computed metrics (AC: 2)
3. Build Difficulty Level section with progression indicator (AC: 3)
4. Build Improvement Trends section with selectable time ranges (AC: 4)
5. Build Recent Achievements section (AC: 5)
6. Implement empty states for all sections (AC: 6)
7. Wire data from sessionStore and IndexedDB
8. Add layout responsive behavior for 1024-1440px viewports

## Dev Notes

This story creates a new standalone Dashboard view (separate from the Dashboard+Chat mode) that serves as the user's practice profile and progress hub.

**Architecture Layer**: Presentation Layer (UI) + Application Layer (data aggregation)

**Technical Details**:

- Create new route: src/app/(auth)/dashboard/page.tsx
- Pull session stats from sessionStore and IndexedDB via Dexie.js
- Skill profile data sourced from sessionStore.skillProfile (dimensions: timing, harmony, technique, speed, consistency)
- Difficulty level from the Difficulty Engine state in sessionStore
- The dashboard is a SEPARATE view from the Dashboard+Chat mode
- Follow dark aesthetic: #0F0F0F background, #7CB9E8 accent, sharp corners, Inter + JetBrains Mono fonts

### Project Structure Notes

**Key files to create**:

- `src/app/(auth)/dashboard/page.tsx` - Main dashboard route
- `src/components/dashboard/session-stats-summary.tsx` - Stats section component
- `src/components/dashboard/difficulty-level-section.tsx` - Difficulty display component
- `src/components/dashboard/improvement-trends.tsx` - Trends chart component
- `src/components/dashboard/recent-achievements.tsx` - Achievements display component

**Key files to modify**:

- `src/stores/session-store.ts` - Add computed stats aggregation functions
- `src/lib/db/queries.ts` - Add session history aggregation queries

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
