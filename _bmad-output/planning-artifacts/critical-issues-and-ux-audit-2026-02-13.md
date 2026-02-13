# Critical Issues & UX Audit — Minstrel

**Date:** 2026-02-13
**Scope:** Full application audit — bugs, data integrity, navigation, UX design
**Source:** User testing feedback + codebase analysis + UX design review

---

## Table of Contents

1. [Critical Bugs (Launch Blockers)](#1-critical-bugs-launch-blockers)
2. [Navigation & Layout Issues](#2-navigation--layout-issues)
3. [Dashboard & Data Accuracy Issues](#3-dashboard--data-accuracy-issues)
4. [Drill Generation Issues](#4-drill-generation-issues)
5. [AI Chat & Visualization Issues](#5-ai-chat--visualization-issues)
6. [Missing Screens & Features](#6-missing-screens--features)
7. [UX Design Critique & Improvements](#7-ux-design-critique--improvements)
8. [Implementation Priority Matrix](#8-implementation-priority-matrix)

---

## 1. Critical Bugs (Launch Blockers)

### BUG-01: Session Replay Does Not Work At All

**Severity:** BLOCKER
**User Report:** "The replay does not work at all — that's a very big issue"
**Files:**

- `src/components/viz/visualization-canvas.tsx` (lines 86-106)
- `src/features/session/replay-engine.ts` (full file)
- `src/stores/session-store.ts`

**Root Cause:** The visualization canvas subscribes exclusively to `useMidiStore.activeNotes` for rendering notes. During replay, the replay engine (`replay-engine.ts`) only advances `replayPosition` via `requestAnimationFrame` — it **never reads replay events at the current position and never feeds them into the midi store or any visual system**. The canvas remains blank because no code maps `replayPosition` to `replayEvents` and injects them as active notes.

**What's Missing:**

1. No replay event dispatcher — nothing reads events at current `replayPosition` and emits them as visual note-on/note-off
2. No replay-to-canvas bridge — `VisualizationCanvas` has zero awareness of replay mode
3. No MIDI output during replay — replay events are never sent to the MIDI output device for audible playback
4. Timeline markers hardcoded to empty array (line 80 of `replay-studio.tsx`): `const markers = useMemo<TimelineMarker[]>(() => [], []);`

**Required Fix:**

- Add a replay event dispatcher in `replay-engine.ts` that, on each frame tick, finds all events between `previousPosition` and `currentPosition` and feeds note-on/note-off events into `useMidiStore` (or a dedicated replay notes ref in the canvas)
- Wire MIDI output playback of replay events through the existing MIDI output system
- Populate `markers` from session snapshots/drills instead of hardcoded empty array
- Add visual indicator distinguishing replay mode from live mode

---

### BUG-02: Key Detection Not Always Accurate

**Severity:** HIGH
**User Report:** "Minstrel does not always accurately diagnose the key being played"
**Files:**

- `src/features/analysis/key-detection.ts`
- `src/features/analysis/chord-detection.ts`

**Root Cause (Multiple Factors):**

1. No velocity weighting — all note-ons treated equally regardless of dynamics, so ghost notes and passing tones weigh as heavily as sustained root notes
2. No octave preference resolution — chord inversions can be misidentified
3. Rolling window accumulator resets — rapid key changes cause detection lag
4. No confidence threshold — key is reported even with very low confidence, leading to flickering between keys
5. Metadata update caching (`session-recorder.ts:149-159`) — rapid key changes like C→D→C within 10s skip the return-to-C because it matches the cached `lastMetadataKey`

**Required Fix:**

- Add velocity-weighted note scoring in key/chord detection
- Add confidence threshold — suppress key display below 60% confidence
- Fix metadata caching to always write on interval, not just on change
- Add debounce/hysteresis to key display (require 3+ seconds of consistency before updating displayed key)

---

### BUG-03: Dashboard Completely Out of Sync with Sessions

**Severity:** HIGH
**User Report:** "The dashboard is completely out of sync with the sessions played"
**Files:**

- `src/components/data-card.tsx`
- `src/features/modes/dashboard-chat.tsx`
- `src/stores/session-store.ts`

**Root Cause:**

1. `DataCard` reads from `useSessionStore` state (`currentKey`, `currentTempo`, `timingAccuracy`, `detectedChords`) which are only updated during **live play** via the analysis pipeline
2. When switching to Dashboard mode after stopping play, these values are stale — they show the LAST values from the analysis pipeline, not a summary of the full session
3. No session summary calculation — there's no aggregation of session data into meaningful totals/averages
4. Dashboard tab data is completely wrong because the Replay Studio's Insights panel shows raw session metadata (`session.key`, `session.tempo`) which are only set during `updateMetadata` calls (every 10s), not computed from actual event analysis

**Required Fix:**

- Compute session summary statistics (average tempo, predominant key, timing accuracy trend, total notes, chord frequency) on session end and display those
- When in replay mode, compute stats from replay events, not from live analysis state
- Add clear visual differentiation between "live session" metrics and "session summary" metrics

---

### BUG-04: Session History Data Incomplete

**Severity:** HIGH
**User Report:** "Session history data is not complete"
**Files:**

- `src/features/modes/replay-studio.tsx` (line 520)
- `src/components/session-history-list.tsx` (lines 54-56)
- `src/features/session/use-replay-session.ts` (line 26)

**Root Cause:**

1. Session list hardcoded to `limit(20)` — users with >20 sessions can't see full history
2. `loadSessionList` only loads sessions with `status === 'completed'` — active/abandoned sessions not shown
3. No pagination or "load more" mechanism
4. Session metadata (key, tempo, duration) only written every 10s — short sessions may have null metadata
5. `firstMetadataUpdate` lag — key/tempo not written until 10s after detection, so sessions shorter than 10s show no metadata

**Required Fix:**

- Remove hardcoded limit, add pagination (20 per page with "Load More")
- Show sessions with all statuses (completed, active, abandoned) with visual status indicators
- Write session metadata immediately on first detection (fix `session-recorder.ts:149-159`)
- Add session summary statistics to history items (note count, chord count)

---

### BUG-05: BPM/Timing Accuracy Not Accurate

**Severity:** HIGH
**User Report:** "The BPM timing is not accurate"
**Files:**

- `src/features/analysis/tempo-detection.ts`
- `src/features/analysis/timing-analysis.ts`

**Root Cause:**

1. Tempo detection uses inter-onset intervals without filtering outliers — pauses, ornaments, and rapid passages distort the BPM calculation
2. No plausibility checking — BPM can show absurd values (e.g., 1200 BPM from rapid trills or 10 BPM from slow passages)
3. Timing accuracy percentage not validated — can show >100% or nonsensical values
4. `timingAccuracy` schema mismatch (`lib/ai/schemas.ts:8`) — source data is 0-100 but schema expects 0-1, division by 100 happens in context builder with no clamping

**Required Fix:**

- Add BPM plausibility range (30-300 BPM) with outlier filtering
- Use rolling median instead of rolling average for tempo stability
- Add BPM confidence indicator — suppress display below threshold
- Clamp timing accuracy to valid range: `Math.max(0, Math.min(100, value))`

---

### BUG-06: Snapshot Data Very Inaccurate / Not Helpful

**Severity:** HIGH
**User Report:** "The snapshot data is very inaccurate" and "the overall snapshot info is not very helpful at all"
**Files:**

- `src/features/analysis/use-analysis-pipeline.ts`
- `src/components/snapshot-cta.tsx`
- `src/components/viz/snapshot-renderer.ts`

**Root Cause:**

1. Snapshot generated after 10s silence — uses rolling window data, not full session data
2. Insight generation has no confidence checks — reports chord detection and harmonic analysis even with low sample size
3. Early session data excluded from rolling window — initial notes not used in trends
4. Snapshot insight is a single string (`keyInsight`) with no supporting data — no chord progression, no timing breakdown, no difficulty assessment
5. `SNAPSHOT_FADE_IN_MS` and `SNAPSHOT_FADE_OUT_MS` constants defined but never imported (dead code in `lib/constants.ts:33-34`) — actually they ARE imported in visualization-canvas.tsx but the fade timing may be wrong

**Required Fix:**

- Require minimum sample size (20+ notes) before generating meaningful snapshot
- Include confidence scores in snapshot data
- Enrich snapshot with: detected chord progression, timing distribution, playing style tendencies
- Add multiple insights instead of single `keyInsight`
- Validate that BPM, key, and timing values are plausible before including in snapshot

---

## 2. Navigation & Layout Issues

### NAV-01: No Proper In-App Navigation

**Severity:** HIGH
**User Report:** "Inside the app lacks a navigation to navigate properly — the overall navigation is poor"
**Files:**

- `src/app/(auth)/session/page.tsx`
- `src/features/modes/mode-switcher.tsx`
- `src/app/(auth)/layout.tsx`

**Current State:**

- Only navigation is the Mode Switcher (3 tabs: Silent Coach, Dashboard+Chat, Replay Studio) fixed at top-right
- No sidebar/drawer navigation to access Settings, History, Achievements, Profile
- No breadcrumbs showing current location
- No way to navigate to `/history`, `/achievements`, `/settings` from within the session page
- Users must manually type URLs or use browser back button

**Required Fix:**

- Add a persistent sidebar or top navigation bar with links to: Session, History, Achievements, Settings, Profile
- Add a user menu (avatar/icon) in the header with dropdown for account actions
- Add breadcrumb trail showing current location
- Make Mode Switcher part of the session page context only (not the global nav)
- Add keyboard shortcut overlay (already exists via `?` key but not discoverable)

---

### NAV-02: Elements Overlap — Tabs Constantly Overlap Components

**Severity:** HIGH
**User Report:** "Elements overlap each other especially the tabs with the three sections constantly overlaps other components"
**Files:**

- `src/features/modes/mode-switcher.tsx` — `fixed right-4 top-12 z-30`
- `src/components/status-bar.tsx` — `fixed top-0 z-40`
- `src/components/snapshot-cta.tsx` — `absolute bottom-16 z-20`
- `src/components/warm-up-prompt.tsx` — `absolute top-24 z-20`

**Root Cause:**

- ModeSwitcher is `fixed right-4 top-12 z-30` — this positions it OVER the right panel content in Dashboard and Replay modes
- On smaller viewports, the fixed position mode switcher overlaps data cards, chat panel, and tab bars
- When the right panel is visible (Dashboard/Replay), the z-30 mode switcher sits on top of the panel content
- StatusBar (`z-40`) + ModeSwitcher (`z-30`) + SnapshotCTA (`z-20`) create a stacking mess on the right side

**Required Fix:**

- Move ModeSwitcher into the layout flow rather than `fixed` positioning — integrate it into the StatusBar or make it part of the grid layout
- Remove fixed positioning for ModeSwitcher; instead place it as part of the top bar
- Ensure all overlays have proper containment and don't overlap interactive elements
- Test all three modes at 1024px, 1280px, and 1440px breakpoints

---

### NAV-03: Replay Trackbar Overlapping Side Drawer

**Severity:** MEDIUM
**User Report:** "The replay trackbar is overlapping the side drawer"
**Files:**

- `src/components/timeline-scrubber.tsx`
- `src/features/modes/replay-studio.tsx`

**Root Cause:**

- Timeline scrubber is at the bottom of a flex column. The grid layout is `grid-cols-[3fr_1fr]` — the right panel takes 1fr. The scrubber spans the full width below both columns, but on certain viewport sizes it can visually overlap the right panel content.
- The shrink-0 scrubber competes with the flex-1 content area above it.

**Required Fix:**

- Ensure timeline scrubber is contained within the canvas column only, or has clear visual separation from the right panel
- Add border/background separation between scrubber and panel
- Test at various viewport heights (especially <700px)

---

## 3. Dashboard & Data Accuracy Issues

### DASH-01: Dashboard Tab Data Completely Wrong

**Severity:** HIGH
**User Report:** "The dashboard tab data is completely wrong"
**Files:**

- `src/components/data-card.tsx`
- `src/stores/session-store.ts`

**Current State:**
DataCard shows 4 metrics: Key, Tempo, Timing %, Chords. These read from session store state that's only updated during live play. Problems:

1. Values don't reset between sessions — previous session's data bleeds into new session
2. No distinction between "current" and "session average"
3. Chord display truncated with `truncate` class, no tooltip for overflow
4. Timing accuracy shows raw instantaneous value, not session trend
5. Tempo shows instantaneous BPM, not session average

**Required Fix:**

- Add session summary computation that aggregates across the entire session
- Show both "current" (live) and "session average" values
- Add tooltip for truncated chord progressions
- Reset all metrics to default state when starting new session
- Add more metrics: note count, session duration, playing density

---

### DASH-02: No Proper User Dashboard with Stats/Difficulty/Style Info

**Severity:** HIGH
**User Report:** "I don't see a proper user dashboard with helpful info" and "I don't see a dashboard with style info or difficulty or stats — that's all missing"
**Files:**

- `src/features/modes/dashboard-chat.tsx`
- `src/app/(auth)/session/page.tsx`

**Current State:**
The "Dashboard" mode is actually just a chat panel with 4 small metric cards. There is no:

- Skill profile visualization (dimensions: rhythm, harmony, technique, etc.)
- Difficulty level display
- Playing style/genre preferences
- Session statistics (total practice time, average session length, notes per session)
- Improvement trends (week-over-week, month-over-month)
- Personal bests or milestones
- Practice streaks visualization (exists but hidden behind toggle)

**Required Fix:**

- Create a proper User Dashboard view with:
  - **Skill Profile Radar** — visual breakdown of skill dimensions
  - **Difficulty Level Indicator** — current level + growth trajectory
  - **Session Stats Summary** — total time, sessions, notes, streaks
  - **Improvement Trends** — charts showing progress over time
  - **Recent Achievements** — latest badges/milestones
  - **Playing Style Profile** — detected genres, harmonic preferences
  - **Practice Recommendations** — AI-generated based on skill profile
- This should be a dedicated view accessible from navigation, not buried in the chat sidebar

---

## 4. Drill Generation Issues

### DRILL-01: Drill Only Generates a Prompt, No Actual Drill Content

**Severity:** HIGH
**User Report:** "The drill does not generate anything apart from a prompt"
**Files:**

- `src/features/modes/dashboard-chat.tsx` (lines 24-35)
- `src/components/snapshot-cta.tsx`
- `src/app/api/ai/drill/route.ts`
- `src/features/drills/drill-generator.ts`

**Root Cause:**
When user clicks "Generate Drill" on the SnapshotCTA:

1. `setPendingDrillRequest(true)` is set
2. Mode switches to Dashboard+Chat
3. In `DashboardChat`, the effect on line 24-35 detects `pendingDrillRequest`, constructs a `drillPrompt` string like `"Generate a drill for me: [keyInsight]"`, sets it as `input`, then calls `handleSubmit()` after a 0ms timeout
4. This sends the drill prompt as a **chat message** to the AI coaching chat — NOT to the structured drill generation API (`/api/ai/drill`)
5. The result is just a text response from the AI, not a structured drill with notes, phases, and playback

**Required Fix:**

- Route drill requests to the dedicated `/api/ai/drill` endpoint (which uses structured output schema) instead of the chat endpoint
- Parse the structured drill response and create a `DrillController` instance with actual note sequences
- Display the drill controller UI with the Demonstrate → Listen → Attempt → Analyze flow
- Pre-populate drill with notes from the API response, not just text

---

### DRILL-02: No Way to Hear What the Drill Should Sound Like

**Severity:** HIGH
**User Report:** "When I generate a drill I want to be able to hear what the drill should sound like"
**Files:**

- `src/features/drills/drill-player.ts`
- `src/components/drill-controller.tsx`

**Current State:**

- `drill-player.ts` has oscillator-based Web Audio synthesis and MIDI output playback code
- But the DrillController UI only shows text instructions — there's no explicit "Preview" or "Listen" button
- The Demonstrate phase exists but is only triggered after clicking "Start Drill"
- Users can't preview the drill sound before committing

**Required Fix:**

- Add a "Preview" button to the drill card that plays the drill notes via MIDI output or Web Audio
- Make the Demonstrate phase louder/clearer with visual emphasis
- Add repeat demonstration option
- Ensure Web Audio fallback works when no MIDI output is connected

---

### DRILL-03: Drills Not Stored Properly

**Severity:** MEDIUM
**User Report:** "Have it stored some way"
**Files:**

- `src/stores/session-store.ts`
- `src/features/drills/drill-generator.ts`

**Current State:**

- Generated drills live only in component state during the session
- No drill history persisted to IndexedDB or Supabase
- No way to revisit a previous drill
- Drill completion data (reps, accuracy, improvement) tracked in session store but not persisted long-term

**Required Fix:**

- Save generated drills to IndexedDB with: notes, metadata, generation context, results
- Add drill history view in the dashboard
- Allow replaying/restarting previous drills
- Track drill progress over time (same drill attempted multiple times)

---

### DRILL-04: Generate Drill Prompt Text Gets Cut Off

**Severity:** MEDIUM
**User Report:** "When we hit generate drill it pastes a prompt that is not fully visible and the text box gets cut off"
**Files:**

- `src/components/ai-chat-panel.tsx` (lines 205-214, 93-98)

**Root Cause:**

- Textarea has `rows={1}` and auto-resizes up to `120px` max height
- Long drill prompts like "Generate a drill for me: Your timing accuracy is averaging 72% with consistent late attacks on off-beat patterns in minor keys" overflow the 120px limit
- No scroll indication on the capped textarea

**Required Fix:**

- Increase max textarea height to at least 200px for drill prompts
- Add visual scroll indicator when content overflows
- Or better yet: show drill prompts in a dedicated drill request card, not in the chat input

---

## 5. AI Chat & Visualization Issues

### CHAT-01: AI Chat Responses Need More/Better Visualizations

**Severity:** MEDIUM
**User Report:** "The generated chat response from the AI should have more and better visualizations"
**Files:**

- `src/components/ai-chat-panel.tsx`
- `src/features/coaching/response-processor.ts`

**Current State:**

- Chat responses are plain text with basic segment highlighting (metrics in `text-metric`, chords in `text-achieved`)
- No inline charts, diagrams, or structured data displays
- No chord diagrams, no scale visualizations, no timing graphs
- AI responses look like plain chat messages, not coaching insights

**Required Fix:**

- Add rich response components that the AI can trigger:
  - **Chord Diagram** — visual chord shape/voicing
  - **Scale Display** — highlighted notes on a piano keyboard visual
  - **Timing Graph** — inline timing accuracy chart
  - **Progress Mini-Chart** — before/after comparison
  - **Practice Tip Card** — styled callout for actionable advice
  - **Drill Suggestion Card** — clickable card to start a recommended drill
- Parse AI response structure (via markers or structured sections) to render appropriate visualizations
- Use the established design system (dark cards, pastel blue accents, monospace metrics)

---

### CHAT-02: Chord and Note Visualizations Too Small

**Severity:** MEDIUM
**User Report:** "I want the chord and note visualizations to be slightly bigger and more noticeable and helpful but keep the aesthetic the same"
**Files:**

- `src/components/viz/piano-roll-renderer.ts`
- `src/components/viz/harmonic-overlay-renderer.ts`

**Current State:**

- Piano roll note bars are small relative to canvas
- Chord labels rendered with small font size
- Harmonic overlay (key, roman numerals) uses minimal sizing
- On high-DPI displays, elements can appear even smaller

**Required Fix:**

- Increase note bar height by ~30% on the piano roll
- Increase chord label font size from current to at least 16px logical
- Make key center label larger and more prominent (currently blends into background)
- Add note name labels next to active notes on the piano roll
- Increase harmonic function indicators (roman numerals) size
- Keep the existing dark aesthetic — just scale up the elements
- Add a faint glow/bloom effect on active notes for better visibility

---

## 6. Missing Screens & Features

### MISSING-01: No Warm-Up Drills Section Visible

**Severity:** HIGH
**User Report:** "I don't see the warm-up drills section"
**Files:**

- `src/components/warm-up-prompt.tsx`
- `src/features/session/warm-up-flow.ts`

**Current State:**

- WarmUpPrompt exists but has strict visibility conditions (lines 42-52):
  - Must be authenticated
  - Must not have played any notes yet (`totalNotesPlayed > 0` hides it)
  - Must have a `skillProfile`
  - Must have `recentSessions.length > 0`
  - Must not be in `isWarmingUp` state
- If ANY condition fails, component returns null — user never sees it
- Even when shown, it's a simple "Warm up first?" card with Start/Skip — no actual warm-up exercises visible
- No dedicated warm-up section in the UI

**Required Fix:**

- Create a dedicated Warm-Up section in the User Dashboard
- Show available warm-ups even without strict conditions
- Display warm-up exercise content (not just a prompt)
- Add warm-up history and completion tracking
- Add "Quick Warm-Up" button to main navigation
- Reduce visibility conditions — show for authenticated users with at least 1 previous session

---

### MISSING-02: No User Profile / Account Dashboard

**Severity:** MEDIUM
**Files:**

- `src/app/(auth)/settings/page.tsx` (exists but minimal)

**Current State:**

- Settings page has API key management and account deletion
- No profile view with: practice statistics, account age, total practice hours, skill level
- No way to see your own progress at a glance outside of session context

**Required Fix:**

- Add user profile section to dashboard with practice statistics
- Show total practice time, sessions count, days active, current streak
- Display skill level progression

---

## 7. UX Design Critique & Improvements

### UX-01: Information Architecture — Chat-Centric Dashboard is Wrong Mental Model

**Problem:** The "Dashboard" mode is actually a chat interface with tiny data cards. Users expect a dashboard to show their data — stats, charts, progress. Instead they get a chat window.

**Impact:** Users feel the app has no data visibility. The rich analysis data being collected is invisible to users.

**Recommendation:**

- Rename "Dashboard+Chat" to just "Chat" or "Coach"
- Create a separate "Dashboard" that is a proper data visualization view
- New mode order: **Play** (Silent Coach) → **Dashboard** (stats/progress) → **Coach** (chat) → **Replay**
- Or consolidate: Make dashboard a separate page accessible from navigation, keep modes as Play/Coach/Replay

---

### UX-02: The "Studio Engineer" Persona Needs More Visual Presence

**Problem:** The AI's Studio Engineer persona is defined in product docs but invisible in the UI. Chat messages look like generic AI responses.

**Recommendation:**

- Add a subtle avatar/icon for the Studio Engineer in chat
- Use distinct typographic treatment for AI messages (already uses monospace, but could add a left-accent bar in `--primary` color)
- Add a brief contextual greeting on first chat open: "Studio Engineer online. What are you working on?"
- Style AI responses with more structure: headers, bullet points, callout boxes

---

### UX-03: Visual Hierarchy — Everything is the Same Size

**Problem:** Data cards, chat messages, drill info, and navigation all use similar tiny text sizes (`text-xs`, `text-[10px]`, `text-[11px]`). Nothing stands out.

**Recommendation:**

- Establish clear typographic hierarchy:
  - **Primary metric** (Key, BPM): 24px, `font-mono`, high contrast
  - **Secondary metric** (Timing, Chord): 16px, `font-mono`, medium contrast
  - **Labels**: 10px uppercase tracking as-is
  - **Chat text**: 14px body text (currently 12-13px, too small for reading)
  - **Headings**: 18-20px for section titles
- Make the DataCard metrics MUCH bigger — they're the most important information

---

### UX-04: Engagement/Progress Section Buried and Hidden

**Problem:** The Progress toggle (WeeklySummary + PersonalRecords) is hidden behind a tiny `+` button labeled "Progress" in 10px uppercase text. Most users will never find it.

**Recommendation:**

- Show progress data prominently in the dashboard view
- Remove the toggle — always show a compact progress summary
- Use visual indicators (streak flame, XP bar, achievement count) that are always visible
- Add a prominent "Your Progress" section to the dedicated dashboard

---

### UX-05: Mode Switching is Confusing

**Problem:** Three modes are presented as tabs but they're really different applications. Silent Coach is immersive canvas. Dashboard+Chat is a split panel. Replay Studio is a detail viewer. The mental model is unclear.

**Recommendation:**

- Add descriptive subtitles under each mode name:
  - **Play** — "Live visualization"
  - **Coach** — "AI-assisted practice"
  - **Replay** — "Session review"
- Add mode transition animations (brief crossfade) to make switching feel intentional
- Show a brief onboarding tooltip on first use explaining what each mode does

---

### UX-06: Canvas Visualization Needs "What Am I Looking At?" Context

**Problem:** The piano roll, timing grid, and harmonic overlay are rendered without labels or legends. New users won't understand what the colored bars, dots, and numbers mean.

**Recommendation:**

- Add a subtle legend overlay (toggle-able) showing:
  - "Notes" label near piano roll
  - "Timing" label near timing grid
  - "Key: C Major" label near harmonic overlay
- Make the legend auto-hide after 30 seconds or on first note played
- Add an info button `(i)` that shows a brief explanation of the visualization

---

### UX-07: Empty States are Uninspiring

**Problem:** Empty states (no sessions, no API key, no MIDI) show minimal text. They don't guide users or inspire action.

**Recommendation:**

- Design empty states with:
  - Illustration or subtle animation
  - Clear action button (primary CTA)
  - Brief explanation of what they'll see once they take action
- For "No sessions yet": Show a mock visualization preview with "Play your first note to see your music come alive"
- For "No API key": Show a preview of what AI coaching looks like with "Connect your API key to unlock AI coaching insights"

---

### UX-08: Color Usage — Amber Overused, No Positive Reinforcement Color

**Problem:** Amber (`accent-warm`) is used for: "listen first" labels, improvement at 0%, improvement negative, typing indicators, error messages, and growth mindset messages. Too much amber makes everything feel like a warning.

**Recommendation:**

- Reserve amber strictly for "attention needed" states
- Add a success/positive color (currently `accent-success` exists but rarely used) for:
  - Positive improvement percentages
  - Streak milestones
  - Achievement unlocks
  - Good timing accuracy (>85%)
- Use `accent-blue` (primary) for neutral-positive states
- Use a muted green for confirmed positive outcomes

---

### UX-09: Drill Flow UX is Disjointed

**Problem:** The drill flow (SnapshotCTA → mode switch → chat input → AI response) feels like 4 separate actions. User expects: click "Generate Drill" → see drill → play drill.

**Recommendation:**

- Clicking "Generate Drill" should:
  1. Show a loading indicator on the button itself
  2. Call the drill API directly (not through chat)
  3. Open a dedicated Drill Panel (not the chat)
  4. Show the drill with: Preview button, Instructions, Start button
- The drill should feel like a standalone practice activity, not a chat conversation
- Add drill difficulty indicator (color-coded from the Difficulty Engine)

---

### UX-10: Session End Experience Missing

**Problem:** When a user stops playing, nothing happens. No session summary, no stats, no "great job" moment. The `showSummary` state in `SessionPage` is initialized to `false` and never set to `true` by any trigger.

**Recommendation:**

- Auto-trigger session summary after 60s of silence (configurable)
- Show a session summary card with: duration, notes played, key, tempo, timing accuracy, improvement vs last session
- Include a motivational growth-mindset message
- Offer: "View Replay", "Continue Playing", "End Session"
- Save session automatically on summary dismiss

---

### UX-11: The Chord Visualization is Text-Only

**Problem:** Chords are displayed as text labels (`Cm`, `Bbm`, `Ebmaj7`) which are hard to parse quickly and meaningless to beginners.

**Recommendation:**

- Add a visual chord indicator — colored arc or shape that represents chord quality:
  - Major: solid block
  - Minor: outlined block
  - 7th: block with dot
  - Diminished: dashed block
- Use color to encode chord function (tonic = stable blue, dominant = warm amber, etc.)
- Add chord progression strip showing last 8 chords as colored blocks with labels

---

### UX-12: Responsive Design — Right Panel Too Narrow at 1024px

**Problem:** Replay Studio uses `grid-cols-[3fr_1fr]` — at 1024px the right panel is only ~256px wide. Tab labels, session cards, and chat are cramped.

**Recommendation:**

- Change Replay Studio grid to `grid-cols-[2fr_1fr]` minimum
- Or use a min-width on the right panel: `min-w-[320px]`
- Consider a collapsible panel that expands on interaction

---

### UX-13: No Visual Feedback for MIDI Input Quality

**Problem:** The app shows notes on the piano roll but gives no feedback about whether the user is playing well, poorly, fast, slow, etc. during live play.

**Recommendation:**

- Add subtle background color shifts on the canvas:
  - Good timing: brief green pulse on timing grid
  - Late/early: brief amber pulse
- Add a "flow state" indicator — when user is playing consistently well, show a subtle glow or aura effect
- Keep feedback ambient and non-distracting (background, not foreground)

---

## 8. Implementation Priority Matrix

### P0 — Must Fix Before Any User Testing (Sprint 12)

| ID       | Issue                                           | Effort |
| -------- | ----------------------------------------------- | ------ |
| BUG-01   | Replay doesn't work (replay-to-canvas bridge)   | Large  |
| NAV-01   | Add proper in-app navigation                    | Medium |
| NAV-02   | Fix element overlap / mode switcher positioning | Medium |
| DASH-02  | Create proper User Dashboard with stats         | Large  |
| DRILL-01 | Route drills to structured API, not chat        | Medium |
| UX-01    | Restructure modes / add Dashboard view          | Medium |

### P1 — Fix Before Beta (Sprint 13)

| ID         | Issue                                  | Effort |
| ---------- | -------------------------------------- | ------ |
| BUG-02     | Improve key detection accuracy         | Medium |
| BUG-03     | Fix dashboard data sync                | Medium |
| BUG-05     | Fix BPM accuracy                       | Medium |
| BUG-06     | Fix snapshot accuracy and usefulness   | Medium |
| DRILL-02   | Add drill audio preview                | Medium |
| DRILL-04   | Fix chat textarea truncation           | Small  |
| CHAT-02    | Increase chord/note visualization size | Small  |
| MISSING-01 | Make warm-up section visible           | Medium |
| UX-03      | Fix visual hierarchy / text sizing     | Medium |

### P2 — Fix Before Launch (Sprint 14)

| ID       | Issue                               | Effort |
| -------- | ----------------------------------- | ------ |
| BUG-04   | Complete session history            | Medium |
| CHAT-01  | Add rich AI response visualizations | Large  |
| DRILL-03 | Persist drills to storage           | Medium |
| NAV-03   | Fix replay trackbar overlap         | Small  |
| UX-02    | Studio Engineer visual presence     | Small  |
| UX-04    | Surface progress data prominently   | Medium |
| UX-05    | Improve mode switching UX           | Small  |
| UX-06    | Add canvas visualization legend     | Medium |
| UX-09    | Redesign drill flow                 | Medium |
| UX-10    | Add session end experience          | Medium |

### P3 — Polish for Launch (Sprint 15)

| ID         | Issue                                | Effort |
| ---------- | ------------------------------------ | ------ |
| UX-07      | Design better empty states           | Small  |
| UX-08      | Fix amber overuse, add success color | Small  |
| UX-11      | Add visual chord indicators          | Medium |
| UX-12      | Fix right panel responsiveness       | Small  |
| UX-13      | Add MIDI input quality feedback      | Medium |
| MISSING-02 | User profile/account dashboard       | Medium |

---

## File Reference Index

**Core Layout:**

- `src/app/(auth)/session/page.tsx` — Session page entry point
- `src/app/(auth)/layout.tsx` — Auth layout wrapper
- `src/features/modes/mode-switcher.tsx` — Mode tabs
- `src/features/modes/silent-coach.tsx` — Immersive canvas mode
- `src/features/modes/dashboard-chat.tsx` — Chat + metrics mode
- `src/features/modes/replay-studio.tsx` — Replay viewer mode

**Visualization:**

- `src/components/viz/visualization-canvas.tsx` — Main canvas (60fps render loop)
- `src/components/viz/piano-roll-renderer.ts` — Note rendering
- `src/components/viz/harmonic-overlay-renderer.ts` — Key/chord overlay
- `src/components/viz/timing-grid-renderer.ts` — BPM/timing display
- `src/components/viz/snapshot-renderer.ts` — Snapshot overlay

**Data & Analysis:**

- `src/components/data-card.tsx` — 4-metric grid
- `src/features/analysis/use-analysis-pipeline.ts` — Analysis orchestrator
- `src/features/analysis/key-detection.ts` — Key center detection
- `src/features/analysis/chord-detection.ts` — Chord recognition
- `src/features/analysis/tempo-detection.ts` — BPM detection
- `src/stores/session-store.ts` — Session state

**Drill System:**

- `src/components/drill-controller.tsx` — Drill phase UI
- `src/features/drills/drill-player.ts` — MIDI/audio playback
- `src/features/drills/drill-generator.ts` — LLM structured output
- `src/app/api/ai/drill/route.ts` — Drill API endpoint
- `src/components/snapshot-cta.tsx` — Generate Drill trigger

**Chat & AI:**

- `src/components/ai-chat-panel.tsx` — Chat UI
- `src/features/coaching/coaching-client.ts` — Chat hook
- `src/features/coaching/response-processor.ts` — Text highlighting
- `src/app/api/ai/chat/route.ts` — Chat API endpoint

**Replay:**

- `src/features/session/replay-engine.ts` — Playback loop
- `src/features/session/use-replay-session.ts` — Session loader
- `src/components/timeline-scrubber.tsx` — Playback controls

**Navigation:**

- `src/components/status-bar.tsx` — Top status bar
- `src/components/warm-up-prompt.tsx` — Warm-up prompt
- `src/components/session-summary.tsx` — Session end modal

---

_This document consolidates user-reported bugs, codebase analysis findings, and UX design critique. It supersedes individual bug reports and should be used as the primary implementation backlog for the next sprint cycle._
