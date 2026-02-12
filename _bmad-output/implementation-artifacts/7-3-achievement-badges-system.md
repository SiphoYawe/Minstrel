# Story 7.3: Achievement Badges System

Status: ready-for-dev

## Story

As a musician,
I want to unlock achievement badges for meaningful accomplishments,
so that milestones in my musical journey are recognized.

## Acceptance Criteria

1. Given the user achieves a specific accomplishment during a session (e.g., first jazz voicing detected, 10 consecutive perfect-timing reps, 100-day streak), When the achievement engine evaluates trigger conditions at session end, Then `achievement-engine.ts` identifies all newly unlocked achievements by comparing the user's current state against the achievement definition registry. And each unlocked achievement is stored in the `achievements` table with `user_id`, `achievement_id`, `unlocked_at`, and `session_id` (the session in which it was earned).

2. Given a new achievement is unlocked, When the AchievementToast component (P2) renders, Then a clean, understated notification appears in the top-right corner showing the achievement icon, name, and a one-line description (e.g., "First Jazz Voicing — Played your first dominant 7th chord"). And the toast auto-dismisses after 4 seconds per the UX toast pattern. And there is no confetti, no animation burst, no sound effect, no celebration popup.

3. Given the achievement system defines categories, When achievements are organized, Then four categories exist: genre milestones (e.g., "First Blues Lick", "Jazz Explorer"), technique milestones (e.g., "Perfect Timing 10x", "Chord Transition Under 200ms"), consistency milestones (e.g., "7-Day Streak", "100-Day Streak", "1000 XP"), and personal records (e.g., "Speed Demon — New tempo record"). And each category has a distinct but understated icon style.

4. Given a user wants to view their achievements, When they navigate to their profile or settings page, Then all unlocked achievements are displayed in a grid or list, grouped by category. And each achievement shows: icon, name, description, and the date it was unlocked. And locked achievements are visible as muted placeholders with the unlock criteria shown (to provide goals without pressure). And the presentation feels like earned credentials (think professional certifications), not game trophies.

5. Given the achievement engine processes triggers, When evaluating whether an achievement should be unlocked, Then each achievement definition includes: a unique `achievement_id`, `name`, `description`, `category`, `icon`, and a `triggerCondition` function that accepts the user's current stats and returns a boolean. And the engine prevents duplicate unlocks — once an achievement is unlocked, it cannot be unlocked again.

6. Given co-located tests are written, When tests execute, Then every trigger condition is validated with mock data: at least one test for each achievement category, tests for boundary conditions (exactly at threshold vs. just below), and tests confirming no duplicate unlock occurs.

## Tasks / Subtasks

- [ ] 1. Extend engagement types for achievements (AC: 1, 3, 5)
  - [ ] 1.1 Add to `src/features/engagement/engagement-types.ts`: `AchievementCategory` enum (Genre, Technique, Consistency, PersonalRecord), `AchievementDefinition` (achievementId, name, description, category, icon, triggerCondition), `UnlockedAchievement` (achievementId, userId, unlockedAt, sessionId), `AchievementRegistry` (Map of achievementId to AchievementDefinition), `UserAchievementState` (unlockedIds, stats for trigger evaluation)
  - [ ] 1.2 Define the `TriggerContext` type: contains all data the trigger condition may need — streakData, xpTotal, personalRecords, sessionStats, lifetimeStats, drillCompletionCount, genreExposure, etc.

- [ ] 2. Define initial achievement registry (AC: 3, 5)
  - [ ] 2.1 Create `src/features/engagement/achievement-definitions.ts` — static registry of all achievement definitions
  - [ ] 2.2 Define genre milestones: "First Jazz Voicing" (played a dom7 chord), "Blues Explorer" (played a 12-bar blues progression), "Pop Prodigy" (played I-V-vi-IV progression), and 3-5 additional genre achievements
  - [ ] 2.3 Define technique milestones: "Perfect Timing 10x" (10 consecutive notes within 20ms of beat grid), "Smooth Operator" (chord transition under 200ms), "Velocity Control" (dynamic range within 10% of target), and 3-5 additional technique achievements
  - [ ] 2.4 Define consistency milestones: "First Week" (7-day streak), "Month Strong" (30-day streak), "Century" (100-day streak), "Yearly Devotion" (365-day streak), "Thousand Club" (1000 cumulative XP), and additional consistency achievements
  - [ ] 2.5 Define personal record achievements: "Speed Demon" (new tempo record), "Accuracy King" (new timing accuracy record), "Complexity Up" (new harmonic complexity record)
  - [ ] 2.6 Each definition includes a pure `triggerCondition(ctx: TriggerContext): boolean` function

- [ ] 3. Implement achievement-engine.ts (AC: 1, 5)
  - [ ] 3.1 Create `src/features/engagement/achievement-engine.ts` — pure domain logic (Layer 3)
  - [ ] 3.2 Implement `evaluateAchievements(context: TriggerContext, alreadyUnlocked: string[]): UnlockedAchievement[]` — iterates through the achievement registry, skips already-unlocked IDs, evaluates trigger conditions, returns newly unlocked achievements
  - [ ] 3.3 Implement `buildTriggerContext(streakData, xpData, personalRecords, sessionStats, lifetimeStats): TriggerContext` — assembles all data needed for trigger evaluation from available sources
  - [ ] 3.4 Ensure the engine is idempotent — running it twice with the same input produces the same output with no side effects

- [ ] 4. Implement achievement persistence service (AC: 1, 4)
  - [ ] 4.1 Create `src/features/engagement/achievement-service.ts` (Layer 4 wrapper) for Supabase read/write of achievement data
  - [ ] 4.2 Implement `fetchUnlockedAchievements(userId: string): Promise<UnlockedAchievement[]>` — queries `achievements` table for all achievements unlocked by this user
  - [ ] 4.3 Implement `saveUnlockedAchievements(achievements: UnlockedAchievement[]): Promise<void>` — batch inserts newly unlocked achievements with `on conflict` to prevent duplicates
  - [ ] 4.4 Implement `fetchAchievementDisplay(userId: string): Promise<AchievementDisplayData>` — joins achievement definitions with unlock status for the profile/settings display

- [ ] 5. Integrate achievement engine with session lifecycle (AC: 1, 2)
  - [ ] 5.1 Create a hook `src/features/engagement/use-achievements.ts` that manages achievement state and triggers evaluation on session end
  - [ ] 5.2 On session end, build the trigger context from: streak data (Story 7.1), XP data (Story 7.2), personal records (Story 7.6), current session analysis data, and lifetime aggregated stats
  - [ ] 5.3 Call `evaluateAchievements` with the current context and already-unlocked IDs
  - [ ] 5.4 Persist any newly unlocked achievements and dispatch them to `appStore` for toast rendering

- [ ] 6. Build AchievementToast component (AC: 2)
  - [ ] 6.1 Create `src/components/achievement-toast.tsx` — `'use client'` component using shadcn/ui Toast primitive
  - [ ] 6.2 Render achievement icon, name, and description in a single clean notification card
  - [ ] 6.3 Use `--bg-tertiary` background, `--accent-success` left border (2px), `--text-primary` for name, `--text-secondary` for description, 0px border radius
  - [ ] 6.4 Auto-dismiss after 4 seconds per UX toast pattern, stack vertically with 8px gap if multiple achievements unlock simultaneously
  - [ ] 6.5 No confetti, no animation burst, no particle effects — the toast slides in and slides out
  - [ ] 6.6 Add `aria-live="polite"` and clear achievement announcement text for screen readers

- [ ] 7. Build achievement display in profile/settings (AC: 4)
  - [ ] 7.1 Create an achievement gallery section in the settings page or a dedicated profile tab
  - [ ] 7.2 Display achievements grouped by category with category headers
  - [ ] 7.3 Unlocked achievements show full icon, name, description, and unlock date
  - [ ] 7.4 Locked achievements show muted icon and criteria text (e.g., "Play 10 notes with perfect timing") — visible as goals, not hidden
  - [ ] 7.5 Use CSS grid layout, 0px border radius cards, `--bg-secondary` for unlocked, `--bg-tertiary` with reduced opacity for locked

- [ ] 8. Write co-located tests (AC: 5, 6)
  - [ ] 8.1 Create `src/features/engagement/achievement-engine.test.ts` — test every trigger condition with mock TriggerContext data, test genre milestone triggers (dom7 chord present/absent), technique triggers (exactly 10 perfect reps, 9 reps), consistency triggers (exact streak/XP thresholds), personal record triggers
  - [ ] 8.2 Test duplicate prevention: already-unlocked achievement is not returned again
  - [ ] 8.3 Test empty context: no achievements unlocked when user has no data
  - [ ] 8.4 Create `src/components/achievement-toast.test.tsx` — verify toast content rendering, auto-dismiss behavior, accessibility attributes

## Dev Notes

- **Architecture Layer**: `achievement-engine.ts` and `achievement-definitions.ts` are Layer 3 (Domain Logic) — pure functions and static data, easily testable. `achievement-service.ts` is Layer 4 (Infrastructure). `use-achievements.ts` is Layer 2 (Application Logic). `achievement-toast.tsx` and the achievement gallery are Layer 1 (Presentation).
- **"Earned Credentials, Not Game Rewards"**: Achievements in Minstrel should feel like certifications or training milestones, not game badges. The visual design uses `--accent-success` sparingly, the language is factual ("First Jazz Voicing — Played your first dominant 7th chord"), and there is zero celebratory animation. Think of a running app showing "First Half Marathon" with the date — that is the vibe.
- **Achievement Registry Pattern**: All achievements are defined statically in `achievement-definitions.ts` as a registry. Each has a pure `triggerCondition` function. This makes it trivial to add new achievements — just add a new entry to the registry. No database changes needed for new achievement definitions (only for tracking unlocks).
- **Trigger Context Assembly**: The `buildTriggerContext` function is the integration point. It pulls data from multiple sources (streak, XP, personal records, session analysis). Some data may not be available yet (e.g., personal records from Story 7.6). The context type should use optional fields for data that may come from stories not yet implemented. The engine skips achievements whose trigger conditions reference missing data.
- **Supabase `achievements` Table**: Schema: `id` (UUID PK), `user_id` (FK to users), `achievement_id` (string, unique per user), `unlocked_at` (timestamptz), `session_id` (FK to sessions, nullable). Unique constraint on `(user_id, achievement_id)` to prevent duplicates at the DB level.
- **Toast Stacking**: If multiple achievements unlock in one session (e.g., "First Jazz Voicing" and "100 XP" simultaneously), toasts stack vertically with 8px gap, appearing one after another with a slight delay (300ms between toasts). This prevents information overload.
- **Expandability**: The achievement system is designed to be easily extensible. Adding new achievements post-launch is a single file change in `achievement-definitions.ts`. No migrations, no API changes, no UI changes needed.
- **Library Versions**: Zustand 5.x for state, Supabase client SDK for DB, shadcn/ui Toast for notification primitive. No additional dependencies.
- **Testing**: Vitest for unit tests, React Testing Library for component tests. The trigger condition testing is the most important — each achievement must have at least one positive and one negative test case.

### Project Structure Notes

- `src/features/engagement/engagement-types.ts` — extended with achievement types
- `src/features/engagement/achievement-definitions.ts` — static achievement registry with trigger conditions
- `src/features/engagement/achievement-engine.ts` — achievement evaluation logic (pure functions)
- `src/features/engagement/achievement-engine.test.ts` — co-located tests
- `src/features/engagement/achievement-service.ts` — Supabase persistence wrapper for achievements
- `src/features/engagement/use-achievements.ts` — React hook for achievement state
- `src/components/achievement-toast.tsx` — AchievementToast UI component (P2)
- `src/components/achievement-toast.test.tsx` — co-located component test
- `src/features/engagement/index.ts` — barrel export updated

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — `achievements` table, Supabase PostgreSQL, RLS policies
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] — naming conventions, co-located tests, Layer 3 boundary rules
- [Source: _bmad-output/planning-artifacts/epics.md#Story 7.3] — acceptance criteria and FR42 coverage
- [Source: _bmad-output/planning-artifacts/prd.md#Engagement & Progress] — FR42: achievement badges for genre, technique, consistency milestones
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#AchievementToast] — component design: understated notification, auto-dismiss 4s, no confetti
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Anti-Patterns] — "Gamification excess" anti-pattern, achievements should feel like earned credentials
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns] — positive feedback uses `--accent-success` left border, factual data-backed messaging

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
