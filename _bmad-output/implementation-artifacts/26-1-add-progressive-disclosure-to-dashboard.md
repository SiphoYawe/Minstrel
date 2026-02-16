# Story 26.1: Add Progressive Disclosure to Dashboard

Status: ready-for-dev

## Story

As a user,
I want to see the most important information first without being overwhelmed,
So that the dashboard is useful instead of intimidating.

## Acceptance Criteria

1. Given user opens dashboard, When it loads, Then top section shows max 4 key metrics: current session summary, recent achievement, skill snapshot, AI suggestion
2. Given sections below fold, When rendered, Then collapsed with clear headers, expand on click
3. Given first-time user with no data, When dashboard loads, Then only relevant sections show (no empty cards for unused features)

## Tasks / Subtasks

1. Redesign dashboard layout with hero metrics section (DASH-C1)
   - Create top-level metrics strip with max 4 cards
   - Prioritize: current session summary, recent achievement, skill snapshot, AI suggestion
2. Add collapsible section wrappers for remaining content
   - Implement expand/collapse with clear header labels
   - Default to collapsed for below-fold sections
3. Add conditional rendering based on user data availability
   - Check data presence before rendering each section
4. Hide zero-state sections for new users
   - Suppress cards/sections that have no meaningful data yet

## Dev Notes

**Findings Covered**: DASH-C1
**Files**: `src/components/dashboard/`, `src/app/(app)/session/page.tsx`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
