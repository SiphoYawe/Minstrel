# Story 10.5: Achievement Gallery

Status: ready-for-dev

## Story

As a musician,
I want to view all my achievements in a gallery,
so that I can see my progress milestones and what badges I've earned.

## Acceptance Criteria

1. Given a user navigates to the achievement gallery (via a link from the settings page or a direct URL `/achievements`), When the page loads, Then all achievements are displayed in a grid layout: earned badges rendered in full color with the `#7CB9E8` accent, unearned badges rendered in greyed-out muted tones (`#4A4A4A`). And the grid is responsive (3 columns on desktop, 2 on tablet, 1 on mobile).

2. Given an achievement is earned, When it appears in the gallery, Then it shows: (a) the badge icon in full color, (b) the achievement title (Inter, medium weight), (c) a brief description of what was accomplished, and (d) the date earned (formatted as "Feb 10, 2026"). And the card has a subtle `#7CB9E8` left border accent to indicate earned status.

3. Given an achievement is not yet earned, When it appears in the gallery, Then it shows: (a) a greyed-out badge icon (CSS `opacity-40` or `grayscale`), (b) the achievement title in muted text, (c) the criteria needed to earn it, and (d) a progress indicator if applicable (e.g., "3/7 days" for a streak milestone, or "2/5 genres" for a genre exploration badge). And earned achievements sort before unearned within each category.

4. Given the gallery displays achievements, When they render, Then achievements are grouped by category with section headers: "Consistency" (streak milestones), "Technique" (skill-based milestones), "Genres" (genre exploration milestones), "Personal Records" (PR-based milestones). And each category header uses the `#7CB9E8` accent color and Inter font.

5. Given the gallery follows the design system, When it renders, Then it uses the dark studio aesthetic: `#0F0F0F` page background, `#1A1A1A` card backgrounds, `0px` border radius on all cards and section elements, no confetti, no animated celebrations, no gamification excess. And the presentation matches the understated athlete-log aesthetic — achievements are logged milestones, not game rewards.

## Tasks / Subtasks

- [ ] 1. Define achievement gallery types (AC: 1, 2, 3, 4)
  - [ ] 1.1 Create `src/features/engagement/achievement-gallery-types.ts` — types for gallery display: `AchievementDisplayItem` (id, title, description, category, icon, earnedAt, progress, isEarned), `AchievementCategory` enum (Consistency, Technique, Genres, PersonalRecords)
  - [ ] 1.2 Define the full achievement catalog as a constant array: all possible achievements with their criteria, icons, and categories. This serves as the "master list" against which earned achievements are matched.

- [ ] 2. Create achievement gallery component (AC: 1, 2, 3, 4, 5)
  - [ ] 2.1 Create `src/components/achievement-gallery.tsx` — `'use client'` component (Layer 1 Presentation)
  - [ ] 2.2 Implement category-grouped grid layout using CSS Grid: `grid-cols-3` on lg, `grid-cols-2` on md, `grid-cols-1` on sm
  - [ ] 2.3 Implement earned badge card: full-color icon, title, description, date, `#7CB9E8` left border
  - [ ] 2.4 Implement unearned badge card: greyed-out icon (`opacity-40 grayscale`), muted title, criteria text, progress bar (shadcn/ui Progress component) if applicable
  - [ ] 2.5 Implement category section headers: `#7CB9E8` text, Inter font, uppercase tracking, separator line below
  - [ ] 2.6 Apply dark studio aesthetic: `bg-[#0F0F0F]` page, `bg-[#1A1A1A]` cards, `rounded-none`, no animations
  - [ ] 2.7 Sort within each category: earned first (by date earned, newest first), then unearned (by progress percentage, highest first)

- [ ] 3. Create achievement gallery data hook (AC: 1, 3)
  - [ ] 3.1 Create `src/features/engagement/use-achievement-gallery.ts` — hook (Layer 2 Application Logic)
  - [ ] 3.2 Query earned achievements from Supabase `achievements` or `progress_metrics` table (depends on Story 7.3 implementation)
  - [ ] 3.3 Merge earned achievements with the full catalog to produce display items: earned items have `earnedAt` set, unearned items have `progress` computed from current user data
  - [ ] 3.4 Compute progress for unearned achievements: query streak data, genre counts, skill dimensions, and personal records to calculate partial completion
  - [ ] 3.5 Return `{ achievements: AchievementDisplayItem[], isLoading: boolean, categorized: Record<AchievementCategory, AchievementDisplayItem[]> }`

- [ ] 4. Create achievement gallery page route (AC: 1)
  - [ ] 4.1 Create `src/app/(auth)/achievements/page.tsx` — page component that renders the `AchievementGallery` component
  - [ ] 4.2 Add page metadata: `title: 'Achievements — Minstrel'`
  - [ ] 4.3 Ensure the page is only accessible to authenticated users (protected by `(auth)` layout)

- [ ] 5. Link from settings page (AC: 1)
  - [ ] 5.1 Update `src/app/(auth)/settings/page.tsx` — add a navigation link to `/achievements` in the settings menu or profile section
  - [ ] 5.2 Style the link consistently with other settings navigation items

- [ ] 6. Write co-located tests (AC: 1, 2, 3, 4, 5)
  - [ ] 6.1 Create `src/components/achievement-gallery.test.tsx` — test rendering of earned and unearned badges, category grouping, sorting order, progress indicators, and design system compliance (no rounded corners, no animations)
  - [ ] 6.2 Create `src/features/engagement/use-achievement-gallery.test.ts` — test catalog merge logic, progress computation, empty state (no achievements earned), full state (all achievements earned)

## Dev Notes

- **Architecture Layer**: `achievement-gallery.tsx` is Layer 1 (Presentation). `use-achievement-gallery.ts` is Layer 2 (Application Logic). `achievement-gallery-types.ts` is types-only. The achievement catalog constant is Layer 3 (Domain) — it defines what achievements exist.
- **Dependency on Story 7.3**: The achievement badges system (Story 7.3) defines how achievements are earned and stored. This story provides the UI to view them. If 7.3 is not yet implemented, the gallery can still render with all badges unearned (the catalog is self-contained). The hook gracefully handles missing data.
- **Achievement Catalog Design**: The catalog is a static constant array defining all possible achievements. Each entry includes: `id`, `title`, `description`, `category`, `iconName`, `criteria` (human-readable), and `evaluator` (function reference or criteria object for progress calculation). This catalog is the single source of truth.
- **Progress Calculation**: For unearned achievements, progress is computed by querying relevant data sources: streak count for consistency badges, genre counts for exploration badges, skill dimension values for technique badges, PR counts for personal record badges. This data is already available via existing stores and services.
- **No Gamification Excess**: Per the UX spec anti-patterns, achievements are presented as a professional training log. Think of a pilot's logbook, not a game's trophy room. Badges are understated icons, not flashy illustrations. The earned state is indicated by color (full vs greyed), not by shine effects or particle animations.
- **Page Route**: `/achievements` is placed under the `(auth)` route group because achievements require an account (they track long-term progress). Guest users do not have an achievement gallery — their data is transient until they create an account.
- **Library Versions**: React 19.x, Zustand 5.x, shadcn/ui (Progress, Badge), Tailwind CSS v4.

### Project Structure Notes

- `src/components/achievement-gallery.tsx` — achievement gallery UI component (create)
- `src/components/achievement-gallery.test.tsx` — co-located component tests (create)
- `src/features/engagement/achievement-gallery-types.ts` — gallery display types (create)
- `src/features/engagement/use-achievement-gallery.ts` — gallery data hook (create)
- `src/features/engagement/use-achievement-gallery.test.ts` — co-located hook tests (create)
- `src/app/(auth)/achievements/page.tsx` — achievements page route (create)
- `src/app/(auth)/settings/page.tsx` — modify to add link to achievements

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Achievement System] — understated athlete-log aesthetic, no confetti, milestone badges
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Anti-Patterns] — "Gamification excess" anti-pattern
- [Source: _bmad-output/planning-artifacts/prd.md#Engagement & Progress] — FR43: achievement badges for practice milestones
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — `progress_metrics` table, Supabase PostgreSQL
- [Source: _bmad-output/implementation-artifacts/7-3-achievement-badges-system.md] — achievement earning logic, badge definitions, storage

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
