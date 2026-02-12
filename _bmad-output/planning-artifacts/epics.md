---
stepsCompleted: [1, 2, 3, 4]
status: 'complete'
completedAt: '2026-02-12'
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
workflowType: 'epics-and-stories'
project_name: 'Minstrel'
user_name: 'Melchizedek'
date: '2026-02-12'
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

| FR | Epic | Brief Description |
|----|------|-------------------|
| FR1 | Epic 1 | MIDI auto-detection |
| FR2 | Epic 1 | Device name/channel/status |
| FR3 | Epic 1 | Troubleshooting guidance |
| FR4 | Epic 1 | MIDI event capture |
| FR5 | Epic 5 | MIDI output demonstration |
| FR6 | Epic 1 | Audio-only fallback |
| FR7 | Epic 1 | Audio dynamics detection |
| FR8 | Epic 2 | Note/chord/progression detection |
| FR9 | Epic 2 | Timing accuracy |
| FR10 | Epic 2 | Key/tonal/harmonic detection |
| FR11 | Epic 2 | Genre pattern identification |
| FR12 | Epic 2 | Playing tendency tracking |
| FR13 | Epic 2 | Session snapshot generation |
| FR14 | Epic 5 | Multi-dimensional skill assessment |
| FR15 | Epic 5 | Dynamic difficulty adjustment |
| FR16 | Epic 5 | Progressive overload |
| FR17 | Epic 5 | Growth zone detection |
| FR18 | Epic 5 | Cross-session recalibration |
| FR19 | Epic 5 | Targeted drill generation |
| FR20 | Epic 5 | MIDI drill demonstration |
| FR21 | Epic 5 | Varied drill production |
| FR22 | Epic 5 | Drill completion tracking |
| FR23 | Epic 5 | Key insight after freeform |
| FR24 | Epic 4 | Natural language questions |
| FR25 | Epic 4 | Session-grounded responses |
| FR26 | Epic 4 | Genre-constrained advice |
| FR27 | Epic 4 | Contextual concept explanations |
| FR28 | Epic 4 | Growth mindset framing |
| FR29 | Epic 2 | Silent Coach mode |
| FR30 | Epic 4 | Dashboard + Chat mode |
| FR31 | Epic 6 | Replay Studio with timeline |
| FR32 | Epic 6 | AI questions about replay |
| FR33 | Epic 2 | Real-time harmonic overlays |
| FR34 | Epic 2 | Freeform play mode |
| FR35 | Epic 5 | Micro-sessions |
| FR36 | Epic 5 | Auto-generated warm-ups |
| FR37 | Epic 2 | Session recording |
| FR38 | Epic 6 | Session continuity |
| FR39 | Epic 7 | Personal records tracking |
| FR40 | Epic 7 | Practice streaks |
| FR41 | Epic 7 | XP awards |
| FR42 | Epic 7 | Achievement badges |
| FR43 | Epic 7 | Progress trend data |
| FR44 | Epic 7 | Weekly progress summaries |
| FR45 | Epic 1/3 | Guest mode / account flow |
| FR46 | Epic 3 | Account creation |
| FR47 | Epic 3 | API key configuration |
| FR48 | Epic 3 | API key validation |
| FR49 | Epic 3 | Graceful degradation |
| FR50 | Epic 3 | Token/cost usage display |

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

## Validation Summary

### FR Coverage: Complete

All 50 Functional Requirements are covered across 7 epics with 43 stories. Every FR maps to at least one story with specific acceptance criteria.

### Epic Independence: Verified

- **Epic 1** — Standalone foundation
- **Epic 2** — Depends on Epic 1 only
- **Epic 3** — Depends on Epic 1 only (parallelizable with Epic 2)
- **Epic 4** — Depends on Epic 2 + Epic 3
- **Epic 5** — Depends on Epic 2 + Epic 4
- **Epic 6** — Depends on Epic 2, optionally Epic 4
- **Epic 7** — Depends on Epic 2

### Story Dependencies: Forward-Only

Within each epic, stories are ordered so that each story depends only on previous stories — no forward dependencies. Database tables and entities are created in the first story that needs them, not upfront.

### Architecture Compliance

- Story 1.1 initializes from the specified starter template (AR1)
- All stores, patterns, and boundaries follow the Architecture document
- Acceptance criteria reference specific NFRs where applicable
- BYOK model is fully represented (Epic 3)
- Growth mindset language enforced across all user-facing stories
