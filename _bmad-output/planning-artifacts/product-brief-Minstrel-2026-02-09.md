---
stepsCompleted: [1, 2, 3, 4, 5, 6]
status: complete
inputDocuments:
  - '_bmad-output/brainstorming/brainstorming-session-2026-02-09.md'
date: 2026-02-09
author: Melchizedek
---

# Product Brief: Minstrel

## Executive Summary

Minstrel is a personal musical growth engine that uses MIDI and AI to give any instrumentalist the feedback loop only expensive tutors could provide. It transforms the laptop into an intelligent practice companion that listens to every note in real time, analyzes playing across notes, chords, timing, and feel, and delivers the right challenge at the right moment to keep musicians growing.

The core problem Minstrel solves is that **practice is broken**. Musicians don't know what to practice, how to practice effectively, or whether they're actually improving. They noodle without direction, repeat the same mistakes unaware, and plateau for months. Private tutors solve this — but at $50-100/hr with limited availability. Minstrel delivers that same expert ear, 24/7, at a fraction of the cost.

Existing solutions like Yousician, Simply Piano, and Melodics fall short in three critical ways: they depend on sheet music (teaching reading, not listening), use static pre-built difficulty (one path for everyone), and provide shallow right/wrong feedback without explaining the music behind the notes. Minstrel takes a fundamentally different approach — ear-first, adaptive, and deeply analytical.

Three converging forces make this the right moment: AI and audio analysis have matured to enable real-time musical coaching, MIDI controllers are cheaper and more ubiquitous than ever, and no one in the market has built a true AI practice companion — the gap is wide open.

---

## Core Vision

### Problem Statement

Musicians at every level — from self-taught beginners to gigging professionals — lack an effective feedback loop during practice. Without an expert ear, they can't hear their own mistakes, don't know what to work on next, and plateau without understanding why. The result: millions of musicians who love playing but stop improving.

### Problem Impact

- **Beginners** get frustrated and quit — 90% of new musicians abandon their instrument within the first year
- **Intermediate players** hit walls they can't diagnose — they practice more but don't improve
- **Advanced players** over-rely on comfort zones — they don't know what they're avoiding
- **All players** waste practice time on the wrong things without targeted guidance

### Why Existing Solutions Fall Short

| Solution                      | Limitation                                                            |
| ----------------------------- | --------------------------------------------------------------------- |
| **Yousician / Simply Piano**  | Sheet-music-dependent, static difficulty, gamification over substance |
| **YouTube tutorials**         | Passive watching, no feedback, no personalization                     |
| **Private tutors**            | $50-100/hr, limited availability, inconsistent quality                |
| **Metronomes / theory books** | Boring, no analysis, musicians avoid using them                       |
| **Self-practice**             | No feedback loop, can't hear own mistakes, blind repetition           |

None of these listen to you play, understand what you're doing, and adapt in real time.

### Proposed Solution

Minstrel is a laptop-based practice companion that connects to any MIDI instrument and uses AI to:

1. **Listen** — capture every note, chord, and progression via MIDI + audio analysis
2. **Analyze** — evaluate timing accuracy, harmonic choices, technique patterns, and playing tendencies
3. **Coach** — provide minimal, subtle, data-driven feedback through a conversational AI interface
4. **Drill** — generate personalized exercises targeting specific weaknesses, never the same drill twice
5. **Challenge** — maintain an adaptive difficulty engine that keeps the player in the growth zone at all times

The experience is ear-first (no sheet music), dynamically generated (no pre-built curriculum), and deeply personal (no social features, no competition). Minstrel is the anti-school practice room.

### Key Differentiators

1. **The Difficulty Engine** — A unified AI system governing all challenge across the platform in real time. Not per-lesson difficulty settings — a living intelligence that knows the player's exact edge and keeps them there.
2. **Ear-First Philosophy** — Everything built around listening and feel, not reading. This requires rethinking music education UX from scratch — competitors can't bolt this onto existing sheet-music architectures.
3. **Session-Aware AI Coaching** — Full context of the player's entire history and current session. Every suggestion is deeply personalized, genre-aware, and grounded in what the player actually just played.

---

## Target Users

### Primary Users

**Segment 1: "Jake" — The Self-Taught Beginner**

- **Profile:** Ages 15-30, self-taught through YouTube and tabs, plays guitar or keyboard
- **Skill Level:** Can play basic chords and simple songs but lacks structure and understanding
- **Theory:** Minimal — knows a few chord names, maybe a scale or two, but can't connect theory to practice
- **Motivation:** Wants to actually get good, not just noodle around. Craves direction and progress.
- **Current Pain:** Watches tutorials but can't replicate them. Practices without knowing what to work on. Can't hear their own mistakes. Plateaus within months and considers quitting.
- **Workarounds:** YouTube tutorials, free apps (Yousician free tier), asking friends, occasional lessons they can't afford regularly
- **Success Vision:** "I can feel myself getting better every week. I know exactly what to work on and I can hear the difference."

**Segment 2: "Aisha" — The Intermediate Player Hitting a Wall**

- **Profile:** Ages 20-45, has some formal training or years of self-teaching, plays piano, guitar, or another MIDI instrument
- **Skill Level:** Technically competent — can play pieces, knows theory basics, but stuck at a plateau
- **Theory:** Knows scales, chords, keys, basic harmony — but can't apply theory to improvisation or creative playing fluently
- **Motivation:** Wants to break through the plateau, develop musicality beyond technique, and explore creativity (improv, composition, new styles)
- **Current Pain:** Practices the same things repeatedly. Knows they have weaknesses but can't pinpoint them. Theory feels disconnected from playing. Private tutors are expensive and hard to schedule.
- **Workarounds:** Occasional private lessons ($50-100/hr), online courses that feel too academic, practicing the same comfortable material
- **Success Vision:** "I can improvise confidently. I understand WHY things sound good. I'm exploring styles I never thought I could play."

### Supported Instruments

- **Any MIDI instrument** — if it sends MIDI, Minstrel listens
- **Primary focus:** Piano/keyboard and guitar (via MIDI) — the two largest instrument markets
- **Also supports:** Bass, drums (MIDI pads), wind controllers, synths, and any chromatic MIDI controller

### Secondary Users

None. Minstrel is built exclusively for the individual player. No teacher mode, no parent dashboards, no indirect user considerations. Razor-sharp focus on the person practicing.

### User Journey

**Discovery → Onboarding → Aha → Core Loop → Long-Term**

| Stage          | Experience                                                                                                                                                                                     |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Discovery**  | User is searching for help ("how to get better at piano"), frustrated after YouTube tutorials, hears about Minstrel from a music community (Reddit/Discord), or gets recommended by a teacher  |
| **Onboarding** | Plug in MIDI → Free Play mode → Minstrel listens silently → Quick skill assessment → First guided challenge. Seamless flow, no forms or curriculum selection.                                  |
| **Aha Moment** | First real-time feedback — the user plays something and Minstrel immediately shows what they played, including a mistake they didn't notice. "It actually HEARS me."                           |
| **Core Loop**  | Micro-sessions (3-5 min) or freeform play → Minstrel analyzes → Generates targeted drills from mistakes → Tracks progress → Adjusts difficulty. Streaks and achievements maintain daily habit. |
| **Long-Term**  | Style DNA Profile grows. Skill trees branch out. Personal records accumulate. The player sees concrete data proving they've improved. Minstrel becomes the daily practice ritual.              |

---

## Success Metrics

### User Success Metrics

| Metric                      | What It Measures                                                                               | Target                                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Skill Improvement Rate**  | Measurable improvement in accuracy, speed, or complexity over time                             | Users show statistically significant improvement within 30 days of regular use     |
| **Practice Consistency**    | Frequency and regularity of practice sessions                                                  | 3+ sessions per week for active users                                              |
| **Breakthrough Milestones** | First improv, first song by ear, first clean speed run — moments users couldn't achieve before | At least 1 breakthrough milestone per user per month                               |
| **Frustration Reduction**   | Users report knowing what to work on and feeling appropriately challenged                      | Session completion rate >80% (users don't abandon mid-practice out of frustration) |
| **Session Duration**        | Time spent in active practice per session                                                      | Average 15+ minutes per session (indicates engagement, not obligation)             |

### Business Objectives

**Business Model:** Free with BYOK (Bring Your Own Key)

- **All features available to all users** — no feature gating or tiers at launch
- **Users provide their own LLM API keys** (OpenAI, Anthropic, etc.) to power AI coaching and drill generation
- **Monetization deferred to Phase 2** — premium subscriptions and managed API access planned for a future phase

**3-Month Objectives:**

- Launch MVP with complete Listen → Analyze → Coach → Drill → Challenge loop
- Acquire first 500 registered users through music communities and organic channels
- Validate that the product delivers measurable improvement
- Validate BYOK model — users successfully configure and use their own API keys

**12-Month Objectives:**

- 10,000+ active players practicing 3x+ per week
- Known in musician communities as "the tool that actually makes you better"
- Evaluate and launch premium subscription model (managed API access) based on user feedback

### Key Performance Indicators

| KPI                           | Measurement                                        | Target | Timeframe |
| ----------------------------- | -------------------------------------------------- | ------ | --------- |
| **Weekly Active Users (WAU)** | Users with 1+ sessions per week                    | 10,000 | 12 months |
| **Weekly Retention Rate**     | % of users returning within 7 days                 | >70%   | Ongoing   |
| **API Key Activation Rate**   | % of registered users who configure an LLM API key | >60%   | Ongoing   |
| **Skill Improvement Signal**  | % of 30-day users showing measurable improvement   | >60%   | Ongoing   |
| **Organic Referral Rate**     | % of new users coming from word-of-mouth           | >20%   | 6 months  |
| **Net Promoter Score (NPS)**  | User satisfaction and likelihood to recommend      | >50    | 6 months  |
| **Session Completion Rate**   | % of started sessions completed (not abandoned)    | >80%   | Ongoing   |

### Leading Indicators (Early Signals of Success)

- **Aha Moment Reach:** % of new users who experience first real-time feedback within first session (target: >90%)
- **Day 7 Retention:** % of users returning after 7 days (strongest predictor of long-term retention)
- **Drill Completion Rate:** % of AI-generated drills completed — indicates drills are relevant and well-calibrated
- **AI Chat Engagement:** % of users who ask Minstrel a question during or after a session — indicates trust in the coaching

---

## MVP Scope

### Core Features

**1. MIDI + Basic Audio Engine (Bidirectional)**

- MIDI input: capture every note, chord, progression, velocity, and timing
- MIDI output: play demonstrations back through the user's instrument speakers (Demonstrate → Listen → Attempt → Analyze loop)
- Basic audio capture via laptop mic for dynamics and volume detection
- Web MIDI API integration for browser-based access

**2. Real-Time Analysis**

- Note/chord/progression detection and display
- Timing accuracy measurement
- Harmonic analysis (key detection, chord quality, progression mapping)
- Playing tendency tracking (comfort zones, patterns, avoidances)
- Genre-aware analysis context

**3. The Difficulty Engine**

- Unified system governing all challenge levels across the platform
- Progressive overload — incremental difficulty increases (tempo, complexity, key)
- Growth zone detection — always keeping the player between boredom and frustration
- Adaptive difficulty that responds to real-time performance

**4. AI Drill Generation + MIDI Demonstration**

- Custom exercises generated from the player's actual mistakes and weaknesses
- Minstrel demonstrates each drill through the instrument's speakers first — player hears how it should sound before attempting
- Never the same drill twice — dynamically generated, infinitely varied
- Targeted: each drill addresses a specific weakness identified in the session

**5. AI Coaching Chat**

- Conversational AI that answers questions about the player's playing
- Session-aware context — every answer grounded in what the player actually played
- Genre-aware — constrains all advice to the relevant musical style
- Minimal and subtle tone — data-driven, not chatty
- Growth mindset framing — "not yet", never "wrong"

**6. Three Interaction Modes**

- **Silent Coach** — real-time data visualization during play, AI speaks only when asked
- **Dashboard + Chat** — split screen with live data and conversational AI for active questioning
- **Replay Studio** — post-session timeline scrubbing, ask AI about any moment in the recording

**7. Session Structure**

- Freeform play mode — just play, Minstrel listens and interrupts only when it notices something worth addressing
- Micro-sessions — 3-5 minute focused bursts on one specific skill, stackable
- Auto-generated warm-ups based on what the player is about to work on
- Personal records tracking ("Fastest clean arpeggio: 140 BPM on Jan 5")

**8. Engagement & Habit Building**

- Daily practice streaks (meaningful practice, not just app opens)
- XP system for practice time and accuracy
- Achievement badges ("First Jazz Voicing", "Perfect Timing 10x", "100 Day Streak")
- Progress data — concrete numbers showing improvement over time

**9. Platform**

- **Web application (browser-based)** using Web MIDI API
- No install required — broadest reach, fastest to ship
- Desktop-class experience in the browser

### Out of Scope for MVP

| Feature                     | Rationale                                                                         | Target Version    |
| --------------------------- | --------------------------------------------------------------------------------- | ----------------- |
| **Skill trees**             | Complex visual system — use simpler progress tracking at MVP                      | v2                |
| **Advanced audio analysis** | Full tone quality, vibrato, articulation via mic — basic audio sufficient for MVP | v2                |
| **Song completion**         | "Play a melody, get arrangements" — powerful but not core to the practice loop    | v2                |
| **Style transfer**          | "Hear your passage as bossa nova" — creative feature, defer to post-MVP           | v2                |
| **Style DNA Profile**       | Musical personality mapping — needs significant data before it's useful           | v2                |
| **Margin Notes mode**       | Post-session annotated view — Replay Studio covers this need at MVP               | v2                |
| **Social features**         | None planned — Minstrel is a solo practice tool                                   | Never (by design) |
| **Sheet music display**     | Ear-first philosophy — no visual notation                                         | Never (by design) |
| **Pre-built curriculum**    | Every path is dynamically generated                                               | Never (by design) |
| **Video content**           | YouTube exists — Minstrel is interactive, not passive                             | Never (by design) |
| **Competitive scoring**     | Progress is personal, not performative                                            | Never (by design) |

### MVP Success Criteria

The MVP is successful and worth scaling when ALL of the following are met:

1. **70%+ weekly retention** — users keep coming back because the product delivers ongoing value
2. **Measurable improvement data** — users show statistically significant skill improvement within 30 days
3. **Organic referral rate >20%** — users recommend Minstrel without being asked
4. **>60% API key activation** — registered users successfully configure and use their own LLM API keys

### Future Vision (Post-MVP Roadmap)

**v2 — The Creative Companion:**

- Song completion engine — play a melody, get chord progressions and arrangements
- Style transfer — hear your playing rendered in different genres
- Style DNA Profile — musical personality mapping with opt-in style discovery
- Advanced audio analysis — full articulation, tone quality, vibrato detection
- Skill trees — visual branching progression maps

**v3 — The Intelligent Studio:**

- AI jam partner — real-time backing tracks that react to your playing
- Composition scratchpad — Minstrel extracts best licks from practice into songwriting tools
- Advanced analytics — timing accuracy to milliseconds, harmonic tendency mapping
- Multi-instrument session support

**Long-Term Vision:**
Minstrel becomes the universal practice companion for every instrumentalist — the tool that made private tutors optional and transformed how the world learns music. Known in every music community as "the thing that actually made me better."
