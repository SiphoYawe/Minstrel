<p align="center">
  <img alt="Minstrel" src="./Minstrel-logo-white.svg" width="400">
</p>

<p align="center">
  AI-powered real-time MIDI practice companion for instrumentalists
</p>

---

## What is Minstrel?

Minstrel is a browser-based practice companion that connects to any MIDI instrument and uses AI to help musicians actually improve. It listens to every note in real time, analyzes playing across notes, chords, timing, and feel, and delivers the right challenge at the right moment to keep you growing.

Practice is broken. Musicians don't know what to practice, how to practice effectively, or whether they're actually improving. Private tutors solve this — but at $50–100/hr with limited availability. Minstrel delivers that same expert ear, 24/7.

## How It Works

1. **Listen** — Captures every note, chord, and progression via MIDI and basic audio analysis
2. **Analyze** — Evaluates timing accuracy, harmonic choices, technique patterns, and playing tendencies
3. **Coach** — Provides minimal, data-driven feedback through a conversational AI interface
4. **Drill** — Generates personalized exercises targeting specific weaknesses, never the same drill twice
5. **Challenge** — Maintains an adaptive Difficulty Engine that keeps the player in the growth zone at all times

## Key Principles

- **Ear-first** — Everything built around listening and feel, not reading sheet music. No notation, ever.
- **The Difficulty Engine** — A unified AI system governing all challenge in real time. It knows your exact edge and keeps you there.
- **Growth mindset** — "Not yet" instead of "wrong." Amber, not red. No failure states, only trajectory.
- **Deeply personal** — No social features, no competition, no pre-built curriculum. Every path is dynamically generated for you.
- **BYOK (Bring Your Own Key)** — Free to use. You provide your own LLM API key to power AI coaching and drill generation.

## Three Modes

- **Silent Coach** — Immersive real-time visualization while you play. AI speaks only when asked.
- **Dashboard + Chat** — Split view with live data and conversational AI for active questioning.
- **Replay Studio** — Post-session timeline scrubbing. Ask the AI about any moment in your recording.

## Supported Instruments

Any MIDI instrument — if it sends MIDI, Minstrel listens. Piano/keyboard and guitar are the primary focus, but bass, drums (MIDI pads), wind controllers, synths, and any chromatic MIDI controller are supported. An audio-only fallback mode via microphone is available for instruments without MIDI output.

## Tech Stack

Built with Next.js, Supabase, TypeScript, React, shadcn/ui, Tailwind CSS, Zustand, and the Vercel AI SDK. Uses the Web MIDI API for browser-based instrument connectivity (Chrome/Edge).

## Getting Started

1. Clone the repository

   ```bash
   git clone https://github.com/your-username/minstrel.git
   cd minstrel
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local` and fill in your Supabase credentials

   ```bash
   cp .env.example .env.local
   ```

4. Start the development server

   ```bash
   npm run dev
   ```

5. Open [localhost:3000](http://localhost:3000), plug in your MIDI instrument, and play.

## License

All rights reserved.
