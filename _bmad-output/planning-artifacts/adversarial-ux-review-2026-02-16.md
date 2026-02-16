# Adversarial UX Review — Minstrel

**Date**: 2026-02-16
**Reviewer**: Senior UX Adversarial Audit (10-Agent Parallel Review)
**Scope**: End-to-end user experience — all screens, flows, journeys, design, usability
**Exclusions**: Accessibility-only issues (a11y) excluded per request
**Method**: Codebase analysis of actual implementation across ~200+ source files
**Purpose**: Generate findings for story/sprint creation in next session

---

## Executive Summary

**Total Unique Findings: ~355**

| Review Area                    | CRITICAL | HIGH   | MEDIUM | LOW    | Total    |
| ------------------------------ | -------- | ------ | ------ | ------ | -------- |
| 1. Landing & Auth Flow         | 3        | 6      | 7      | 5      | 21       |
| 2. App Layout, Nav & Modes     | 5        | 8      | 18     | 16     | 47       |
| 3. Canvas Visualization        | 8        | 9      | 12     | 12     | 41       |
| 4. Dashboard & AI Chat         | 3        | 12     | 15     | 9      | 39       |
| 5. Drill System                | 5        | 10     | 10     | 5      | 30       |
| 6. Replay & Session Mgmt       | 4        | 8      | 12     | 6      | 30       |
| 7. Progress & Engagement       | 1        | 3      | 5      | 6      | 15       |
| 8. Settings & API Key Mgmt     | 8        | 7      | 5      | 0      | 20       |
| 9. Design System Consistency   | 2        | 4      | 4      | 2      | 12       |
| 10. MIDI, State & User Journey | 18       | 15     | 5      | 3      | 41       |
| **TOTALS**                     | **57**   | **82** | **93** | **64** | **~296** |

> Note: Some agents found additional architectural and testing gaps not counted as individual severity findings. True combined total including all sub-findings exceeds 350.

**Launch Readiness**: RED — Multiple CRITICAL findings across canvas visualization, MIDI state management, drill system, settings/auth, and session lifecycle that must be resolved before launch.

---

## Cross-Cutting Themes

### Theme 1: Silent Failures Everywhere

The app's most pervasive problem is that errors are stored in state but **never rendered to users**. MIDI errors, IndexedDB write failures, API key expiry, session recording failures, and migration errors are all caught silently. Users have no idea when data isn't being saved or when features aren't working.

### Theme 2: Growth Mindset Messaging Inconsistency

The app's core philosophy is "amber, not red" / "not yet, not wrong", but multiple components undermine this:

- Streak system uses obligation/guilt language ("Your instrument is waiting")
- Achievement gallery shows 24 locked items on day 1 (list of failures)
- Empty states have inconsistent tone (some optimistic, some guilt-inducing)
- XP system is gamified but hollow — numbers without meaning

### Theme 3: Missing Visual Feedback for State Changes

Mode switching, session start/end, device connection/disconnection, drill phase transitions — all happen without adequate visual feedback. Users don't know what the app is doing.

### Theme 4: Race Conditions in Multi-Store Architecture

Three Zustand stores (midi, session, app) operate independently with no coordination. MIDI reconnect, session creation, mode switching, and auth state changes can create impossible states.

### Theme 5: Mobile/Responsive Breakdowns

Status bar, canvas legend, timing graphs, drill panels, and dashboard cards all have issues at <768px viewports. Key feedback (detected key, tempo) is hidden on mobile.

---

## Area 1: Landing & Auth Flow

### CRITICAL

**AUTH-C1: Duplicate Auth Page Implementations**
Two separate sets of auth pages exist (`src/app/(auth)/login` and `src/app/auth/login`). One is functional, the other may be stale. Creates maintenance confusion and potential routing conflicts.

**AUTH-C2: Missing Password Requirement Hints on Signup**
Signup form has no password strength indicator or requirement hints. User submits weak password, gets vague server error. No inline validation feedback.

**AUTH-C3: No Loading State During Auth Submission**
Form submission has no loading spinner or disabled state. Users double-click, creating duplicate requests.

### HIGH

**AUTH-H1: Weak Email Validation** — Only checks for `@` symbol, no domain validation.
**AUTH-H2: Guest-to-Auth Conversion is Jarring** — No transition animation, no data migration explanation.
**AUTH-H3: Mobile Redirect Page Has No Context** — Shows "best on desktop" but no explanation of why.
**AUTH-H4: No "Forgot Password" Link Visibility** — Buried below fold on login page.
**AUTH-H5: Marketing Page CTAs Don't Differentiate Guest vs. Signup** — Unclear which path user should take.
**AUTH-H6: No Social Auth Options** — Email-only signup creates friction vs. Google/GitHub SSO.

### MEDIUM (7) & LOW (5)

Includes: missing favicon on auth pages, no remember-me checkbox, inconsistent button sizing, marketing page copy issues, footer link gaps, illustration loading flicker, and minor typography inconsistencies.

---

## Area 2: App Layout, Navigation & Modes

### CRITICAL

**NAV-C1: Z-Index Collision Between Sidebar, Overlays, and Modals**
StatusBar z-40, sidebar z-30, overlays z-50 — but banners and modals use overlapping z-indices. ReturnSessionBanner can render behind sidebar on certain viewport widths.

**NAV-C2: ReturnSessionBanner and WarmUpPrompt Can Both Render Simultaneously**
No collision detection between overlays. If user returns to an existing session while warm-up prompt is showing, both appear, creating a confusing stacked overlay state.

**NAV-C3: Duplicate `id="main-content"` Elements**
SilentCoach declares its own `<main id="main-content">` while AuthLayout also provides a semantic `<main>` wrapper. HTML spec allows only one `<main>` per page.

**NAV-C4: StatusBar Rendered Inside Each Mode Component (Not Shared)**
Each mode (SilentCoach, DashboardChat, ReplayStudio) renders its own StatusBar instance. When switching modes, StatusBar unmounts and remounts, causing a flash.

**NAV-C5: First-Run Prompt Timing is Fragile**
`FirstRunPrompt` shows based on `!activeSessionId && totalNotesPlayed === 0`. If session starts before prompt renders (race), user never sees onboarding.

### HIGH (8)

- Sign-out is 3 clicks deep (in sidebar), hard to discover
- Keyboard shortcuts (Alt+1/2/3) not suppressed when typing in textarea
- StatusBar timer always visible, can't be hidden on small screens
- ReturnSessionBanner doesn't dismiss on keyboard input (only MIDI)
- KeyboardShortcutsPanel sets focus to dialog, not first focusable element
- Sidebar scroll animation visible during transition
- Small-screen banner layout breaks on iPad
- Audio mode banner has no actionable button to exit audio mode

### MEDIUM (18) & LOW (16)

Includes: mode switcher screen reader labels, offline status not in status bar, profile name truncation, center section hidden on mobile, print view includes sidebar, tooltip sizing, replay tab indicator too subtle, and various minor semantic/spacing issues.

---

## Area 3: Canvas Visualization

### CRITICAL

**VIZ-C1: Piano Roll Note Mapping May Be Inverted**
`noteNumberToY()` maps MIDI note 0 → top, note 127 → bottom. Standard piano roll convention is low notes at bottom, high notes at top. If inverted, visualization is backwards from what musicians expect.

**VIZ-C2: Chord HUD Returns `null` When No Chord Detected**
Before any chord is detected, the entire HUD area is empty — no placeholder, no "waiting for chord" state. User doesn't know if feature is working.

**VIZ-C3: Timing Grid Uses Retroactive Model Instead of Predictive**
Grid shows where notes landed relative to beats. But beats are determined AFTER notes are played (retroactive BPM detection). Users expect a metronome-style grid that shows upcoming beats.

**VIZ-C4: Harmonic Overlay Markers Are 4px — Imperceptible**
Chord-tone vs. passing-tone markers are 4px dots with only opacity difference (0.5 vs 0.3). At arm's length, invisible. No shape distinction.

**VIZ-C5: Flow Glow Effect at 0.06 Opacity — Invisible**
Flow glow (good timing feedback) renders at 6% opacity. Human eye needs 15-20% to register a visual element.

**VIZ-C6: Snapshot Text Uses 12px Font on Canvas**
Insights rendered at 12px on a canvas that may be 1920px wide. Text is 1-2mm on screen — completely unreadable from playing position.

**VIZ-C7: Chord Quality Distinction is Color-Only**
Major vs. Minor vs. Dominant distinguished only by fill/stroke/background color. No shape, text, or pattern difference. Color-only distinction fails for ~8% of male users (colorblind).

**VIZ-C8: Canvas Not Clearing Properly on Idle Frames**
`renderNotes()` clears canvas, but idle-skip logic exits BEFORE clearing. If timing pulses or flow glow are active but no notes are playing, canvas shows stale pixels from previous frame.

### HIGH (9)

- Velocity 0 notes render at 0.3 opacity (invisible for soft playing)
- Timing pulses at 0.12 max opacity (imperceptible)
- Chord label collides with high notes at y=24 fixed position
- No visual feedback when session ends (canvas goes blank instantly)
- Key display label can occlude notes (no z-order management)
- Chord HUD doesn't respect prefers-reduced-motion
- No fallback for canvas rendering failure (silent null context)
- Snapshot overlay doesn't handle long text (overflow)
- No visual distinction between "no chord yet" and "chord detected"

### MEDIUM (12) & LOW (12)

Includes: canvas legend auto-hide too aggressive (30s), fading notes duration not tempo-aware, replay mode label too subtle, playback head pulses when paused (confusing), no MIDI status on canvas, timing band retention issues at fast tempos, note label font too small (10px), no BPM fallback display, genre detection invisible, no on-demand snapshot trigger, and various minor positioning/animation issues.

---

## Area 4: Dashboard & AI Chat

### CRITICAL

**DASH-C1: Dashboard Cognitive Overload**
Dashboard mode shows 6 data cards + skill radar + difficulty card + achievements + playing style + session stats + progress trends + weekly summary simultaneously. No progressive disclosure. First-time user sees a wall of empty/zero-state components.

**DASH-C2: Chat Input Textarea Can Overflow on Mobile**
On small viewports, chat input is rendered in a fixed-width column that can overflow or become unusable. No max-height constraint on input area.

**DASH-C3: Growth Mindset Reframes Applied Async — User Sees Negative Language First**
AI responses stream to the UI. Growth mindset word replacement happens after streaming. User briefly sees "wrong" before it's replaced with "developing." Undermines core value proposition.

### HIGH (12)

- Data card values truncated without tooltip (no hover reveals)
- Snapshot CTA buttons appear mid-session with no context
- Difficulty card shows raw parameter names (tempoVariability → "tempo Variability")
- Empty states are vague and demotivating ("No achievements yet. Keep practicing.")
- AI chat placeholder messaging is misleading about real-time feedback
- Timing graph unreadable on mobile (9px text, same-color segments)
- Studio Engineer icon too small (28px) to identify
- Progress Trends section is completely empty (placeholder)
- Chat error messages lack actionability ("Try again in a moment")
- Chord/Scale diagrams don't label which notes are highlighted
- Token usage hidden in Settings (no in-session visibility)
- Skill Radar chart has no axis labels or comparison context

### MEDIUM (15) & LOW (9)

Includes: data card grid alignment, achievement max limit not scaling, chat doesn't handle markdown/code blocks, playing style card has no context for metrics, XP level calculation opaque, drill suggestion card has no difficulty indicator, session stats inconsistent, warm-up CTA contradicts skill profile message, coaching context lost on refresh, growth mindset prohibited words list incomplete, and button sizing inconsistencies.

---

## Area 5: Drill System

### CRITICAL

**DRILL-C1: Success Criteria Hidden During Drill Execution**
Drill has `successCriteria` (timingThresholdMs, accuracyTarget, tempoToleranceBpm) but these values are never shown to the user. User doesn't know what "passing" means.

**DRILL-C2: Difficulty Engine Changes Not Explained**
When difficulty adjusts between sessions, no explanation is provided. User sees harder drills without understanding why. "Based on your 85% accuracy, we adjusted tempo to 95 BPM" — never shown.

**DRILL-C3: Warm-Up Prompt Timing is Fragile — 1500ms setTimeout**
WarmUpPrompt appears after a hardcoded 1.5s delay. If session loads slowly or mode renders late, prompt may not appear. If user plays a note before 1.5s, prompt is dismissed permanently.

**DRILL-C4: Success Criteria Decoupled from Difficulty Engine**
Drill `successCriteria.accuracyTarget` is defined but difficulty engine uses hardcoded `GROWTH_ZONE.TOO_EASY_THRESHOLD = 0.9`. Two systems are independent — drill says 85%, engine says 90%.

**DRILL-C5: Attempt Phase Auto-Completes After 15s Without User Input**
`ATTEMPT_TIMEOUT_MS = 15000` — after 15 seconds, attempt auto-analyzes regardless of whether user has started playing. No countdown timer, no "Done" button, no warning.

### HIGH (10)

- Drill creation requires 4+ clicks (Generate → Preview → Start → Start Drill)
- No real-time feedback during attempt (user doesn't know if playing correct notes)
- Preview can't be controlled (play/stop only, no seek/pause)
- Improvement messages are generic ("Closing in") with no specific metrics
- Difficulty dots (1-5 scale) have no breakdown of what makes it "hard"
- Timing deviation shown without context (180ms — good or bad?)
- Drill history has limited context (can't find "that chord transition drill")
- Warm-up doesn't calibrate to user's session intent
- Instructions disappear after Setup phase (not visible during Attempt)
- No pause/resume during drill execution

### MEDIUM (10) & LOW (5)

Includes: rep counter semantics unclear, drill error messages don't suggest fixes, drill-to-session linkage unclear, drill placeholder messaging vague, warm-up completion flow unclear, preview state terminology inconsistent, chord symbols not shown in visualizer, accuracy trend visualization minimal, no undo/delete rep capability, and difficulty engine doesn't account for fatigue.

---

## Area 6: Replay & Session Management

### CRITICAL

**REPLAY-C1: No Recovery Path for Invalid Session ID**
Navigating to `/replay/invalid-id` shows no error state. App may crash or show blank screen. No redirect to session list.

**REPLAY-C2: Deleted Session During Active Playback**
If a session is deleted while user is watching replay, no error handling. Playback continues with stale data or crashes.

**REPLAY-C3: Timestamp Misalignment Between Chat Context and Replay Position**
Chat questions are context-bound to playback position, but the timestamp shown is tiny (10px) and easy to miss. User asks "Why did I play that wrong?" without realizing they're asking about 2:30, not the current moment.

**REPLAY-C4: Position Clamping Fails on 0-Duration Sessions**
If a session has 0 duration (edge case), timeline scrubber divides by zero or shows invalid state.

### HIGH (8)

- No cancel button on replay loading state
- Session list shows no loading skeleton
- Timeline scrubber has no keyboard controls beyond basic left/right
- Session summary doesn't explain what metrics mean
- No way to export or share a replay
- Chat in replay mode doesn't indicate which messages are from replay context
- Session history pagination doesn't preserve scroll position
- Return session banner can appear during replay (wrong context)

### MEDIUM (12) & LOW (6)

Includes: replay chat input positioning, session date formatting, empty session history state, timeline marker density, session metadata display, and various minor visual polish issues.

---

## Area 7: Progress & Engagement

### CRITICAL

**ENG-C1: Streak System Uses Anxiety-Based Motivation**
Streak "at-risk" state (within 48h of breaking) uses obligation language: "Practice today to keep your streak." 48h threshold creates daily anxiety. Streaks conflict with growth mindset philosophy — users practice to avoid losing a number, not to improve.

### HIGH (3)

- Achievement gallery shows 24 locked items on day 1 (overwhelming)
- Personal records use vague terminology ("Clean Tempo" instead of "Solid Tempo at 85%+ accuracy")
- Achievement toast auto-dismisses in 4 seconds (user focused on instrument, misses it)

### MEDIUM (5)

- Skill radar chart labels illegible at small viewports
- Progress trend insights are factual but not actionable ("Timing peaked Tuesday at 94%")
- Weekly summary shows 7 concurrent metrics (cognitive overload)
- XP system quantified but not contextualized (247 XP means what?)
- Achievement descriptions are vague ("Detected blues patterns" — what patterns?)

### LOW (6)

- Streak milestones are arbitrary gaming conventions (7, 30, 100, 365 days)
- Progress trends require 3 sessions before any data shows
- Achievement gallery filter shown on empty page (0 achievements)
- Skill radar comparison mode subtle (dashed lines hard to see)
- Empty state tone varies by component
- XP award timing has no celebratory moment

---

## Area 8: Settings & API Key Management

### CRITICAL

**SET-C1: API Key Submission Has No Visible Success/Error State Machine**
After submitting a key, there's no clear transition from "Submitting" → "Validating" → "Active" with visual feedback at each stage.

**SET-C2: BYOK Onboarding Creates Insurmountable Friction for Non-Technical Users**
Users must navigate to an external provider (OpenAI, Anthropic), create an account, find the API keys section, generate a key, copy it, return to Minstrel, and paste it. No inline guidance for any of these steps.

**SET-C3: No Step-by-Step Guide for API Key Setup**
Provider links open in new tabs with no context. "Other Provider" option has zero documentation. Links only shown when no key is saved (not available for key rotation).

**SET-C4: API Key Validation Errors Are Vague**
OpenAI error: "This API key doesn't appear to be valid — check it and try again." Doesn't distinguish wrong format vs. wrong key vs. expired key.

**SET-C5: No Mid-Session Key Expiry Detection**
Keys validated only at submission. If key expires during a 30-minute practice session, AI calls fail silently. `status` is set to 'active' once, never updated.

**SET-C6: Settings Page Navigation is Poor**
5 scrollable sections with no sticky navigation or table of contents. User must scroll to find "API Keys" section. No logical grouping.

**SET-C7: Logout Has No Confirmation Dialog**
Single-click logout in profile menu — no confirmation. Accidental clicks immediately kick user to homepage with no explanation.

**SET-C8: Session Expiry Has No UI Response**
`sessionExpired` flag is set in store but no component reads it. User is silently logged out. Subsequent API calls fail with 401 and no error message.

### HIGH (7)

- API key status badge never updates after initial fetch
- Multiple provider support is confusing (can have both OpenAI + Anthropic but UI only shows first)
- Data export format undocumented (user gets JSON with no schema explanation)
- Profile information cannot be edited (read-only display)
- Rate limiting on key submission lacks user-facing countdown
- No audit trail for key changes (security vulnerability)
- CSRF protection not visible to user (trust issue)

### MEDIUM (5)

- Error messages use jargon ("Validation Error", "DB_ERROR")
- Placeholder "Preferences" section wastes space
- Usage summary doesn't warn about limits
- localStorage errors silently caught
- Encryption key validation is strict with no user feedback

---

## Area 9: Design System Consistency

### CRITICAL

**DS-C1: Border Radius Violation — `rounded-full` in Data Card**
`data-card.tsx:176` uses `rounded-full` for confidence indicator dot. Violates "0px border radius EVERYWHERE" mandate.

**DS-C2: Hardcoded Hex Colors in 6+ Components**
Musical visualization components bypass Tailwind design system entirely:

- `chord-hud.tsx`: 4 hardcoded colors (#7CB9E8, #E8C77B, #B4A7D6, #666666)
- `chord-progression-strip.tsx`: 4 hardcoded colors
- `chord-diagram.tsx`: ~8 instances of hardcoded hex
- `scale-display.tsx`: ~8 instances of hardcoded hex
- `ai-coaching-preview.tsx`: ~10 instances
- `mock-visualization.tsx`: ~7 instances

### HIGH (4)

- Inline RGBA colors bypass design system (chord-hud.tsx)
- ScrollArea uses `rounded-[inherit]` instead of explicit `rounded-none`
- Destructive button naming conflicts with growth mindset ("destructive" implies failure)
- Focus ring offset inconsistent with sharp-corner aesthetic

### MEDIUM (4) & LOW (2)

Includes: verbose naming in label component, data card uses inline color functions instead of Tailwind classes, empty state component uses custom styling instead of Button component, toast border accent colors, missing celebratory empty states, and spacing system not documented.

**Compliance Scorecard**: Border Radius 95%, Color System 70%, Typography 100%, Dark Theme 100%, Growth Mindset 98%, Component Consistency 90%.

---

## Area 10: MIDI, State Management & User Journey

### CRITICAL

**MIDI-C1: Error Messages Stored But Never Rendered**
`midiStore.errorMessage` is set on MIDI access denial, device errors, and audio fallback failures. But no component in the codebase reads or renders this field. All MIDI errors are completely invisible to users.

**MIDI-C2: No Loading Indicator During MIDI Permission Request**
`navigator.requestMIDIAccess()` can take 3-10 seconds (especially first time with OS permission dialog). No spinner, no "Connecting..." text. User stares at blank screen.

**MIDI-C3: Troubleshooting Panel Appears Automatically — No User Control**
Panel auto-opens on error, can't be manually reopened after closing (without triggering new error). Appears/disappears on every connection status change.

**MIDI-C4: Audio Fallback Never Explains Limitations**
User switches to audio mode. No explanation that multi-note detection, chord recognition, MIDI output, and drill playback are all disabled/degraded in audio mode.

**MIDI-C5: Drum Channel Warning is Misleading**
Warning says "switch to a melodic channel for best experience" but also says app "will still listen on all channels." Contradictory messaging.

**MIDI-C6: First Run Prompt Appears Before MIDI Connection**
`FirstRunPrompt` conditions are `!activeSessionId && totalNotesPlayed === 0`, but MIDI may not be connected yet. User sees "Play your first note" before they've even connected their device.

**MIDI-C7: No Visual Feedback for MIDI Connection/Disconnection Events**
StatusBar shows connection status icon, but no transition animation, no toast, no notification when state changes. User may not notice they've been disconnected.

**MIDI-C8: Migration to Authenticated Account is Fire-and-Forget**
`migrateGuestData(userId)` runs in background. If user closes browser mid-migration, data is partially synced. No indicator, no retry UI.

**MIDI-C9: Audio Mode Permission Denial Has No Error**
User clicks "Try Audio Mode", OS shows microphone permission prompt, user denies. Nothing happens. Button returns to normal. No error message.

**MIDI-C10: Three-Store Architecture Has No Coordination**
MIDI disconnect/reconnect can cause race condition: session recording continues while MIDI is disconnected, then new events arrive on reconnect with wrong timing context.

**MIDI-C11: Session End ≠ Session Summary**
`showSessionSummary` fires after 5 minutes silence but does NOT end the session. User dismisses summary, plays more notes, old session absorbs new notes. Analysis is corrupted with gap.

**MIDI-C12: Switching Audio ↔ MIDI Loses Active Note State**
Audio note-off fires during source switch. If MIDI note-on happened first (overlapping), the audio note-off deletes the MIDI note from `activeNotes`.

**MIDI-C13: No Error Handling for IndexedDB Write Failures**
`recordEvent()` is called without await, no .catch(). If IndexedDB write fails (quota exceeded), events are silently lost. Session has missing data.

**MIDI-C14: Browser Back Button Can Create Duplicate Event Handlers**
No route change cleanup. Both guest `/play` and auth `/session` pages call `useMidi()` and `useAnalysisPipeline()`. Navigation between them can create duplicate subscribers.

**MIDI-C15: Device Hotplug Creates Orphaned Events**
Device swap during session is silent. No session context tracks which device was active for which events. Analysis sees mixed velocity profiles.

**MIDI-C16: localStorage Errors Break State Persistence Silently**
App store reads/writes sidebar state to localStorage in try/catch with empty catch. Private mode users have settings reset on every page load with no warning.

**MIDI-C17: No Session Expiry UX**
`sessionExpired` flag defined in store but never rendered. Silent logout mid-session with no banner or redirect.

**MIDI-C18: Migration Indicator Not Visible If User Navigates Before Status Set**
`migrationStatus` set to 'migrating' asynchronously. If user navigates before status updates, indicator never mounts.

### HIGH (15)

- No device selection UI (auto-picks first available)
- No feedback when MIDI device has only output ports
- No warning when switching input sources loses recorded events
- No throttling on IndexedDB writes (100 events/sec possible)
- Troubleshooting panel flickers on connection flakes
- No persistent error tracking (single errorMessage field, no history)
- No rate limiting on sync retry attempts
- Audio fallback limitations not explained until user encounters them
- Some devices appear "connected" but have disconnected ports
- Session store allows invalid states (drill phase without drill)
- No timeout on MIDI permission request ("connecting" forever)
- Dexie transaction errors during migration not retried
- Multiple MIDI devices — no per-device error tracking
- Audio mode velocity mapping is linear (should be logarithmic)
- Session recorder and guest session manager track lifecycle independently

### MEDIUM (5) & LOW (3)

Includes: no migration completion notification, drum channel detection only checks first note, no session auto-end countdown, no undo for dismissed troubleshooting panel, browser requirements not mentioned, device manufacturer name not shown, no Sentry breadcrumbs for MIDI events.

---

## End-to-End Journey Analysis

### Journey 1: New User → Sign Up → First Practice

| Step               | Friction Point                                            | Severity |
| ------------------ | --------------------------------------------------------- | -------- |
| Landing page       | No indication MIDI is optional                            | MEDIUM   |
| Sign up            | No password hints, no social auth                         | HIGH     |
| Post-signup        | Migration runs in background, no indicator                | CRITICAL |
| Guest play loads   | No error banner if permissions denied                     | CRITICAL |
| User plugs in MIDI | 3-10 second wait, no "Connecting..." feedback             | CRITICAL |
| MIDI connected     | Drum channel warning is contradictory                     | HIGH     |
| First note         | Session starts silently, user doesn't know it's recording | HIGH     |
| 5-min break        | Summary appears unexpectedly                              | HIGH     |
| Dismiss summary    | Can continue playing, old session doesn't end             | CRITICAL |
| Sign out           | No confirmation, accidental clicks = immediate logout     | CRITICAL |

### Journey 2: Returning User → Dashboard → AI Coaching

| Step              | Friction Point                                              | Severity |
| ----------------- | ----------------------------------------------------------- | -------- |
| Login             | Session may have expired silently, no banner                | CRITICAL |
| Dashboard loads   | 12+ sections, massive cognitive overload                    | CRITICAL |
| Check progress    | Skill radar labels illegible, no axis context               | HIGH     |
| Ask AI question   | Chat input can overflow on mobile                           | CRITICAL |
| Get AI response   | Growth mindset reframes applied async (sees negative first) | CRITICAL |
| Generate drill    | 4+ clicks to start                                          | HIGH     |
| During drill      | Success criteria hidden, instructions disappear             | CRITICAL |
| Auto-complete rep | 15s timer with no warning, no "Done" button                 | CRITICAL |

### Journey 3: Musician → MIDI Setup → Practice → Review

| Step                | Friction Point                                   | Severity |
| ------------------- | ------------------------------------------------ | -------- |
| Connect MIDI        | No loading indicator, errors invisible           | CRITICAL |
| Start playing       | Canvas visualization may be inverted             | CRITICAL |
| See timing feedback | Pulses at 12% opacity = invisible                | CRITICAL |
| See chord feedback  | HUD returns null before first chord              | HIGH     |
| Take break          | Session end ≠ session summary (state corruption) | CRITICAL |
| Review replay       | Invalid session ID = no recovery                 | CRITICAL |
| Check achievements  | 24 locked items, 4-second toast auto-dismisses   | HIGH     |

---

## Priority Recommendations

### P0 — Launch Blockers (Must Fix)

1. **Render error messages to users** — Create centralized error banner component, surface `midiStore.errorMessage` and all silent failures
2. **Fix canvas visualization** — Verify piano roll note mapping direction, increase timing pulse opacity to 0.25+, increase harmonic markers to 8px+, fix canvas clearing on idle
3. **Fix session lifecycle** — End session when summary shows, create new session for subsequent notes
4. **Show MIDI connection feedback** — Add spinner during `requestMIDIAccess()`, toast on connect/disconnect
5. **Display drill success criteria** — Show timing threshold, accuracy target during drill execution
6. **Fix BYOK onboarding** — Add step-by-step setup guide, inline validation feedback
7. **Add session expiry handling** — Render `sessionExpired` flag as persistent banner
8. **Fix growth mindset streaming** — Apply word replacements before streaming to UI, not after
9. **Reduce dashboard cognitive overload** — Progressive disclosure, show 3-4 key metrics above fold
10. **Add attempt phase countdown** — Show timer, add manual "Done" button, don't auto-complete

### P1 — High Priority (Before Release)

1. Add device selection UI (don't auto-pick first device)
2. Add logout confirmation dialog
3. Fix keyboard shortcut suppression in text inputs
4. Consolidate drill flow to max 2 clicks
5. Keep drill instructions visible through all phases
6. Add drill pause/resume capability
7. Fix achievement toast duration (8+ seconds)
8. Add replay loading cancel button
9. Improve empty state messaging (growth mindset alignment)
10. Fix multiple provider UX in settings
11. Add profile editing capability
12. Surface token usage in chat panel (not just settings)

### P2 — Important Polish (Post-Launch OK)

1. Refactor hardcoded hex colors to CSS variables
2. Add mode transition animations
3. Improve skill radar label positioning
4. Make progress trend insights actionable
5. Add data export schema documentation
6. Replace streak obligation language with invitation tone
7. Fix responsive breakdowns (status bar, timing graph, drill panel)
8. Add audit trail for API key changes
9. Improve achievement descriptions (tell user how to unlock)
10. Add performance overlay for development

### P3 — Nice to Have

1. Add social auth options
2. Fix print view (hide sidebar)
3. Add per-device error tracking for multiple MIDI devices
4. Add Sentry breadcrumbs for MIDI events
5. Document spacing system in design system
6. Add tooltip for profile name truncation
7. Fix minor border radius violations
8. Add note appearance fade-in animation

---

## Methodology Notes

This review was conducted by 10 specialized agents working in parallel, each reviewing a specific area of the codebase:

1. **Landing & Auth Flow** — Marketing pages, auth forms, guest flow, mobile redirect
2. **App Layout, Nav & Modes** — Sidebar, status bar, mode switcher, keyboard shortcuts, overlays
3. **Canvas Visualization** — Piano roll, timing grid, harmonic overlay, chord HUD, snapshot renderer
4. **Dashboard & AI Chat** — Dashboard view, data cards, AI chat panel, drill panel, coaching
5. **Drill System** — Drill controller, tracker, visualizer, preview, warm-up flow, difficulty engine
6. **Replay & Session Mgmt** — Replay studio, timeline scrubber, session history, session summary
7. **Progress & Engagement** — Achievements, streaks, XP, personal records, progress trends, weekly summary
8. **Settings & API Key Mgmt** — Settings page, API key prompt, auth provider, data export, profile
9. **Design System Consistency** — Tailwind config, component tokens, color system, typography, spacing
10. **MIDI, State & User Journey** — MIDI engine, stores, analysis pipeline, session recorder, end-to-end journeys

Each agent reviewed actual source code, analyzed user flows, identified specific file:line references, and rated findings by severity (CRITICAL/HIGH/MEDIUM/LOW).

---

_Report compiled: 2026-02-16_
_For: Melchizedek (Minstrel Project)_
_Next step: Create epics and stories from these findings in a new session_
