# Story 26.4: Improve Data Card Values, Empty States, and Streak Messaging

Status: ready-for-dev

## Story

As a user,
I want helpful and encouraging empty states and tooltips,
So that I understand my data and feel invited rather than pressured.

## Acceptance Criteria

1. Given data card value truncated, When user hovers, Then tooltip shows full value
2. Given empty state renders, When no data, Then inviting language: "Your first [feature] is waiting. Start playing to see it come alive."
3. Given streak at risk, When message appears, Then invitation tone: "Ready for today's session?" not "Practice today to keep your streak"
4. Given achievement gallery on day 1, When rendered, Then shows max 3 "next up" achievements (not 24 locked items)

## Tasks / Subtasks

1. Add tooltip on hover for truncated data card values (DASH data card truncation)
   - Detect text truncation via overflow check
   - Show full value in tooltip on hover
2. Rewrite all empty state messages to growth mindset tone
   - Audit all empty state components for language
   - Replace with inviting, forward-looking messages
3. Rewrite streak messaging from obligation to invitation (ENG-C1)
   - Change "Practice today to keep your streak" to "Ready for today's session?"
   - Review all streak-related copy for pressure language
4. Limit achievement gallery initial view to 3 next-up items
   - Show only 3 nearest unlockable achievements for new users
   - Add "See all" link to expand full gallery

## Dev Notes

**Findings Covered**: DASH data card truncation (HIGH), empty states (HIGH), ENG-C1
**Files**: `src/components/dashboard/data-card.tsx`, `src/components/empty-state.tsx`, `src/lib/engagement/streaks.ts`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
