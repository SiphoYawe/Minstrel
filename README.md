<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./public/minstrel-logo-white.svg">
    <source media="(prefers-color-scheme: light)" srcset="./public/minstrel-logo-dark.svg">
    <img alt="Minstrel" src="./public/minstrel-logo-white.svg" width="400">
  </picture>
</p>

<p align="center">
  AI-powered real-time MIDI practice companion for instrumentalists
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript 5">
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase" alt="Supabase">
  <img src="https://img.shields.io/badge/Vercel_AI_SDK-6-black?logo=vercel" alt="Vercel AI SDK 6">
  <img src="https://img.shields.io/badge/Web_MIDI_API-Chrome%2FEdge-4285F4?logo=googlechrome" alt="Web MIDI API">
</p>

---

Minstrel connects to any MIDI instrument through the browser and uses AI to deliver real-time coaching, adaptive drills, and session replay. No sheet music, no pre-built curriculum — everything is ear-first and dynamically generated for each player.

## Features

### Real-Time MIDI Analysis

- Captures every note, chord, and progression via the Web MIDI API with sub-millisecond latency
- Pitch detection, velocity tracking, timing accuracy measurement, and harmonic function analysis
- Audio fallback via microphone for instruments without MIDI output
- Bidirectional MIDI: input analysis + output demonstration through instrument speakers

### Adaptive Difficulty Engine

- AI-driven system that evaluates playing in real time and adjusts challenge dynamically
- Tracks note accuracy, rhythmic precision, harmonic choices, and technique patterns
- Keeps the player in the growth zone — never too easy, never overwhelming
- Growth mindset framing throughout: "not yet" instead of "wrong," amber instead of red

### AI Coaching (BYOK)

- Provider-agnostic AI integration via Vercel AI SDK — bring your own OpenAI or Anthropic key
- Studio Engineer persona: technical, precise, data-driven feedback with no filler
- Streaming responses with token budget management and context windowing
- Structured drill generation targeting specific weaknesses, never the same drill twice

### Three Practice Modes

- **Silent Coach** — Immersive full-screen canvas visualization while you play. AI observes silently, speaks only when asked.
- **Dashboard + Chat** — Split view with live performance data, skill radar, session history, and conversational AI.
- **Replay Studio** — Post-session timeline scrubbing with MIDI playback. Ask the AI about any moment in your recording.

### Session Replay & Continuity

- Full MIDI recording with timeline markers and visual playback indicators
- Scrub to any point in a session and replay through your instrument
- Session snapshots with BPM, key detection, and performance metrics
- Persistent session history with data export

### Progress Tracking

- XP system with streak tracking and skill radar visualization
- Per-session snapshots enriched with harmonic analysis and accuracy metrics
- Historical trend visualization across sessions
- Data stored locally (IndexedDB) with cloud sync via Supabase

## Tech Stack

| Layer         | Technology                                                         |
| ------------- | ------------------------------------------------------------------ |
| Framework     | Next.js 16 (App Router, React 19, Server Components)               |
| Language      | TypeScript 5 (strict mode)                                         |
| UI            | shadcn/ui + Radix UI primitives, Tailwind CSS v4                   |
| Visualization | HTML5 Canvas (vanilla Zustand subscribe, bypasses React for 60fps) |
| State         | Zustand 5 (3 stores: MIDI, session, app)                           |
| AI            | Vercel AI SDK 6 (provider-agnostic, streaming, BYOK)               |
| Database      | Supabase PostgreSQL + Dexie.js 4 (IndexedDB, offline-first)        |
| Auth          | Supabase Auth with SSR cookie sessions                             |
| Validation    | Zod 4                                                              |
| Monitoring    | Sentry 10 + PostHog                                                |
| Testing       | Vitest + React Testing Library + Playwright                        |
| Quality       | ESLint 9, Prettier, Husky + lint-staged                            |
| Deploy        | Vercel                                                             |

## Architecture

Five-layer architecture: **Presentation > Application > Domain > Infrastructure > External**

- Feature-based directory structure with co-located tests
- Canvas rendering subscribes directly to Zustand stores (vanilla `subscribe`), bypassing the React render cycle entirely for real-time 60fps visualization
- Offline-first data layer — IndexedDB via Dexie.js handles all local persistence, Supabase syncs when available
- Rate limiting via Upstash Redis, encrypted API key storage, CSRF protection
- Kebab-case files, PascalCase components, snake_case database columns

## Supported Instruments

Any MIDI instrument — piano, keyboard, guitar, bass, drums (MIDI pads), wind controllers, synths, and any chromatic MIDI controller. Audio-only fallback via microphone for instruments without MIDI output. Requires Chrome or Edge (Web MIDI API).

## Getting Started

```bash
git clone https://github.com/your-username/minstrel.git
cd minstrel
npm install
cp .env.example .env.local  # Add your Supabase credentials
npm run dev
```

Open [localhost:3000](http://localhost:3000), plug in your MIDI instrument, and play.

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run test         # Run unit tests (Vitest)
npm run test:watch   # Run tests in watch mode
npm run test:e2e     # Run end-to-end tests (Playwright)
npm run lint         # Lint with ESLint
npm run format       # Format with Prettier
```

## License

All rights reserved.
