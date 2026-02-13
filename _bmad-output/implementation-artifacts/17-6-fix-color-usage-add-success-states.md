# Story 17.6: Fix Color Usage & Add Success States

Status: ready-for-dev

## Story

As a musician,
I want positive outcomes to be visually reinforced with a distinct success color,
So that amber is reserved for "attention needed" and green/success is used for positive reinforcement.

## Acceptance Criteria

1. Given the current color system uses amber for multiple purposes, When this story is completed, Then amber (accent-warm) is reserved strictly for "attention needed" states
2. Given a positive improvement percentage is displayed, When rendered, Then it uses accent-success (muted green) instead of amber
3. Given a streak milestone is reached, When the milestone notification renders, Then it uses accent-success color
4. Given timing accuracy exceeds 85%, When displayed, Then the value uses accent-success color
5. Given the accent-success color token exists but is rarely used, When this story is completed, Then accent-success is used consistently across all positive outcome indicators with WCAG AA contrast on #0F0F0F
6. Given a confirmed positive outcome is displayed, When rendered, Then it uses a muted green visual treatment distinct from both amber and blue

## Tasks / Subtasks

1. Verify/define accent-success color token in globals.css (AC: 5)
2. Audit all amber color usage across codebase (AC: 1)
3. Replace amber with accent-success for positive improvements (AC: 2)
4. Apply accent-success to streak milestones (AC: 3)
5. Apply accent-success to high timing accuracy (AC: 4)
6. Apply accent-success to all positive outcome indicators (AC: 6)
7. Verify WCAG AA contrast compliance (AC: 5)
8. Add tests for color usage consistency

## Dev Notes

**Architecture Layer**: Presentation Layer (design system) + Infrastructure Layer (CSS variables)

**Technical Details**:

- Check globals.css for --accent-success definition — ensure muted green passing 4.5:1 contrast on #0F0F0F
- Audit files for amber color usage: search for accent-warm, text-amber, bg-amber across codebase
- Key files to update: src/components/data-card.tsx, src/components/snapshot-cta.tsx, src/components/streak-badge.tsx, src/components/achievement-toast.tsx
- Do NOT remove amber entirely — it remains for warnings, "not yet" states

### Project Structure Notes

**Key files to modify/create**:

- Modify: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/app/globals.css`
- Modify: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/components/data-card.tsx`
- Modify: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/components/snapshot-cta.tsx`
- Modify: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/components/streak-badge.tsx`
- Modify: `/Users/siphoyawe/Desktop/Projects/Minstrel/src/components/achievement-toast.tsx`
- Audit: All component files using accent-warm/amber colors

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
