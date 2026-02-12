---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
classification:
  projectType: 'web_app'
  domain: 'edtech'
  complexity: 'medium'
  projectContext: 'greenfield'
inputDocuments:
  - '_bmad-output/planning-artifacts/product-brief-Minstrel-2026-02-09.md'
  - '_bmad-output/brainstorming/brainstorming-session-2026-02-09.md'
workflowType: 'prd'
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 1
  projectDocs: 0
  projectContext: 0
status: complete
completedDate: 2026-02-12
---

# Product Requirements Document - Minstrel

**Author:** Melchizedek
**Date:** 2026-02-09
**Status:** Complete

Minstrel is an AI-powered real-time MIDI practice companion that transforms any laptop into an intelligent music coach. It connects to any MIDI instrument via the Web MIDI API, listens to every note in real time, analyzes playing across notes, chords, timing, and feel, and delivers personalized challenges and drills to keep musicians growing. The experience is ear-first (no sheet music), dynamically generated (no pre-built curriculum), and deeply personal (no social features, no competition).

**Core Differentiator:** The Difficulty Engine — a unified AI system that governs all challenge levels in real time, keeping every player at their exact growth edge. Combined with bidirectional MIDI (input analysis + demonstration playback through the user's instrument), session-aware AI coaching, and an ear-first philosophy that competitors cannot bolt onto existing sheet-music architectures.

**Target Users:** Self-taught beginners and intermediate players hitting plateaus, across any MIDI instrument (primarily piano/keyboard and guitar).

**Business Model:** Free with BYOK (Bring Your Own Key) — users provide their own LLM API keys. Payment features deferred to a future phase.

**Platform:** Browser-based web application using Web MIDI API.

---

## Success Criteria

### User Success

| Criteria | Measurement | Target |
|----------|------------|--------|
| **Measurable Skill Improvement** | Accuracy, speed, and complexity tracked over time | Statistically significant improvement within 30 days of regular use |
| **Practice Habit Formation** | Sessions per week for active users | 3+ sessions per week |
| **Breakthrough Milestones** | First improv, first song by ear, first clean speed run | At least 1 breakthrough per user per month |
| **Session Completion** | % of started sessions not abandoned | >80% completion rate |
| **Aha Moment Reach** | % of new users receiving real-time feedback in first session | >90% within first session |

**The moment users feel Minstrel is "worth it":** When they play something, Minstrel shows them a mistake they didn't hear, and then generates a drill that fixes it in 2 minutes. That's when they know this is different.

### Business Success

| Timeline | Metric | Target |
|----------|--------|--------|
| **3 months** | Registered users | 500+ |
| **6 months** | Organic referral rate | >20% |
| **6 months** | Net Promoter Score | >50 |
| **12 months** | Weekly Active Users | 10,000+ |
| **12 months** | Weekly retention rate | >70% |

**Business model:** Free with BYOK (Bring Your Own Key). All features available to all users. Users provide their own LLM API keys (OpenAI, Anthropic, etc.) to power AI coaching and drill generation. Monetization (subscriptions, managed API access) deferred to a future phase.

### Technical Success

| Criteria | Target | Rationale |
|----------|--------|-----------|
| **MIDI-to-feedback latency** | <50ms | Must feel instantaneous — any perceptible delay breaks the real-time experience |
| **Application uptime** | 99.5% | Musicians practice at unpredictable hours — downtime kills habit |
| **Initial page load** | <3 seconds | Zero friction between "I want to practice" and playing the first note |
| **MIDI connection time** | <2 seconds | Plug in and go — no configuration screens or setup wizards |
| **AI response time** | <1 second | Chat responses and drill generation must feel conversational, not queued |
| **Session recording reliability** | 100% | Every note must be captured — lost data destroys trust |

### Measurable Outcomes

**Leading indicators (early signals):**
- Day 7 retention >40% (strongest predictor of long-term engagement)
- Drill completion rate >60% (drills are relevant and well-calibrated)
- AI chat engagement >30% (users trust the coaching)

**Critical quality gate:** The Difficulty Engine must be *perfect* at launch. If challenge calibration is off — too easy or too hard — the core value proposition fails. All other features can iterate; this one cannot ship "good enough."

---

## Product Scope

### MVP - Minimum Viable Product

1. **MIDI + Basic Audio Engine (Bidirectional)** — input capture + MIDI output demonstration playback
2. **Real-Time Analysis** — note/chord/progression detection, timing, harmonic analysis, genre-aware context
3. **The Difficulty Engine** — unified adaptive challenge system (MUST BE PERFECT)
4. **AI Drill Generation + MIDI Demonstration** — custom exercises from mistakes, demonstrated through instrument speakers
5. **AI Coaching Chat** — session-aware, genre-aware conversational AI
6. **Three Interaction Modes** — Silent Coach, Dashboard + Chat, Replay Studio
7. **Session Structure** — freeform play, micro-sessions, warm-ups, personal records
8. **Engagement & Habit Building** — streaks, XP, achievements, progress data
9. **Web Platform** — browser-based via Web MIDI API

### Growth Features (Post-MVP)

**v2 — Monetization & Creative Companion:**
- Premium subscription model (managed API access, freemium tiers)
- Payment processing integration
- Song completion engine
- Style transfer
- Style DNA Profile
- Advanced audio analysis (full articulation, tone, vibrato)
- Skill trees (visual branching progression)
- Margin Notes interaction mode

### Vision (Future)

**v3 — The Intelligent Studio:**
- AI jam partner (reactive backing tracks)
- Composition scratchpad
- Advanced analytics (millisecond-level timing, harmonic tendency mapping)
- Multi-instrument session support

**Long-term:** The universal practice companion for every instrumentalist.

---

## User Journeys

### Journey 1: Jake — First Session (Happy Path)

**Opening Scene:** Jake, 17, has been teaching himself guitar from YouTube for 8 months. He can strum open chords and play a few riffs, but he's hit a wall. He googled "why am I not improving at guitar" and found Minstrel recommended in a Reddit thread. He bought a cheap MIDI keyboard adapter for his guitar last week.

**Rising Action:**
1. Jake opens Minstrel in Chrome. No account creation — just "Plug in your MIDI device." He connects his guitar adapter. Green light: "Connected — start playing whenever you're ready."
2. He noodles around for 2 minutes — some chord progressions he knows, a riff from a song he's learning. Minstrel is silent. The Silent Coach shows a subtle real-time visualization — notes lighting up, a timing pulse.
3. After 2 minutes, Minstrel presents a **Session Snapshot**: "You played in C major, used 4 chords (C, Am, F, G), timing accuracy 73%, average tempo 95 BPM." Below that, a **Key Insight**: "Your chord transitions from C to Am are slow — the gap averages 400ms. Want a 30-second drill to smooth that out?"
4. Jake taps yes. Minstrel plays the drill through his guitar's speaker first — **Demonstrate** — he hears how the transition should sound. Then: "Now you try." He plays it. Minstrel shows his gap dropping from 400ms to 280ms in real time.

**Climax:** Jake sees his transition speed improving with each rep. After 5 attempts, Minstrel says: "280ms → 180ms. That's a 55% improvement in 2 minutes. Not yet perfect — but you're getting there fast."

**Resolution:** Jake plays for 15 more minutes. He gets a streak badge: "Day 1 — you started." He closes the laptop thinking: "I actually got better at something specific today." He comes back tomorrow.

**Requirements Revealed:** MIDI connection auto-detection, free play mode, session snapshot, key insight engine, drill generation, MIDI demonstration playback, real-time progress visualization, streak system, growth mindset language.

---

### Journey 2: Aisha — Regular Tuesday Session (Happy Path)

**Opening Scene:** Aisha, 28, classically trained pianist. She's been using Minstrel for 2 weeks. She knows theory but can't improvise. It's 8pm Tuesday — she has 25 minutes before dinner.

**Rising Action:**
1. Aisha opens Minstrel. It remembers her: "Welcome back, Aisha. Ready to warm up?" An auto-generated 2-minute warm-up begins — scale patterns in the key she was working in yesterday, progressively faster. Minstrel demonstrates each pattern through her piano's speakers first, then she plays.
2. Warm-up done. Minstrel transitions: "Yesterday you were working on ii-V-I voicings and your voice leading between the ii and V had some parallel fifths. Here's a targeted drill." It demonstrates the voicing through her speakers — smooth voice leading — then she plays.
3. After 5 minutes of drilling, Minstrel reports: "Voice leading accuracy up from 60% to 82% this week." Then it shifts: "Freeform time — try improvising over this ii-V-I progression. I'll listen." She improvises. The Silent Coach shows chord tones vs. passing tones in real time.
4. She pauses and types: "Why did that last phrase sound so jazzy?" Minstrel responds: "You used a b9 over the V chord — that's a common bebop tension. It resolved nicely to the root of the I. Want to explore more altered dominant tensions?"

**Climax:** Aisha realizes she just improvised something that sounded genuinely jazzy — and she understands *why* it worked. Theory and playing clicked together for the first time.

**Resolution:** Session complete. Achievement unlocked: "First Altered Dominant." Her weekly progress shows improv confidence growing. She's not just playing notes anymore — she's making music.

**Requirements Revealed:** Session continuity/memory, auto-generated warm-ups, personalized drill sequencing, MIDI demonstration, voice leading analysis, freeform mode, real-time harmonic overlay, AI chat mid-session, genre-specific musical knowledge, achievement system, weekly progress tracking.

---

### Journey 3: Jake — MIDI Connection Failure (Edge Case)

**Opening Scene:** Jake plugs in his MIDI adapter. Nothing happens. No green light. Minstrel shows: "No MIDI device detected."

**Rising Action:**
1. Minstrel doesn't leave Jake stranded. It immediately shows: "Troubleshooting — let's get you connected." Step 1: "Is your device powered on and plugged into USB?" Step 2: "Try a different USB port." Step 3: "Check if your browser has MIDI permissions (here's how)."
2. Jake follows step 2 — different USB port. Still nothing. Minstrel detects the device is sending on MIDI channel 10 (drums). It suggests: "I see a MIDI signal on channel 10 — this is usually set for drums. Your instrument might need to be set to channel 1. Here's how to check."
3. Jake changes the channel. Green light. "Connected — you're good to go."

**Alternative path:** If nothing works after troubleshooting, Minstrel offers: "Can't connect? You can still use Minstrel with your laptop mic — I'll listen to your audio instead. It's less precise but still useful." Graceful degradation to audio-only mode.

**Resolution:** Jake is playing within 3 minutes of hitting the problem. He never had to leave the app, open a help desk, or search a forum.

**Requirements Revealed:** MIDI device detection and diagnostics, step-by-step troubleshooting UI, MIDI channel detection, browser permission guidance, graceful degradation to audio-only mode, zero-external-support troubleshooting.

---

### Journey 4: API Key Setup (BYOK Onboarding)

**Opening Scene:** A new user has been playing in guest mode for a few sessions — MIDI analysis and visualization work perfectly without an account. They want AI coaching and drill generation. Minstrel prompts: "To unlock AI features, connect your LLM API key."

**Rising Action:**
1. The user creates an account (email + password). Minstrel immediately shows Settings → API Keys.
2. They select their LLM provider (OpenAI, Anthropic, etc.) and paste their API key. Minstrel validates the key in real time — green checkmark: "Connected. AI features are ready."
3. They return to their session. The AI coaching chat is now live. They play something and ask "What went wrong?" — Minstrel responds with grounded, session-aware analysis. Drill generation works. The full experience is unlocked.

**Climax:** The user realizes the full Minstrel experience is available — no trial limits, no feature gates, no subscription pressure. They own their setup.

**Resolution:** The user practices with full AI coaching. Their API key usage is transparent — Minstrel shows estimated token usage per session so there are no surprises. They come back daily because the product delivers value without friction.

**Requirements Revealed:** LLM API key management UI, multi-provider support, real-time key validation, token usage transparency, graceful degradation when no API key is configured (MIDI analysis works, AI features show "connect API key" prompt), secure API key storage.

---

### Journey Requirements Summary

| Capability Area | Revealed By | Priority |
|----------------|-------------|----------|
| MIDI auto-detection & diagnostics | Journey 3 | Critical |
| Free play + session snapshot | Journey 1 | Critical |
| Key insight engine | Journey 1 | Critical |
| AI drill generation + MIDI demo | Journeys 1, 2 | Critical |
| Silent Coach real-time visualization | Journeys 1, 2 | Critical |
| AI coaching chat | Journey 2 | Critical |
| Session continuity/memory | Journey 2 | High |
| Auto-generated warm-ups | Journey 2 | High |
| Freeform mode | Journey 2 | High |
| Backing tracks for improvisation practice | Journey 2 | Post-MVP (Phase 3) |
| Streak & achievement system | Journeys 1, 2 | High |
| Progress tracking & history | Journeys 2, 4 | High |
| LLM API key management | Journey 4 | High |
| Multi-provider LLM support | Journey 4 | High |
| Token usage transparency | Journey 4 | Medium |
| Troubleshooting UI | Journey 3 | Medium |
| Audio-only fallback mode | Journey 3 | Medium |

---

## Domain-Specific Requirements

Minstrel operates in the **EdTech domain** (medium complexity). While it is not a formal educational institution, it functions as a learning platform and must address key EdTech concerns.

### Privacy & Data Protection

- **COPPA Consideration:** Minstrel's target audience includes users as young as 15. If users under 13 are permitted, COPPA compliance is required (verifiable parental consent, data minimization for minors). MVP recommendation: set minimum age at 13 and implement age-gating at account creation.
- **FERPA:** Not directly applicable — Minstrel is not an educational institution and does not integrate with school systems. No FERPA obligations at MVP.
- **GDPR/Data Privacy:** Users in the EU require consent-based data collection, right to data export, and right to deletion. All session data, progress history, and AI interaction logs are personal data.
- **Data Minimization:** Collect only what's necessary for the practice experience. MIDI data, session recordings, and progress metrics are core. No location data, no contact lists, no unnecessary personal information.

### Accessibility

- **WCAG 2.1 AA Compliance:** All non-audio interface elements must meet WCAG 2.1 AA standards — color contrast, keyboard navigation, screen reader support for text-based features.
- **Audio-Dependent Nature:** Minstrel is inherently audio/music-focused. Full accessibility for hearing-impaired users is not feasible for the core experience. Visual feedback (note display, timing visualization) serves as a partial complement.
- **Motor Accessibility:** The primary interaction is playing a musical instrument — motor accessibility limitations are inherent to the domain, not the software.

### Content Safety

- **AI-Generated Content:** All AI coaching responses, drill instructions, and chat outputs must be appropriate and constructive. Growth mindset framing ("not yet" instead of "wrong") is built into the AI personality.
- **No User-Generated Content:** Minstrel has no social features, no user profiles visible to others, and no content sharing. Content moderation risk is minimal.

### Age Verification

- Implement age-gating at account creation (minimum age 13).
- No identity verification required — self-declared age is sufficient for MVP.
- If under-13 access is considered post-MVP, implement COPPA-compliant parental consent flow.

---

## Innovation & Novel Patterns

### Detected Innovation Areas

Minstrel contains three genuinely novel patterns that differentiate it from all existing music education tools:

**1. The Difficulty Engine — Unified Adaptive Challenge**
No existing music education platform has a single AI system governing all challenge levels in real time across the entire experience. Competitors use per-lesson or per-module static difficulty. Minstrel's Difficulty Engine is a living intelligence that knows the player's exact growth edge across every dimension (tempo, harmonic complexity, rhythmic difficulty, genre context) and adjusts continuously. This is analogous to adaptive learning algorithms in EdTech (e.g., Knewton, DreamBox) but applied to real-time musical performance — a domain where adaptation must happen in milliseconds, not between sessions.

**2. Ear-First Architecture**
Every competitor (Yousician, Simply Piano, Melodics, Flowkey) is built on a sheet-music-first architecture — the user reads notation and the system checks if they played it correctly. Minstrel inverts this entirely: the system listens to unstructured playing and provides analysis. This is not a feature toggle — it requires fundamentally different UX patterns, data models, and AI training. Competitors cannot bolt this onto existing architectures.

**3. Bidirectional MIDI Demonstration**
Using MIDI output to play demonstrations through the user's own instrument speakers is novel in the practice companion space. The Demonstrate → Listen → Attempt → Analyze loop creates a unique learning flow where the user hears the target sound from their own instrument, not from a recording. This reduces the cognitive gap between "what it should sound like" and "what my instrument sounds like."

### Validation Approach

| Innovation | Validation Method | Success Signal |
|-----------|-------------------|---------------|
| **Difficulty Engine** | A/B test adaptive vs. static difficulty with early users | Higher drill completion rate and lower session abandonment in adaptive group |
| **Ear-First Architecture** | User testing with beginners — can they use the product without any notation? | >90% of first-time users complete their first session without requesting sheet music |
| **Bidirectional MIDI Demo** | Compare learning speed with MIDI demo vs. audio recording demo | Measurable improvement in drill accuracy when demonstration is via MIDI output |

### Risk Mitigation

| Innovation | Risk | Mitigation |
|-----------|------|-----------|
| **Difficulty Engine** | Calibration is off — too easy or too hard | Extensive testing with diverse skill levels before launch. Implement manual difficulty override as safety valve. This is the critical quality gate. |
| **Ear-First Architecture** | Users expect sheet music and feel lost without it | Clear messaging during onboarding: "Minstrel teaches your ears, not your eyes." Provide rich visual feedback (note names, chord diagrams) as alternative to notation. |
| **Bidirectional MIDI Demo** | Not all MIDI devices support output / have speakers | Graceful fallback to audio playback through laptop speakers. Detect MIDI output capability and adapt. |

---

## Web Application Specific Requirements

### Project-Type Overview

Minstrel is a **Single Page Application (SPA)** designed for desktop-class browser experiences. The real-time nature of MIDI processing and audio analysis requires a rich client-side application with persistent WebSocket or similar connections for AI features.

### Browser Support

| Browser | Support Level | Rationale |
|---------|--------------|-----------|
| **Chrome (Desktop)** | Full support, primary target | Best Web MIDI API support, largest market share |
| **Edge (Desktop)** | Full support | Chromium-based, equivalent Web MIDI support |
| **Firefox (Desktop)** | Partial support | Web MIDI API requires polyfill or extension; degrade gracefully |
| **Safari (Desktop)** | Partial support | Web MIDI API support limited; audio-only fallback available |
| **Mobile browsers** | Not supported at MVP | MIDI instrument connection is desktop-centric; mobile is post-MVP |

**Critical dependency:** Web MIDI API availability. Chrome and Chromium-based browsers are the primary target. For browsers without Web MIDI, display a clear message directing users to Chrome.

### Responsive Design

- **Primary target:** Desktop screens (1280px+ width) — musicians practice at desks with instruments
- **Minimum supported width:** 1024px
- **Tablet support:** Secondary priority — functional but not optimized
- **Mobile:** Not supported at MVP (MIDI connection is impractical on mobile)

### Real-Time Requirements

| Feature | Latency Target | Protocol |
|---------|---------------|----------|
| MIDI input processing | <50ms | Web MIDI API (client-side) |
| Visual feedback update | <16ms (60fps) | Client-side rendering |
| AI chat response | <1 second | Server API (WebSocket or REST) |
| Drill generation | <2 seconds | Server API |
| Session data sync | Best-effort, non-blocking | Background sync |

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial page load (first contentful paint) | <3 seconds | Measured on broadband connection (10Mbps+) |
| Time to interactive | <5 seconds | Measured on broadband connection (10Mbps+) |
| MIDI connection established | <2 seconds after device detection | Client-side timer |
| Client-side bundle size | <500KB gzipped (initial load) | Build output analysis |
| Memory usage during session | <200MB | Browser DevTools profiling |

### SEO Strategy

- **Minimal SEO need:** Minstrel is a tool, not a content site. Users discover it through music communities, word-of-mouth, and direct search.
- **Landing page:** Server-rendered marketing page with product description, features, and signup — SEO optimized.
- **Application:** SPA behind authentication — no SEO needed for the app itself.
- **Content strategy (post-MVP):** Blog posts and guides targeting "how to improve at [instrument]" search queries.

### Accessibility Level

- **Target:** WCAG 2.1 AA for all non-audio interface elements.
- **Keyboard navigation:** Full keyboard support for all UI controls.
- **Screen reader:** Compatible for text-based features (chat, settings, progress data). Real-time visualizations provide alt-text summaries.
- **Color contrast:** Minimum 4.5:1 contrast ratio for text, 3:1 for large text and UI components.
- **Reduced motion:** Respect `prefers-reduced-motion` for animations and visualizations.

---

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Experience MVP — deliver the complete Listen → Analyze → Coach → Drill → Challenge loop for a single user type. The goal is proving that an AI practice companion delivers measurable skill improvement, validating the core value proposition before expanding.

**Resource Requirements:** Small team (2-3 engineers, 1 designer). AI/ML capability for the Difficulty Engine and coaching chat. Music theory domain expertise for analysis algorithms.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Journey 1 (Jake — First Session): Full happy path
- Journey 2 (Aisha — Regular Session): Full happy path
- Journey 3 (MIDI Connection Failure): Troubleshooting + audio fallback
- Journey 4 (API Key Setup): BYOK onboarding and AI feature activation

**Must-Have Capabilities:**
1. MIDI connection auto-detection and bidirectional communication
2. Real-time note/chord/progression analysis
3. The Difficulty Engine (adaptive challenge — CRITICAL QUALITY GATE)
4. AI drill generation with MIDI demonstration playback
5. AI coaching chat (session-aware, genre-aware)
6. All three interaction modes (Silent Coach, Dashboard + Chat, Replay Studio)
7. Session recording and continuity
8. Engagement system (streaks, XP, achievements)
9. User accounts with LLM API key management (BYOK)
10. MIDI troubleshooting and audio-only fallback

### Post-MVP Features

**Phase 2 — Monetization & Creative Companion (v2):**
- Premium subscription model (freemium tiers, managed API access so users don't need their own keys)
- Payment processing integration
- Song completion engine (play a melody, get chord progressions)
- Style transfer (hear your playing in different genres)
- Style DNA Profile (musical personality mapping)
- Advanced audio analysis (articulation, tone, vibrato via microphone)
- Skill trees (visual branching progression maps)
- Margin Notes interaction mode (post-session annotated timeline)
- Mobile browser support

**Phase 3 — The Intelligent Studio (v3):**
- AI jam partner (real-time backing tracks reactive to playing)
- Composition scratchpad (extract best licks into songwriting tools)
- Advanced analytics (millisecond-level timing, harmonic tendency mapping)
- Multi-instrument session support
- API for third-party integrations

### Risk Mitigation Strategy

**Technical Risks:**

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Difficulty Engine calibration is wrong at launch | Core value proposition fails | Extensive beta testing across skill levels. Manual difficulty override as safety valve. This is the #1 risk. |
| Web MIDI API browser support is too limited | Reduces addressable market | Target Chrome/Edge first (80%+ desktop share). Clear browser requirement messaging. Audio fallback for unsupported browsers. |
| AI response latency exceeds targets | Breaks real-time feel | Client-side MIDI processing (no server round-trip for core analysis). Server calls only for AI chat and drill generation. |
| MIDI output not supported on all devices | Demonstration feature doesn't work | Graceful fallback to audio playback through laptop speakers. Detect device capabilities. |

**Market Risks:**

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Musicians don't trust AI coaching | Low adoption and engagement | Show data, not opinions. Ground every suggestion in what the player actually played. Growth mindset framing builds trust. |
| Users expect sheet music | Confusion and churn | Clear "ear-first" messaging from day one. Rich visual feedback as alternative (note names, chord diagrams, timing graphs). |
| API key friction deters users | Users unwilling to get/manage their own LLM API keys | Clear setup guide, multi-provider support, transparent cost estimates. Plan managed API access (premium tier) for Phase 2 to remove this barrier. |

**Resource Risks:**

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Smaller team than planned | Slower delivery | Phase 1 is tightly scoped to 10 must-haves. All growth features deferred to Phase 2. |
| Music theory expertise gap | Poor analysis quality | Consult with music educators during development. Validate analysis accuracy with trained musicians before launch. |

---

## Functional Requirements

### MIDI & Audio Input

- **FR1:** Users can connect any MIDI device and have it auto-detected without manual configuration
- **FR2:** System can detect MIDI device name, channel, and connection status in real time
- **FR3:** Users can receive step-by-step troubleshooting guidance when MIDI connection fails
- **FR4:** System can capture all MIDI events (notes, velocity, timing, control changes) from connected devices
- **FR5:** System can send MIDI output to connected devices for demonstration playback
- **FR6:** Users can fall back to audio-only input via laptop microphone when MIDI is unavailable
- **FR7:** System can detect basic dynamics and volume through audio capture

### Real-Time Analysis

- **FR8:** System can identify individual notes, chords, and chord progressions in real time as the user plays
- **FR9:** System can measure timing accuracy relative to detected or target tempo
- **FR10:** System can detect key center, tonal context, and harmonic function of played chords
- **FR11:** System can identify genre-specific patterns and stylistic elements in the user's playing
- **FR12:** System can track playing tendencies, comfort zones, and avoidance patterns across sessions
- **FR13:** System can generate a session snapshot summarizing key, chords used, timing accuracy, tempo, and a key insight

### The Difficulty Engine

- **FR14:** System can assess a player's current skill level across multiple dimensions (timing, harmony, technique, speed)
- **FR15:** System can dynamically adjust challenge difficulty based on real-time performance within a session
- **FR16:** System can apply progressive overload by incrementally increasing tempo, harmonic complexity, or rhythmic difficulty
- **FR17:** System can detect when a player is in the growth zone (between boredom and frustration) and maintain that state
- **FR18:** System can recalibrate difficulty across all exercises and modes based on cumulative player data

### AI Drill Generation & Demonstration

- **FR19:** System can generate targeted practice exercises based on specific weaknesses identified during play
- **FR20:** System can demonstrate generated drills through the user's instrument via MIDI output before the user attempts them
- **FR21:** System can produce varied drills addressing the same weakness without repetition
- **FR22:** System can track drill completion and measure improvement in the targeted skill within a drill session
- **FR23:** Users can receive a key insight identifying their highest-impact area for improvement after freeform play

### AI Coaching Chat

- **FR24:** Users can ask natural language questions about their playing during or after a session
- **FR25:** System can provide responses grounded in the user's actual session data and playing history
- **FR26:** System can constrain musical advice to the relevant genre/style context
- **FR27:** System can explain musical concepts (harmony, technique, theory) in the context of what the user just played
- **FR28:** System can frame all feedback using growth mindset language ("not yet" instead of "wrong")

### Interaction Modes

- **FR29:** Users can play in Silent Coach mode with real-time visualization and no AI interruptions
- **FR30:** Users can switch to Dashboard + Chat mode with live data display and conversational AI access
- **FR31:** Users can review recorded sessions in Replay Studio with timeline scrubbing
- **FR32:** Users can ask the AI about any specific moment in a recorded session during replay
- **FR33:** System can display real-time harmonic overlays showing chord tones vs. passing tones during play

### Session Management

- **FR34:** Users can enter freeform play mode with no structured objectives
- **FR35:** Users can start micro-sessions (focused bursts on a single skill, stackable)
- **FR36:** System can auto-generate warm-ups based on the user's recent work and planned session focus
- **FR37:** System can record complete sessions (all MIDI data and analysis) for later replay
- **FR38:** System can maintain session continuity, referencing previous sessions in coaching and drill selection
- **FR39:** Users can view and track personal records (fastest clean run, longest streak, accuracy milestones)

### Engagement & Progress

- **FR40:** System can track daily practice streaks based on meaningful practice activity (not just app opens)
- **FR41:** System can award XP for practice time, accuracy improvements, and milestone completion
- **FR42:** System can unlock achievement badges for specific accomplishments (genre, technique, consistency milestones)
- **FR43:** Users can view progress data showing improvement trends over configurable time periods
- **FR44:** Users can view weekly progress summaries with skill improvement metrics and session history

### User Accounts & API Key Management

- **FR45:** Users can begin playing immediately without creating an account (guest mode with MIDI connection only — MIDI analysis and visualization work without AI)
- **FR46:** Users can create an account to persist data, progress, and session history
- **FR47:** Users can configure their own LLM API key (OpenAI, Anthropic, or other supported providers) in settings to enable AI features
- **FR48:** System can validate LLM API keys in real time and display connection status
- **FR49:** System can gracefully degrade when no API key is configured (MIDI analysis and visualization work; AI features show "connect API key" prompt)
- **FR50:** System can display estimated token/cost usage per session for transparency

---

## Non-Functional Requirements

### Performance

| Requirement | Target | Condition |
|-------------|--------|-----------|
| MIDI event processing latency | <50ms | From MIDI input to visual feedback update, client-side |
| Real-time visualization frame rate | 60fps | During active play with Silent Coach overlay |
| AI coaching chat response | <1 second | From user message submission to first response token |
| AI drill generation | <2 seconds | From drill request to playable exercise delivered |
| Initial page load (FCP) | <3 seconds | On broadband connection (10Mbps+) |
| Time to interactive | <5 seconds | On broadband connection (10Mbps+) |
| Session data autosave | Every 30 seconds | Non-blocking background operation |
| Client memory usage | <200MB | During active 30-minute session |

### Security

- All data encrypted in transit (TLS 1.2+) and at rest (AES-256)
- User authentication via industry-standard protocols (OAuth 2.0 / email+password)
- Session data isolated per user — no cross-user data access
- LLM API keys encrypted at rest and never exposed in client-side code or logs
- API rate limiting to prevent abuse (100 requests/minute per authenticated user)
- MIDI data and session recordings treated as personal data under GDPR
- Users can export all personal data and request complete account deletion

### Scalability

| Milestone | Target | Approach |
|-----------|--------|----------|
| Launch | 500 concurrent users | Single-region deployment |
| 6 months | 2,000 concurrent users | Horizontal scaling of API servers |
| 12 months | 10,000 concurrent users | Multi-region deployment, CDN for static assets |

- Client-side MIDI processing eliminates server load for core real-time features
- Server scaling required primarily for AI chat, drill generation, and data persistence
- Database must support efficient time-series queries for session history and progress analytics

### Accessibility

- WCAG 2.1 AA compliance for all non-audio interface elements
- Full keyboard navigation for all UI controls and modes
- Screen reader compatibility for text-based features (chat, settings, progress data, menus)
- Minimum 4.5:1 color contrast ratio for text; 3:1 for large text and UI components
- Respect `prefers-reduced-motion` for animations and real-time visualizations
- Provide text descriptions for visual-only data (e.g., "Timing accuracy: 85%" alongside timing graph)

### Reliability

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| Application uptime | 99.5% | Musicians practice at unpredictable hours |
| Session recording integrity | 100% — zero data loss during active recording | Lost session data destroys user trust |
| Graceful degradation on connection loss | Client continues recording locally; syncs when reconnected | Practice shouldn't stop because of network issues |
| MIDI device reconnection | Auto-reconnect within 5 seconds of device re-detection | USB disconnects happen — recovery must be seamless |
| AI service degradation | Core features (MIDI analysis, visualization) function without AI server | AI is enhancement, not dependency for basic practice |

### Integration

| System | Integration Type | Priority |
|--------|-----------------|----------|
| Web MIDI API | Browser API (client-side) | Critical — core MIDI functionality |
| Web Audio API | Browser API (client-side) | High — audio capture and playback |
| LLM Provider(s) | Server-side API (user-provided keys) | High — AI coaching and drill generation via BYOK |
| Product Analytics Platform | Client + server SDK | Medium — user behavior tracking and product metrics |
| Transactional Email Service | Server-side API | Medium — account verification |

---

*This PRD serves as the capability contract for all downstream work. UX designers will design for these capabilities. Architects will build systems to support them. Epic breakdown will implement what is listed here. Any capability not documented in the Functional Requirements will not exist in the final product.*
