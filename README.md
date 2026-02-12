# Minstrel

AI-powered real-time MIDI practice companion for instrumentalists.

## What It Does

Minstrel connects to any MIDI instrument via the Web MIDI API, listens to every note in real time, analyzes playing across notes, chords, timing, and feel, and delivers personalized challenges and drills to keep musicians growing.

- **Ear-first** — no sheet music, ever. Feedback is data-driven and visual.
- **Adaptive** — the Difficulty Engine keeps every player at their exact growth edge in real time.
- **Bidirectional MIDI** — drills are demonstrated through the user's own instrument speakers before they attempt them.
- **AI Coaching** — session-aware, genre-aware conversational AI powered by the user's own LLM API key (BYOK).

## Core Features

- **Real-Time Analysis** — note/chord/progression detection, timing accuracy, harmonic analysis, playing tendency tracking
- **The Difficulty Engine** — unified adaptive challenge system that calibrates across sessions
- **AI Drill Generation** — personalized exercises generated from actual weaknesses, never the same drill twice
- **Three Interaction Modes** — Silent Coach (immersive visualization), Dashboard + Chat (split analysis + AI), Replay Studio (session review with timeline scrubbing)
- **Engagement** — practice streaks, XP, achievement badges, progress trends, personal records

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **UI:** React + shadcn/ui + Tailwind CSS v4 + Canvas/WebGL
- **State:** Zustand 5.x (3-store architecture)
- **AI:** Vercel AI SDK 6.x (provider-agnostic, BYOK)
- **Database:** Supabase PostgreSQL + Dexie.js 4.x (IndexedDB, offline-first)
- **Auth:** Supabase Auth (`@supabase/ssr`)
- **Monitoring:** Sentry 10.x + PostHog
- **Testing:** Vitest + React Testing Library + Playwright
- **Deploy:** Vercel

## Business Model

Free with BYOK (Bring Your Own Key). Users provide their own LLM API keys. All features available to all users at launch. Monetization deferred to a future phase.

## Target Users

- **Self-taught beginners** (15-30) who lack structure and can't hear their own mistakes
- **Intermediate players** (20-45) hitting plateaus who want to break through with data-driven practice

## Platform

Browser-based web application. Chrome/Edge primary (Web MIDI API). Desktop-first (1024px+ viewport).
