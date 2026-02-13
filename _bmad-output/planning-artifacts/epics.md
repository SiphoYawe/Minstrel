---
stepsCompleted: [1, 2, 3, 4]
status: 'complete'
completedAt: '2026-02-13'
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
  - '_bmad-output/planning-artifacts/code-review-findings-epics-8-11.md'
workflowType: 'epics-and-stories'
project_name: 'Minstrel'
user_name: 'Melchizedek'
date: '2026-02-13'
---

# Minstrel - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Minstrel, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

**MIDI & Audio Input:**

- FR1: Users can connect any MIDI device and have it auto-detected without manual configuration
- FR2: System can detect MIDI device name, channel, and connection status in real time
- FR3: Users can receive step-by-step troubleshooting guidance when MIDI connection fails
- FR4: System can capture all MIDI events (notes, velocity, timing, control changes) from connected devices
- FR5: System can send MIDI output to connected devices for demonstration playback
- FR6: Users can fall back to audio-only input via laptop microphone when MIDI is unavailable
- FR7: System can detect basic dynamics and volume through audio capture

**Real-Time Analysis:**

- FR8: System can identify individual notes, chords, and chord progressions in real time as the user plays
- FR9: System can measure timing accuracy relative to detected or target tempo
- FR10: System can detect key center, tonal context, and harmonic function of played chords
- FR11: System can identify genre-specific patterns and stylistic elements in the user's playing
- FR12: System can track playing tendencies, comfort zones, and avoidance patterns across sessions
- FR13: System can generate a session snapshot summarizing key, chords used, timing accuracy, tempo, and a key insight

**The Difficulty Engine:**

- FR14: System can assess a player's current skill level across multiple dimensions (timing, harmony, technique, speed)
- FR15: System can dynamically adjust challenge difficulty based on real-time performance within a session
- FR16: System can apply progressive overload by incrementally increasing tempo, harmonic complexity, or rhythmic difficulty
- FR17: System can detect when a player is in the growth zone (between boredom and frustration) and maintain that state
- FR18: System can recalibrate difficulty across all exercises and modes based on cumulative player data

**AI Drill Generation & Demonstration:**

- FR19: System can generate targeted practice exercises based on specific weaknesses identified during play
- FR20: System can demonstrate generated drills through the user's instrument via MIDI output before the user attempts them
- FR21: System can produce varied drills addressing the same weakness without repetition
- FR22: System can track drill completion and measure improvement in the targeted skill within a drill session
- FR23: Users can receive a key insight identifying their highest-impact area for improvement after freeform play

**AI Coaching Chat:**

- FR24: Users can ask natural language questions about their playing during or after a session
- FR25: System can provide responses grounded in the user's actual session data and playing history
- FR26: System can constrain musical advice to the relevant genre/style context
- FR27: System can explain musical concepts (harmony, technique, theory) in the context of what the user just played
- FR28: System can frame all feedback using growth mindset language ("not yet" instead of "wrong")

**Interaction Modes:**

- FR29: Users can play in Silent Coach mode with real-time visualization and no AI interruptions
- FR30: Users can switch to Dashboard + Chat mode with live data display and conversational AI access
- FR31: Users can review recorded sessions in Replay Studio with timeline scrubbing
- FR32: Users can ask the AI about any specific moment in a recorded session during replay
- FR33: System can display real-time harmonic overlays showing chord tones vs. passing tones during play

**Session Management:**

- FR34: Users can enter freeform play mode with no structured objectives
- FR35: Users can start micro-sessions (focused bursts on a single skill, stackable)
- FR36: System can auto-generate warm-ups based on the user's recent work and planned session focus
- FR37: System can record complete sessions (all MIDI data and analysis) for later replay
- FR38: System can maintain session continuity, referencing previous sessions in coaching and drill selection
- FR39: Users can view and track personal records (fastest clean run, longest streak, accuracy milestones)

**Engagement & Progress:**

- FR40: System can track daily practice streaks based on meaningful practice activity (not just app opens)
- FR41: System can award XP for practice time, accuracy improvements, and milestone completion
- FR42: System can unlock achievement badges for specific accomplishments (genre, technique, consistency milestones)
- FR43: Users can view progress data showing improvement trends over configurable time periods
- FR44: Users can view weekly progress summaries with skill improvement metrics and session history

**User Accounts & API Key Management:**

- FR45: Users can begin playing immediately without creating an account (guest mode with MIDI connection only)
- FR46: Users can create an account to persist data, progress, and session history
- FR47: Users can configure their own LLM API key (OpenAI, Anthropic, or other supported providers) in settings to enable AI features
- FR48: System can validate LLM API keys in real time and display connection status
- FR49: System can gracefully degrade when no API key is configured (MIDI analysis works; AI features show "connect API key" prompt)
- FR50: System can display estimated token/cost usage per session for transparency

### NonFunctional Requirements

**Performance:**

- NFR1: MIDI event processing latency <50ms from input to visual feedback, client-side
- NFR2: Real-time visualization at 60fps during active play
- NFR3: AI coaching chat response <1 second from submission to first token
- NFR4: AI drill generation <2 seconds from request to playable exercise
- NFR5: Initial page load (FCP) <3 seconds on broadband (10Mbps+)
- NFR6: Time to interactive <5 seconds on broadband (10Mbps+)
- NFR7: Session data autosave every 30 seconds, non-blocking
- NFR8: Client memory usage <200MB during active 30-minute session

**Security:**

- NFR9: All data encrypted in transit (TLS 1.2+) and at rest (AES-256)
- NFR10: User authentication via industry-standard protocols (OAuth 2.0 / email+password)
- NFR11: Session data isolated per user — no cross-user data access
- NFR12: LLM API keys encrypted at rest and never exposed in client-side code or logs
- NFR13: API rate limiting (100 requests/minute per authenticated user)
- NFR14: MIDI data and session recordings treated as personal data under GDPR
- NFR15: Users can export all personal data and request complete account deletion

**Scalability:**

- NFR16: Support 500 concurrent users at launch (single-region)
- NFR17: Scale to 2,000 concurrent users at 6 months (horizontal scaling)
- NFR18: Scale to 10,000 concurrent users at 12 months (multi-region)

**Accessibility:**

- NFR19: WCAG 2.1 AA compliance for all non-audio interface elements
- NFR20: Full keyboard navigation for all UI controls and modes
- NFR21: Screen reader compatibility for text-based features
- NFR22: Minimum 4.5:1 color contrast for text; 3:1 for large text and UI components
- NFR23: Respect `prefers-reduced-motion` for animations and visualizations
- NFR24: Text descriptions for visual-only data (e.g., "Timing accuracy: 85%" alongside graphs)

**Reliability:**

- NFR25: Application uptime 99.5%
- NFR26: Session recording integrity 100% — zero data loss during active recording
- NFR27: Graceful degradation on connection loss (client continues locally, syncs on reconnect)
- NFR28: MIDI device auto-reconnect within 5 seconds of re-detection
- NFR29: Core features (MIDI analysis, viz) function without AI server

### Additional Requirements

**From Architecture:**

- AR1: Initialize project using `npx create-next-app@latest minstrel -e with-supabase` (Next.js 16 + Supabase official template) — this is Epic 1, Story 1
- AR2: Configure Zustand 5.x with 3-store architecture (midiStore, sessionStore, appStore)
- AR3: Set up Dexie.js 4.x for IndexedDB client-side persistence with Supabase sync layer
- AR4: Integrate Vercel AI SDK 6.x for provider-agnostic BYOK LLM integration
- AR5: Implement 5-layer architectural boundaries (Presentation → Application → Domain → Infrastructure → External)
- AR6: Configure Sentry 10.x (`@sentry/nextjs`) for error tracking and performance monitoring
- AR7: Configure PostHog for product analytics
- AR8: Set up CI/CD: axe-core (deploy gate), eslint-plugin-jsx-a11y (pre-commit), Lighthouse CI (nightly, 90+)
- AR9: Set up Vitest + React Testing Library + Playwright testing infrastructure
- AR10: Configure Supabase PostgreSQL schema with RLS policies for all tables
- AR11: Set up Supabase Auth with `@supabase/ssr` cookie-based sessions
- AR12: API key encryption/decryption using AES-256 (pgcrypto or application-level)
- AR13: Canvas/WebGL visualization layer subscribes to Zustand directly (vanilla subscribe, bypasses React cycle)
- AR14: Feature-based project organization with co-located tests

**From UX Design:**

- UX1: Implement Epidemic Sound-inspired dark aesthetic (#0F0F0F background, #7CB9E8 primary accent)
- UX2: 0px border radius on all components — sharp corners everywhere
- UX3: Inter + JetBrains Mono typography (variable fonts)
- UX4: Two-layer rendering: React/shadcn/ui Application Shell + Canvas/WebGL Visualization Canvas
- UX5: Three interaction modes with specific layout ratios: Silent Coach (~90% canvas), Dashboard + Chat (60/40 split), Replay Studio (canvas + timeline)
- UX6: Restyle 12 shadcn/ui components to match dark studio aesthetic
- UX7: Build 13 custom components: VisualizationCanvas, StatusBar, ModeSwitcher, InstantSnapshot (P0); DrillController, DataCard, AIChatPanel, SessionSummary (P1); TimelineScrubber, TroubleshootingPanel, StreakBadge, AchievementToast (P2); APIKeyPrompt (P3)
- UX8: Component priority tiers: P0 (Weeks 1-3), P1 (Weeks 3-5), P2 (Weeks 5-7), P3 (Weeks 5-7)
- UX9: Growth mindset language everywhere — "not yet" framing, amber (not red) for in-progress states
- UX10: Studio Engineer AI persona — technical, precise, no filler, specific data references
- UX11: 70/30 attention split — instrument primary, screen secondary (glanceable visualizations)
- UX12: Silence-triggered instant snapshot — visualization transforms on pause
- UX13: Demonstrate → Listen → Attempt → Analyze drill choreography with clear visual phases

### FR Coverage Map

| FR   | Epic     | Brief Description                  |
| ---- | -------- | ---------------------------------- |
| FR1  | Epic 1   | MIDI auto-detection                |
| FR2  | Epic 1   | Device name/channel/status         |
| FR3  | Epic 1   | Troubleshooting guidance           |
| FR4  | Epic 1   | MIDI event capture                 |
| FR5  | Epic 5   | MIDI output demonstration          |
| FR6  | Epic 1   | Audio-only fallback                |
| FR7  | Epic 1   | Audio dynamics detection           |
| FR8  | Epic 2   | Note/chord/progression detection   |
| FR9  | Epic 2   | Timing accuracy                    |
| FR10 | Epic 2   | Key/tonal/harmonic detection       |
| FR11 | Epic 2   | Genre pattern identification       |
| FR12 | Epic 2   | Playing tendency tracking          |
| FR13 | Epic 2   | Session snapshot generation        |
| FR14 | Epic 5   | Multi-dimensional skill assessment |
| FR15 | Epic 5   | Dynamic difficulty adjustment      |
| FR16 | Epic 5   | Progressive overload               |
| FR17 | Epic 5   | Growth zone detection              |
| FR18 | Epic 5   | Cross-session recalibration        |
| FR19 | Epic 5   | Targeted drill generation          |
| FR20 | Epic 5   | MIDI drill demonstration           |
| FR21 | Epic 5   | Varied drill production            |
| FR22 | Epic 5   | Drill completion tracking          |
| FR23 | Epic 5   | Key insight after freeform         |
| FR24 | Epic 4   | Natural language questions         |
| FR25 | Epic 4   | Session-grounded responses         |
| FR26 | Epic 4   | Genre-constrained advice           |
| FR27 | Epic 4   | Contextual concept explanations    |
| FR28 | Epic 4   | Growth mindset framing             |
| FR29 | Epic 2   | Silent Coach mode                  |
| FR30 | Epic 4   | Dashboard + Chat mode              |
| FR31 | Epic 6   | Replay Studio with timeline        |
| FR32 | Epic 6   | AI questions about replay          |
| FR33 | Epic 2   | Real-time harmonic overlays        |
| FR34 | Epic 2   | Freeform play mode                 |
| FR35 | Epic 5   | Micro-sessions                     |
| FR36 | Epic 5   | Auto-generated warm-ups            |
| FR37 | Epic 2   | Session recording                  |
| FR38 | Epic 6   | Session continuity                 |
| FR39 | Epic 7   | Personal records tracking          |
| FR40 | Epic 7   | Practice streaks                   |
| FR41 | Epic 7   | XP awards                          |
| FR42 | Epic 7   | Achievement badges                 |
| FR43 | Epic 7   | Progress trend data                |
| FR44 | Epic 7   | Weekly progress summaries          |
| FR45 | Epic 1/3 | Guest mode / account flow          |
| FR46 | Epic 3   | Account creation                   |
| FR47 | Epic 3   | API key configuration              |
| FR48 | Epic 3   | API key validation                 |
| FR49 | Epic 3   | Graceful degradation               |
| FR50 | Epic 3   | Token/cost usage display           |

## Epic List

### Epic 1: First Note Experience

A user can open Minstrel, connect their MIDI device (with troubleshooting if needed), and see real-time visual feedback when they play — the "it hears me" moment.
**FRs covered:** FR1, FR2, FR3, FR4, FR6, FR7, FR45 (guest)

### Epic 2: Real-Time Analysis & Silent Coach

Users can play freely and see real-time analysis of notes, chords, timing, and harmonic context. They receive silence-triggered session snapshots with key insights. Sessions are recorded locally.
**FRs covered:** FR8, FR9, FR10, FR11, FR12, FR13, FR29, FR33, FR34, FR37

### Epic 3: Accounts & API Key Management

Users can create an account to persist data and configure their own LLM API key. The system validates keys, shows cost estimates, and degrades gracefully without a key.
**FRs covered:** FR45 (full), FR46, FR47, FR48, FR49, FR50

### Epic 4: AI Coaching & Dashboard Mode

Users can switch to Dashboard + Chat mode and ask the AI natural language questions about their playing. Responses are session-aware, genre-aware, and use growth mindset framing.
**FRs covered:** FR24, FR25, FR26, FR27, FR28, FR30

### Epic 5: Difficulty Engine & AI Drills

Users receive AI-generated drills targeting their specific weaknesses, demonstrated through their instrument via MIDI output, with adaptive difficulty that keeps them in the growth zone.
**FRs covered:** FR5, FR14, FR15, FR16, FR17, FR18, FR19, FR20, FR21, FR22, FR23, FR35, FR36

### Epic 6: Session Replay & Continuity

Users can replay recorded sessions with timeline scrubbing, ask the AI about any moment in a recording, and experience cross-session continuity in coaching and drill selection.
**FRs covered:** FR31, FR32, FR38

### Epic 7: Engagement & Progress Tracking

Users can track practice streaks, earn XP and achievement badges, view progress trends over time, and celebrate personal records.
**FRs covered:** FR39, FR40, FR41, FR42, FR43, FR44

### Epic 8: Critical Bug Fixes & Core Flow Repair

Critical bugs and broken flows identified by adversarial UX review — data integrity issues, broken user journeys, and missing guards.
**Source:** BUG-1 through BUG-7, MISS-7, ARCH-1

### Epic 9: Design System Remediation

Fixes to align the implemented UI with the UX Design Specification — color violations, hardcoded values, accessibility gaps, and responsive breakpoints.
**Source:** DS-1 through DS-6, A11Y-1 through A11Y-8, MISS-9, MISS-10

### Epic 10: Missing Screens & User Journeys

New screens and flows completing the end-to-end user experience across all 4 user journeys.
**Source:** MISS-1 through MISS-14, NEW-1 through NEW-9

### Epic 11: AI Coaching & Data Integrity Fixes

Wire up existing but unused AI coaching infrastructure and resolve data integrity issues in engagement features.
**Source:** AI-1 through AI-6, DATA-1 through DATA-6, MISS-8, MISS-11

### Epic 12: Critical Security & Data Integrity

17 CRITICAL code review findings from adversarial security, state management, UI, and AI reviews. Must be resolved before launch — blocks deployment.
**Source:** SEC-C1, SEC-C2, STATE-C1–C5, UI-C1–C5, AI-C1–C5

### Epic 13: High Priority Accessibility & State Fixes

27 HIGH code review findings covering distributed rate limiting, stale closures, atomic operations, token estimation, and comprehensive ARIA/keyboard accessibility.
**Source:** SEC-H1–H3, STATE-H1–H5, AI-H1–H7, UI-H1–H12

### Epic 14: Medium Priority Polish

35 MEDIUM code review findings covering CI security checks, timezone persistence, dead code removal, drill validation, screen reader fixes, animation accessibility, and performance virtualization.
**Source:** SEC-M1–M4, STATE-M1–M7, AI-M1–M2, AI-M4–M11, UI-M1–M13

### Epic 15: Low Priority Cleanup

20 LOW code review findings covering middleware hardening, DST edge cases, cache invalidation, dead code removal, export compression, and UI polish. Post-launch acceptable.
**Source:** SEC-L1–L3, STATE-L1–L6, AI-L1–L6, UI-L1–L4

---

## Epic 1: First Note Experience

A user can open Minstrel, connect their MIDI device (with troubleshooting if needed), and see real-time visual feedback when they play — the "it hears me" moment. This is the foundation epic that establishes the project, design system, MIDI connectivity, and basic visualization.

### Story 1.1: Initialize Project from Starter Template

As a developer,
I want the Minstrel project initialized from the Next.js 16 + Supabase official template with all foundational tooling configured,
So that all subsequent stories have a consistent, working codebase to build upon.

**Acceptance Criteria:**

**Given** the Architecture specifies `npx create-next-app@latest minstrel -e with-supabase`
**When** the project is initialized
**Then** Next.js 16 with App Router, TypeScript strict mode, Tailwind CSS v4, and Supabase Auth (`@supabase/ssr`) are configured
**And** the feature-based directory structure from Architecture is created (`src/features/`, `src/components/ui/`, `src/components/viz/`, `src/stores/`, `src/lib/`, `src/types/`)
**And** Zustand 5.x is installed with empty store files (`midi-store.ts`, `session-store.ts`, `app-store.ts`)
**And** Vitest + React Testing Library + Playwright are installed and configured
**And** ESLint with `eslint-plugin-jsx-a11y` and Prettier are configured
**And** Sentry (`@sentry/nextjs` 10.x) is installed and initialized (client + server config files)
**And** PostHog SDK is installed with a basic analytics wrapper
**And** Husky pre-commit hook runs lint + typecheck
**And** `.env.example` lists all required environment variables
**And** the app builds and deploys to Vercel successfully

### Story 1.2: Configure Design System and Dark Studio Aesthetic

As a user,
I want Minstrel to have a professional, dark studio aesthetic from the moment I open it,
So that the interface communicates seriousness and capability.

**Acceptance Criteria:**

**Given** the UX specification defines the visual foundation
**When** the design system is configured
**Then** `tailwind.config.ts` defines custom color tokens (#0F0F0F background, #7CB9E8 primary, full pastel accent palette)
**And** all border radius values are set to 0px globally (sharp corners)
**And** Inter (variable) and JetBrains Mono (variable) fonts are loaded via `public/fonts/` and applied globally
**And** 12 shadcn/ui components (button, card, dialog, input, select, tabs, toast, tooltip, badge, progress, scroll-area, separator) are installed and restyled to match dark studio aesthetic
**And** `globals.css` contains Tailwind directives and CSS custom properties for the design token system
**And** a basic landing page (`src/app/(marketing)/page.tsx`) renders with the correct dark theme
**And** color contrast meets WCAG 2.1 AA (minimum 4.5:1 for text)
**And** `prefers-reduced-motion` is respected in all transition utilities

### Story 1.3: Web MIDI Device Connection and Auto-Detection

As a musician,
I want my MIDI device to be automatically detected when I plug it in,
So that I can start playing immediately without configuration.

**Acceptance Criteria:**

**Given** the user opens Minstrel in Chrome/Edge with a MIDI device connected
**When** the Web MIDI API is available and permission is granted
**Then** the system auto-detects the connected MIDI device within 2 seconds
**And** the device name, MIDI channel, and connection status are displayed in a StatusBar component
**And** a green status indicator shows "Connected"
**And** `midiStore` is populated with device info and connection state
**And** when the device is unplugged, the status updates to "Disconnected" within 1 second
**And** when the device is reconnected, auto-reconnect occurs within 5 seconds (NFR28)

**Given** the user opens Minstrel in a browser without Web MIDI API support
**When** the page loads
**Then** a clear message directs the user to Chrome/Edge for full MIDI support

### Story 1.4: MIDI Event Capture and Basic Canvas Visualization

As a musician,
I want to see visual feedback on screen when I play notes on my MIDI device,
So that I know Minstrel is listening and responding to my playing.

**Acceptance Criteria:**

**Given** a MIDI device is connected and the user is on the session page
**When** the user plays a note on their instrument
**Then** the MIDI event (note, velocity, timing via `performance.now()`) is captured and dispatched to `midiStore` within 50ms (NFR1)
**And** the VisualizationCanvas component renders the note visually on a Canvas element at 60fps (NFR2)
**And** the Canvas subscribes to `midiStore` via Zustand vanilla `subscribe` (not React re-renders) per AR13
**And** note-on and note-off events are both visualized (notes light up on press, fade on release)
**And** velocity is reflected visually (louder = brighter/larger)
**And** memory usage stays under 200MB during a 30-minute session (NFR8)
**And** a co-located test validates MIDI event parsing

### Story 1.5: MIDI Troubleshooting Guidance

As a musician,
I want step-by-step troubleshooting when my MIDI device fails to connect,
So that I can resolve the issue without leaving the app.

**Acceptance Criteria:**

**Given** no MIDI device is detected after page load
**When** the system detects no MIDI input
**Then** a troubleshooting panel displays step-by-step guidance: (1) "Is your device powered on and plugged into USB?", (2) "Try a different USB port", (3) "Check browser MIDI permissions"
**And** if a MIDI signal is detected on an unexpected channel (e.g., channel 10/drums), the system suggests changing to channel 1
**And** each troubleshooting step has a "Try Again" action that re-scans for MIDI devices
**And** the guidance uses growth mindset language (helpful, never blaming)

### Story 1.6: Audio-Only Fallback Mode

As a musician without a MIDI device,
I want to use my laptop microphone as an input source,
So that I can still get basic feedback from Minstrel.

**Acceptance Criteria:**

**Given** MIDI connection has failed or the user opts for audio input
**When** the user selects audio fallback or troubleshooting suggests it
**Then** the system requests microphone permission via Web Audio API
**And** basic pitch detection captures approximate note information from the audio stream
**And** dynamics and volume levels are detected and reflected in the visualization
**And** a banner indicates "Audio Mode — connect a MIDI device for full precision"
**And** all MIDI-specific features (velocity, exact timing, MIDI output) are disabled with clear indicators

### Story 1.7: Guest Mode Entry Point

As a new visitor,
I want to start playing immediately without creating an account,
So that I can experience Minstrel's value before committing.

**Acceptance Criteria:**

**Given** a user visits Minstrel for the first time
**When** they navigate to the guest play page (`/play`)
**Then** MIDI connection, event capture, and basic visualization work without authentication
**And** no account creation, email, or sign-up is required
**And** a subtle prompt indicates "Create an account to save your progress" (non-blocking)
**And** AI features show "Connect your API key to unlock AI coaching" with a link to settings
**And** guest session data is stored in browser IndexedDB only (no server persistence)
**And** the guest experience demonstrates the full MIDI visualization value

---

## Epic 2: Real-Time Analysis & Silent Coach

Users can play freely and see real-time analysis of notes, chords, timing, and harmonic context. They receive silence-triggered session snapshots with key insights. Sessions are recorded locally. This epic delivers the core analytical intelligence that makes Minstrel more than a visualizer.

### Story 2.1: Note and Chord Detection Engine

As a musician,
I want Minstrel to identify the individual notes and chords I'm playing in real time,
So that I can see exactly what I'm playing displayed on screen.

**Acceptance Criteria:**

**Given** MIDI events are flowing into `midiStore` from a connected device
**When** the user plays individual notes or simultaneous notes (chords)
**Then** `note-detector.ts` identifies each note by name and octave (e.g., "C4", "G#3") within 50ms
**And** `chord-analyzer.ts` identifies chord quality when 3+ simultaneous notes are detected (e.g., "Cmaj", "Am7", "Dm")
**And** chord progressions are tracked as an ordered sequence (e.g., C → Am → F → G)
**And** detection results are dispatched to `sessionStore` for display
**And** the VisualizationCanvas updates to show detected notes/chords
**And** co-located unit tests validate detection accuracy for major, minor, 7th, and suspended chords

### Story 2.2: Timing Accuracy and Tempo Analysis

As a musician,
I want to see how accurate my timing is relative to the tempo I'm playing at,
So that I can identify and improve timing weaknesses.

**Acceptance Criteria:**

**Given** the user is playing a sequence of notes
**When** the timing analyzer processes MIDI events
**Then** `timing-analyzer.ts` detects the current tempo (BPM) from note intervals
**And** timing accuracy is measured as deviation from detected beat grid (in milliseconds)
**And** timing data is visualized on the Canvas (timing grid overlay)
**And** timing accuracy is expressed as a percentage and displayed in the UI
**And** the system handles tempo changes mid-session (re-detects)
**And** co-located tests validate timing detection with known test sequences

### Story 2.3: Key Center and Harmonic Analysis

As a musician,
I want Minstrel to detect what key I'm playing in and analyze the harmonic function of my chords,
So that I can understand the music theory behind what I'm playing.

**Acceptance Criteria:**

**Given** the user has played a sequence of notes and chords
**When** enough harmonic data is accumulated (8+ notes or 3+ chords)
**Then** `harmonic-analyzer.ts` detects the likely key center (e.g., "C major", "A minor")
**And** each chord is analyzed for its harmonic function in the detected key (e.g., I, IV, V, vi)
**And** chord tones vs. passing tones are distinguished and available for overlay display (FR33)
**And** the harmonic overlay renders on the Canvas showing chord tone relationships
**And** key detection updates dynamically if the player modulates
**And** co-located tests validate key detection for common progressions (I-IV-V-I, ii-V-I, I-vi-IV-V)

### Story 2.4: Genre Pattern and Tendency Tracking

As a musician,
I want Minstrel to identify genre-specific patterns and track my playing tendencies,
So that I can discover my comfort zones and areas I'm avoiding.

**Acceptance Criteria:**

**Given** the user has played across multiple analysis windows
**When** pattern analysis runs
**Then** `genre-detector.ts` identifies genre-characteristic patterns (blues progressions, jazz voicings, pop patterns, etc.)
**And** `tendency-tracker.ts` tracks which keys, chord types, tempo ranges, and intervals the user plays most often
**And** avoidance patterns are detected (keys never played in, chord types never used, tempo ranges avoided)
**And** tendency data persists in `sessionStore` and is available for session snapshots
**And** the analysis is non-intrusive — runs in the background without affecting real-time performance

### Story 2.5: Silence-Triggered Session Snapshot

As a musician,
I want to see an instant summary of my playing when I pause,
So that I get immediate, actionable feedback without navigating menus.

**Acceptance Criteria:**

**Given** the user has been playing and then stops
**When** silence is detected (no MIDI input for 3+ seconds)
**Then** `snapshot-generator.ts` produces an InstantSnapshot within 500ms containing: key played in, chords used, timing accuracy %, average tempo BPM, and one key insight
**And** the key insight identifies the single highest-impact area for improvement (e.g., "Your C to Am transition averages 400ms — smoothing this would improve your flow")
**And** the VisualizationCanvas transitions from real-time mode to snapshot display mode (UX12)
**And** the snapshot uses growth mindset language ("not yet" framing, amber tones)
**And** when the user starts playing again, the Canvas smoothly transitions back to real-time mode
**And** the snapshot is stored in `sessionStore` for later reference

### Story 2.6: Silent Coach Mode Layout

As a musician,
I want a full-screen immersive visualization while I play,
So that I can focus on my instrument with minimal screen distraction.

**Acceptance Criteria:**

**Given** the user is in a session
**When** Silent Coach mode is active (default mode)
**Then** the VisualizationCanvas occupies ~90% of the viewport (UX5)
**And** the StatusBar (P0) shows MIDI connection, current key/tempo, and session timer as a minimal floating overlay
**And** the ModeSwitcher (P0) is accessible but unobtrusive (corner or keyboard shortcut)
**And** no AI chat, no panels, no data cards are visible — just the visualization
**And** the layout responds correctly at 1024px minimum width
**And** keyboard navigation works for all visible controls (NFR20)
**And** the 70/30 attention split principle is honored — visualization is glanceable, not demanding

### Story 2.7: Freeform Play Mode

As a musician,
I want to just play with no structured objectives,
So that I can warm up, noodle, or practice freely while Minstrel listens.

**Acceptance Criteria:**

**Given** the user enters a session
**When** they begin playing without selecting any drill or exercise
**Then** the system enters freeform play mode automatically
**And** all analysis engines run in the background (note detection, timing, harmonic analysis, tendency tracking)
**And** the Silent Coach visualization responds in real time
**And** session snapshots trigger on silence as normal
**And** no interruptions, prompts, or structured exercises appear unless the user requests them
**And** freeform play data is captured for later analysis and drill generation

### Story 2.8: Session Recording to IndexedDB

As a musician,
I want every note I play to be recorded for later replay,
So that I never lose a practice session.

**Acceptance Criteria:**

**Given** the user is in an active session (any mode)
**When** MIDI events are captured
**Then** `session-recorder.ts` streams all MIDI events to Dexie.js (IndexedDB) in real time
**And** recording starts automatically on the first note — no "record" button needed
**And** session metadata (start time, duration, key, tempo) is stored alongside events
**And** autosave occurs every 30 seconds (NFR7) with no blocking of the UI
**And** recording integrity is 100% — zero data loss during active recording (NFR26)
**And** memory usage stays bounded by streaming to IndexedDB (not accumulating in memory)
**And** the Dexie schema includes tables for sessions, midi_events, and analysis_snapshots
**And** co-located tests verify write integrity and autosave behavior

---

## Epic 3: Accounts & API Key Management

Users can create an account to persist their data across devices, configure their own LLM API key to unlock AI features, and manage their keys securely. The system validates keys, shows cost estimates, and degrades gracefully without a key.

### Story 3.1: User Registration and Login

As a musician,
I want to create an account and log in,
So that my progress and session history are saved across visits.

**Acceptance Criteria:**

**Given** the user wants to persist their data
**When** they navigate to sign up
**Then** they can register with email + password via Supabase Auth
**And** session management uses `@supabase/ssr` with cookie-based sessions (AR11)
**And** Next.js middleware protects auth-required routes (`/session`, `/replay`, `/settings`)
**And** the settings page is accessible at `/settings`
**And** Supabase PostgreSQL tables are created for: `users` (profile + preferences), `sessions` (metadata), `midi_events` (time-series), `analysis_snapshots`, `drill_records`, `progress_metrics`, `ai_conversations`, `achievements`
**And** RLS policies enforce per-user data isolation on all tables (NFR11)
**And** age-gating at registration requires minimum age 13 (COPPA)
**And** login/logout works correctly with session persistence

### Story 3.2: Guest-to-Account Data Migration

As a guest user who decides to create an account,
I want my existing guest session data to transfer to my new account,
So that I don't lose the practice I've already done.

**Acceptance Criteria:**

**Given** a guest user has session data in browser IndexedDB
**When** they create an account
**Then** all Dexie.js session data (MIDI events, snapshots) is associated with their new user ID
**And** the Dexie → Supabase sync layer uploads guest sessions to the server
**And** the migration happens in the background without blocking the UI
**And** the user sees their previous sessions in their account after migration completes
**And** if migration fails, guest data remains in IndexedDB and sync retries

### Story 3.3: LLM API Key Configuration UI

As a user,
I want to configure my LLM API key in settings,
So that I can unlock AI coaching and drill generation features.

**Acceptance Criteria:**

**Given** the user is logged in and on the Settings page
**When** they navigate to the API Keys section
**Then** they can select their LLM provider (OpenAI, Anthropic, or other supported providers)
**And** they can paste their API key into a secure input field
**And** the key is masked after entry (shown as `sk-...xxxx`)
**And** the APIKeyPrompt component (P3) renders with the dark studio aesthetic
**And** the user can update or delete their API key at any time
**And** the key is submitted to `/api/user/keys` for secure server-side storage

### Story 3.4: API Key Validation and Encrypted Storage

As a user,
I want my API key validated and stored securely,
So that I know it works and that it's protected.

**Acceptance Criteria:**

**Given** the user submits an API key
**When** the `/api/user/keys` POST endpoint receives the key
**Then** the system validates the key by making a lightweight test call to the LLM provider
**And** validation result is returned in real time (green checkmark or error message)
**And** valid keys are encrypted using AES-256 before storage in Supabase (AR12)
**And** encrypted keys are stored in the `user_api_keys` table
**And** keys are never logged, never included in error reports, never exposed to client-side code after submission (NFR12)
**And** the `/api/user/keys` GET endpoint returns only key metadata (provider, last 4 chars, status) — never the actual key
**And** the `/api/user/keys` DELETE endpoint removes the encrypted key

### Story 3.5: Graceful Degradation Without API Key

As a user without an API key configured,
I want MIDI features to work fully while AI features show clear prompts to connect a key,
So that I can still use the core product.

**Acceptance Criteria:**

**Given** a logged-in user has no API key configured
**When** they use Minstrel
**Then** MIDI connection, real-time analysis, visualization, and session recording work fully
**And** AI coaching chat shows "Connect your API key in Settings to unlock AI coaching" instead of the chat input
**And** drill generation shows "Connect your API key to get personalized drills" instead of drill content
**And** the prompt links directly to the Settings → API Keys section
**And** `appStore` tracks `hasApiKey: boolean` for UI conditional rendering
**And** no errors are thrown — degradation is smooth and informative

### Story 3.6: Token Usage Estimation Display

As a user,
I want to see estimated token usage and cost per session,
So that I can manage my LLM API spending transparently.

**Acceptance Criteria:**

**Given** a user has an API key configured and uses AI features
**When** they view session details or settings
**Then** estimated token count per AI interaction is tracked (from Vercel AI SDK response metadata)
**And** cumulative session token usage is displayed in the session summary
**And** estimated cost is calculated based on the provider's published pricing (stored as a configuration)
**And** the display uses clear, non-alarming formatting (e.g., "~2,400 tokens this session, est. $0.03")
**And** token data is stored in the `ai_conversations` table for historical tracking

---

## Epic 4: AI Coaching & Dashboard Mode

Users can switch to Dashboard + Chat mode and ask the AI natural language questions about their playing. The AI provides session-aware, genre-aware responses with growth mindset framing, grounded in the user's actual playing data.

### Story 4.1: Vercel AI SDK Integration and Provider Setup

As a developer,
I want the AI service layer configured with Vercel AI SDK for provider-agnostic LLM access,
So that all AI features use a consistent, secure integration pattern.

**Acceptance Criteria:**

**Given** the Architecture specifies Vercel AI SDK 6.x (AR4)
**When** the AI service layer is implemented
**Then** `src/lib/ai/provider.ts` initializes the Vercel AI SDK with dynamic provider selection based on user's configured key
**And** `src/lib/ai/prompts.ts` contains system prompts for the Studio Engineer persona (UX10)
**And** `src/lib/ai/schemas.ts` contains Zod schemas for structured AI outputs (drill generation, analysis)
**And** `/api/ai/chat/route.ts` accepts POST requests, decrypts the user's API key server-side, and proxies to the LLM provider
**And** streaming responses use AI SDK's `streamText` for real-time chat
**And** API route validates session, checks API key exists, and handles errors with structured `ApiResponse` format
**And** rate limiting is enforced (100 requests/min per user, NFR13)
**And** errors distinguish `INVALID_KEY`, `RATE_LIMITED`, `PROVIDER_DOWN`, `GENERATION_FAILED`

### Story 4.2: Dashboard + Chat Mode Layout

As a musician,
I want to switch to a split-screen view with visualization and a chat panel,
So that I can see my playing data and ask questions side by side.

**Acceptance Criteria:**

**Given** the user is in a session
**When** they switch to Dashboard + Chat mode via the ModeSwitcher
**Then** the layout splits: VisualizationCanvas occupies ~60% left, data/chat panel occupies ~40% right (UX5)
**And** the AIChatPanel component (P1) renders in the right panel
**And** the DataCard component (P1) displays current session metrics (key, tempo, timing accuracy, chords)
**And** the Canvas continues rendering real-time visualization without interruption during mode switch
**And** session context (analysis data, recording) persists across mode switches
**And** keyboard shortcut allows quick mode switching
**And** layout is responsive down to 1024px minimum width

### Story 4.3: AI Coaching Chat with Streaming Responses

As a musician,
I want to type questions about my playing and get streaming AI responses,
So that the conversation feels natural and responsive.

**Acceptance Criteria:**

**Given** the user is in Dashboard + Chat mode with an API key configured
**When** they type a question and submit it
**Then** the question is sent to `/api/ai/chat` with the current session context
**And** the AI response streams in real time (first token <1 second, NFR3)
**And** a typing indicator (3 dots) shows immediately while waiting for the first token
**And** the chat displays the conversation history within the current session
**And** the user can ask follow-up questions with full conversation context preserved
**And** if the API key is invalid or the provider is down, a clear error message appears (not technical jargon)

### Story 4.4: Session-Grounded AI Responses

As a musician,
I want AI responses that reference my actual playing data,
So that the coaching is specific and trustworthy, not generic.

**Acceptance Criteria:**

**Given** the user asks a question in the coaching chat
**When** the system builds the AI prompt
**Then** `context-builder.ts` assembles session context including: current key, chords played, timing accuracy, tempo, recent snapshots, tendency data, and the specific question
**And** the AI response references specific data points from the session (e.g., "Your timing on beat 3 drifts 40ms late when you move to the F chord")
**And** responses never make claims not supported by session data
**And** if insufficient data exists to answer, the AI says so explicitly
**And** co-located tests verify context builder produces correct prompt structure

### Story 4.5: Genre-Aware Advice and Growth Mindset Framing

As a musician,
I want coaching that respects my musical style and encourages growth,
So that feedback feels relevant and motivating.

**Acceptance Criteria:**

**Given** the AI is responding to a user question
**When** genre context is available from analysis
**Then** all musical advice is constrained to the detected genre/style context (FR26)
**And** theory explanations use genre-appropriate terminology (e.g., "dominant 7th" for jazz, "power chord" for rock)
**And** all feedback uses growth mindset language: "not yet" framing, trajectory language, no absolute judgments (FR28, UX9)
**And** the Studio Engineer persona is maintained: technical, precise, no filler, specific data references (UX10)
**And** error states and struggles are reframed as progress: "280ms → 180ms over 5 attempts. Closing in."
**And** the AI never uses red/error styling for musical performance feedback — amber only (UX9)

---

## Epic 5: Difficulty Engine & AI Drills

Users receive AI-generated drills targeting their specific weaknesses, demonstrated through their instrument via MIDI output, with adaptive difficulty that keeps them in the growth zone. This epic delivers the Difficulty Engine — the critical quality gate — and the full Demonstrate → Listen → Attempt → Analyze drill loop.

### Story 5.1: Multi-Dimensional Skill Assessment

As a musician,
I want Minstrel to understand my skill level across multiple dimensions,
So that challenges are calibrated to my actual abilities.

**Acceptance Criteria:**

**Given** the user has played for at least one session with analysis data
**When** the skill assessor runs
**Then** `skill-assessor.ts` produces a multi-dimensional skill profile covering: timing accuracy, harmonic complexity handled, technique range (chord types, intervals), speed (max clean tempo), and genre familiarity
**And** each dimension is scored on a continuous scale (not discrete levels)
**And** the assessment updates after each session based on new data
**And** the profile is stored in `sessionStore` (in-session) and `progress_metrics` (cross-session via Supabase)
**And** co-located tests validate assessment with known performance data sets

### Story 5.2: Dynamic Difficulty Adjustment and Growth Zone Detection

As a musician,
I want the difficulty of exercises to adjust in real time based on how I'm performing,
So that I'm always challenged but never frustrated.

**Acceptance Criteria:**

**Given** the user is attempting a drill or exercise
**When** the Difficulty Engine processes real-time performance data
**Then** `difficulty-engine.ts` adjusts challenge parameters (tempo, complexity, key) within the session based on success/failure rates
**And** `growth-zone-detector.ts` monitors engagement signals: too easy (>90% accuracy for 3+ reps → increase difficulty), too hard (<40% accuracy for 3+ reps → decrease difficulty)
**And** the growth zone target is 60-85% accuracy — challenging but achievable
**And** difficulty adjustments are invisible to the user — no sliders, no level selectors (UX principle: "Show, Don't Configure")
**And** adjustments happen between drill repetitions, not mid-exercise
**And** co-located tests validate growth zone detection with simulated performance data

### Story 5.3: Progressive Overload and Cross-Session Recalibration

As a musician,
I want the system to incrementally increase challenge over time and remember my progress across sessions,
So that I keep improving without hitting the same plateau.

**Acceptance Criteria:**

**Given** the user returns for a new session
**When** the Difficulty Engine initializes
**Then** `progressive-overload.ts` loads the user's cumulative skill profile from Supabase
**And** starting difficulty for new exercises is calibrated based on historical performance (not reset to default)
**And** the `/api/ai/analyze` endpoint handles cross-session recalibration using the LLM for complex pattern analysis (FR18)
**And** progressive overload incrementally increases one dimension at a time (tempo OR complexity OR key, not all simultaneously)
**And** the system detects when a skill has plateaued and suggests different approaches
**And** recalibration data syncs between Dexie.js (local) and Supabase (server)

### Story 5.4: AI Drill Generation

As a musician,
I want personalized practice exercises generated from my specific weaknesses,
So that every drill targets something I actually need to improve.

**Acceptance Criteria:**

**Given** the analysis has identified a weakness (e.g., slow chord transitions, timing drift on beat 3)
**When** a drill is requested (automatically after snapshot insight, or manually by user)
**Then** `/api/ai/drill` generates a targeted exercise using Vercel AI SDK's `generateObject` with a Zod schema
**And** the generated drill includes: target skill, sequence of notes/chords, target tempo, success criteria
**And** drill generation completes in <2 seconds (NFR4)
**And** the system produces varied drills addressing the same weakness without repetition (FR21)
**And** each drill is difficulty-calibrated by the Difficulty Engine for the current user
**And** the drill data is stored in `drill_records` table

### Story 5.5: MIDI Output Demonstration Playback

As a musician,
I want to hear how a drill should sound played through my own instrument,
So that I have a clear auditory target before attempting it myself.

**Acceptance Criteria:**

**Given** a drill has been generated
**When** the Demonstrate phase begins
**Then** `midi-output.ts` sends MIDI note events through the Web MIDI API to the user's connected device
**And** the drill plays through the user's instrument speakers (not laptop speakers) at the target tempo
**And** the VisualizationCanvas shows a clear "Demonstrating..." visual phase with the notes lighting up in sequence (UX13)
**And** after demonstration completes, the system transitions to "Your turn" with a clear visual cue
**And** if MIDI output is not supported by the device, graceful fallback plays audio through laptop speakers
**And** the Demonstrate → Listen → Attempt → Analyze choreography has distinct visual phases (UX13)

### Story 5.6: Drill Tracking and Improvement Measurement

As a musician,
I want to see my improvement within a drill session,
So that I know the practice is working.

**Acceptance Criteria:**

**Given** the user is attempting a drill
**When** they complete each repetition
**Then** `drill-tracker.ts` measures performance against the drill's success criteria (timing, accuracy, speed)
**And** improvement delta is calculated and displayed in real time (e.g., "400ms → 280ms → 180ms")
**And** a key insight is generated after freeform play identifying the highest-impact area (FR23)
**And** drill completion (pass/fail/partial) and improvement deltas are stored in `drill_records`
**And** the DrillController component (P1) shows progress through the drill with clear visual feedback
**And** growth mindset framing: "Closing in" rather than scoring

### Story 5.7: Micro-Sessions and Auto-Generated Warm-Ups

As a musician,
I want focused 3-5 minute practice bursts and auto-generated warm-ups,
So that I can practice efficiently even with limited time.

**Acceptance Criteria:**

**Given** the user starts a session
**When** a warm-up is generated
**Then** `warmup-generator.ts` creates a 2-minute warm-up based on the user's recent work and skill profile (FR36)
**And** the warm-up is demonstrated via MIDI output first, then the user plays
**And** micro-sessions are focused bursts on a single skill, stackable into longer sessions (FR35)
**And** after completing a micro-session, the system offers "One more?" to encourage stacking
**And** each micro-session targets a specific weakness from the skill assessment
**And** warm-ups adapt based on what the user is about to work on

---

## Epic 6: Session Replay & Continuity

Users can replay recorded sessions with timeline scrubbing, ask the AI about any specific moment in a recording, and experience cross-session continuity where coaching and drills reference previous sessions.

### Story 6.1: Replay Studio Mode Layout

As a musician,
I want to review my past sessions in a dedicated replay view,
So that I can study my playing after the fact.

**Acceptance Criteria:**

**Given** the user has recorded sessions
**When** they navigate to `/replay/[id]`
**Then** the Replay Studio layout renders: Canvas + timeline at bottom, tabbed detail panel at right (UX5)
**And** the session's MIDI events are loaded from Dexie.js (or Supabase for older synced sessions)
**And** the VisualizationCanvas replays the recorded notes with the same visual representation as live play
**And** session metadata (date, duration, key, tempo, summary stats) is displayed
**And** the ModeSwitcher shows Replay Studio as the active mode
**And** a session list is accessible to switch between recordings

### Story 6.2: Timeline Scrubbing and Playback Controls

As a musician,
I want to scrub through a recorded session timeline,
So that I can jump to specific moments and review them.

**Acceptance Criteria:**

**Given** a session is loaded in Replay Studio
**When** the user interacts with the TimelineScrubber component (P2)
**Then** they can drag to any point in the session timeline
**And** the Canvas updates to show the musical state at that moment (notes, chords, analysis)
**And** play/pause controls allow playback from any point at original tempo
**And** playback speed can be adjusted (0.5x, 1x, 1.5x, 2x)
**And** the timeline visually marks session snapshots and key moments
**And** scrubbing is smooth with no perceptible lag

### Story 6.3: AI Questions About Replay Moments

As a musician,
I want to ask the AI about any specific moment in my recorded session,
So that I can understand what happened and why.

**Acceptance Criteria:**

**Given** the user is viewing a specific moment in Replay Studio with an API key configured
**When** they ask a question in the chat panel
**Then** the AI receives context for the specific timestamp: notes played, chords, timing, harmonic analysis at that moment
**And** the AI can explain what happened musically (e.g., "At 2:34, you played a b9 over the V chord — that's a common bebop tension")
**And** the AI references the specific moment's data, not just overall session data (FR32)
**And** if no API key is configured, the chat shows the graceful degradation prompt

### Story 6.4: Cross-Session Continuity

As a returning musician,
I want Minstrel to remember my previous sessions and reference them in coaching,
So that my practice feels continuous and personalized.

**Acceptance Criteria:**

**Given** the user has completed previous sessions
**When** they start a new session
**Then** the AI coaching references previous session data: "Yesterday you were working on ii-V-I voicings" (FR38)
**And** drill selection prioritizes skills that showed weakness in recent sessions
**And** warm-up generation considers what was practiced recently (avoids redundancy, builds on progress)
**And** session history is queryable from Supabase for the AI context builder
**And** the Dexie → Supabase sync layer ensures recent sessions are available server-side for AI context

---

## Epic 7: Engagement & Progress Tracking

Users can track practice streaks, earn XP and achievement badges, view progress trends over configurable time periods, and celebrate personal records. This epic makes improvement tangible and builds the daily practice habit.

### Story 7.1: Practice Streak Tracking

As a musician,
I want to see my daily practice streak,
So that I'm motivated to maintain a consistent practice habit.

**Acceptance Criteria:**

**Given** the user has an account
**When** they complete a meaningful practice session (not just opening the app, FR40)
**Then** `streak-tracker.ts` updates their current streak count
**And** the StreakBadge component (P2) displays the current streak (e.g., "Day 14")
**And** meaningful practice is defined as: minimum 3 minutes of active playing with MIDI input
**And** streaks reset after 48 hours of inactivity (generous buffer for timezone differences)
**And** the streak display uses athlete training log aesthetic, not game aesthetic (professional)
**And** streak data is stored in `progress_metrics` table
**And** the presentation is understated — "Day 47" not "47-DAY STREAK!!!"

### Story 7.2: XP Calculation and Awards

As a musician,
I want to earn XP for practice time and improvements,
So that my effort is quantified and I can see cumulative progress.

**Acceptance Criteria:**

**Given** the user completes a session or drill
**When** XP is calculated
**Then** `xp-calculator.ts` awards XP for: practice time (base), timing accuracy improvement (bonus), drill completion (bonus), new personal records (bonus)
**And** XP accumulates across sessions and is displayed in the user's profile
**And** XP progression is visible but not the primary focus (supports progress feeling, doesn't gamify)
**And** XP data is stored in `progress_metrics` table
**And** no levels, ranks, or leaderboards — XP is personal

### Story 7.3: Achievement Badges System

As a musician,
I want to unlock achievement badges for meaningful accomplishments,
So that milestones in my musical journey are recognized.

**Acceptance Criteria:**

**Given** the user achieves a specific accomplishment
**When** the achievement engine detects the trigger condition
**Then** `achievement-engine.ts` unlocks the badge and stores it in the `achievements` table
**And** the AchievementToast component (P2) shows a clean, understated notification (no confetti, no explosions)
**And** achievement categories include: genre milestones ("First Jazz Voicing"), technique milestones ("Perfect Timing 10x"), consistency milestones ("100 Day Streak"), and personal records
**And** unlocked achievements are viewable in the user's profile or settings
**And** achievements feel like earned credentials, not game rewards
**And** co-located tests validate achievement trigger conditions

### Story 7.4: Progress Trends Visualization

As a musician,
I want to see my improvement trends over time,
So that I have concrete proof that practice is working.

**Acceptance Criteria:**

**Given** the user has multiple sessions of data
**When** they view progress data
**Then** `progress-aggregator.ts` computes trends for: timing accuracy, harmonic complexity handled, speed (tempo), and practice consistency
**And** trends are displayed as charts showing change over configurable time periods (7 days, 30 days, 90 days) (FR43)
**And** progress visualization prioritizes deltas and trajectories over absolute scores (UX: "Earned Confidence, Not Given Praise")
**And** data is presented with Strava-like factual summaries: precise, personal, worth tracking
**And** all progress data queries come from Supabase `progress_metrics` table

### Story 7.5: Weekly Progress Summaries

As a musician,
I want a weekly summary of my practice and improvement,
So that I can see the bigger picture of my growth.

**Acceptance Criteria:**

**Given** the user has practiced during the past week
**When** they view the weekly summary
**Then** a SessionSummary component (P1) displays: total practice time, sessions count, key metrics improved, drills completed, and personal records set (FR44)
**And** comparison with the previous week is shown (e.g., "Timing accuracy up 8% from last week")
**And** the summary is factual and data-driven: "You improved X by Y% this week" not "Great job this week!"
**And** summaries are computed from `progress_metrics` and `sessions` tables
**And** the summary surfaces the highest-impact insight of the week

### Story 7.6: Personal Records Tracking

As a musician,
I want to track my personal records across different skills,
So that I can celebrate concrete achievements and push myself.

**Acceptance Criteria:**

**Given** the user achieves a new best in any tracked metric
**When** the record is detected
**Then** personal records are tracked for: fastest clean tempo per exercise type, longest streak, highest timing accuracy, most complex chord progression handled (FR39)
**And** new records are highlighted in the session summary
**And** records are stored with date and context (which session, which drill)
**And** records feel like athlete stats: precise, personal, worth tracking
**And** previous records are preserved for historical comparison

---

## Epic 8: Critical Bug Fixes & Core Flow Repair

Critical bugs and broken flows identified by adversarial UX review. These fix data integrity issues, broken user journeys, and missing guards that could cause confusing errors or incorrect coaching advice.
**Source:** UX Critique BUG-1 through BUG-7, MISS-7, ARCH-1

### Story 8.1: Fix Replay Timing Accuracy Bug

As a musician,
I want my timing accuracy to reflect my actual performance,
So that coaching advice about timing is meaningful and not always "100%."

**Acceptance Criteria:**

**Given** the timing accuracy calculation in `context-builder.ts` line 223 runs
**When** noteOnCount > 0
**Then** accuracy is calculated from actual timing deviation data from sessionStore snapshots, not by dividing noteOnCount by itself
**And** the timingAccuracy field reflects real performance (e.g., 0.73 not always 1.0)
**And** AI coaching references correct timing data in its advice

### Story 8.2: Fix SnapshotCTA Drill Generation Flow

As a musician,
I want the "Generate Drill" button on the session snapshot to actually generate a drill targeting my identified weakness,
So that I can immediately practice what needs improvement.

**Acceptance Criteria:**

**Given** a session snapshot is displayed with a key insight
**When** the user clicks "Generate Drill"
**Then** a drill is generated via `/api/ai/drill` targeting the weakness identified in the snapshot
**And** the UI transitions to the DrillController component with the generated drill loaded
**And** if no API key is configured, the user sees the graceful degradation prompt

### Story 8.3: Add API Key Guard to Coaching Chat

As a musician using the coaching chat,
I want the system to prevent me from sending messages without an API key,
So that I don't encounter confusing server errors.

**Acceptance Criteria:**

**Given** a user has no API key configured
**When** they attempt to submit a coaching chat message
**Then** the message is not sent and the input shows a prompt to configure an API key
**And** `useCoachingChat` matches the guard pattern in `useReplayChat`: `!trimmed || isLoading || !hasApiKey`
**And** `providerId` reads from the user's saved key metadata instead of hardcoded `'openai'`

### Story 8.4: Fix Auth Flow Bugs

As a user,
I want authentication flows to redirect me to sensible destinations,
So that I don't get lost after confirming my email, signing out, or signing up.

**Acceptance Criteria:**

**Given** a user confirms their email via the confirmation link
**When** the auth/confirm route processes the OTP
**Then** the default redirect is `/session` (not `/`)
**And** sign-out redirects to `/` consistently across all implementations (profile-menu.tsx and use-auth.ts)
**And** the dead `/auth/sign-up-success` route is removed or redirects to `/login`

### Story 8.5: Replace Delete Account with Honest UX

As a user,
I want the settings page to honestly communicate that account deletion is not yet available,
So that I'm not confused by a non-functional red button.

**Acceptance Criteria:**

**Given** a user views the Danger Zone section in Settings
**When** the section renders
**Then** the Delete Account button uses amber styling instead of red/destructive
**And** copy is clear: "Account deletion — coming in a future update"
**And** the section matches the "amber not red" design principle

### Story 8.6: Wire AI Provider Selection from Saved Key

As a user who configured a non-OpenAI API key,
I want the AI coaching to use my configured provider,
So that requests don't fail with an OpenAI-only hardcode.

**Acceptance Criteria:**

**Given** a user has saved an API key for provider X
**When** the coaching chat sends a request
**Then** `providerId` in the request body matches the user's configured provider
**And** both `coaching-client.ts` and `use-replay-chat.ts` read provider dynamically

### Story 8.7: Add Next.js Middleware for Auth Route Protection

As a developer,
I want Next.js middleware to redirect unauthenticated users from protected routes,
So that users never see broken auth-required pages.

**Acceptance Criteria:**

**Given** an unauthenticated user navigates to `/session`, `/replay`, or `/settings`
**When** the middleware runs
**Then** they are redirected to `/login?redirectTo={originalPath}`
**And** authenticated users on `/login` or `/signup` are redirected to `/session`
**And** guest routes (`/play`, `/`) remain unprotected

---

## Epic 9: Design System Remediation

Fixes to align the implemented UI with the UX Design Specification. Addresses color violations, hardcoded values, missing accessibility features, and responsive breakpoint gaps.
**Source:** UX Critique DS-1 through DS-6, A11Y-1 through A11Y-8, MISS-9, MISS-10

### Story 9.1: Change Destructive/Error Colors to Amber

As a user,
I want error and warning states to use amber tones instead of red,
So that the interface maintains the growth mindset principle of "trajectory, not failure."

**Acceptance Criteria:**

**Given** the globals.css design tokens
**When** `--destructive` and `--accent-error` are defined
**Then** they use warm amber HSL values (not red hue 0)
**And** all components using `variant="destructive"` or `text-red-*` render in amber tones
**And** the login form error messages use `text-accent-error` (amber), not `text-red-500`

### Story 9.2: Replace Hardcoded Colors with Design Tokens

As a developer,
I want all colors to reference design tokens instead of hardcoded hex values,
So that theming is consistent and maintainable.

**Acceptance Criteria:**

**Given** any component file
**When** it uses a color
**Then** it references a Tailwind utility backed by a CSS custom property, not a hardcoded hex
**And** #0F0F0F → `bg-background`, #7CB9E8 → `text-primary`, #1A1A1A → `border-border`, #999 → `text-muted-foreground`

### Story 9.3: Refactor Raw Buttons and Inline Styles

As a developer,
I want all interactive elements to use the shadcn/ui design system,
So that the design system is consistent throughout the application.

**Acceptance Criteria:**

**Given** any component has raw `<button>` elements
**When** they are refactored
**Then** they use shadcn/ui `<Button>` with appropriate variant
**And** inline `<style>` tags (e.g., `@keyframes fadeUp` in snapshot-cta) are moved to globals.css or Tailwind config

### Story 9.4: Add Responsive Breakpoints to Dashboard and Replay

As a user on a smaller screen,
I want layouts to adapt gracefully,
So that the interface remains usable at various viewport widths.

**Acceptance Criteria:**

**Given** the dashboard 60/40 split layout
**When** the viewport is below 1024px
**Then** the layout stacks vertically (canvas on top, panel below)
**And** a "Best experienced on a larger screen" message appears below 768px

### Story 9.5: Fix Accessibility Gaps

As a user who relies on assistive technology,
I want the application to be accessible with screen readers and keyboard navigation,
So that I can use all features effectively.

**Acceptance Criteria:**

**Given** the VisualizationCanvas renders
**Then** it has `role="img"` and a descriptive `aria-label`
**And** the ModeSwitcher has `role="tablist"` with `aria-current` on the active mode
**And** session snapshots use `aria-live="polite"` for announcements
**And** drill phases use `aria-live` for phase transitions
**And** a skip-to-content link is the first focusable element on every page
**And** the chat panel has `role="log"` with `aria-live="polite"`
**And** Canvas respects `prefers-reduced-motion: reduce`

### Story 9.6: Add Mobile Redirect and Browser Incompatibility Pages

As a user visiting on mobile or an unsupported browser,
I want a clear message explaining requirements,
So that I understand why the app isn't working.

**Acceptance Criteria:**

**Given** a user visits on mobile
**When** the session/play page loads
**Then** a message explains "Minstrel requires a desktop browser with MIDI support"
**And** Firefox/Safari users see browser requirements with a Chrome download link
**And** the marketing page (/) is NOT blocked — only MIDI-dependent pages

---

## Epic 10: Missing Screens & User Journeys

New screens and flows identified as gaps in the 4 user journeys (First Note, Returning Player, Deep Practice, Casual Check-in). These complete the end-to-end user experience.
**Source:** UX Critique MISS-1 through MISS-14, NEW-1 through NEW-9

### Story 10.1: First-Run Onboarding Empty State

As a first-time user,
I want to see guided first-run experience when I have no session data,
So that I understand how to start using Minstrel.

**Acceptance Criteria:**

**Given** a new user with zero sessions
**When** they navigate to the session page
**Then** an empty state displays: "Connect your MIDI device" → "Play anything — Minstrel listens"
**And** on first MIDI input, the empty state transitions to real-time visualization
**And** after the first session completes, the onboarding never appears again

### Story 10.2: Session Summary Screen

As a musician,
I want to see a summary when I finish practicing,
So that I can review what I accomplished.

**Acceptance Criteria:**

**Given** a user ends a session
**When** the session ends
**Then** a summary displays: practice time, notes played, chords, key(s), tempo, timing accuracy, XP earned, and key insight
**And** navigation options: start new session, go to replay, go to dashboard

### Story 10.3: Return Session Welcome Experience

As a returning musician,
I want a personalized welcome when I start a new session,
So that I feel the continuity of my practice journey.

**Acceptance Criteria:**

**Given** a returning user with previous sessions
**When** they start a new session
**Then** a welcome card shows: last session date, what they worked on, and a suggestion for today
**And** the card auto-dismisses on MIDI input or manual dismiss

### Story 10.4: Session History Browser

As a musician,
I want to browse my past practice sessions,
So that I can find and replay specific sessions.

**Acceptance Criteria:**

**Given** a user navigates to `/replay` without a session ID
**When** the page loads
**Then** a session list shows all past sessions: date, duration, key, timing accuracy
**And** clicking a session navigates to `/replay/[id]`

### Story 10.5: Achievement Gallery

As a musician,
I want to view all my achievements in a gallery,
So that I can see my progress milestones.

**Acceptance Criteria:**

**Given** a user navigates to the achievement gallery
**When** the page loads
**Then** earned badges display in full color, unearned badges greyed out with progress
**And** achievements are grouped by category (Genre, Technique, Consistency, Records)

### Story 10.6: Keyboard Shortcuts Help Panel

As a user,
I want to see a keyboard shortcuts reference,
So that I can learn and use shortcuts efficiently.

**Acceptance Criteria:**

**Given** the user presses Shift+?
**When** the shortcut triggers
**Then** a modal shows all shortcuts grouped by context (Navigation, Session, Replay, General)
**And** the modal is dismissable with Escape

### Story 10.7: Warm-Up Generation Flow

As a musician,
I want to request a guided warm-up before my session,
So that I can prepare properly.

**Acceptance Criteria:**

**Given** a user starts a session
**When** the session page loads
**Then** a "Warm up first?" option is available
**And** warm-ups run through the Demonstrate → Listen → Attempt → Analyze drill loop
**And** users can skip directly to their main session

### Story 10.8: Offline Mode Indicator

As a user with intermittent internet,
I want to see when I'm offline and what still works,
So that I can continue practicing without confusion.

**Acceptance Criteria:**

**Given** the user loses internet connection
**When** offline is detected
**Then** a subtle StatusBar indicator shows "Offline — MIDI features active, AI features paused"
**And** the indicator uses amber tone (not red)
**And** on reconnect, the indicator disappears and queued data syncs

---

## Epic 11: AI Coaching & Data Integrity Fixes

Fixes to wire up existing but unused AI coaching infrastructure (growth mindset validation, token tracking, response formatting) and resolve data integrity issues in engagement features.
**Source:** UX Critique AI-1 through AI-6, DATA-1 through DATA-6, MISS-8, MISS-11

### Story 11.1: Wire Growth Mindset Validation on Streaming

As a musician,
I want all AI coaching responses validated for growth mindset language,
So that I never receive discouraging feedback.

**Acceptance Criteria:**

**Given** the AI streams a coaching response
**When** text chunks arrive
**Then** `validateGrowthMindset()` scans for prohibited words and replaces them with growth-mindset alternatives
**And** word boundary detection prevents false positives
**And** the full response has zero prohibited words

### Story 11.2: Add Genre Terminology for All 13 Genres

As a musician playing in any genre,
I want the AI to use genre-appropriate terminology,
So that coaching advice feels relevant to my style.

**Acceptance Criteria:**

**Given** the genre detector identifies one of 13 genres
**When** AI coaching builds context
**Then** genre-specific terminology is available for ALL 13 genres (adding Latin, Country, Electronic, Funk, Gospel, Metal, Folk, Reggae)
**And** a generic fallback exists for undetected genres

### Story 11.3: Wire Token Tracking and Response Processor

As a musician,
I want token usage tracked and coaching responses richly formatted,
So that I can manage costs and easily parse advice.

**Acceptance Criteria:**

**Given** the AI chat completes a response
**When** onFinish fires
**Then** `recordTokenUsage()` is called with actual token count from Vercel AI SDK metadata
**And** `segmentResponseText()` highlights metrics, timing, chords, and keys in chat display
**And** token data flows to the Settings → Usage Summary display

### Story 11.4: Context Length Management and Rate Limit Retry

As a musician having a long coaching conversation,
I want context managed and rate limits handled gracefully,
So that chat keeps working without errors.

**Acceptance Criteria:**

**Given** a conversation exceeds provider context limits
**When** the context builder prepares the prompt
**Then** older messages are truncated with a summary prepended
**And** 429 rate limit errors trigger exponential backoff retry (1s, 2s, 4s, max 3 retries)
**And** per-provider context limits are configurable

### Story 11.5: Fix XP Race Condition and Streak Timezone

As a musician,
I want XP tracked accurately and streaks to respect my timezone,
So that my progress data is reliable.

**Acceptance Criteria:**

**Given** concurrent XP awards happen
**When** `awardXp()` runs
**Then** updates use atomic operations (not read-modify-write)
**And** streak calculations use the user's local timezone offset for day boundaries
**And** users in non-UTC timezones don't get false streak breaks

### Story 11.6: Session Expiry Notification and API Key Validity

As a user,
I want clear notifications when my session or API key expires,
So that I can take action without confusion.

**Acceptance Criteria:**

**Given** the auth session expires during use
**When** the next API call fails with 401
**Then** a modal says "Your session has expired. Please log in again." with redirect to login
**And** invalid API key errors show "Your API key is no longer valid" with link to settings

### Story 11.7: Data Export for GDPR Compliance

As a user,
I want to export all my personal data,
So that I can exercise my right to data portability under GDPR.

**Acceptance Criteria:**

**Given** a user clicks "Export My Data" in Settings
**When** the export generates
**Then** it includes all personal data: profile, sessions, MIDI events, snapshots, drills, progress, achievements, conversations
**And** the download is a structured JSON file named `minstrel-data-export-{date}.json`
**And** API keys are included as metadata only (provider + last 4 chars, not the actual key)

---

## Epic 12: Critical Security & Data Integrity

17 CRITICAL code review findings that must be resolved before launch. Covers CSRF protection, encryption key hardening, session data loss prevention, race conditions in XP/streaks, memory leaks, semantic landmarks, token tracking, growth mindset streaming, and rate limit separation.
**Source:** Adversarial Code Review Findings — SEC-C1, SEC-C2, STATE-C1–C5, UI-C1–C5, AI-C1–C5

### Story 12.1: CSRF Protection for All API Routes

As a user,
I want all API routes protected against cross-site request forgery,
So that attackers cannot force my browser to trigger expensive AI operations, delete my API keys, or export my data.

**Acceptance Criteria:**

**Given** any POST or DELETE API route (`/api/ai/chat`, `/api/user/keys`, `/api/user/export`, `/api/ai/drill`, `/api/ai/analyze`, `/api/ai/recalibrate`)
**When** a request arrives from a cross-origin source
**Then** the server validates the `Origin` header matches the expected domain before processing
**And** requests without a valid `Origin` or `Referer` header are rejected with 403 Forbidden
**And** GET requests (read-only) are exempt from CSRF checks
**And** all existing API route tests are updated to include CSRF origin validation (NFR9)

**Finding:** SEC-C1
**Test Coverage Gap Addressed:** #6 — CSRF protection verification on all POST routes

### Story 12.2: Encryption Key Entropy Validation and Rotation

As a developer,
I want encryption key validation to enforce entropy requirements and support key rotation,
So that weak keys cannot be used and compromised keys can be replaced without data loss.

**Acceptance Criteria:**

**Given** the application starts and reads the encryption key from environment
**When** `src/lib/crypto.ts` validates the key (lines 32-34, 52-54)
**Then** entropy validation rejects keys with Shannon entropy below 3.5 bits/char (blocking keys like `"a".repeat(32)`)
**And** a key version identifier is stored alongside encrypted data to support rotation
**And** a rotation mechanism allows decrypting with old key and re-encrypting with new key
**And** startup fails with a clear error message if the encryption key fails entropy validation (NFR12)
**And** all crypto operations are covered by unit tests with both valid and weak key inputs

**Finding:** SEC-C2

### Story 12.3: Session Buffer Crash Protection

As a musician,
I want my session data preserved even if the browser tab closes unexpectedly,
So that I never lose more than a few seconds of practice data.

**Acceptance Criteria:**

**Given** an active recording session with buffered events in `session-recorder.ts` (lines 126-143, 196-243)
**When** the browser tab is closed or crashes
**Then** a `beforeunload` event listener force-flushes the event buffer using `navigator.sendBeacon` for reliable delivery (STATE-C1)
**And** the flush mechanism uses a queue pattern instead of re-appending failed events to the buffer (STATE-C4)
**And** the queue processes sequentially, preventing data loss and order corruption from the reentrancy race condition
**And** the `flushInProgress` guard is replaced with a proper async queue that handles errors without re-appending
**And** session recording integrity approaches 100% (NFR26)

**Findings:** STATE-C1, STATE-C4
**Test Coverage Gap Addressed:** #2 — Browser crash simulation (close tab during active recording)

### Story 12.4: Atomic XP and Streak Updates

As a musician,
I want XP awards and streak increments to be accurate even when triggered from multiple sources,
So that my progress data is never lost to race conditions.

**Acceptance Criteria:**

**Given** concurrent XP award sources (session end + achievement unlock) in `use-xp.ts` (lines 49-70)
**When** both trigger simultaneously
**Then** Supabase RPC atomic increment is used instead of optimistic local state update (STATE-C2)
**And** local React state is set from the Supabase RPC return value, not from stale `lifetimeXp`
**And** streak updates in `use-streak.ts` (lines 46-55) use Supabase RPC for atomic increment (STATE-C3)
**And** `streakRef.current` is updated from the RPC return value, preventing last-write-wins in multi-tab scenarios

**Findings:** STATE-C2, STATE-C3
**Test Coverage Gap Addressed:** #1 — Concurrent `awardSessionXp` calls from different sources

### Story 12.5: Memory Leak Fixes — Analysis Pipeline and Pointer Capture

As a musician in a long practice session,
I want the application to release resources properly,
So that memory doesn't grow unbounded and block other interactions.

**Acceptance Criteria:**

**Given** the analysis pipeline in `use-analysis-pipeline.ts` (lines 105, 349)
**When** the component unmounts during async operations
**Then** the `patternInterval` ID stored in a ref is cleared on unmount before any async cleanup (STATE-C5)
**And** the interval does not fire after component destruction, preventing access to stale Zustand getters
**And** in `timeline-scrubber.tsx` (lines 100-123), pointer capture is released in a `useEffect` cleanup function (UI-C3)
**And** `document.body.style.userSelect` is reset on unmount, preventing stuck pointer states

**Findings:** STATE-C5, UI-C3
**Test Coverage Gap Addressed:** #5 — Component unmount during async session start

### Story 12.6: Semantic Landmarks and Session Switch Error Handling

As a user who relies on assistive technology,
I want semantic landmarks and stable rendering in the application,
So that I can navigate efficiently and the UI doesn't degrade with large datasets.

**Acceptance Criteria:**

**Given** `dashboard-chat.tsx` (line 39) uses `<div id="main-content">`
**When** the component renders
**Then** the `<div>` is replaced with `<main id="main-content">` providing a proper main landmark (UI-C1, NFR19)
**And** the session switch Promise chain in `replay-studio.tsx` (lines 556-577) has a `.catch()` handler with user-facing error state (UI-C2)
**And** session history in `session-history-list.tsx` (lines 54-94) batches state updates using a single `setSessions` call instead of individual re-renders per session (UI-C4)
**And** tab buttons in `replay-studio.tsx` (lines 166-193) have stable keys and memoized rendering to prevent full re-renders on session change (UI-C5)

**Findings:** UI-C1, UI-C2, UI-C4, UI-C5

### Story 12.7: Fix Token Usage Extraction and Silent Tracking Failures

As a user tracking my API costs,
I want token usage accurately extracted from AI responses and failures never silently swallowed,
So that cost tracking and rate limiting are reliable.

**Acceptance Criteria:**

**Given** the chat route in `src/app/api/ai/chat/route.ts` (lines 168-174)
**When** `extractTokenUsage` is called after `streamText` completes
**Then** it receives the full `result` object from `streamText` which contains `result.usage`, not the `{ text }` shorthand (AI-C1)
**And** the character-based estimation fallback is only used when `result.usage` is genuinely unavailable
**And** token tracking failures in `token-tracker.ts` (lines 90-92, 125-127) are reported to Sentry instead of silently swallowed (AI-C2)
**And** an IndexedDB fallback stores failed token writes for later sync
**And** retry with exponential backoff (1s, 2s, 4s) is implemented for failed writes

**Findings:** AI-C1, AI-C2
**Test Coverage Gap Addressed:** #10 — Token usage extraction accuracy vs estimation

### Story 12.8: Growth Mindset Stream Transform and Prompt Injection Protection

As a musician,
I want growth mindset language enforced during streaming (not just after) and protection against prompt manipulation,
So that I never see prohibited words in real-time and the Studio Engineer persona cannot be overridden.

**Acceptance Criteria:**

**Given** the chat route streams text to the client in `src/app/api/ai/chat/route.ts` (lines 153-158)
**When** text chunks arrive from the LLM
**Then** the `createGrowthMindsetTransform()` TransformStream (defined in `growth-mindset-rules.ts` lines 64-92) is piped through `textStream` before returning to client (AI-C3)
**And** users never see prohibited words ("wrong", "bad", "failed") during real-time streaming
**And** user message content is wrapped in XML-style delimiters (`<user_message>...</user_message>`) before insertion into the prompt (AI-C4)
**And** existing XML tags in user input are escaped to prevent delimiter injection
**And** the system prompt includes explicit role-override rejection instructions

**Findings:** AI-C3, AI-C4
**Test Coverage Gap Addressed:** #9 — Growth mindset word filtering in streamed responses

### Story 12.9: Separate Rate Limits for Drill Generation

As a musician,
I want drill generation to have its own rate limit separate from chat,
So that chat usage cannot exhaust my quota for expensive drill generation.

**Acceptance Criteria:**

**Given** the drill route in `src/app/api/ai/drill/route.ts` (lines 31-34)
**When** rate limiting is checked
**Then** drill generation has a separate rate limit bucket (10 requests/min) from chat (100 requests/min)
**And** each route type (chat, drill, analyze, recalibrate) has its own rate limit configuration
**And** exceeding the drill rate limit returns 429 with a message specific to drill generation
**And** the rate limit separation prevents expensive structured output generation from being blocked by chat (NFR13)

**Finding:** AI-C5

---

## Epic 13: High Priority Accessibility & State Fixes

27 HIGH code review findings covering distributed rate limiting, non-charging API key validation, stale closures, atomic IndexedDB writes, token estimation, AI context management, drill timeouts, and comprehensive ARIA/keyboard accessibility across dashboard, replay, and modal components.
**Source:** Adversarial Code Review Findings — SEC-H1–H3, STATE-H1–H5, AI-H1–H7, UI-H1–H12

### Story 13.1: Distributed Rate Limiting with Upstash

As a developer,
I want rate limiting backed by distributed storage,
So that limits cannot be bypassed via cold starts or multi-instance deployment.

**Acceptance Criteria:**

**Given** the current in-memory rate limiter in `rate-limiter.ts` (line 10) and `keys/rate-limit.ts` (line 7)
**When** migrated to distributed storage
**Then** rate limit state is stored in Upstash Redis (or Vercel KV) shared across all serverless isolates
**And** cold starts do not reset rate limit counters
**And** the migration replaces both `rate-limiter.ts` and `keys/rate-limit.ts` instances
**And** AI-M3 (duplicate of SEC-H1) is resolved by this same fix — no separate story needed (NFR13)

**Finding:** SEC-H1 (also resolves AI-M3 duplicate)
**Test Coverage Gap Addressed:** #7 — Rate limit bypass via cold start simulation

### Story 13.2: Non-Charging API Key Validation

As a user,
I want API key validation to not consume my LLM quota,
So that validating my key doesn't cost money and can't be weaponized to drain my account.

**Acceptance Criteria:**

**Given** the validation endpoint in `src/app/api/user/keys/validate.ts` (lines 52-63, 82-94)
**When** a user validates their API key
**Then** OpenAI keys are validated via `GET /v1/models` (non-charging endpoint)
**And** Anthropic keys are validated via key format check and lightweight metadata endpoint
**And** no `max_tokens: 1` generation call is made during validation
**And** repeated validation requests cannot drain a user's API account

**Finding:** SEC-H2

### Story 13.3: Rate Limit Response Headers

As a developer or API consumer,
I want standard rate limit headers on all 429 responses,
So that clients can implement proper backoff and retry logic.

**Acceptance Criteria:**

**Given** any API route returns a 429 status
**When** the response is constructed
**Then** it includes `Retry-After` header (seconds until limit resets)
**And** `X-RateLimit-Limit` header (max requests allowed in window)
**And** `X-RateLimit-Remaining` header (requests remaining in window)
**And** `X-RateLimit-Reset` header (unix timestamp when limit resets)
**And** all API routes consistently include these headers on rate-limited responses

**Finding:** SEC-H3

### Story 13.4: Stale Closure and Reentrancy Fixes

As a developer,
I want stale closure and reentrancy bugs fixed in state management hooks,
So that concurrent operations produce correct results.

**Acceptance Criteria:**

**Given** `use-streak.ts` (lines 18-22, 52) uses `streakRef` for streak data
**When** `recordSession` is called
**Then** it reads from Zustand `getState()` directly instead of the ref, preventing stale reads from React batching (STATE-H1)
**And** `startMetadataSync` in `session-recorder.ts` (lines 180-191) has a guard using a ref or flag to prevent multiple concurrent intervals if called in rapid succession (STATE-H4)
**And** `addDrillRepResult` in `session-store.ts` (lines 343-372) uses Zustand's `set` with an updater function pattern to ensure sequential state reads (STATE-H5)

**Findings:** STATE-H1, STATE-H4, STATE-H5

### Story 13.5: Atomic IndexedDB Transactions and Metadata Writes

As a musician,
I want session data written atomically and metadata updates not skipped,
So that I never have orphan sessions or missing metadata.

**Acceptance Criteria:**

**Given** session creation and event writing in `session-recorder.ts` (lines 36-48, 135)
**When** a new recording session starts
**Then** session creation and initial events are wrapped in a Dexie transaction for atomic write (STATE-H3)
**And** browser crash between operations cannot create orphan sessions with zero events
**And** `updateMetadata` in `session-recorder.ts` (lines 149-159) always writes metadata on interval, not just on change (STATE-H2)
**And** rapid key changes (C→D→C) within the 10s interval are not skipped due to stale cache comparison

**Findings:** STATE-H2, STATE-H3

### Story 13.6: Token Estimation and Budget Enforcement

As a user managing API costs,
I want accurate token estimation and a hard cap on per-request cost,
So that a single request cannot cost hundreds of dollars.

**Acceptance Criteria:**

**Given** the context length manager in `context-length-manager.ts` (lines 27-29) uses a fixed 4 chars/token heuristic
**When** estimating tokens
**Then** a lightweight tokenizer (e.g., `gpt-tokenizer` npm package) is used for accurate BPE estimation (AI-H1)
**And** technical content and code-heavy prompts (MIDI sequences) are accurately counted
**And** a hard maximum token budget of ~8K tokens per request is enforced in the chat route (AI-H2)
**And** requests exceeding the budget are trimmed with a notice to the user, not silently truncated
**And** the maximum cost per request is capped at approximately $0.10

**Findings:** AI-H1, AI-H2

### Story 13.7: Context Trimming, Replay Window, and Error Classification

As a musician,
I want AI context managed correctly and errors classified reliably,
So that conversations flow naturally and error handling doesn't break on provider updates.

**Acceptance Criteria:**

**Given** the context trimming in `chat/route.ts` (lines 141-143)
**When** truncation occurs
**Then** the summary is injected as a system message (not `role: 'assistant'`), preventing the model from referencing it as its own response (AI-H3)
**And** the replay context window in `context-builder.ts` (lines 131, 172) adapts based on detected tempo (e.g., always 16 beats) instead of hardcoded 10 seconds (AI-H4)
**And** error classification in `errors.ts` (lines 43-62) uses structured error response parsing (`errorBody.error?.code`) instead of regex on error messages (AI-H5)
**And** new error formats from providers don't break classification

**Findings:** AI-H3, AI-H4, AI-H5

### Story 13.8: Drill Timeout and Genre Logging

As a musician,
I want drill generation to have a timeout and unknown genres to be tracked,
So that the UI never hangs and genre coverage gaps are discovered.

**Acceptance Criteria:**

**Given** the drill route in `src/app/api/ai/drill/route.ts` (lines 68-73)
**When** `generateText` with structured output is called
**Then** an AbortController with a 20s timeout is attached (AI-H6)
**And** timeout produces a user-friendly message ("Drill generation took too long — try again")
**And** unknown genres in `genre-terminology.ts` (lines 447-450) that fall back to GENERIC are logged to Sentry with the unknown genre name (AI-H7)
**And** Sentry alerts enable monitoring for when new genres need to be added

**Findings:** AI-H6, AI-H7

### Story 13.9: Dashboard and Replay Accessibility — ARIA Attributes

As a user relying on assistive technology,
I want dashboard and replay components to have proper ARIA attributes,
So that I can navigate and understand state changes with a screen reader.

**Acceptance Criteria:**

**Given** the engagement toggle in `dashboard-chat.tsx` (lines 62-72)
**When** the button renders
**Then** it includes `aria-expanded={showEngagement}` for screen reader state announcement (UI-H1)
**And** an `aria-live` region announces accordion open/close state changes (UI-H2, NFR21)
**And** the replay loading spinner in `replay-studio.tsx` (lines 90-116) has `aria-live="assertive"` to announce loading state (UI-H4)
**And** the AI chat textarea in `ai-chat-panel.tsx` (lines 205-214) has a visible `<label>` element satisfying WCAG 2.5.3 Label in Name (UI-H5, NFR19)
**And** snapshot CTAs in `snapshot-cta.tsx` (lines 14-41) auto-focus the first button on mount for keyboard discoverability (UI-H6)
**And** the replay tab list in `replay-studio.tsx` (lines 166-193) implements Left/Right arrow key navigation with roving tabindex per ARIA tablist spec (UI-H3, NFR20)

**Findings:** UI-H1, UI-H2, UI-H3, UI-H4, UI-H5, UI-H6

### Story 13.10: Keyboard Navigation, Focus Traps, and Modal Fixes

As a keyboard-only user,
I want focus properly managed in modals and interactive elements,
So that I never lose my place or get trapped behind overlays.

**Acceptance Criteria:**

**Given** the return session banner in `return-session-banner.tsx` (lines 57-70)
**When** it auto-dismisses on MIDI input
**Then** it checks whether the banner currently has focus before dismissing, preserving keyboard flow (UI-H7)
**And** the keyboard shortcuts panel in `keyboard-shortcuts-panel.tsx` (lines 58-110) has a focus trap preventing Tab from escaping to background content (UI-H8, NFR20)
**And** the mobile redirect overlay in `mobile-redirect.tsx` (lines 48-76) adds `aria-hidden="true"` to background content when active (UI-H9)
**And** the drill controller in `drill-controller.tsx` (lines 176-185) has a keyboard shortcut hint or visible focus indicator for the Start button (UI-H10)
**And** timeline marker buttons in `timeline-scrubber.tsx` (lines 238-282) are wrapped in `role="list"` / `role="listitem"` semantic structure (UI-H11)
**And** the AI chat textarea auto-resize in `ai-chat-panel.tsx` (lines 93-98) has an `aria-live` announcement for layout changes (UI-H12)

**Findings:** UI-H7, UI-H8, UI-H9, UI-H10, UI-H11, UI-H12

---

## Epic 14: Medium Priority Polish

35 MEDIUM code review findings covering CI security automation, timezone persistence, XP error propagation, drill timer cleanup, stale closure fixes, export completeness, dead code removal, schema validation, analytics attribution, screen reader landmarks, chat UX polish, animation accessibility, and performance virtualization.
**Source:** Adversarial Code Review Findings — SEC-M1–M4, STATE-M1–M7, AI-M1–M2, AI-M4–M11, UI-M1–M13

### Story 14.1: CI Security Checks and Token Tracker Server Import

As a developer,
I want CI checks for security violations and correct imports in server-side code,
So that accidental misconfigurations don't reach production.

**Acceptance Criteria:**

**Given** the codebase CI pipeline
**When** a build runs
**Then** a CI check detects any `service_role` usage outside admin code paths (SEC-M1)
**And** `token-tracker.ts` (line 1) imports from `@/lib/supabase/server` instead of `@/lib/supabase/client` for server-side execution (SEC-M2)
**And** error messages in `errors.ts` (lines 13-18) use generic text in production, only revealing implementation details in development mode (SEC-M3)
**And** `sessionId` in `token-tracker.ts` (line 170) has UUID format validation before database insert (SEC-M4)

**Findings:** SEC-M1, SEC-M2, SEC-M3, SEC-M4

### Story 14.2: Streak Timezone Persistence and XP Error Propagation

As a musician who travels or lives in non-UTC timezones,
I want my streak calculations consistent regardless of timezone changes,
So that travel or DST doesn't break or double-count my streaks.

**Acceptance Criteria:**

**Given** `use-streak.ts` (lines 32, 52) computes timezone offset from `Date.getTimezoneOffset()`
**When** the user's timezone is detected
**Then** the user's primary timezone is persisted to their profile on first session (STATE-M1)
**And** subsequent streak calculations use the stored timezone, not the current browser offset
**And** `awardXp` in `xp-service.ts` (lines 40-54) returns an error status instead of silently logging failures (STATE-M2)
**And** callers handle the error and sync local state from the database return value

**Findings:** STATE-M1, STATE-M2
**Test Coverage Gap Addressed:** #3 — Timezone changes mid-session

### Story 14.3: Drill Player Timer and Audio Node Cleanup

As a musician stopping drills early,
I want timers and audio nodes cleaned up properly,
So that callbacks don't fire after stop and audio nodes don't accumulate.

**Acceptance Criteria:**

**Given** `drill-player.ts` (lines 63-135) creates setTimeout timers for note playback
**When** `stop()` is called before all timers have been created
**Then** a `stopped` flag check inside each timer callback prevents `onNotePlay` from firing after stop (STATE-M3)
**And** the listen phase timer in `drill-player.ts` (lines 216-220, 229) also checks the `stopped` flag at start of callback (STATE-M4)
**And** oscillator and gain nodes in `drill-player.ts` (lines 142-172) are explicitly disconnected after playback completes, preventing audio node accumulation (STATE-M6)

**Findings:** STATE-M3, STATE-M4, STATE-M6
**Test Coverage Gap Addressed:** #4 — Drill playback early stop with pending timers

### Story 14.4: Stale Closure and Reentrancy Fixes

As a developer,
I want MIDI callback and session recorder reentrancy bugs fixed,
So that retrying connections and starting sessions don't produce stale state.

**Acceptance Criteria:**

**Given** `use-midi.ts` (lines 13-51, 78, 101) creates callbacks with `createMidiCallbacks()`
**When** `retryConnection` is called
**Then** `channelChecked` is reset to false before creating new callbacks, ensuring drum channel detection runs again (STATE-M5)
**And** `session-recorder.ts` (lines 54-68) has a reentrancy guard with async lock on `startRecording` (STATE-M7)
**And** calling `recordEvent` before `startRecording` completes uses the pending buffer without race conditions

**Findings:** STATE-M5, STATE-M7

### Story 14.5: Data Export Completeness and Token Summary

As a user exercising GDPR data portability rights,
I want my data export to be complete and include cost breakdowns,
So that I have a full picture of my data and spending.

**Acceptance Criteria:**

**Given** the data export in `data-export.ts` (lines 50-67) and `export/route.ts` (line 31)
**When** IndexedDB queries fail during export
**Then** export status flags indicate which data sources succeeded and which failed (AI-M1)
**And** the user is notified of partial export with an option to retry (NFR15)
**And** the server export includes an aggregated token usage summary by provider and model (AI-M2)
**And** users can see a cost breakdown per provider in their export

**Findings:** AI-M1, AI-M2

### Story 14.6: Dead Code Removal and Growth Mindset Monitoring

As a developer,
I want dead code removed and growth mindset violations logged,
So that the codebase stays clean and content quality issues are detectable.

**Acceptance Criteria:**

**Given** `constants.ts` (lines 33-34) defines `SNAPSHOT_FADE_IN_MS` and `SNAPSHOT_FADE_OUT_MS`
**When** these constants are audited
**Then** they are either wired to their intended consumers or removed as dead code (AI-M4)
**And** `validateGrowthMindset` violations in `response-processor.ts` (line 24) are logged to Sentry with the specific violations array for monitoring (AI-M5)
**And** `parseChatError` in `chat-error-handler.ts` (lines 40, 48) returns error + suggested action instead of directly mutating global app store (AI-M7)
**And** callers are updated to handle the returned error action

**Findings:** AI-M4, AI-M5, AI-M7

### Story 14.7: Drill Schema Validation and PostHog User ID

As a developer,
I want drill schemas validated, analytics attributed to real users, and non-text message parts logged,
So that drills are well-formed, analytics are useful, and future features don't silently break.

**Acceptance Criteria:**

**Given** the drill generator in `drill-generator.ts` (lines 29-40)
**When** a drill request is built
**Then** `sessionContext.genre` is included in the drill prompt for genre-specific terminology (AI-M6)
**And** `timingAccuracy` conversion in `context-builder.ts` (line 34) / `schemas.ts` (line 8) includes runtime clamping: `Math.max(0, Math.min(1, value / 100))` (AI-M8)
**And** `DrillNoteSchema` array has `.max(64)` to prevent absurdly long AI-generated note sequences (AI-M9)
**And** PostHog `distinctId` in `drill/route.ts` (line 90) uses `authResult.userId` instead of hardcoded `'server'` (AI-M10)
**And** `uiMessagesToSimple` in `message-adapter.ts` (lines 14-17) logs when non-text parts are encountered and silently dropped (AI-M11)

**Findings:** AI-M6, AI-M8, AI-M9, AI-M10, AI-M11

### Story 14.8: Landmark and Screen Reader Fixes

As a screen reader user,
I want all views to have proper landmarks and no duplicate announcements,
So that navigation is efficient and not confusing.

**Acceptance Criteria:**

**Given** `silent-coach.tsx` (lines 14-30)
**When** the component renders
**Then** it wraps content in a `<main>` element providing a main landmark (UI-M1, NFR19)
**And** the mode switcher in `mode-switcher.tsx` (lines 103-106) uses `aria-label` with full text so screen readers read "Silent Coach" not just "Coach" (UI-M2)
**And** the manual `textContent` update in `mode-switcher.tsx` (lines 56-61) is removed to prevent duplicate announcements from the existing `role="status"` (UI-M3)

**Findings:** UI-M1, UI-M2, UI-M3

### Story 14.9: Chat UX Improvements — Scroll, Submit, Color Logic

As a musician using the AI chat,
I want smooth scrolling behavior, standard form submission, and correct feedback colors,
So that the chat experience is polished and intuitive.

**Acceptance Criteria:**

**Given** the chat panel in `ai-chat-panel.tsx` (lines 76-80)
**When** a new message appears
**Then** `scrollIntoView` only fires if the user is already at the bottom of the chat, not interrupting reading of earlier messages (UI-M4)
**And** form submission in `ai-chat-panel.tsx` (lines 85-86) uses `form.requestSubmit()` instead of synthetic `dispatchEvent` (UI-M5)
**And** improvement color logic in `drill-controller.tsx` (lines 236-248) distinguishes between negative (regression), zero (stagnation), and positive (improvement) with three distinct color treatments (UI-M6)

**Findings:** UI-M4, UI-M5, UI-M6

### Story 14.10: Animation Accessibility and Focus Traps

As a user with motion sensitivity,
I want animations to respect my system preferences and modals to trap focus,
So that the UI doesn't cause discomfort and keyboard navigation works correctly.

**Acceptance Criteria:**

**Given** the timeline scrubber in `timeline-scrubber.tsx` (lines 120-123)
**When** the component is used
**Then** a `useEffect` cleanup resets `document.body.style.userSelect` on unmount (UI-M7)
**And** session summary animation in `session-summary.tsx` (lines 74-82) uses CSS animation that respects `prefers-reduced-motion` media query (UI-M8, NFR23)
**And** the session summary modal in `session-summary.tsx` (lines 72-188) auto-focuses the first button and implements a focus trap (UI-M9, NFR20)
**And** return session banner animation in `return-session-banner.tsx` (line 97) adds a `prefers-reduced-motion` check (UI-M10, NFR23)

**Findings:** UI-M7, UI-M8, UI-M9, UI-M10

### Story 14.11: Performance — Virtualization and Pagination

As a musician with many sessions and achievements,
I want lists virtualized or paginated for performance,
So that the UI stays responsive even with hundreds of items.

**Acceptance Criteria:**

**Given** the achievement gallery in `achievement-gallery.tsx` (lines 179-242)
**When** rendering 43+ achievement cards
**Then** virtual scrolling or pagination limits the DOM to a manageable number of elements (UI-M11)
**And** session history in `session-history-list.tsx` (lines 54-56) implements pagination or limits to recent 50 sessions (UI-M12)
**And** media query listener cleanup in `small-screen-banner.tsx` (lines 15-29) is verified to handle fast unmount/remount without memory leaks (UI-M13)

**Findings:** UI-M11, UI-M12, UI-M13

---

## Epic 15: Low Priority Cleanup

20 LOW code review findings covering middleware redirect hardening, RLS test automation, DST edge cases, accumulator resets, timer cleanup, cache invalidation, MIDI subscription cleanup, metadata write timing, dead code removal, retry/pricing staleness, export compression, growth mindset expansion, and UI polish. Post-launch acceptable.
**Source:** Adversarial Code Review Findings — SEC-L1–L3, STATE-L1–L6, AI-L1–L6, UI-L1–L4

**Note:** STATE-L7 (Guest Session Double-Start) was verified as NOT a bug — `startingRef` guard works correctly. Excluded from stories.

### Story 15.1: Middleware and RLS Security Hardening

As a developer,
I want defense-in-depth protections for middleware and database access,
So that even if one layer fails, data remains protected.

**Acceptance Criteria:**

**Given** the middleware redirect in `middleware.ts` (lines 43-46)
**When** a redirect occurs
**Then** pathname validation ensures `pathname.startsWith('/') && !pathname.includes('://')` to prevent open redirects (SEC-L1)
**And** the middleware config is documented with inline comments to explain why API routes are excluded from the matcher (SEC-L2)
**And** automated tests verify RLS policies exist on all user data tables (SEC-L3, NFR11)

**Findings:** SEC-L1, SEC-L2, SEC-L3
**Test Coverage Gap Addressed:** #8 — RLS policy verification for all tables

### Story 15.2: DST, Accumulator, and Timer Edge Cases

As a musician,
I want edge cases in streaks, analysis, and timers handled correctly,
So that DST transitions, component remounts, and unmounts don't cause subtle bugs.

**Acceptance Criteria:**

**Given** the streak calculation in `streak-tracker.ts` (lines 12-21)
**When** a DST switch occurs
**Then** `isSameCalendarDay` uses `Intl.DateTimeFormat` for timezone-aware date comparison instead of manual offset application (STATE-L1)
**And** `resetAccumulator()` in `use-analysis-pipeline.ts` (lines 58-79) resets all properties including `startTimestamp` (STATE-L2)
**And** the 10-second silence timeout in `use-analysis-pipeline.ts` (lines 169-217, 351) checks a mounted flag before firing, preventing CPU waste on unmounted components (STATE-L3)

**Findings:** STATE-L1, STATE-L2, STATE-L3

### Story 15.3: Cache Invalidation and MIDI Subscription Cleanup

As a musician,
I want session caches invalidated after completion and MIDI subscriptions cleaned up properly,
So that I see my latest data and no subscriptions leak.

**Acceptance Criteria:**

**Given** the continuity context cache in `session-manager.ts` (lines 112-143)
**When** a session completes
**Then** the cache is invalidated so the just-completed session appears without requiring a page reload (STATE-L4)
**And** MIDI access requests in `use-midi.ts` (lines 64-94) add a mounted check after async resolve to prevent subscription creation after cleanup (STATE-L5)
**And** first metadata detection in `session-recorder.ts` (lines 149-159, 185-190) writes metadata immediately on first detection instead of waiting for the next 10s interval (STATE-L6)

**Findings:** STATE-L4, STATE-L5, STATE-L6

### Story 15.4: Dead Code Removal and Retry/Pricing Staleness

As a developer,
I want unused code removed, retry logic improved, and pricing freshness ensured,
So that the codebase is clean and operational concerns are addressed.

**Acceptance Criteria:**

**Given** `trackTokenUsage` in `token-tracker.ts` (lines 100-128) is never imported
**When** the codebase is audited
**Then** the dead function is either removed or documented with a `// TODO: wire in story X.Y` comment (AI-L1)
**And** chat route retry logic in `chat/route.ts` (lines 17, 63) parses the `Retry-After` header from 429 responses to honor provider-specified backoff (AI-L2)
**And** the `drill-parser.ts` reference is resolved — either the file is created if needed or the reference is removed (AI-L3)
**And** `pricing.ts` (line 12) has an automated check that logs a Sentry warning when `PRICING_LAST_UPDATED` is >30 days stale (AI-L4)

**Findings:** AI-L1, AI-L2, AI-L3, AI-L4

### Story 15.5: Export Compression and Growth Mindset Expansion

As a user with many sessions,
I want data exports compressed and growth mindset coverage expanded,
So that exports don't hit size limits and AI responses are more thoroughly filtered.

**Acceptance Criteria:**

**Given** the export endpoint in `export/route.ts` (line 50)
**When** the export is generated
**Then** large exports are gzip compressed to stay within Vercel's 4.5MB response limit (AI-L5)
**And** streaming response is used for exports exceeding the size limit
**And** the prohibited word list in `growth-mindset-rules.ts` (lines 1-12) is expanded to include common negatives ("can't", "never", "impossible") (AI-L6)

**Findings:** AI-L5, AI-L6

### Story 15.6: UI Polish — Limits, Magic Numbers, Typography, localStorage

As a user,
I want polish fixes for session limits, responsive sizing, consistent typography, and safe storage access,
So that the UI handles edge cases gracefully.

**Acceptance Criteria:**

**Given** the replay studio in `replay-studio.tsx` (line 520)
**When** the session limit is applied
**Then** the `.limit(20)` is made configurable or a "Load More" button is added for users with >20 sessions (UI-L1)
**And** the chat textarea max height in `ai-chat-panel.tsx` (line 97) uses a CSS `max-height` or viewport-based calculation instead of the magic number `120` (UI-L2)
**And** the drill controller in `drill-controller.tsx` (lines 134, 202, 256) uses consistent design token classes instead of mixed raw `text-xs` (UI-L3)
**And** all `localStorage` access in `mobile-redirect.tsx` (lines 27, 32, 36, 41) is wrapped in try/catch with a fallback for disabled or quota-exceeded storage (UI-L4)

**Findings:** UI-L1, UI-L2, UI-L3, UI-L4

---

## Validation Summary

### FR Coverage: Complete

All 50 Functional Requirements are covered across 7 epics with 43 stories. Every FR maps to at least one story with specific acceptance criteria.

### UX Critique Coverage: Complete (Epics 8-11)

All adversarial UX critique items are covered across Epics 8-11 with 28 stories:

- **BUG-1 through BUG-7**: Epic 8 (Stories 8.1-8.5)
- **DS-1 through DS-6**: Epic 9 (Stories 9.1-9.4)
- **A11Y-1 through A11Y-8**: Epic 9 (Story 9.5)
- **MISS-1 through MISS-14**: Epics 8, 9, 10, 11 (distributed by domain)
- **AI-1 through AI-6**: Epic 11 (Stories 11.1-11.4)
- **DATA-1 through DATA-6**: Epic 11 (Stories 11.5-11.6)
- **ARCH-1**: Epic 8 (Story 8.7)
- **NEW-1 through NEW-12**: Epics 10, 11 (distributed by domain)

### Code Review Coverage: Complete (Epics 12-15)

All 99 adversarial code review findings from Epics 8-11 are covered across 4 remediation epics with 36 stories:

**Exclusions:**

- **STATE-L7** (Guest Session Double-Start): Verified as NOT a bug — `startingRef` guard works correctly. Excluded.
- **AI-M3** (Rate Limiter In-Memory Store): Duplicate of SEC-H1. Resolved in Story 13.1.

**Total unique findings addressed:** 97 (99 total − 1 not-a-bug − 1 duplicate)

| Epic      | Severity | Findings | Stories | IDs Covered                                                |
| --------- | -------- | -------- | ------- | ---------------------------------------------------------- |
| Epic 12   | CRITICAL | 17       | 9       | SEC-C1–C2, STATE-C1–C5, UI-C1–C5, AI-C1–C5                 |
| Epic 13   | HIGH     | 27       | 10      | SEC-H1–H3, STATE-H1–H5, AI-H1–H7, UI-H1–H12 (+AI-M3 dedup) |
| Epic 14   | MEDIUM   | 34       | 11      | SEC-M1–M4, STATE-M1–M7, AI-M1–M2, AI-M4–M11, UI-M1–M13     |
| Epic 15   | LOW      | 19       | 6       | SEC-L1–L3, STATE-L1–L6, AI-L1–L6, UI-L1–L4                 |
| **Total** |          | **97**   | **36**  |                                                            |

### Test Coverage Gaps: Mapped

All 10 test coverage gaps from the code review are mapped to specific stories:

1. Concurrent `awardSessionXp` calls → **Story 12.4**
2. Browser crash simulation → **Story 12.3**
3. Timezone changes mid-session → **Story 14.2**
4. Drill playback early stop → **Story 14.3**
5. Component unmount during async → **Story 12.5**
6. CSRF protection verification → **Story 12.1**
7. Rate limit bypass via cold start → **Story 13.1**
8. RLS policy verification → **Story 15.1**
9. Growth mindset streaming → **Story 12.8**
10. Token usage extraction accuracy → **Story 12.7**

### Epic Independence: Verified

- **Epics 1-7** — Original feature development (43 stories)
- **Epics 8-11** — UX critique remediation (28 stories, depends on 1-7)
- **Epic 12** — CRITICAL security & data integrity (9 stories, depends on 8-11, **BLOCKS LAUNCH**)
- **Epic 13** — HIGH priority a11y & state fixes (10 stories, depends on 12 for rate limit infrastructure)
- **Epic 14** — MEDIUM priority polish (11 stories, depends on 12-13 for foundational fixes)
- **Epic 15** — LOW priority cleanup (6 stories, independent of 13-14, post-launch OK)

### Story Dependencies: Forward-Only

Within each epic, stories are ordered so that each story depends only on previous stories — no forward dependencies. Database tables and entities are created in the first story that needs them, not upfront.

### Architecture Compliance

- Story 1.1 initializes from the specified starter template (AR1)
- All stores, patterns, and boundaries follow the Architecture document
- Acceptance criteria reference specific NFRs where applicable
- BYOK model is fully represented (Epic 3)
- Growth mindset language enforced across all user-facing stories

### NFR Compliance (Epics 12-15)

Remediation epics address the following Non-Functional Requirements:

- **NFR9** (encryption in transit/at rest): Stories 12.1, 12.2
- **NFR11** (per-user data isolation): Story 15.1
- **NFR12** (API key security): Story 12.2
- **NFR13** (API rate limiting): Stories 12.9, 13.1, 13.3
- **NFR15** (data export/deletion): Story 14.5
- **NFR19** (WCAG 2.1 AA): Stories 12.6, 13.9, 14.8
- **NFR20** (keyboard navigation): Stories 13.9, 13.10, 14.10
- **NFR21** (screen reader compatibility): Story 13.9
- **NFR23** (prefers-reduced-motion): Story 14.10
- **NFR26** (session recording integrity): Story 12.3

### Cumulative Totals

| Scope               | Epics  | Stories | Source                       |
| ------------------- | ------ | ------- | ---------------------------- |
| Feature Development | 1-7    | 43      | PRD Functional Requirements  |
| UX Remediation      | 8-11   | 28      | Adversarial UX Critique      |
| Code Review Fixes   | 12-15  | 36      | Adversarial Code Review (99) |
| **Total**           | **15** | **107** |                              |
