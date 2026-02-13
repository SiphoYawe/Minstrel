# Story 14.2: Build Skill Profile Radar Visualization

Status: ready-for-dev

## Story

As a musician,
I want a radar chart showing my skill dimensions (timing, harmony, technique, speed, consistency),
So that I can see at a glance where I am strong and where I need to improve.

## Acceptance Criteria

1. Given the user has a skillProfile with values for timing, harmony, technique, speed, and consistency, When the radar chart renders on the dashboard, Then each dimension is plotted as a point on a 5-axis radar chart with values from 0-100
2. Given the radar chart is rendered, When the user views it, Then the chart uses the dark aesthetic: #7CB9E8 fill with 20% opacity, #7CB9E8 stroke, #0F0F0F background, #2A2A2A grid lines
3. Given the radar chart is rendered, When the user hovers over a dimension axis or data point, Then a tooltip shows the dimension name and exact value
4. Given the user has multiple sessions over time, When the radar chart supports comparison mode, Then a secondary (ghosted) polygon shows the previous week's/session's skill profile for comparison
5. Given the skill profile data has not been computed yet (new user), When the radar chart renders, Then a placeholder outline (all axes at 0) is shown with a label "Play more to build your skill profile"
6. Given the radar chart renders on different viewport sizes, When viewed at 1024px through 1440px, Then the chart scales responsively while maintaining legible axis labels and data points

## Tasks / Subtasks

1. Create skill-radar-chart.tsx SVG component (AC: 1)
2. Apply dark aesthetic styling (AC: 2)
3. Add hover tooltips for dimension values (AC: 3)
4. Add comparison mode with ghosted previous polygon (AC: 4)
5. Implement empty state for new users (AC: 5)
6. Add responsive scaling (AC: 6)
7. Wire to sessionStore.skillProfile data
8. Add tests for radar chart rendering

## Dev Notes

This story creates a custom SVG-based radar chart component for visualizing the user's skill profile across 5 dimensions.

**Architecture Layer**: Presentation Layer (data visualization component)

**Technical Details**:

- Implement as SVG (recommended for static chart, not 60fps animation) — create src/components/skill-radar-chart.tsx
- Data source: useSessionStore.getState().skillProfile
- Axis labels should use JetBrains Mono at 12px, dimension values at 14px mono
- Sharp corners on container card (0px border radius per UX2)
- Chart dimensions: timing, harmony, technique, speed, consistency (all 0-100 scale)
- Ghosted comparison polygon: use 40% opacity with dashed stroke

### Project Structure Notes

**Key files to create**:

- `src/components/skill-radar-chart.tsx` - Main radar chart SVG component
- `src/components/skill-radar-chart.test.tsx` - Component tests

**Key files to modify**:

- `src/stores/session-store.ts` - Ensure skillProfile type includes all 5 dimensions
- `src/app/(auth)/dashboard/page.tsx` - Integrate radar chart into dashboard

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
