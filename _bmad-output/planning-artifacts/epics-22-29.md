---
status: 'active'
createdAt: '2026-02-16'
inputDocuments:
  - '_bmad-output/planning-artifacts/adversarial-ux-review-2026-02-16.md'
  - '_bmad-output/planning-artifacts/epics-18-21.md'
workflowType: 'epics-and-stories'
project_name: 'Minstrel'
user_name: 'Melchizedek'
date: '2026-02-16'
---

# Epics 22-29: Adversarial UX Review Remediation

## Overview

This document covers 8 remediation epics (22-29) addressing ~355 findings from a comprehensive adversarial UX review conducted on 2026-02-16. The review was performed by 10 specialized agents examining every screen, flow, and journey in the Minstrel application.

**Total scope**: 50 stories across 8 epics.
**Source**: adversarial-ux-review-2026-02-16.md

### Priority Mapping

| Epic      | Title                                       | Priority | Stories | Focus                             |
| --------- | ------------------------------------------- | -------- | ------- | --------------------------------- |
| 22        | Error Visibility & MIDI Connection Feedback | P0       | 7       | Silent failures, MIDI UX          |
| 23        | Canvas Visualization Overhaul               | P0       | 7       | Visual feedback, readability      |
| 24        | Session Lifecycle & Data Integrity          | P0       | 6       | Session state, store coordination |
| 25        | Drill System UX Overhaul                    | P0/P1    | 6       | Drill usability, feedback         |
| 26        | Dashboard & AI Coaching UX                  | P0/P1    | 6       | Cognitive load, growth mindset    |
| 27        | Auth & BYOK Settings Overhaul               | P0/P1    | 7       | Onboarding friction, settings     |
| 28        | Navigation & Layout Fixes                   | P1       | 5       | Z-index, layout, shortcuts        |
| 29        | Replay, Engagement & Design Polish          | P1/P2    | 6       | Replay UX, design system          |
| **Total** |                                             |          | **50**  |                                   |

### Dependencies

- Epics 22-24: Independent (P0, can run in parallel)
- Epic 25: Independent (P0/P1)
- Epic 26: Depends on Epic 22 (error rendering patterns)
- Epic 27: Independent (P0/P1)
- Epic 28: Depends on Epic 22 (StatusBar changes)
- Epic 29: Depends on Epics 23, 26 (design tokens, dashboard patterns)

---

## Epic 22: Error Visibility & MIDI Connection Feedback

**Epic ID**: 22
**Epic Title**: Error Visibility & MIDI Connection Feedback
**Epic Description**: The most pervasive UX failure: errors are stored in state but never rendered to users. MIDI errors, connection events, session expiry, and audio fallback limitations are all invisible. This epic creates a centralized error rendering system and makes MIDI connection/disconnection events visible.
**Source**: MIDI-C1, MIDI-C2, MIDI-C3, MIDI-C4, MIDI-C5, MIDI-C6, MIDI-C7, MIDI-C9, SET-C8, MIDI-C17, NAV-C5, Theme 1, Theme 3
**Priority**: P0 — Launch Blocker
**Dependencies**: None (highest priority)
**Story Count**: 7

### Story 22.1: Create Centralized Error Banner Component and Surface MIDI Errors

**Story ID**: 22.1
**Story Title**: Create Centralized Error Banner Component and Surface MIDI Errors
**Story Description**: Create a reusable error/notification banner component that reads `midiStore.errorMessage` and renders it visibly to users. Currently, `errorMessage` is set on MIDI access denial, device errors, and audio fallback failures, but no component in the codebase reads or renders this field.

**Findings Covered**: MIDI-C1, Theme 1

**Context**:

- **Files**: `src/stores/midi-store.ts`, all mode components
- **Issue**: `midiStore.errorMessage` is set but never read by any component. All MIDI errors are completely invisible.
- **Impact**: Users have no idea when MIDI is not working, data isn't being saved, or features are broken.

**Acceptance Criteria**:

1. Given `midiStore.errorMessage` is set, when the error is non-null, then a visible banner appears at the top of the active mode view
2. Given the error banner is visible, when the user dismisses it, then the banner hides but errors remain in store for debugging
3. Given multiple errors occur, when they overlap, then the most recent error is shown with a count indicator
4. Given the error banner component, when used across modes, then it uses consistent styling (amber tone, growth mindset language)

---

### Story 22.2: Add MIDI Connection Loading Indicator and Timeout

**Story ID**: 22.2
**Story Title**: Add MIDI Connection Loading Indicator and Timeout
**Story Description**: Add a visible loading spinner and "Connecting to your MIDI device..." text during `navigator.requestMIDIAccess()`, which can take 3-10 seconds. Add a 15-second timeout with a helpful message.

**Findings Covered**: MIDI-C2, MIDI timeout (HIGH)

**Context**:

- **Files**: `src/hooks/use-midi.ts`, `src/components/midi/`
- **Issue**: `requestMIDIAccess()` can take 3-10s (especially first time with OS permission dialog). No spinner, no text. User stares at blank screen.
- **Impact**: Users think the app is broken during MIDI initialization.

**Acceptance Criteria**:

1. Given MIDI access is requested, when `requestMIDIAccess()` is pending, then a loading spinner with "Connecting to your instrument..." text is visible
2. Given MIDI connection takes >15 seconds, when the timeout fires, then a helpful message appears with troubleshooting suggestions
3. Given MIDI permission is denied by OS, when the denial occurs, then a clear error message explains what happened and how to fix it

---

### Story 22.3: Fix Troubleshooting Panel Behavior and Persistence

**Story ID**: 22.3
**Story Title**: Fix Troubleshooting Panel Behavior and Persistence
**Story Description**: Fix the troubleshooting panel so it doesn't auto-open/close uncontrollably. Add a persistent "Help" button to manually reopen it. Fix flickering on connection flakes.

**Findings Covered**: MIDI-C3, troubleshooting flickering (HIGH)

**Context**:

- **Files**: `src/components/midi/troubleshooting-panel.tsx`
- **Issue**: Panel auto-opens on error, can't be manually reopened after closing. Appears/disappears on every connection status change causing flicker.
- **Impact**: Users lose access to troubleshooting help when they need it most.

**Acceptance Criteria**:

1. Given the troubleshooting panel was dismissed, when the user wants to reopen it, then a persistent "MIDI Help" button in the status bar allows manual reopening
2. Given a connection flake (rapid connect/disconnect), when status changes rapidly, then the panel debounces open/close by 2 seconds
3. Given the panel is open and connection succeeds, when MIDI connects, then the panel stays open for 3 seconds showing success before auto-closing

---

### Story 22.4: Add Audio Mode Limitations Explainer and Permission Error

**Story ID**: 22.4
**Story Title**: Add Audio Mode Limitations Explainer and Permission Error
**Story Description**: When user switches to audio mode, explain that multi-note detection, chord recognition, MIDI output, and drill playback are disabled/degraded. Show clear error when microphone permission is denied.

**Findings Covered**: MIDI-C4, MIDI-C9

**Context**:

- **Files**: `src/components/midi/audio-fallback.tsx`, audio mode components
- **Issue**: Audio mode silently degrades features. Permission denial shows no error. Users don't understand limitations.
- **Impact**: Users expect full functionality in audio mode and are confused when features don't work.

**Acceptance Criteria**:

1. Given user activates audio mode, when the mode switch completes, then a brief overlay lists which features are limited and why
2. Given user clicks "Try Audio Mode" and denies microphone permission, when the denial occurs, then a clear error message explains what happened
3. Given user is in audio mode, when they attempt a feature that's unavailable (e.g., chord recognition), then a contextual tooltip explains the limitation

---

### Story 22.5: Fix Drum Channel Warning Messaging

**Story ID**: 22.5
**Story Title**: Fix Drum Channel Warning Messaging
**Story Description**: Rewrite the drum channel warning to be clear and non-contradictory. Currently says "switch to melodic channel" but also "will still listen on all channels."

**Findings Covered**: MIDI-C5

**Context**:

- **Files**: `src/components/midi/` (drum channel detection)
- **Issue**: Contradictory messaging confuses users about whether the app works with drums.
- **Impact**: Users on MIDI drum kits get mixed signals about app compatibility.

**Acceptance Criteria**:

1. Given a drum channel (channel 10) is detected, when the warning appears, then it clearly explains: "We detected a percussion channel. Melodic features like chord and key detection work best on channels 1-9. You can keep playing — we're listening on all channels."
2. Given the warning is shown, when it includes any call-to-action, then the action is specific and achievable (not vague "switch to melodic")

---

### Story 22.6: Fix First-Run Prompt Timing and MIDI Coordination

**Story ID**: 22.6
**Story Title**: Fix First-Run Prompt Timing and MIDI Coordination
**Story Description**: Fix the race condition where FirstRunPrompt appears before MIDI is connected (telling user to "play your first note" when they can't yet). Coordinate prompt timing with MIDI connection state.

**Findings Covered**: MIDI-C6, NAV-C5

**Context**:

- **Files**: `src/components/first-run-prompt.tsx`, `src/stores/midi-store.ts`
- **Issue**: `FirstRunPrompt` conditions are `!activeSessionId && totalNotesPlayed === 0`, but MIDI may not be connected. Prompt shows "Play your first note" before device is ready. Also: if session starts before prompt renders (race), user never sees onboarding.
- **Impact**: Users see an impossible instruction or miss onboarding entirely.

**Acceptance Criteria**:

1. Given MIDI is not connected, when `FirstRunPrompt` would show, then it displays a MIDI connection step first ("Connect your instrument to get started")
2. Given MIDI connects after the prompt is visible, when connection succeeds, then the prompt transitions to "Play your first note" messaging
3. Given a note is played before the prompt renders (race), when the prompt mounts, then it skips to a brief "Session started!" confirmation instead of showing stale onboarding

---

### Story 22.7: Add Session Expiry UI Response

**Story ID**: 22.7
**Story Title**: Add Session Expiry UI Response
**Story Description**: Render the `sessionExpired` flag as a persistent banner with re-login CTA. Currently the flag is set in the store but no component reads it, causing silent logout mid-session.

**Findings Covered**: SET-C8, MIDI-C17

**Context**:

- **Files**: `src/stores/app-store.ts`, layout components
- **Issue**: `sessionExpired` flag defined in store but never rendered. User is silently logged out. Subsequent API calls fail with 401 and no error message.
- **Impact**: Users lose their session with no explanation and may lose unsaved practice data.

**Acceptance Criteria**:

1. Given `sessionExpired` is true, when the flag is set, then a persistent, non-dismissible banner appears: "Your session has expired. Sign in again to continue."
2. Given the session expiry banner is visible, when the user clicks "Sign in", then they are redirected to login with a return URL to their current page
3. Given a session expires during active practice, when the expiry is detected, then local IndexedDB data is preserved and a message reassures: "Your practice data is saved locally."

---

## Epic 23: Canvas Visualization Overhaul

**Epic ID**: 23
**Epic Title**: Canvas Visualization Overhaul
**Epic Description**: The canvas visualization has multiple critical issues: potentially inverted piano roll mapping, imperceptible feedback elements (timing pulses at 12% opacity, flow glow at 6%, harmonic markers at 4px), color-only chord distinctions, unreadable text, and canvas clearing bugs. This epic makes the primary visual interface functional and readable.
**Source**: VIZ-C1 through VIZ-C8, VIZ HIGH findings, Theme 3
**Priority**: P0 — Launch Blocker
**Dependencies**: None
**Story Count**: 7

### Story 23.1: Verify and Fix Piano Roll Note Mapping Direction

**Story ID**: 23.1
**Story Title**: Verify and Fix Piano Roll Note Mapping Direction
**Story Description**: Audit `noteNumberToY()` mapping — standard piano roll convention is low notes at bottom, high notes at top. If inverted, the entire visualization is backwards from what musicians expect.

**Findings Covered**: VIZ-C1

**Context**:

- **Files**: `src/components/canvas/` (note rendering)
- **Issue**: `noteNumberToY()` maps MIDI note 0 → top, note 127 → bottom. Standard convention is opposite.
- **Impact**: Musicians read the visualization upside-down, undermining the core product value.

**Acceptance Criteria**:

1. Given the piano roll canvas, when notes are rendered, then low notes (C2, MIDI 36) appear at the bottom and high notes (C6, MIDI 84) appear at the top
2. Given a musician plays an ascending scale (C3→C4→C5), when notes appear on canvas, then they visually move upward
3. Given the mapping is changed, when existing replay sessions are played back, then notes render correctly with the new mapping

---

### Story 23.2: Fix Timing Feedback Visibility — Pulses and Flow Glow

**Story ID**: 23.2
**Story Title**: Fix Timing Feedback Visibility — Pulses and Flow Glow
**Story Description**: Increase timing pulse opacity from 0.12 to 0.30+ and flow glow from 0.06 to 0.20+. These feedback elements are currently imperceptible to the human eye.

**Findings Covered**: VIZ-C5, timing pulses (HIGH)

**Context**:

- **Files**: `src/components/canvas/` (timing rendering)
- **Issue**: Flow glow at 6% opacity is invisible. Timing pulses at 12% max opacity are imperceptible. Human eye needs 15-20% minimum.
- **Impact**: The primary positive feedback mechanism (good timing = glow) is invisible.

**Acceptance Criteria**:

1. Given a note is played with good timing, when the flow glow renders, then it is clearly visible at 0.20+ opacity
2. Given timing pulses fire, when they render, then they are clearly visible at 0.30+ opacity with a noticeable size (8px+ radius)
3. Given the user is at arm's length from screen (70/30 attention split), when feedback elements render, then they are perceivable without leaning forward

---

### Story 23.3: Fix Harmonic Overlay Markers and Chord Quality Distinction

**Story ID**: 23.3
**Story Title**: Fix Harmonic Overlay Markers and Chord Quality Distinction
**Story Description**: Increase harmonic markers from 4px to 8px+ with shape distinction (not just opacity). Add non-color chord quality indicators (text labels or shapes) so major/minor/dominant are distinguishable without color.

**Findings Covered**: VIZ-C4, VIZ-C7

**Context**:

- **Files**: `src/components/canvas/` (harmonic overlay, chord rendering)
- **Issue**: Chord-tone vs. passing-tone markers are 4px dots with only opacity difference (0.5 vs 0.3). Chord quality (major/minor/dominant) uses color-only distinction. Both fail for colorblind users (~8% of male users).
- **Impact**: Harmonic information — a core feature — is invisible or inaccessible.

**Acceptance Criteria**:

1. Given harmonic markers render, when displayed on canvas, then chord-tones are 8px+ circles and passing-tones are 8px+ diamonds (shape distinction)
2. Given a chord quality is displayed, when rendered, then it includes a text label ("Maj", "min", "Dom7") in addition to color
3. Given a colorblind user views the canvas, when chord quality is shown, then the distinction is clear without relying on color alone

---

### Story 23.4: Add Chord HUD Empty and Waiting States

**Story ID**: 23.4
**Story Title**: Add Chord HUD Empty and Waiting States
**Story Description**: Before any chord is detected, the Chord HUD returns null (empty space). Add a "waiting for chord..." placeholder state and a clear visual distinction between "no chord yet" and "chord detected."

**Findings Covered**: VIZ-C2, no distinction between states (HIGH)

**Context**:

- **Files**: `src/components/canvas/chord-hud.tsx`
- **Issue**: Before first chord detection, entire HUD area is empty. User doesn't know if the feature is working or broken.
- **Impact**: Users assume chord detection is broken when it's just waiting for input.

**Acceptance Criteria**:

1. Given no chord has been detected yet, when the HUD renders, then it shows a subtle placeholder: "Play a chord..." in muted text
2. Given a chord is detected, when the HUD updates, then a brief highlight animation distinguishes the transition from placeholder to detected chord
3. Given the session has been silent for 30+ seconds after chords were detected, when the HUD would go empty, then it shows the last detected chord in a dimmed state with "(last detected)" label

---

### Story 23.5: Fix Canvas Clearing and Idle Frame Handling

**Story ID**: 23.5
**Story Title**: Fix Canvas Clearing and Idle Frame Handling
**Story Description**: Fix the idle-skip logic that exits before clearing the canvas. When timing pulses or flow glow are active but no notes are playing, canvas shows stale pixels from previous frames.

**Findings Covered**: VIZ-C8

**Context**:

- **Files**: `src/components/canvas/` (render loop)
- **Issue**: `renderNotes()` clears canvas, but idle-skip logic exits BEFORE clearing. Stale pixels persist on screen.
- **Impact**: Canvas shows ghost artifacts that confuse users about what's currently playing.

**Acceptance Criteria**:

1. Given no notes are playing and the idle skip fires, when the render loop executes, then the canvas is cleared before returning
2. Given timing pulses are active with no notes, when rendering, then only the active pulses render on a clean canvas
3. Given a session ends, when the canvas goes idle, then it clears completely with no stale artifacts

---

### Story 23.6: Fix Snapshot and Label Text Readability

**Story ID**: 23.6
**Story Title**: Fix Snapshot and Label Text Readability
**Story Description**: Increase snapshot text from 12px to 16-18px on canvas. Fix note labels (10px too small), chord label collision with high notes, and key display label occluding notes.

**Findings Covered**: VIZ-C6, note label font (MEDIUM), chord label collision (HIGH), key display occlusion (HIGH)

**Context**:

- **Files**: `src/components/canvas/` (text rendering)
- **Issue**: Multiple text elements on canvas are too small to read from playing position (12px snapshot, 10px note labels). Chord label at fixed y=24 collides with high notes. Key display can occlude notes.
- **Impact**: Information rendered on canvas is unreadable at the 70/30 attention split distance.

**Acceptance Criteria**:

1. Given snapshot insights render on canvas, when displayed, then text is 16px minimum and readable from 1 meter away
2. Given note labels render, when displayed, then they are 12px minimum
3. Given chord labels render, when a high note is near y=24, then the label repositions to avoid collision
4. Given key display renders, when it overlaps with active notes, then notes render above the key display (z-order)

---

### Story 23.7: Fix Timing Grid Model and Velocity Rendering

**Story ID**: 23.7
**Story Title**: Fix Timing Grid Model and Velocity Rendering
**Story Description**: Address the retroactive timing grid model (shows where notes landed vs. where they should land). Fix velocity 0 notes rendering at 0.3 opacity (invisible for soft playing). Add session-end canvas feedback.

**Findings Covered**: VIZ-C3, velocity rendering (HIGH), session end blank (HIGH)

**Context**:

- **Files**: `src/components/canvas/` (timing grid, velocity mapping)
- **Issue**: Grid shows where notes landed relative to beats, but beats are determined AFTER notes (retroactive BPM). Users expect upcoming beats. Velocity 0 notes at 0.3 opacity are invisible.
- **Impact**: Timing grid confuses users; soft playing is invisible.

**Acceptance Criteria**:

1. Given the timing grid is visible, when it renders, then it shows predictive beat markers (based on current detected tempo) that the user can play against
2. Given a very soft note (velocity 1-20), when it renders, then it has minimum 0.5 opacity (soft but visible)
3. Given a session ends, when the canvas would go blank, then a fade-out animation plays over 1 second followed by a "Session complete" message

---

## Epic 24: Session Lifecycle & Data Integrity

**Epic ID**: 24
**Epic Title**: Session Lifecycle & Data Integrity
**Epic Description**: Critical session state management issues: session summary doesn't end the session (corrupting analysis with gaps), three stores operate without coordination, audio/MIDI switching loses note state, IndexedDB writes can silently fail, and navigation creates duplicate event handlers.
**Source**: MIDI-C10, MIDI-C11, MIDI-C12, MIDI-C13, MIDI-C14, MIDI-C15, MIDI-C8, MIDI-C16, MIDI-C18, Theme 4
**Priority**: P0 — Launch Blocker
**Dependencies**: None
**Story Count**: 6

### Story 24.1: Fix Session End vs Session Summary Lifecycle

**Story ID**: 24.1
**Story Title**: Fix Session End vs Session Summary Lifecycle
**Story Description**: When `showSessionSummary` fires after 5 minutes of silence, it must also end the session. Currently, dismissing the summary allows more notes to flow into the old session, corrupting analysis with a time gap.

**Findings Covered**: MIDI-C11

**Context**:

- **Files**: `src/stores/session-store.ts`, `src/components/session-summary.tsx`
- **Issue**: `showSessionSummary` fires but does NOT end the session. User dismisses summary, plays more notes, old session absorbs them.
- **Impact**: Session analysis is corrupted with gap periods, making metrics unreliable.

**Acceptance Criteria**:

1. Given a session summary is triggered, when it appears, then the current session is immediately ended and finalized
2. Given the user dismisses the summary and plays more notes, when notes arrive, then a new session is created automatically
3. Given the session summary is displayed, when it shows, then it includes a "Start New Session" CTA button

---

### Story 24.2: Add Multi-Store State Coordination

**Story ID**: 24.2
**Story Title**: Add Multi-Store State Coordination
**Story Description**: Add a coordination layer between the three Zustand stores (midi, session, app) to prevent impossible states during MIDI reconnect, session creation, and mode switching.

**Findings Covered**: MIDI-C10, Theme 4

**Context**:

- **Files**: `src/stores/midi-store.ts`, `src/stores/session-store.ts`, `src/stores/app-store.ts`
- **Issue**: MIDI disconnect/reconnect can cause race condition: session recording continues while MIDI is disconnected, then new events arrive on reconnect with wrong timing context.
- **Impact**: Sessions record invalid data during disconnected periods; state becomes inconsistent.

**Acceptance Criteria**:

1. Given MIDI disconnects, when the event fires, then session recording pauses with a "MIDI disconnected" marker in the timeline
2. Given MIDI reconnects, when the event fires, then session recording resumes with a "reconnected" marker (no gap corruption)
3. Given a mode switch occurs during active recording, when the transition happens, then all three stores transition atomically (no intermediate invalid states)

---

### Story 24.3: Fix Audio-MIDI Switch Note State Loss

**Story ID**: 24.3
**Story Title**: Fix Audio-MIDI Switch Note State Loss
**Story Description**: Fix the bug where switching between audio and MIDI input modes causes audio note-off events to incorrectly remove MIDI notes from `activeNotes`.

**Findings Covered**: MIDI-C12

**Context**:

- **Files**: `src/stores/midi-store.ts`, `src/hooks/use-midi.ts`
- **Issue**: Audio note-off fires during source switch. If MIDI note-on happened first (overlapping), the audio note-off deletes the MIDI note from `activeNotes`.
- **Impact**: Notes visually disappear during input source switching; analysis loses data.

**Acceptance Criteria**:

1. Given a source switch from MIDI to audio, when the switch occurs, then pending MIDI notes in `activeNotes` are preserved (not cleared by audio note-off)
2. Given overlapping note events from different sources, when they arrive, then each source's notes are tracked independently
3. Given a source switch completes, when the new source is active, then only the new source's events affect `activeNotes`

---

### Story 24.4: Add IndexedDB Write Error Handling and Feedback

**Story ID**: 24.4
**Story Title**: Add IndexedDB Write Error Handling and Feedback
**Story Description**: Add error handling to `recordEvent()` and other IndexedDB writes. Show user-facing feedback when writes fail (e.g., quota exceeded). Implement write batching to prevent 100+ writes/second.

**Findings Covered**: MIDI-C13, IndexedDB throttling (HIGH)

**Context**:

- **Files**: `src/lib/dexie-client.ts`, `src/stores/session-store.ts`
- **Issue**: `recordEvent()` is called without await, no `.catch()`. If IndexedDB write fails (quota exceeded), events are silently lost. No throttling on writes (100 events/sec possible).
- **Impact**: Users lose session data without knowing. Storage quota exhaustion goes undetected.

**Acceptance Criteria**:

1. Given an IndexedDB write fails, when the error occurs, then the error is caught and an amber notification appears: "Some practice data couldn't be saved"
2. Given high-frequency note input (>50 notes/sec), when events arrive, then they are batched into 100ms write windows
3. Given storage quota is near capacity, when the threshold is reached (>90%), then a warning appears: "Storage is getting full. Export your data to free space."

---

### Story 24.5: Fix Navigation Duplicate Handlers and Device Hotplug

**Story ID**: 24.5
**Story Title**: Fix Navigation Duplicate Handlers and Device Hotplug
**Story Description**: Fix the bug where browser back button navigation between guest `/play` and auth `/session` creates duplicate MIDI event subscribers. Track device changes during sessions.

**Findings Covered**: MIDI-C14, MIDI-C15

**Context**:

- **Files**: `src/hooks/use-midi.ts`, `src/hooks/use-analysis-pipeline.ts`
- **Issue**: No route change cleanup. Both guest and auth pages call `useMidi()` and `useAnalysisPipeline()`. Navigation creates duplicate subscribers. Device swap during session is silent.
- **Impact**: Duplicate handlers process each MIDI event twice; device swaps create mixed velocity profiles in analysis.

**Acceptance Criteria**:

1. Given the user navigates between routes, when `useMidi()` and `useAnalysisPipeline()` hooks unmount, then all event listeners are properly cleaned up
2. Given the user navigates back, when hooks remount, then only one set of event listeners exists
3. Given a MIDI device is disconnected and a different one connected, when the swap occurs, then a "Device changed" notification appears and the session records a device-change marker

---

### Story 24.6: Fix Migration Indicator and localStorage Safety

**Story ID**: 24.6
**Story Title**: Fix Migration Indicator and localStorage Safety
**Story Description**: Make guest-to-auth data migration visible and robust. Fix `migrationStatus` being set asynchronously (user navigates before indicator mounts). Fix localStorage reads/writes in private browsing mode.

**Findings Covered**: MIDI-C8, MIDI-C16, MIDI-C18

**Context**:

- **Files**: `src/lib/guest-migration.ts`, `src/stores/app-store.ts`
- **Issue**: `migrateGuestData(userId)` runs in background. If user closes browser mid-migration, data is partially synced. `migrationStatus` set async — indicator may never mount. Private mode localStorage resets silently.
- **Impact**: Users lose data during migration; settings reset unexpectedly in private browsing.

**Acceptance Criteria**:

1. Given guest data migration starts, when `migrateGuestData()` is called, then a blocking overlay appears: "Moving your practice data to your account..."
2. Given migration fails or browser closes mid-migration, when the user returns, then migration retries automatically with progress indication
3. Given the user is in private browsing mode, when localStorage fails, then the app detects this and warns: "Private browsing mode — settings won't persist between sessions"

---

## Epic 25: Drill System UX Overhaul

**Epic ID**: 25
**Epic Title**: Drill System UX Overhaul
**Epic Description**: The drill system has critical usability issues: success criteria are hidden during execution, difficulty changes are unexplained, the attempt phase auto-completes silently after 15 seconds, drill creation requires 4+ clicks, instructions disappear after setup, and there's no pause/resume capability.
**Source**: DRILL-C1 through DRILL-C5, DRILL HIGH findings
**Priority**: P0/P1
**Dependencies**: None
**Story Count**: 6

### Story 25.1: Display Success Criteria During Drill Execution

**Story ID**: 25.1
**Story Title**: Display Success Criteria During Drill Execution
**Story Description**: Show `successCriteria` (timing threshold, accuracy target, tempo tolerance) visibly during drill execution. Currently these values exist but are never shown to the user.

**Findings Covered**: DRILL-C1

**Context**:

- **Files**: `src/components/drill/drill-controller.tsx`, `src/components/drill/drill-tracker.tsx`
- **Issue**: Drill has `successCriteria` fields but values are never rendered. User doesn't know what "passing" means.
- **Impact**: Users can't set expectations or understand what they're working toward.

**Acceptance Criteria**:

1. Given a drill is in progress, when the attempt phase is active, then success criteria are visible: "Target: 85% accuracy, ±50ms timing, 90 BPM"
2. Given the user completes a rep, when results show, then each criterion is shown as met/not-yet-met with the actual value vs. target
3. Given criteria are displayed, when the terms are potentially confusing, then tooltips explain each metric in plain language

---

### Story 25.2: Add Difficulty Change Explanations

**Story ID**: 25.2
**Story Title**: Add Difficulty Change Explanations
**Story Description**: When difficulty adjusts between sessions, explain why. Show the reasoning: "Based on your 85% accuracy, we adjusted tempo from 80 to 95 BPM." Fix the decoupling between drill `successCriteria` and difficulty engine thresholds.

**Findings Covered**: DRILL-C2, DRILL-C4

**Context**:

- **Files**: `src/lib/difficulty-engine.ts`, `src/components/drill/`
- **Issue**: No explanation when difficulty changes. Also: drill `successCriteria.accuracyTarget` is independent from difficulty engine's `GROWTH_ZONE.TOO_EASY_THRESHOLD = 0.9`. Two systems disagree.
- **Impact**: Users see harder drills without context; system gives contradictory pass/fail signals.

**Acceptance Criteria**:

1. Given difficulty has changed since last session, when a drill is generated, then a brief explanation appears: "We noticed [specific metric]. Adjusting difficulty to keep you in the growth zone."
2. Given drill `successCriteria` exists, when difficulty engine sets thresholds, then they are derived from the same source (no independent hardcoded values)
3. Given the user asks why a drill is harder/easier, when viewed in drill details, then the specific metrics that triggered the change are listed

---

### Story 25.3: Add Attempt Phase Countdown Timer and Done Button

**Story ID**: 25.3
**Story Title**: Add Attempt Phase Countdown Timer and Done Button
**Story Description**: Add a visible countdown timer during the attempt phase (currently auto-completes silently after 15 seconds). Add a "Done" button for users who finish early. Add a warning at 5 seconds remaining.

**Findings Covered**: DRILL-C5

**Context**:

- **Files**: `src/components/drill/drill-controller.tsx`
- **Issue**: `ATTEMPT_TIMEOUT_MS = 15000` — after 15 seconds, attempt auto-analyzes regardless of whether user started. No countdown, no "Done" button, no warning.
- **Impact**: Users are surprised by auto-completion; can't signal they're done early.

**Acceptance Criteria**:

1. Given the attempt phase starts, when the timer is running, then a visible countdown timer shows remaining seconds
2. Given the countdown reaches 5 seconds, when the warning fires, then an amber flash appears: "5 seconds remaining"
3. Given the user finishes early, when they click "Done" or press Enter, then the attempt phase ends immediately and analysis begins
4. Given the user hasn't started playing, when 15 seconds elapses, then the auto-complete shows: "No notes detected. Try again?" with a retry button

---

### Story 25.4: Streamline Drill Creation Flow

**Story ID**: 25.4
**Story Title**: Streamline Drill Creation Flow
**Story Description**: Reduce drill creation from 4+ clicks (Generate → Preview → Start → Start Drill) to maximum 2 clicks. Combine preview and start into a single step.

**Findings Covered**: Drill creation clicks (HIGH)

**Context**:

- **Files**: `src/components/drill/drill-preview.tsx`, `src/components/drill/drill-controller.tsx`
- **Issue**: Current flow requires: 1) Open drill panel, 2) Click Generate, 3) Wait for preview, 4) Click Start Preview, 5) Click Start Drill. Too many steps.
- **Impact**: Friction discourages drill use; users abandon before starting.

**Acceptance Criteria**:

1. Given the user wants to start a drill, when they click "Generate Drill", then the drill generates AND auto-starts preview in one step
2. Given the preview is playing, when the user is ready, then a single "Start" button begins the attempt phase
3. Given the total flow, when measured, then it requires maximum 2 explicit user clicks from intent to attempt

---

### Story 25.5: Keep Instructions Visible and Add Real-Time Feedback

**Story ID**: 25.5
**Story Title**: Keep Instructions Visible and Add Real-Time Feedback
**Story Description**: Keep drill instructions visible throughout all phases (currently disappear after Setup phase). Add real-time visual feedback during the attempt phase showing whether notes are correct.

**Findings Covered**: Instructions disappear (HIGH), no real-time feedback (HIGH)

**Context**:

- **Files**: `src/components/drill/drill-controller.tsx`, `src/components/drill/drill-tracker.tsx`
- **Issue**: Instructions shown during Setup vanish during Attempt. User must memorize drill content. No indication during playing whether notes are correct.
- **Impact**: Users can't reference instructions while playing; no feedback loop during practice.

**Acceptance Criteria**:

1. Given a drill is in the Attempt phase, when the user is playing, then drill instructions remain visible (collapsed but expandable) at the top of the drill panel
2. Given the user plays a note during a drill attempt, when the note is analyzed, then immediate visual feedback shows: green flash for on-target, amber for close, no flash for off-target
3. Given timing deviation occurs, when it's detected, then a brief indicator shows: "Early" or "Late" near the timing display

---

### Story 25.6: Fix Warm-Up Prompt Timing and Add Drill Pause/Resume

**Story ID**: 25.6
**Story Title**: Fix Warm-Up Prompt Timing and Add Drill Pause/Resume
**Story Description**: Fix the fragile 1500ms hardcoded setTimeout for WarmUpPrompt. Add pause/resume capability during drill execution.

**Findings Covered**: DRILL-C3, drill pause/resume (HIGH)

**Context**:

- **Files**: `src/components/warm-up-prompt.tsx`, `src/components/drill/drill-controller.tsx`
- **Issue**: WarmUpPrompt appears after 1.5s hardcoded delay. If session loads slowly, prompt may not appear. If user plays before 1.5s, dismissed permanently. No pause during drill execution.
- **Impact**: Warm-up prompt is unreliable; users can't pause drills when interrupted.

**Acceptance Criteria**:

1. Given the warm-up prompt should appear, when conditions are met, then it waits for MIDI connection + mode render (event-driven, not setTimeout)
2. Given a drill is in progress, when the user presses Escape or clicks Pause, then the drill timer pauses and a "Paused" overlay appears
3. Given a drill is paused, when the user clicks Resume, then the timer resumes from where it left off

---

## Epic 26: Dashboard & AI Coaching UX

**Epic ID**: 26
**Epic Title**: Dashboard & AI Coaching UX
**Epic Description**: The dashboard creates cognitive overload (12+ sections simultaneously), growth mindset reframes are applied asynchronously (user sees negative language before replacement), chat input overflows on mobile, and key information is buried or missing context.
**Source**: DASH-C1 through DASH-C3, DASH HIGH findings, ENG-C1, Theme 2
**Priority**: P0/P1
**Dependencies**: Epic 22 (error rendering patterns)
**Story Count**: 6

### Story 26.1: Add Progressive Disclosure to Dashboard

**Story ID**: 26.1
**Story Title**: Add Progressive Disclosure to Dashboard
**Story Description**: Redesign the dashboard layout to show 3-4 key metrics above the fold with expandable sections below. Reduce cognitive overload from 12+ simultaneous sections.

**Findings Covered**: DASH-C1

**Context**:

- **Files**: `src/components/dashboard/`, `src/app/(app)/session/page.tsx`
- **Issue**: Dashboard shows 6 data cards + skill radar + difficulty card + achievements + playing style + session stats + progress trends + weekly summary simultaneously. First-time user sees a wall of empty/zero-state components.
- **Impact**: Overwhelms users; important information is lost in visual noise.

**Acceptance Criteria**:

1. Given a user opens the dashboard, when it loads, then the top section shows max 4 key metrics: current session summary, recent achievement, skill snapshot, and AI suggestion
2. Given sections below the fold, when they render, then they are collapsed with clear headers and expand on click
3. Given a first-time user with no data, when the dashboard loads, then only relevant sections show (no empty cards for features they haven't used yet)

---

### Story 26.2: Fix Growth Mindset Streaming — Pre-Filter Before UI

**Story ID**: 26.2
**Story Title**: Fix Growth Mindset Streaming — Pre-Filter Before UI
**Story Description**: Apply growth mindset word replacements BEFORE streaming text to the UI, not after. Currently, users briefly see "wrong" before it's replaced with "developing."

**Findings Covered**: DASH-C3, Theme 2

**Context**:

- **Files**: `src/lib/ai/growth-mindset.ts`, `src/components/chat/ai-chat-panel.tsx`
- **Issue**: AI responses stream to UI first, then growth mindset replacement happens. User sees prohibited words momentarily.
- **Impact**: Directly undermines core value proposition ("amber, not red" / "not yet, not wrong").

**Acceptance Criteria**:

1. Given an AI response streams to the chat, when each token arrives, then growth mindset filtering is applied BEFORE the token is rendered
2. Given the word "wrong" appears in an AI response, when the token is processed, then the user NEVER sees "wrong" — only "developing" (or equivalent)
3. Given the streaming pipeline is modified, when filtering is added, then there is no perceptible increase in latency (<50ms per token)

---

### Story 26.3: Fix Chat Input Overflow and Mobile UX

**Story ID**: 26.3
**Story Title**: Fix Chat Input Overflow and Mobile UX
**Story Description**: Fix chat input textarea that overflows on small viewports. Add max-height constraint, proper scrolling, and mobile-optimized layout.

**Findings Covered**: DASH-C2, timing graph mobile (HIGH)

**Context**:

- **Files**: `src/components/chat/ai-chat-panel.tsx`
- **Issue**: On small viewports, chat input is rendered in a fixed-width column that can overflow or become unusable. No max-height constraint.
- **Impact**: Chat is unusable on mobile/tablet devices.

**Acceptance Criteria**:

1. Given a viewport <768px, when the chat input renders, then it has a max-height of 120px with scroll
2. Given the chat panel on mobile, when it's active, then it takes full viewport width with no horizontal overflow
3. Given the timing graph renders on mobile, when displayed, then it uses a minimum 12px font and contrasting segment colors

---

### Story 26.4: Improve Data Card Values, Empty States, and Streak Messaging

**Story ID**: 26.4
**Story Title**: Improve Data Card Values, Empty States, and Streak Messaging
**Story Description**: Fix truncated data card values (add tooltips), improve empty state messaging to be growth-mindset aligned, and fix streak system's anxiety-based motivation language.

**Findings Covered**: DASH data card truncation (HIGH), empty states (HIGH), ENG-C1

**Context**:

- **Files**: `src/components/dashboard/data-card.tsx`, `src/components/empty-state.tsx`, `src/lib/engagement/streaks.ts`
- **Issue**: Data card values truncated without tooltip. Empty states are demotivating ("No achievements yet. Keep practicing."). Streak system uses obligation language ("Practice today to keep your streak.").
- **Impact**: Information is hidden; messaging contradicts growth mindset philosophy.

**Acceptance Criteria**:

1. Given a data card value is truncated, when the user hovers, then a tooltip shows the full value
2. Given an empty state component renders, when there's no data, then it uses inviting language: "Your first [feature] is waiting. Start playing to see it come alive."
3. Given a streak is at risk, when the message appears, then it uses invitation tone: "Ready for today's session?" instead of "Practice today to keep your streak"
4. Given the achievement gallery on day 1, when it renders, then it shows max 3 "next up" achievements (not 24 locked items)

---

### Story 26.5: Improve Skill Radar, Token Usage, and Difficulty Display

**Story ID**: 26.5
**Story Title**: Improve Skill Radar, Token Usage, and Difficulty Display
**Story Description**: Add axis labels to skill radar chart. Surface token usage in the chat panel (not just settings). Fix difficulty card showing raw parameter names.

**Findings Covered**: Skill Radar (HIGH), Token usage (HIGH), Difficulty card (HIGH)

**Context**:

- **Files**: `src/components/dashboard/skill-radar.tsx`, `src/components/chat/`, `src/components/dashboard/difficulty-card.tsx`
- **Issue**: Skill radar has no axis labels or comparison context. Token usage hidden in Settings only. Difficulty card shows raw names ("tempoVariability").
- **Impact**: Key feedback mechanisms lack context; users can't monitor AI costs.

**Acceptance Criteria**:

1. Given the skill radar chart renders, when displayed, then each axis has a readable label (e.g., "Timing", "Harmony", "Dynamics")
2. Given the user is in a chat session, when tokens are being consumed, then a small counter shows approximate tokens used in the chat panel header
3. Given the difficulty card renders, when showing parameters, then human-readable labels are used ("Tempo Variation" not "tempoVariability")

---

### Story 26.6: Improve AI Chat Error Messages and Feedback

**Story ID**: 26.6
**Story Title**: Improve AI Chat Error Messages and Feedback
**Story Description**: Make AI chat error messages actionable instead of vague ("Try again in a moment"). Fix placeholder text that's misleading about real-time feedback. Improve Studio Engineer icon size.

**Findings Covered**: Chat errors (HIGH), placeholder (HIGH), icon size (HIGH)

**Context**:

- **Files**: `src/components/chat/ai-chat-panel.tsx`
- **Issue**: Error messages lack actionability. Placeholder text implies real-time feedback capability that doesn't exist. Studio Engineer icon at 28px is too small.
- **Impact**: Users don't know how to recover from errors; expectations are set incorrectly.

**Acceptance Criteria**:

1. Given an AI chat error occurs, when the error message shows, then it includes a specific action: "API key may have expired — check Settings" or "Rate limit reached — try again in [countdown]"
2. Given the chat input placeholder, when empty, then it accurately describes capability: "Ask about your playing, request a drill, or get coaching tips"
3. Given the Studio Engineer icon, when displayed, then it is 40px minimum with clear visual identity

---

## Epic 27: Auth & BYOK Settings Overhaul

**Epic ID**: 27
**Epic Title**: Auth & BYOK Settings Overhaul
**Epic Description**: The BYOK onboarding creates insurmountable friction for non-technical users (navigate to provider, create account, find API keys, generate, copy, return, paste — no guidance for any step). Settings page has poor navigation. Auth has missing loading states, no password hints, and duplicate page implementations.
**Source**: SET-C1 through SET-C7, AUTH-C1 through AUTH-C3, AUTH HIGH findings
**Priority**: P0/P1
**Dependencies**: None
**Story Count**: 7

### Story 27.1: Add Step-by-Step BYOK Setup Guide

**Story ID**: 27.1
**Story Title**: Add Step-by-Step BYOK Setup Guide
**Story Description**: Create an inline step-by-step wizard for API key setup. Guide users through: 1) Choose provider, 2) Open provider site (with annotated screenshots), 3) Generate key, 4) Paste key. Replace bare external links.

**Findings Covered**: SET-C2, SET-C3

**Context**:

- **Files**: `src/components/settings/api-key-prompt.tsx`
- **Issue**: Users must navigate to external provider, create account, find API keys section, generate key, copy, return, paste — no inline guidance. "Other Provider" has zero documentation.
- **Impact**: Non-technical musicians abandon at this step — it's the primary conversion killer.

**Acceptance Criteria**:

1. Given a user needs to set up an API key, when they reach the setup screen, then a step-by-step wizard appears with numbered steps
2. Given step 2 (external provider), when the user clicks "Open [Provider]", then a tooltip/overlay shows what to look for on the provider's site
3. Given the "Other Provider" option, when selected, then documentation explains supported providers and where to find API keys
4. Given the setup flow, when completed, then the user doesn't need to leave the wizard (paste field is in the same view)

---

### Story 27.2: Improve API Key Validation Feedback

**Story ID**: 27.2
**Story Title**: Improve API Key Validation Feedback
**Story Description**: Create a clear visual state machine for API key submission: Idle → Submitting → Validating → Active/Error. Distinguish between wrong format, wrong key, and expired key errors.

**Findings Covered**: SET-C1, SET-C4

**Context**:

- **Files**: `src/components/settings/api-key-prompt.tsx`, `src/lib/api-key-validation.ts`
- **Issue**: No visible state transitions after submission. Error messages don't distinguish wrong format vs. wrong key vs. expired. Status badge never updates after initial fetch.
- **Impact**: Users don't know if their key is working or what went wrong.

**Acceptance Criteria**:

1. Given a key is submitted, when each stage completes, then the UI shows: "Checking format..." → "Validating with provider..." → "Active" (with green indicator)
2. Given a key fails format check, when the error shows, then it explains: "API keys from [Provider] start with 'sk-'. Check you copied the full key."
3. Given a key is rejected by the provider, when the error shows, then it distinguishes: "Key not recognized" vs. "Key expired" vs. "Insufficient permissions"
4. Given a key is active, when checked later, then the status badge reflects current state (not stale initial fetch)

---

### Story 27.3: Add Mid-Session Key Expiry Detection

**Story ID**: 27.3
**Story Title**: Add Mid-Session Key Expiry Detection
**Story Description**: Detect API key expiry during active practice sessions instead of only at submission time. Show a non-disruptive notification when the key fails.

**Findings Covered**: SET-C5

**Context**:

- **Files**: `src/lib/api-key-validation.ts`, `src/components/chat/ai-chat-panel.tsx`
- **Issue**: Keys validated only at submission. If key expires during 30-minute practice, AI calls fail silently. `status` is set to 'active' once, never rechecked.
- **Impact**: AI coaching silently stops working mid-session with no explanation.

**Acceptance Criteria**:

1. Given an AI API call fails with auth error, when the failure is detected, then a non-disruptive banner appears: "Your API key may have expired. Update it in Settings to continue coaching."
2. Given the key status changes, when it transitions from active to expired, then the key status badge updates immediately
3. Given key expiry is detected, when the user is in a session, then practice data continues recording (only AI features are affected)

---

### Story 27.4: Redesign Settings Page Navigation

**Story ID**: 27.4
**Story Title**: Redesign Settings Page Navigation
**Story Description**: Add sticky section navigation or table of contents to the settings page. Group sections logically. Remove placeholder "Preferences" section.

**Findings Covered**: SET-C6, Preferences placeholder (MEDIUM)

**Context**:

- **Files**: `src/app/(app)/settings/page.tsx`
- **Issue**: 5 scrollable sections with no navigation. User must scroll to find specific sections. Placeholder "Preferences" wastes space.
- **Impact**: Users can't find settings quickly; page feels unfinished.

**Acceptance Criteria**:

1. Given the settings page loads, when it renders, then a sticky sidebar or top navigation shows all section names
2. Given a section is clicked in the navigation, when it scrolls, then the target section scrolls into view with highlighted indicator
3. Given the "Preferences" section has no content, when the page renders, then it is removed until real preferences exist
4. Given the API Keys section, when accessed, then it is the first/most prominent section (primary user need)

---

### Story 27.5: Add Logout Confirmation Dialog

**Story ID**: 27.5
**Story Title**: Add Logout Confirmation Dialog
**Story Description**: Add a confirmation dialog before logout. Single-click logout in the profile menu has no confirmation — accidental clicks immediately kick user to homepage.

**Findings Covered**: SET-C7

**Context**:

- **Files**: `src/components/sidebar/`, `src/components/profile-menu.tsx`
- **Issue**: Single-click logout with no confirmation. Accidental clicks = immediate logout with no explanation. Sign-out is also 3 clicks deep in sidebar.
- **Impact**: Users accidentally log out and lose their practice context.

**Acceptance Criteria**:

1. Given the user clicks "Sign Out", when the action triggers, then a confirmation dialog appears: "Sign out? Your practice data is saved."
2. Given the confirmation dialog, when the user confirms, then logout proceeds normally
3. Given the confirmation dialog, when the user cancels, then they return to their previous state

---

### Story 27.6: Fix Auth Loading States and Password Hints

**Story ID**: 27.6
**Story Title**: Fix Auth Loading States and Password Hints
**Story Description**: Add loading spinner and disabled state during auth form submission. Add password strength indicator and requirement hints on signup form.

**Findings Covered**: AUTH-C2, AUTH-C3

**Context**:

- **Files**: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`
- **Issue**: No loading spinner or disabled state on form submission — users double-click. No password strength indicator — users get vague server errors on weak passwords.
- **Impact**: Duplicate requests; user frustration on signup.

**Acceptance Criteria**:

1. Given the login form is submitted, when the request is pending, then the submit button shows a spinner and is disabled
2. Given the signup form is active, when the user types a password, then a strength indicator shows: "Weak / Fair / Strong" with requirements listed
3. Given a weak password is entered, when the user tries to submit, then client-side validation blocks with specific feedback ("Must be 8+ characters with a number")

---

### Story 27.7: Resolve Duplicate Auth Pages and Improve Auth UX

**Story ID**: 27.7
**Story Title**: Resolve Duplicate Auth Pages and Improve Auth UX
**Story Description**: Remove duplicate auth page implementations. Improve email validation, add "Forgot Password" visibility, and improve guest-to-auth conversion flow.

**Findings Covered**: AUTH-C1, AUTH-H1, AUTH-H2, AUTH-H4

**Context**:

- **Files**: `src/app/(auth)/`, `src/app/auth/`
- **Issue**: Two separate sets of auth pages exist. One may be stale. Email validation only checks for `@`. "Forgot Password" link buried below fold. Guest-to-auth conversion is jarring.
- **Impact**: Maintenance confusion; poor auth UX for new users.

**Acceptance Criteria**:

1. Given two auth page directories exist, when audited, then the stale/duplicate set is removed
2. Given email validation, when the user enters an email, then domain validation checks for valid format (user@domain.tld)
3. Given the login page, when rendered, then "Forgot Password" is visible without scrolling
4. Given a guest converts to a registered user, when the transition occurs, then a brief animation and message explain: "Creating your account and migrating your practice data..."

---

## Epic 28: Navigation & Layout Fixes

**Epic ID**: 28
**Epic Title**: Navigation & Layout Fixes
**Epic Description**: Z-index collisions between sidebar/overlays/modals, duplicate `<main>` elements, StatusBar remounting on mode switch, keyboard shortcuts firing in text inputs, and return session banner context issues.
**Source**: NAV-C1 through NAV-C4, NAV HIGH findings
**Priority**: P1
**Dependencies**: Epic 22 (StatusBar changes)
**Story Count**: 5

### Story 28.1: Fix Z-Index Collisions and Overlay Stacking

**Story ID**: 28.1
**Story Title**: Fix Z-Index Collisions and Overlay Stacking
**Story Description**: Fix z-index collisions between StatusBar (z-40), sidebar (z-30), overlays (z-50), banners, and modals. Add collision detection between ReturnSessionBanner and WarmUpPrompt.

**Findings Covered**: NAV-C1, NAV-C2

**Context**:

- **Files**: `src/components/status-bar.tsx`, `src/components/sidebar/`, overlay/modal components
- **Issue**: Overlapping z-indices cause rendering order bugs. ReturnSessionBanner and WarmUpPrompt can both appear simultaneously.
- **Impact**: UI elements render in wrong order; users see stacked conflicting overlays.

**Acceptance Criteria**:

1. Given all overlapping UI layers, when rendered simultaneously, then each has a unique z-index with clear hierarchy: modals > overlays > banners > status bar > sidebar > content
2. Given ReturnSessionBanner and WarmUpPrompt would both show, when the condition occurs, then only one shows (ReturnSessionBanner takes priority)
3. Given the z-index scale, when documented, then a comment in a shared constants file lists all z-index values

---

### Story 28.2: Fix Duplicate Main Elements and Shared StatusBar

**Story ID**: 28.2
**Story Title**: Fix Duplicate Main Elements and Shared StatusBar
**Story Description**: Remove duplicate `id="main-content"` / `<main>` elements. Refactor StatusBar to be rendered once in the shared layout instead of per-mode (preventing flash on mode switch).

**Findings Covered**: NAV-C3, NAV-C4

**Context**:

- **Files**: `src/components/silent-coach/`, `src/components/layouts/`, status bar components
- **Issue**: SilentCoach has its own `<main>` while AuthLayout provides another. StatusBar is rendered per-mode — unmounts/remounts on switch causing flash.
- **Impact**: Invalid HTML; StatusBar flashes during mode transitions.

**Acceptance Criteria**:

1. Given the app layout, when rendered, then only one `<main>` element exists in the DOM
2. Given the StatusBar component, when modes switch, then StatusBar remains mounted (no unmount/remount flash)
3. Given the StatusBar is shared, when different modes need different status content, then content updates reactively without component remounting

---

### Story 28.3: Fix Keyboard Shortcut Suppression in Text Inputs

**Story ID**: 28.3
**Story Title**: Fix Keyboard Shortcut Suppression in Text Inputs
**Story Description**: Suppress keyboard shortcuts (Alt+1/2/3 for mode switching) when the user is typing in a textarea, input, or contenteditable element.

**Findings Covered**: Keyboard shortcuts in text inputs (HIGH)

**Context**:

- **Files**: `src/hooks/use-keyboard-shortcuts.ts` or keyboard handler
- **Issue**: Alt+1/2/3 keyboard shortcuts fire even when user is typing in chat textarea. Typing causes unexpected mode switches.
- **Impact**: Users accidentally switch modes while typing messages to the AI.

**Acceptance Criteria**:

1. Given the user is focused on a text input/textarea, when they press Alt+1/2/3, then the keyboard shortcut is suppressed
2. Given the user is focused on any `<input>`, `<textarea>`, or `[contenteditable]` element, when any app-level shortcut fires, then it is suppressed
3. Given the user tabs away from a text input, when they press a shortcut, then it fires normally

---

### Story 28.4: Improve Sign-Out Discoverability and Audio Mode Banner

**Story ID**: 28.4
**Story Title**: Improve Sign-Out Discoverability and Audio Mode Banner
**Story Description**: Make sign-out more discoverable (currently 3 clicks deep in sidebar). Add actionable "Exit Audio Mode" button to the audio mode banner.

**Findings Covered**: Sign-out discoverability (HIGH), audio mode banner (HIGH)

**Context**:

- **Files**: `src/components/sidebar/`, audio mode banner component
- **Issue**: Sign-out is buried 3 clicks deep. Audio mode banner informs but has no action button.
- **Impact**: Users can't find logout; can't easily exit audio mode.

**Acceptance Criteria**:

1. Given the sidebar is open, when the user looks for sign-out, then it is visible at the bottom of the sidebar without expanding a sub-menu
2. Given the audio mode banner is visible, when the user wants to switch back, then a "Switch to MIDI" button is in the banner
3. Given the user clicks "Switch to MIDI", when the action fires, then the app attempts MIDI reconnection

---

### Story 28.5: Fix Return Session Banner and Mode Transition Feedback

**Story ID**: 28.5
**Story Title**: Fix Return Session Banner and Mode Transition Feedback
**Story Description**: Fix ReturnSessionBanner appearing in wrong contexts (e.g., during replay). Add visual feedback during mode transitions. Fix banner not dismissing on keyboard input.

**Findings Covered**: Return banner context (HIGH), banner keyboard dismiss (HIGH), mode transitions (MEDIUM)

**Context**:

- **Files**: `src/components/return-session-banner.tsx`, mode components
- **Issue**: Banner can appear during replay (wrong context). Only dismisses on MIDI, not keyboard. No visual feedback when modes switch.
- **Impact**: Banner shows at wrong times; mode switches feel abrupt.

**Acceptance Criteria**:

1. Given the user is in Replay mode, when the return session banner would show, then it is suppressed
2. Given the return session banner is visible, when the user presses any key, then it can be dismissed (not just MIDI)
3. Given a mode switch occurs, when the transition happens, then a brief fade animation (200ms) provides visual continuity

---

## Epic 29: Replay, Engagement & Design Polish

**Epic ID**: 29
**Epic Title**: Replay, Engagement & Design Polish
**Epic Description**: Invalid session IDs in replay crash/blank, deleted sessions during playback are unhandled, achievement gallery overwhelms on day 1, design system has hardcoded hex colors and border radius violations, and responsive breakdowns occur on mobile.
**Source**: REPLAY-C1 through REPLAY-C4, REPLAY HIGH, ENG findings, DS-C1, DS-C2, Theme 5
**Priority**: P1/P2
**Dependencies**: Epics 23, 26 (design patterns established)
**Story Count**: 6

### Story 29.1: Add Replay Error Recovery and Edge Case Handling

**Story ID**: 29.1
**Story Title**: Add Replay Error Recovery and Edge Case Handling
**Story Description**: Handle invalid session IDs (show error + redirect), deleted sessions during playback (graceful stop + message), and 0-duration sessions (prevent divide-by-zero).

**Findings Covered**: REPLAY-C1, REPLAY-C2, REPLAY-C4

**Context**:

- **Files**: `src/app/(app)/replay/`, `src/components/replay/`
- **Issue**: Invalid session ID = blank screen/crash. Deleted session during playback = crash or stale data. 0-duration = divide-by-zero.
- **Impact**: Replay mode is fragile — edge cases crash the app.

**Acceptance Criteria**:

1. Given an invalid session ID in the URL, when the replay page loads, then an error message appears with a "Back to Sessions" link
2. Given a session is deleted during active playback, when deletion occurs, then playback stops with: "This session is no longer available"
3. Given a session has 0 duration, when the timeline renders, then it shows "Empty session" instead of a broken scrubber

---

### Story 29.2: Fix Replay Timestamp Alignment and Chat Context

**Story ID**: 29.2
**Story Title**: Fix Replay Timestamp Alignment and Chat Context
**Story Description**: Make the replay timestamp more visible (currently 10px and easy to miss). Indicate which chat messages are from replay context vs. current. Fix replay loading state.

**Findings Covered**: REPLAY-C3, replay chat context (HIGH), loading state (HIGH)

**Context**:

- **Files**: `src/components/replay/`, `src/components/chat/`
- **Issue**: Timestamp shown at 10px is easy to miss. User asks AI about "wrong" moment not realizing the timestamp context. No loading skeleton for session list.
- **Impact**: Users get confused about temporal context in replay; loading feels broken.

**Acceptance Criteria**:

1. Given the replay is playing, when the timestamp displays, then it is 14px minimum with a prominent position (not tucked in a corner)
2. Given a chat message in replay mode, when it references the playback position, then the timestamp context is visible: "Asking about 2:30"
3. Given the session list is loading, when data is being fetched, then a skeleton loading animation appears

---

### Story 29.3: Improve Achievement Gallery and Progress Feedback

**Story ID**: 29.3
**Story Title**: Improve Achievement Gallery and Progress Feedback
**Story Description**: Fix achievement gallery showing 24 locked items on day 1. Extend achievement toast from 4s to 8s. Improve personal record terminology and progress trend actionability.

**Findings Covered**: Achievement gallery (HIGH), toast duration (HIGH), personal records (HIGH), progress trends (MEDIUM)

**Context**:

- **Files**: `src/components/achievements/`, `src/components/progress/`
- **Issue**: 24 locked achievements on day 1 overwhelms. 4-second toast auto-dismisses (user focused on instrument). Personal records use vague terminology.
- **Impact**: Achievement system demotivates instead of motivates; progress feedback is not actionable.

**Acceptance Criteria**:

1. Given a new user opens the achievement gallery, when it renders, then only 3-5 "next up" achievements show with clear unlock conditions
2. Given an achievement is earned, when the toast appears, then it persists for 8 seconds with a "View" button
3. Given personal records display, when shown, then they use specific language: "Solid Tempo — 85% timing accuracy at 120 BPM" (not vague "Clean Tempo")
4. Given progress trend insights, when shown, then they include an action: "Timing peaked at 94% Tuesday — try extending that to scales" (not just "Timing peaked Tuesday at 94%")

---

### Story 29.4: Fix Hardcoded Colors and Design System Violations

**Story ID**: 29.4
**Story Title**: Fix Hardcoded Colors and Design System Violations
**Story Description**: Replace hardcoded hex colors in 6+ components with CSS custom properties. Fix `rounded-full` border radius violation in data card. Fix inline RGBA colors.

**Findings Covered**: DS-C1, DS-C2, inline RGBA (HIGH)

**Context**:

- **Files**: `chord-hud.tsx`, `chord-progression-strip.tsx`, `chord-diagram.tsx`, `scale-display.tsx`, `ai-coaching-preview.tsx`, `mock-visualization.tsx`, `data-card.tsx`
- **Issue**: 6+ components bypass Tailwind with hardcoded hex (#7CB9E8, #E8C77B, etc.). `rounded-full` in data-card violates 0px border radius mandate. Inline RGBA in chord-hud bypasses design system.
- **Impact**: Design system is inconsistent; theme changes require touching 40+ hardcoded values.

**Acceptance Criteria**:

1. Given hardcoded hex colors, when replaced, then all use CSS custom properties or Tailwind design tokens
2. Given `rounded-full` in data-card, when fixed, then it uses `rounded-none` per design mandate
3. Given inline RGBA colors, when replaced, then they use Tailwind opacity utilities or CSS custom properties
4. Given the design system, when audited after changes, then color compliance is 95%+ (up from 70%)

---

### Story 29.5: Fix Responsive Breakdowns Across Viewports

**Story ID**: 29.5
**Story Title**: Fix Responsive Breakdowns Across Viewports
**Story Description**: Fix status bar, canvas legend, timing graphs, drill panels, and dashboard cards at <768px viewports. Ensure key feedback (detected key, tempo) is visible on mobile.

**Findings Covered**: Theme 5, responsive issues across areas

**Context**:

- **Files**: Status bar, canvas legend, timing graph, drill panel, dashboard card components
- **Issue**: Multiple components break at small viewports. Key/tempo feedback hidden on mobile. StatusBar timer can't be hidden.
- **Impact**: Mobile users (tablets, small laptops) have degraded experience.

**Acceptance Criteria**:

1. Given a viewport <768px, when the status bar renders, then all critical information (MIDI status, session time, detected key) remains visible with responsive layout
2. Given a viewport <768px, when the canvas legend renders, then it collapses to icon-only mode
3. Given a viewport <768px, when dashboard cards render, then they stack vertically with full-width layout
4. Given a viewport <768px, when timing graphs render, then they use larger text (12px min) and simplified layout

---

### Story 29.6: Improve Replay Export, Session History, and Multiple Provider UX

**Story ID**: 29.6
**Story Title**: Improve Replay Export, Session History, and Multiple Provider UX
**Story Description**: Add ability to export/share replay sessions. Fix session history pagination scroll position. Improve multiple API provider UX in settings (currently confusing when both OpenAI + Anthropic are saved).

**Findings Covered**: Export/share replay (HIGH), pagination scroll (HIGH), multiple provider UX (HIGH), profile editing (HIGH)

**Context**:

- **Files**: `src/components/replay/`, `src/components/settings/`
- **Issue**: No export/share for replays. Session history pagination loses scroll position. Multiple provider UI only shows first key. Profile is read-only.
- **Impact**: Users can't share progress; settings UX is confusing with multiple providers.

**Acceptance Criteria**:

1. Given a replay session, when the user wants to share, then an "Export" button generates a shareable summary (not full MIDI data)
2. Given session history pagination, when the user navigates pages, then scroll position is preserved
3. Given multiple API keys are saved, when the settings page renders, then all providers are listed with active/inactive status and a clear "Default" indicator
4. Given the profile section, when displayed, then the user can edit their display name

---

## Summary

### Total Story Count by Priority

| Priority            | Epics      | Stories |
| ------------------- | ---------- | ------- |
| P0 (Launch Blocker) | 22, 23, 24 | 20      |
| P0/P1               | 25, 26, 27 | 19      |
| P1                  | 28         | 5       |
| P1/P2               | 29         | 6       |
| **Total**           | **8**      | **50**  |

### Recommended Sprint Order

1. **Sprint 1** (P0): Epics 22, 23, 24 in parallel — Error visibility, canvas fixes, session lifecycle
2. **Sprint 2** (P0/P1): Epics 25, 26, 27 in parallel — Drill UX, dashboard, auth/settings
3. **Sprint 3** (P1): Epic 28 — Navigation/layout
4. **Sprint 4** (P1/P2): Epic 29 — Polish and design system

### Key Cross-References

- `adversarial-ux-review-2026-02-16.md` — Full review with all ~355 findings
- `code-review-findings-epics-8-11.md` — Previous code review (some overlap with security findings)
- `epics-18-21.md` — Previous remediation (some findings may already be addressed)

> **Note**: Some findings from this UX review may overlap with fixes already implemented in Epics 18-21 (code review remediation). During implementation, verify each finding against current codebase state before making changes.
