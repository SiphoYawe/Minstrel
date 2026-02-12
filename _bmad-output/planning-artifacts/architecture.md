---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/product-brief-Minstrel-2026-02-09.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-02-12'
project_name: 'Minstrel'
user_name: 'Melchizedek'
date: '2026-02-12'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
50 FRs across 9 capability areas. Architecturally, these cluster into four implementation domains:

1. **Client-Side Real-Time Engine** (FR1-13, FR29, FR33) — MIDI I/O, audio capture, note/chord/progression detection, timing analysis, harmonic analysis, playing tendency tracking, real-time visualization. All must execute client-side at <50ms latency and 60fps. This is the largest and most performance-critical domain.

2. **AI Services Layer** (FR14-28) — The Difficulty Engine (adaptive challenge calibration), AI drill generation with MIDI demonstration, and AI coaching chat. These require server-side LLM inference but must feel responsive (<1-2s). The Difficulty Engine uniquely spans client and server — real-time in-session adaptation client-side, cross-session calibration server-side.

3. **Session & Data Management** (FR34-44) — Session recording (100% integrity), freeform/micro-session/warm-up modes, session continuity across visits, personal records, streaks, XP, achievements, progress tracking. Requires a time-series-capable data model with both real-time append and historical query patterns.

4. **Platform & API Key Management** (FR45-50) — Guest mode, account creation, BYOK (Bring Your Own Key) LLM API key management, multi-provider support, key validation, graceful degradation when no key configured. Cross-cuts all other domains.

**Non-Functional Requirements:**
The NFRs impose hard architectural constraints:
- **<50ms MIDI processing** eliminates any server dependency for core real-time features
- **60fps visualization** requires efficient client-side rendering (Canvas/WebGL mandated by UX)
- **<500KB gzipped initial bundle** constrains framework and library choices
- **<200MB memory over 30 minutes** requires careful session data management (can't keep all MIDI events in memory indefinitely)
- **99.5% uptime + offline resilience** demands client-side-first architecture with eventual consistency
- **100% recording integrity** requires local-first storage with reliable sync
- **GDPR + COPPA** require data export, deletion, consent management, and age verification

**Scale & Complexity:**

- Primary domain: Full-stack web (SPA with heavy client-side)
- Complexity level: Medium-High
- Estimated architectural components: 13 custom + 12 shadcn/ui components, with P0-P3 priority tiers

### Technical Constraints & Dependencies

| Constraint | Impact |
|-----------|--------|
| **Web MIDI API** (Chrome/Edge only at full support) | Browser-gated feature set; Firefox/Safari require graceful degradation |
| **Web Audio API** for audio fallback | Secondary input path when MIDI unavailable |
| **Client-side MIDI processing** | Core analysis cannot use server — shapes entire client architecture |
| **LLM provider dependency** | AI features require external API; must handle latency, rate limits, cost |
| **BYOK API key security** | User LLM API keys must be encrypted at rest and never exposed client-side |
| **Desktop-only at MVP** | No mobile considerations needed; minimum 1024px viewport |
| **No pre-built curriculum** | All content is dynamically generated — no CMS, no content authoring pipeline |

### Cross-Cutting Concerns Identified

1. **Real-Time Data Pipeline** — MIDI events flow from Web MIDI API through analysis engines to visualization and recording simultaneously. This pipeline is the spine of the application — every mode, every feature connects to it.

2. **AI Service Integration** — Three distinct AI consumers (Difficulty Engine, drill generation, coaching chat) with different latency requirements and invocation patterns. Needs unified AI service layer with queuing, retry, and graceful degradation.

3. **Session Data Model** — Sessions are the core data entity. Must support real-time append (recording), random-access read (replay), analytical queries (progress tracking), and cross-session aggregation (Difficulty Engine calibration). Time-series characteristics.

4. **Authentication & API Key Management** — Guest → Registered user flow. API key presence determines AI feature availability. Gating is binary (key configured vs. not configured) rather than tiered. Secure key storage and server-side-only decryption are critical.

5. **Offline Resilience** — Core MIDI features work without network. AI features queue and sync. Session recording continues locally. Requires clear online/offline state management and sync strategy.

6. **Growth Mindset Framing** — All user-facing text, visual feedback, and AI responses must follow growth mindset principles. This is a design constraint that crosses every component generating user-visible output.

7. **Accessibility (WCAG 2.1 AA)** — Keyboard navigation, screen reader compatibility, color contrast, reduced motion support. Affects all UI components. Real-time visualizations need text alternatives.

8. **Data Privacy & Compliance** — GDPR (consent, export, deletion), COPPA (age-gating at 13+), session data as personal data. Affects data model, API design, and account management.

### UX-Mandated Architecture Constraints

The complete UX specification (all 14 steps) defines hard architectural constraints that downstream decisions must honor:

**Rendering Architecture:** Two-layer system — React/shadcn/ui Application Shell for UI chrome, Canvas/WebGL Visualization Canvas for real-time rendering. The Canvas layer operates independently of React's update cycle.

**Framework Lock:** React + shadcn/ui + Tailwind CSS. Components are source-owned (copied into project, not npm dependency). Design tokens defined in `tailwind.config.ts`.

**Component Structure:**
- `src/components/ui/` — shadcn/ui components (12 restyled)
- `src/components/` — Custom Minstrel components (13 designed)
- `src/components/viz/` — Canvas/WebGL visualization components

**Routing:** Client-side routing with `/session`, `/replay/:id`, `/settings`

**CI/CD Pipeline Requirements:** axe-core (deploy gate), eslint-plugin-jsx-a11y (pre-commit), Lighthouse CI (nightly, 90+ a11y threshold), Storybook a11y addon (component development)

**Visual Constants:** 0px border radius everywhere, no shadows, Inter + JetBrains Mono fonts, dark-first palette (#0F0F0F base), pastel accent system (#7CB9E8 primary)

**Mode-Specific Layouts:**

| Mode | Layout Pattern | Canvas Space |
|------|---------------|-------------|
| **Silent Coach** | Immersive Canvas — full-viewport viz, floating overlays, minimal chrome | ~90% viewport |
| **Dashboard + Chat** | Split Dashboard — canvas 60% left, data/chat panel 40% right | ~60% viewport |
| **Replay Studio** | Tabbed Workspace — canvas + timeline bottom, tabbed detail right | ~60% viewport |

**Component Priority Tiers:**

| Tier | Components | Implementation Phase |
|------|-----------|---------------------|
| **P0 — Core Experience** | VisualizationCanvas, StatusBar, ModeSwitcher, InstantSnapshot | Phase 1 (Weeks 1-3) |
| **P1 — Practice Loop** | DrillController, DataCard, AIChatPanel, SessionSummary | Phase 2 (Weeks 3-5) |
| **P2 — Engagement & Polish** | TimelineScrubber, TroubleshootingPanel, StreakBadge, AchievementToast | Phase 3 (Weeks 5-7) |
| **P3 — API Key Management** | APIKeyPrompt | Phase 3 (Weeks 5-7) |

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application (SPA with heavy client-side) based on project requirements analysis. React framework locked by UX specification (shadcn/ui dependency). TypeScript everywhere (frontend + backend). PostgreSQL via Supabase. Vercel deployment.

### User Technical Preferences

- **Language:** TypeScript everywhere (frontend and backend)
- **Database:** PostgreSQL via Supabase (managed)
- **Deployment:** Vercel + managed services
- **Backend Services:** Supabase (auth + DB + realtime)
- **Skill Level:** Intermediate

### Starter Options Considered

**Option 1: Next.js 16 + Supabase Official Template** — `npx create-next-app -e with-supabase`. Pre-configured with Next.js 16 App Router, TypeScript, Tailwind CSS, Supabase auth via `@supabase/ssr`, shadcn/ui initialized. Vercel-native deployment. Built-in API routes for AI proxy endpoints. SSR for landing page SEO.

**Option 2: Vite + React (Pure SPA)** — `npm create vite@latest -- --template react-ts`. Minimal React + TypeScript. Fastest dev server and smallest bundle. No SSR, no API routes — requires separate backend for AI proxy. Manual Supabase and shadcn/ui setup.

**Option 3: Community Templates (Nextbase Lite / supa-next-starter)** — More batteries-included but community-maintained. Risk of staleness, opinionated choices may conflict with Minstrel's specific architecture.

### Selected Starter: Next.js 16 + Supabase Official Template

**Rationale for Selection:**
1. Vercel-native deployment — zero-config, automatic preview deployments
2. API routes eliminate separate backend — AI proxy endpoints, API key management, server actions all within the app
3. SSR for landing page — PRD requires SEO-optimized marketing page; app itself uses `'use client'` components
4. Supabase + shadcn/ui pre-configured — two hardest integration choices already wired
5. File-based routing maps naturally to `/session`, `/replay/[id]`, `/settings`
6. Official template maintained by Supabase and Vercel teams

**Initialization Command:**

```bash
npx create-next-app@latest minstrel -e with-supabase
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
TypeScript with strict mode. Next.js 16 runtime with Turbopack (stable). Node.js server runtime for API routes and server components.

**Styling Solution:**
Tailwind CSS v4 configured. shadcn/ui initialized with component CLI. CSS variables for theming (dark mode first-class).

**Build Tooling:**
Turbopack for development (fast HMR). Webpack/SWC for production builds. Automatic code splitting, tree shaking, and lazy loading.

**Code Organization:**
App Router file-based routing. `app/` directory for routes and layouts. Middleware for auth session management. Server and client component separation via `'use client'` directives.

**Authentication:**
Supabase Auth with `@supabase/ssr` package. Cookie-based sessions. Middleware-level auth checking. Server-side session access in API routes and server components.

**Development Experience:**
Turbopack dev server with fast HMR. TypeScript type checking. ESLint configuration. Hot module replacement for instant feedback.

**What the Starter Does NOT Provide (Must Be Added):**
- Canvas/WebGL visualization layer (`src/components/viz/`)
- Web MIDI API integration layer
- Web Audio API integration layer
- AI service layer (API routes proxying to LLM provider)
- LLM API key management (encrypted storage, validation, multi-provider support)
- State management for real-time MIDI data pipeline
- Session recording and replay infrastructure
- Storybook for component development and a11y testing
- Testing framework (Vitest + React Testing Library + Playwright)
- CI/CD pipeline (axe-core deploy gate, eslint-plugin-jsx-a11y pre-commit, Lighthouse CI nightly)
- Custom shadcn/ui theme overrides (0px radius, dark palette, design tokens)

**Note:** Project initialization using this command should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
1. State management for real-time MIDI pipeline → Zustand 5.x
2. LLM integration approach → Vercel AI SDK 6.x (provider-agnostic, BYOK)
3. Client-side persistence for offline/recording → Dexie.js 4.x (IndexedDB)
4. Business model shift → Free with BYOK API keys (defers payment/gating)

**Important Decisions (Shape Architecture):**
5. Testing strategy → Vitest + React Testing Library + Playwright
6. Error tracking → Sentry (`@sentry/nextjs` 10.x)
7. Product analytics → PostHog
8. API patterns → Next.js API routes + Supabase client SDK

**Deferred Decisions (Post-MVP):**
- Payment processing (Stripe) — deferred until managed API key tier
- Feature gating (free/premium/trial) — deferred; all features available at MVP
- Transactional email service — deferred until account-heavy features needed

### Data Architecture

**Database: Supabase PostgreSQL**
- All persistent data in Supabase PostgreSQL
- Row Level Security (RLS) policies for per-user data isolation
- Supabase client SDK (`@supabase/supabase-js`) for all DB operations
- Supabase Realtime for cross-device session sync (post-MVP)

**Client-Side Persistence: Dexie.js 4.3.x (IndexedDB)**
- Primary storage for active session MIDI event recordings (100% capture integrity)
- Offline-first: sessions record locally, sync to Supabase when online
- Structured schema: sessions, MIDI events (time-series), snapshots, drill results
- Memory management: MIDI events stream to IndexedDB during recording, not held in memory
- Sync strategy: background upload of completed sessions to Supabase; conflict resolution by timestamp

**Data Model (Core Entities):**

| Entity | Storage | Notes |
|--------|---------|-------|
| User profile | Supabase | Auth + preferences + API key (encrypted) |
| Session metadata | Supabase + Dexie | Duration, key, tempo, summary stats |
| MIDI events | Dexie → Supabase | Time-series: timestamp, note, velocity, duration. Stream to IndexedDB, batch-sync to Supabase |
| Analysis snapshots | Supabase + Dexie | Session snapshots, key insights, generated by client-side analysis |
| Drill records | Supabase | Drill type, target, attempts, improvement deltas |
| Progress metrics | Supabase | Aggregated from sessions: accuracy trends, personal records, streaks |
| AI conversations | Supabase | Chat history per session, for coaching continuity |
| User API keys | Supabase (encrypted) | LLM provider API keys, encrypted at rest, never logged |

**Caching Strategy:**
- Supabase query caching via React Query / SWR for server data
- Zustand stores as in-memory cache for active session state
- Dexie as persistent cache for offline access to recent sessions
- No CDN caching needed (no static content beyond the app shell)

### Authentication & Security

**Authentication: Supabase Auth**
- Email + password at MVP (simplest path)
- OAuth providers (Google, GitHub) as quick follow-up
- Session management via `@supabase/ssr` with cookie-based sessions
- Next.js middleware for auth route protection
- Guest mode: MIDI analysis works without account; account required to persist data

**API Key Security (BYOK Model):**
- User LLM API keys stored encrypted in Supabase (AES-256 via `pgcrypto` or application-level encryption)
- Keys decrypted only in Next.js API routes (server-side) for LLM calls
- Keys never exposed to client-side code after initial submission
- Keys never logged, never included in error reports
- User can rotate/delete their API keys at any time

**Authorization:**
- Supabase RLS enforces per-user data isolation at the database level
- No cross-user data access possible even with API manipulation
- API routes validate session before processing requests
- Rate limiting: 100 requests/minute per authenticated user on API routes

**Data Privacy:**
- GDPR: data export endpoint, account deletion endpoint, consent tracking
- COPPA: age-gating at account creation (minimum 13)
- Session data treated as personal data
- API keys are the user's property — Minstrel is a passthrough, not a data processor for LLM interactions

### API & Communication Patterns

**API Architecture: Next.js API Routes**
- `/api/ai/chat` — Proxies to user's LLM provider for coaching chat
- `/api/ai/drill` — Proxies to user's LLM provider for drill generation
- `/api/ai/analyze` — Proxies for Difficulty Engine cross-session calibration
- `/api/session/sync` — Batch upload of session data from Dexie to Supabase
- `/api/user/keys` — CRUD for encrypted API keys

**LLM Integration: Vercel AI SDK 6.x**
- Provider-agnostic: supports Anthropic Claude, OpenAI GPT, and others
- Streaming responses for chat (AI SDK's `streamText`)
- Structured outputs for drill generation and analysis (`generateObject`)
- User's API key injected server-side per request
- Graceful error handling: clear messages for invalid/expired keys, rate limits, provider outages

**Communication Patterns:**
- Client → Supabase: Direct via `@supabase/supabase-js` (auth, DB queries, realtime)
- Client → API routes: `fetch` for AI features (chat, drills, analysis)
- No WebSocket server needed at MVP — all real-time is client-side MIDI processing
- Supabase Realtime available for future cross-device sync

**Error Handling Standards:**
- API routes return structured error responses: `{ error: string, code: string, details?: object }`
- Client-side errors caught at component boundaries (React Error Boundaries)
- AI errors distinguished: `INVALID_KEY`, `RATE_LIMITED`, `PROVIDER_DOWN`, `GENERATION_FAILED`
- Growth mindset in user-facing errors: "Could not generate drill right now. Try again in a moment." (never technical jargon)

### Frontend Architecture

**State Management: Zustand 5.x**

Three store architecture for separation of concerns:

| Store | Purpose | Update Frequency |
|-------|---------|-----------------|
| `midiStore` | Active MIDI events, connection status, current analysis | High (every MIDI event, ~ms) |
| `sessionStore` | Session metadata, mode, drill state, snapshot data | Medium (user actions, analysis results) |
| `appStore` | Auth state, user preferences, UI state, feature flags | Low (login, settings changes) |

**Critical pattern:** `midiStore` is subscribed to by the Canvas/WebGL layer **outside React** via Zustand's vanilla `subscribe` API. This prevents React re-renders on every MIDI event while keeping the visualization at 60fps.

```
MIDI Event → midiStore.setState() → Canvas subscribes directly (no React)
                                   → React components subscribe selectively (derived data only)
```

**Component Architecture:**
- Two-layer rendering: React (UI chrome) + Canvas/WebGL (visualization)
- Canvas components in `src/components/viz/` use `useRef` + direct Canvas API
- React components in `src/components/` use shadcn/ui primitives
- `'use client'` directive on all MIDI/Canvas/interactive components
- Server components for landing page and static content only

**Bundle Optimization:**
- Dynamic imports (`next/dynamic`) for mode-specific panels (Dashboard, Replay Studio)
- Canvas/WebGL code loaded only when MIDI device detected
- Supabase client tree-shaken to used modules only
- Target: <500KB gzipped initial load (excluding Canvas viz code, which lazy-loads)

### Infrastructure & Deployment

**Hosting: Vercel**
- Automatic deployments from `main` branch
- Preview deployments for pull requests
- Edge Functions for low-latency API routes (where applicable)
- Serverless functions for AI proxy routes

**CI/CD Pipeline:**
- GitHub Actions (or Vercel's built-in CI)
- Pre-commit: `eslint-plugin-jsx-a11y` + Prettier + TypeScript type checking
- On PR: Vitest unit tests + axe-core a11y checks + build verification
- On merge to main: Playwright E2E tests + Lighthouse CI (90+ a11y threshold) + deploy to production
- Nightly: Full Lighthouse CI audit + Storybook visual regression (when added)

**Environment Configuration:**
- `.env.local` for development (Supabase URL, publishable key)
- Vercel environment variables for production (no secrets in code)
- User API keys stored in Supabase, never in environment variables

**Monitoring:**
- Sentry (`@sentry/nextjs` 10.x): Error tracking, performance monitoring, source maps
- PostHog: Product analytics, user journeys, feature usage tracking
- Vercel Analytics: Web Vitals (FCP, LCP, CLS, FID)
- Custom MIDI latency monitoring: client-side performance metrics sent to PostHog

**Scaling Strategy:**
- MVP: Single Vercel deployment, single Supabase project
- 500→2,000 users: Supabase handles PostgreSQL scaling automatically
- 2,000→10,000 users: Evaluate Supabase Pro plan, consider read replicas for analytics queries
- Client-side MIDI processing means zero server load for core real-time features — scaling concern is primarily AI proxy and data sync

### Decision Impact Analysis

**Implementation Sequence:**
1. Next.js + Supabase starter initialization
2. Supabase schema + RLS policies
3. Zustand stores (midiStore, sessionStore, appStore)
4. Dexie.js schema + sync layer
5. Vercel AI SDK integration + API key management
6. Canvas/WebGL visualization layer
7. Sentry + PostHog integration
8. Testing infrastructure (Vitest + Playwright)
9. CI/CD pipeline

**Cross-Component Dependencies:**
- Zustand `midiStore` → Canvas/WebGL layer (direct subscription)
- Dexie.js ↔ Supabase (sync layer connects local and remote)
- Vercel AI SDK ← User API keys from Supabase (decrypted in API routes)
- Sentry wraps all layers (client errors, API route errors, React boundaries)
- PostHog tracks events across all components (analytics layer)

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**25+ potential conflict points identified** across naming, structure, format, communication, and process categories. These rules ensure all AI agents produce compatible, consistent code.

### Naming Patterns

**Database Naming (Supabase PostgreSQL):**

| Element | Convention | Example |
|---------|-----------|---------|
| Tables | `snake_case`, plural | `sessions`, `midi_events`, `drill_records`, `progress_metrics` |
| Columns | `snake_case` | `user_id`, `created_at`, `session_duration`, `timing_accuracy` |
| Primary keys | `id` (UUID) | `id uuid default gen_random_uuid()` |
| Foreign keys | `{table_singular}_id` | `session_id`, `user_id` |
| Indexes | `idx_{table}_{columns}` | `idx_sessions_user_id`, `idx_midi_events_session_id_timestamp` |
| Enums | `snake_case` | `session_mode`, `drill_status` |
| Timestamps | `{action}_at` | `created_at`, `updated_at`, `completed_at` |
| Booleans | `is_{adjective}` or `has_{noun}` | `is_active`, `has_account` |

**API Naming (Next.js API Routes):**

| Element | Convention | Example |
|---------|-----------|---------|
| Route files | `route.ts` in kebab-case dirs | `app/api/ai/chat/route.ts` |
| URL paths | kebab-case, plural nouns | `/api/ai/chat`, `/api/session/sync`, `/api/user/keys` |
| Query params | camelCase | `?sessionId=xxx&limit=50` |
| Request body | camelCase JSON | `{ "sessionId": "...", "midiEvents": [...] }` |
| Response body | camelCase JSON | `{ "data": { "drillId": "..." }, "error": null }` |

**Code Naming (TypeScript/React):**

| Element | Convention | Example |
|---------|-----------|---------|
| Files (components) | kebab-case `.tsx` | `drill-controller.tsx`, `status-bar.tsx` |
| Files (hooks) | kebab-case `use-*.ts` | `use-midi.ts`, `use-session.ts` |
| Files (utils) | kebab-case `.ts` | `midi-parser.ts`, `time-utils.ts` |
| Files (types) | kebab-case `.ts` | `session-types.ts`, `midi-types.ts` |
| Files (stores) | kebab-case `.ts` | `midi-store.ts`, `session-store.ts` |
| Files (tests) | `{name}.test.ts(x)` | `drill-controller.test.tsx`, `midi-parser.test.ts` |
| Components | PascalCase | `DrillController`, `StatusBar`, `InstantSnapshot` |
| Hooks | camelCase `use*` | `useMidi`, `useSession`, `useDrillState` |
| Functions | camelCase | `parseMidiEvent`, `calculateTimingAccuracy` |
| Variables | camelCase | `sessionDuration`, `midiEvents`, `currentKey` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_MIDI_LATENCY_MS`, `DEFAULT_TEMPO` |
| Types/Interfaces | PascalCase | `MidiEvent`, `SessionSnapshot`, `DrillResult` |
| Enums | PascalCase members | `SessionMode.SilentCoach`, `DrillPhase.Demonstrate` |
| Zustand stores | camelCase `use*Store` | `useMidiStore`, `useSessionStore`, `useAppStore` |

### Structure Patterns

**Project Organization (Feature-Based with Co-Located Tests):**

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth-required routes (group)
│   │   ├── session/              # /session
│   │   ├── replay/[id]/          # /replay/:id
│   │   └── settings/             # /settings
│   ├── (marketing)/              # Public routes (group)
│   │   └── page.tsx              # Landing page (SSR)
│   ├── api/                      # API routes
│   │   ├── ai/chat/route.ts
│   │   ├── ai/drill/route.ts
│   │   ├── ai/analyze/route.ts
│   │   ├── session/sync/route.ts
│   │   └── user/keys/route.ts
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles + Tailwind
├── components/
│   ├── ui/                       # shadcn/ui components (restyled)
│   └── viz/                      # Canvas/WebGL visualization components
├── features/
│   ├── midi/                     # MIDI engine
│   │   ├── midi-engine.ts
│   │   ├── midi-parser.ts
│   │   ├── midi-output.ts
│   │   ├── use-midi.ts
│   │   ├── midi-types.ts
│   │   ├── midi-engine.test.ts
│   │   └── midi-parser.test.ts
│   ├── analysis/                 # Real-time analysis
│   │   ├── note-detector.ts
│   │   ├── chord-analyzer.ts
│   │   ├── timing-analyzer.ts
│   │   └── ...
│   ├── session/                  # Session management
│   │   ├── session-manager.ts
│   │   ├── session-recorder.ts
│   │   ├── use-session.ts
│   │   └── ...
│   ├── ai/                       # AI integration
│   │   ├── ai-client.ts
│   │   ├── drill-generator.ts
│   │   ├── coaching-chat.ts
│   │   ├── difficulty-engine.ts
│   │   └── ...
│   ├── auth/                     # Authentication
│   │   ├── auth-provider.tsx
│   │   ├── use-auth.ts
│   │   └── ...
│   └── engagement/               # Streaks, XP, achievements
│       ├── streak-tracker.ts
│       ├── achievement-engine.ts
│       └── ...
├── stores/                       # Zustand stores
│   ├── midi-store.ts
│   ├── session-store.ts
│   └── app-store.ts
├── lib/                          # Shared utilities
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   ├── server.ts             # Server Supabase client
│   │   └── middleware.ts         # Auth middleware helper
│   ├── dexie/
│   │   ├── db.ts                 # Dexie database schema
│   │   └── sync.ts               # Dexie → Supabase sync
│   ├── utils.ts                  # General utilities (cn, etc.)
│   └── constants.ts              # App-wide constants
└── types/                        # Shared type definitions
    ├── database.ts               # Supabase generated types
    ├── midi.ts                   # MIDI-related types
    └── api.ts                    # API request/response types
```

**Co-Located Test Rules:**
- Test files live next to the code they test: `midi-engine.test.ts` beside `midi-engine.ts`
- Component tests: `drill-controller.test.tsx` beside `drill-controller.tsx`
- E2E tests in a top-level `e2e/` directory (Playwright)
- Test utilities in `src/test-utils/`

**Import Rules:**
- Use `@/` path alias for all imports from `src/` (configured by starter)
- Never use relative imports that go up more than one level (no `../../..`)
- Import order: React → external packages → `@/` internal → relative → types
- Barrel exports (`index.ts`) only for feature folders, never for `components/ui/`

### Format Patterns

**API Response Format:**

```typescript
// Success response
type ApiResponse<T> = {
  data: T;
  error: null;
};

// Error response
type ApiErrorResponse = {
  data: null;
  error: {
    code: string;       // Machine-readable: 'INVALID_KEY', 'RATE_LIMITED', etc.
    message: string;    // Human-readable (growth mindset language)
  };
};

// AI streaming responses use Vercel AI SDK format (not this envelope)
```

**Standard Error Codes:**

| Code | HTTP Status | Usage |
|------|------------|-------|
| `UNAUTHORIZED` | 401 | No valid session |
| `FORBIDDEN` | 403 | Valid session but insufficient permissions |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `INVALID_KEY` | 400 | User's LLM API key is invalid or expired |
| `RATE_LIMITED` | 429 | Too many requests |
| `PROVIDER_DOWN` | 502 | LLM provider unavailable |
| `GENERATION_FAILED` | 500 | AI generation failed |
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `SYNC_CONFLICT` | 409 | Dexie → Supabase sync conflict |

**Date/Time Format:**
- Database: PostgreSQL `timestamptz` (UTC)
- API JSON: ISO 8601 strings (`"2026-02-12T14:30:00.000Z"`)
- Client display: Relative ("2 hours ago") or locale-formatted via `Intl.DateTimeFormat`
- MIDI timestamps: `performance.now()` (DOMHighResTimeStamp, milliseconds)

**JSON Conventions:**
- All JSON fields: `camelCase`
- Null over undefined for absent values in API responses
- Empty arrays `[]` over null for empty collections
- Boolean fields always explicit `true`/`false`, never truthy/falsy

### Communication Patterns

**Zustand State Update Patterns:**

```typescript
// CORRECT: Immutable updates via set()
useMidiStore.setState((state) => ({
  events: [...state.events, newEvent],
}));

// CORRECT: Direct set for simple values
useMidiStore.setState({ isConnected: true });

// WRONG: Never mutate state directly
// state.events.push(newEvent);
```

**Zustand Selector Patterns:**

```typescript
// CORRECT: Select only what you need (prevents unnecessary re-renders)
const isConnected = useMidiStore((s) => s.isConnected);

// CORRECT: Derived data with shallow equality
const stats = useSessionStore(
  (s) => ({ accuracy: s.accuracy, tempo: s.tempo }),
  shallow
);

// WRONG: Selecting entire store
// const store = useMidiStore();
```

**Canvas/Zustand Integration:**

```typescript
// CORRECT: Subscribe outside React for 60fps visualization
const unsubscribe = useMidiStore.subscribe(
  (state) => state.currentEvents,
  (events) => renderToCanvas(events)  // Direct Canvas API call
);

// WRONG: Using React component for real-time visualization
// Never: useEffect(() => { draw(events) }, [events]);
```

**Event Naming (Dexie/Supabase sync events):**

| Event | Format | Example |
|-------|--------|---------|
| Sync events | `sync:{entity}:{action}` | `sync:session:uploaded`, `sync:events:batched` |
| MIDI events | `midi:{action}` | `midi:connected`, `midi:note-on`, `midi:disconnected` |
| Session events | `session:{action}` | `session:started`, `session:paused`, `session:ended` |
| Analysis events | `analysis:{type}` | `analysis:snapshot`, `analysis:insight` |

### Process Patterns

**Error Handling:**

```typescript
// API routes: Always catch and return structured errors
export async function POST(request: Request) {
  try {
    // ... logic
    return Response.json({ data: result, error: null });
  } catch (error) {
    if (error instanceof ApiKeyError) {
      return Response.json(
        { data: null, error: { code: 'INVALID_KEY', message: 'Check your API key in settings.' } },
        { status: 400 }
      );
    }
    // Log to Sentry, return generic error
    Sentry.captureException(error);
    return Response.json(
      { data: null, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Try again.' } },
      { status: 500 }
    );
  }
}
```

**React Error Boundaries:**
- One Error Boundary per mode (Silent Coach, Dashboard, Replay Studio)
- Canvas visualization has its own Error Boundary (prevents viz crash from killing the whole app)
- Error Boundary UI shows growth mindset message + retry button
- All errors reported to Sentry from boundary `componentDidCatch`

**Loading State Patterns:**
- Use a `status` field in Zustand stores: `'idle' | 'loading' | 'success' | 'error'`
- Never use separate boolean flags (`isLoading`, `isError`) — use discriminated status
- AI streaming responses show typing indicator (3 dots) immediately, content streams in
- Canvas never shows loading states during active play — processing must be <50ms

**Validation Patterns:**
- Zod schemas for all API route request validation
- Shared Zod schemas between client and server (in `src/types/`)
- Validate at the boundary (API route entry), trust internally
- Client-side form validation via Zod + React Hook Form (for settings/account forms)

### Enforcement Guidelines

**All AI Agents MUST:**
1. Follow kebab-case file naming and PascalCase component naming without exception
2. Place new code in the appropriate feature folder, never create new top-level directories
3. Use the `ApiResponse<T>` envelope for all non-streaming API responses
4. Subscribe to Zustand stores with selectors, never select the entire store
5. Use `'use client'` directive on any component that uses hooks, browser APIs, or interactivity
6. Write co-located tests for any new feature logic (`.test.ts` beside the source file)
7. Use Supabase client from `@/lib/supabase/client.ts` (browser) or `@/lib/supabase/server.ts` (server) — never instantiate directly
8. Report errors to Sentry and return growth mindset user-facing messages
9. Use `@/` import alias for all cross-feature imports
10. Never use red/error styling for musical performance feedback — amber only

**Pattern Enforcement:**
- ESLint rules enforce import order and naming conventions
- TypeScript strict mode catches type violations
- PR reviews (human or AI) check pattern compliance
- axe-core in CI catches accessibility pattern violations

## Project Structure & Boundaries

### Complete Project Directory Structure

```
minstrel/
├── .env.example                      # Environment variable template
├── .env.local                        # Local dev environment (gitignored)
├── .eslintrc.json                    # ESLint config (incl. jsx-a11y)
├── .gitignore
├── .github/
│   └── workflows/
│       ├── ci.yml                    # PR checks: lint, typecheck, test, axe-core
│       ├── deploy.yml                # Main branch: E2E + Lighthouse CI + deploy
│       └── nightly.yml               # Nightly: full Lighthouse audit
├── .husky/
│   └── pre-commit                    # lint-staged + eslint-plugin-jsx-a11y
├── .prettierrc                       # Prettier config
├── README.md
├── components.json                   # shadcn/ui CLI config
├── next.config.ts                    # Next.js 16 configuration
├── package.json
├── pnpm-lock.yaml
├── postcss.config.js                 # PostCSS for Tailwind
├── tailwind.config.ts                # Tailwind v4 + design tokens
├── tsconfig.json                     # TypeScript strict mode
├── vitest.config.ts                  # Vitest configuration
├── playwright.config.ts              # Playwright E2E config
├── sentry.client.config.ts           # Sentry browser init
├── sentry.server.config.ts           # Sentry server init
├── supabase/
│   ├── config.toml                   # Supabase local dev config
│   └── migrations/
│       ├── 001_users.sql             # User profiles + preferences
│       ├── 002_api_keys.sql          # Encrypted LLM API key storage
│       ├── 003_sessions.sql          # Session metadata
│       ├── 004_midi_events.sql       # MIDI event time-series
│       ├── 005_analysis_snapshots.sql # Session analysis snapshots
│       ├── 006_drill_records.sql     # Drill attempts + results
│       ├── 007_progress_metrics.sql  # Aggregated progress data
│       ├── 008_ai_conversations.sql  # AI chat history per session
│       ├── 009_achievements.sql      # Achievement definitions + unlocks
│       └── 010_rls_policies.sql      # Row Level Security for all tables
├── e2e/
│   ├── session-flow.spec.ts          # Full session happy path
│   ├── midi-connection.spec.ts       # MIDI connect/troubleshoot
│   ├── api-key-setup.spec.ts         # BYOK onboarding flow
│   ├── replay-studio.spec.ts         # Replay and timeline
│   └── fixtures/
│       ├── mock-midi-device.ts       # Mock Web MIDI API
│       └── mock-ai-responses.ts      # Mock LLM responses
├── public/
│   ├── fonts/
│   │   ├── inter-variable.woff2      # Inter variable font
│   │   └── jetbrains-mono-variable.woff2  # JetBrains Mono variable font
│   ├── icons/                        # App icons, favicons
│   └── og-image.png                  # Social sharing image
└── src/
    ├── app/
    │   ├── globals.css               # Tailwind directives + design tokens
    │   ├── layout.tsx                # Root layout (fonts, providers, Sentry)
    │   ├── not-found.tsx             # 404 page
    │   ├── error.tsx                 # Global error boundary
    │   ├── (marketing)/
    │   │   ├── layout.tsx            # Marketing layout (SSR)
    │   │   └── page.tsx              # Landing page (SEO-optimized)
    │   ├── (auth)/
    │   │   ├── layout.tsx            # Auth-required layout + middleware
    │   │   ├── session/
    │   │   │   └── page.tsx          # /session — main practice view
    │   │   ├── replay/
    │   │   │   └── [id]/
    │   │   │       └── page.tsx      # /replay/:id — session replay
    │   │   └── settings/
    │   │       └── page.tsx          # /settings — user prefs + API keys
    │   ├── (guest)/
    │   │   └── play/
    │   │       └── page.tsx          # /play — guest MIDI mode (no AI)
    │   └── api/
    │       ├── ai/
    │       │   ├── chat/
    │       │   │   └── route.ts      # POST: streaming AI coaching chat
    │       │   ├── drill/
    │       │   │   └── route.ts      # POST: drill generation
    │       │   └── analyze/
    │       │       └── route.ts      # POST: Difficulty Engine calibration
    │       ├── session/
    │       │   └── sync/
    │       │       └── route.ts      # POST: batch upload Dexie → Supabase
    │       └── user/
    │           └── keys/
    │               └── route.ts      # GET/POST/DELETE: API key CRUD
    ├── components/
    │   ├── ui/                       # shadcn/ui (source-owned, restyled)
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── dialog.tsx
    │   │   ├── input.tsx
    │   │   ├── select.tsx
    │   │   ├── tabs.tsx
    │   │   ├── toast.tsx
    │   │   ├── tooltip.tsx
    │   │   ├── badge.tsx
    │   │   ├── progress.tsx
    │   │   ├── scroll-area.tsx
    │   │   └── separator.tsx
    │   └── viz/                      # Canvas/WebGL visualization
    │       ├── visualization-canvas.tsx    # P0: Main Canvas wrapper
    │       ├── visualization-canvas.test.tsx
    │       ├── piano-roll-renderer.ts      # Piano roll visualization
    │       ├── timing-grid-renderer.ts     # Timing accuracy grid
    │       ├── harmonic-overlay-renderer.ts # Chord tone vs passing tone
    │       └── canvas-utils.ts             # Shared Canvas helpers
    ├── features/
    │   ├── midi/
    │   │   ├── index.ts              # Barrel export
    │   │   ├── midi-engine.ts        # WebMIDI init, device management
    │   │   ├── midi-engine.test.ts
    │   │   ├── midi-parser.ts        # Raw MIDI → structured events
    │   │   ├── midi-parser.test.ts
    │   │   ├── midi-output.ts        # MIDI output for demonstrations
    │   │   ├── midi-output.test.ts
    │   │   ├── use-midi.ts           # React hook for MIDI state
    │   │   ├── midi-types.ts         # MIDI-specific types
    │   │   └── troubleshooting.ts    # Connection diagnostics
    │   ├── analysis/
    │   │   ├── index.ts
    │   │   ├── note-detector.ts      # Single note identification
    │   │   ├── note-detector.test.ts
    │   │   ├── chord-analyzer.ts     # Chord detection + quality
    │   │   ├── chord-analyzer.test.ts
    │   │   ├── timing-analyzer.ts    # Timing accuracy measurement
    │   │   ├── timing-analyzer.test.ts
    │   │   ├── harmonic-analyzer.ts  # Key detection, progression mapping
    │   │   ├── harmonic-analyzer.test.ts
    │   │   ├── tendency-tracker.ts   # Comfort zone / avoidance patterns
    │   │   ├── tendency-tracker.test.ts
    │   │   ├── genre-detector.ts     # Genre-specific pattern recognition
    │   │   ├── snapshot-generator.ts # Session snapshot creation (FR13)
    │   │   └── analysis-types.ts     # Analysis-specific types
    │   ├── difficulty/
    │   │   ├── index.ts
    │   │   ├── difficulty-engine.ts  # Core adaptive algorithm
    │   │   ├── difficulty-engine.test.ts
    │   │   ├── skill-assessor.ts     # Multi-dimensional skill scoring
    │   │   ├── skill-assessor.test.ts
    │   │   ├── growth-zone-detector.ts # Boredom/frustration detection
    │   │   ├── growth-zone-detector.test.ts
    │   │   ├── progressive-overload.ts # Incremental difficulty adjustment
    │   │   └── difficulty-types.ts   # Difficulty-specific types
    │   ├── drills/
    │   │   ├── index.ts
    │   │   ├── drill-generator.ts    # Client-side drill request builder
    │   │   ├── drill-generator.test.ts
    │   │   ├── drill-player.ts       # MIDI output drill demonstration
    │   │   ├── drill-tracker.ts      # Drill attempt tracking + scoring
    │   │   ├── drill-tracker.test.ts
    │   │   └── drill-types.ts        # Drill-specific types
    │   ├── coaching/
    │   │   ├── index.ts
    │   │   ├── coaching-client.ts    # AI chat client (Vercel AI SDK)
    │   │   ├── coaching-client.test.ts
    │   │   ├── context-builder.ts    # Session context for AI prompts
    │   │   ├── context-builder.test.ts
    │   │   └── coaching-types.ts     # Coaching-specific types
    │   ├── modes/
    │   │   ├── index.ts
    │   │   ├── silent-coach.tsx      # Silent Coach mode layout
    │   │   ├── silent-coach.test.tsx
    │   │   ├── dashboard-chat.tsx    # Dashboard + Chat mode layout
    │   │   ├── dashboard-chat.test.tsx
    │   │   ├── replay-studio.tsx     # Replay Studio mode layout
    │   │   ├── replay-studio.test.tsx
    │   │   ├── mode-switcher.tsx     # P0: Mode transition component
    │   │   └── mode-types.ts         # Mode-specific types
    │   ├── session/
    │   │   ├── index.ts
    │   │   ├── session-manager.ts    # Session lifecycle (start/pause/end)
    │   │   ├── session-manager.test.ts
    │   │   ├── session-recorder.ts   # MIDI event → Dexie recording
    │   │   ├── session-recorder.test.ts
    │   │   ├── warmup-generator.ts   # Auto-generated warm-ups (FR36)
    │   │   ├── use-session.ts        # React hook for session state
    │   │   └── session-types.ts      # Session-specific types
    │   ├── engagement/
    │   │   ├── index.ts
    │   │   ├── streak-tracker.ts     # Daily practice streak logic
    │   │   ├── streak-tracker.test.ts
    │   │   ├── xp-calculator.ts      # XP award logic
    │   │   ├── achievement-engine.ts # Achievement unlock logic
    │   │   ├── achievement-engine.test.ts
    │   │   ├── progress-aggregator.ts # Progress trend computation
    │   │   └── engagement-types.ts   # Engagement-specific types
    │   └── auth/
    │       ├── index.ts
    │       ├── auth-provider.tsx     # Supabase auth context provider
    │       ├── use-auth.ts           # React hook for auth state
    │       ├── api-key-manager.ts    # API key CRUD client
    │       ├── api-key-manager.test.ts
    │       └── auth-types.ts         # Auth-specific types
    ├── stores/
    │   ├── midi-store.ts             # High-frequency MIDI state
    │   ├── midi-store.test.ts
    │   ├── session-store.ts          # Session metadata + drill state
    │   ├── session-store.test.ts
    │   ├── app-store.ts              # Auth, preferences, UI state
    │   └── app-store.test.ts
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts             # Browser Supabase client
    │   │   ├── server.ts             # Server Supabase client
    │   │   └── middleware.ts         # Auth middleware helper
    │   ├── dexie/
    │   │   ├── db.ts                 # Dexie database schema
    │   │   ├── db.test.ts
    │   │   ├── sync.ts              # Dexie → Supabase sync engine
    │   │   └── sync.test.ts
    │   ├── ai/
    │   │   ├── provider.ts           # Vercel AI SDK provider setup
    │   │   ├── prompts.ts            # System prompts for coaching/drills
    │   │   └── schemas.ts            # Zod schemas for structured AI output
    │   ├── crypto.ts                 # API key encryption/decryption
    │   ├── utils.ts                  # General utilities (cn, etc.)
    │   └── constants.ts              # App-wide constants
    ├── types/
    │   ├── database.ts               # Supabase generated types
    │   ├── midi.ts                   # Shared MIDI types
    │   └── api.ts                    # API request/response types
    ├── test-utils/
    │   ├── render.tsx                # Custom render with providers
    │   ├── midi-fixtures.ts          # Mock MIDI event data
    │   └── session-fixtures.ts       # Mock session data
    └── middleware.ts                  # Next.js middleware (auth)
```

### Architectural Boundaries

**5-Layer Architecture:**

```
┌─────────────────────────────────────────────────────┐
│  Layer 1: Presentation                               │
│  React components (shadcn/ui) + Canvas/WebGL viz     │
│  src/app/, src/components/, src/features/modes/      │
├─────────────────────────────────────────────────────┤
│  Layer 2: Application Logic                          │
│  Zustand stores, React hooks, mode orchestration     │
│  src/stores/, src/features/*/use-*.ts                │
├─────────────────────────────────────────────────────┤
│  Layer 3: Domain Logic                               │
│  MIDI engine, analysis, difficulty, drills, coaching │
│  src/features/midi/, analysis/, difficulty/, drills/ │
├─────────────────────────────────────────────────────┤
│  Layer 4: Infrastructure                             │
│  Supabase client, Dexie.js, Vercel AI SDK, Sentry   │
│  src/lib/, src/app/api/                              │
├─────────────────────────────────────────────────────┤
│  Layer 5: External Services                          │
│  Supabase (DB/Auth), LLM providers, PostHog          │
│  Managed services — no project code                  │
└─────────────────────────────────────────────────────┘
```

**Boundary Rules:**
- Layer 1 may only import from Layers 2 and 3 (never directly from Layer 4)
- Layer 2 orchestrates between Layers 1 and 3
- Layer 3 contains pure domain logic — no framework imports, no UI, no infrastructure
- Layer 4 is accessed only through `src/lib/` wrappers — no direct Supabase/Dexie calls from features
- Layer 5 is never accessed directly from project code — always through Layer 4

### Data Flow Architecture

```
MIDI Device
    │
    ▼
Web MIDI API (Layer 5)
    │
    ▼
midi-engine.ts (Layer 3) ──► midiStore (Layer 2) ──┬──► Canvas/viz (Layer 1)
    │                                                │    (direct subscribe,
    │                                                │     no React cycle)
    │                                                │
    │                                                └──► React UI (Layer 1)
    │                                                     (selective selectors)
    ▼
analysis/* (Layer 3)
    │
    ├──► snapshot-generator ──► sessionStore (Layer 2) ──► UI components
    │
    ├──► difficulty-engine ──┬──► sessionStore (in-session adaptation)
    │                        └──► API route /ai/analyze (cross-session calibration)
    │                                  │
    │                                  ▼
    │                             LLM Provider (Layer 5)
    │
    └──► session-recorder ──► Dexie.js (Layer 4)
                                  │
                                  ▼ (background sync)
                             Supabase (Layer 5)
```

### Requirements to Structure Mapping

| FR Category | FRs | Primary Directory | Supporting Directories |
|-------------|-----|-------------------|----------------------|
| **MIDI & Audio Input** | FR1-FR7 | `src/features/midi/` | `src/stores/midi-store.ts`, `src/components/viz/` |
| **Real-Time Analysis** | FR8-FR13 | `src/features/analysis/` | `src/stores/session-store.ts`, `src/components/viz/` |
| **Difficulty Engine** | FR14-FR18 | `src/features/difficulty/` | `src/app/api/ai/analyze/`, `src/stores/session-store.ts` |
| **AI Drills & Demo** | FR19-FR23 | `src/features/drills/` | `src/app/api/ai/drill/`, `src/features/midi/midi-output.ts` |
| **AI Coaching Chat** | FR24-FR28 | `src/features/coaching/` | `src/app/api/ai/chat/`, `src/lib/ai/` |
| **Interaction Modes** | FR29-FR33 | `src/features/modes/` | `src/components/viz/`, `src/app/(auth)/session/` |
| **Session Management** | FR34-FR39 | `src/features/session/` | `src/lib/dexie/`, `src/stores/session-store.ts` |
| **Engagement & Progress** | FR40-FR44 | `src/features/engagement/` | `src/stores/app-store.ts`, `supabase/migrations/009_achievements.sql` |
| **Accounts & API Keys** | FR45-FR50 | `src/features/auth/` | `src/app/api/user/keys/`, `src/lib/crypto.ts`, `src/app/(guest)/` |

### External Integrations

| Service | Integration Point | Data Flow | Failure Mode |
|---------|-------------------|-----------|-------------|
| **Web MIDI API** | `src/features/midi/midi-engine.ts` | Bidirectional: note input + demonstration output | Troubleshooting UI → audio fallback |
| **Web Audio API** | `src/features/midi/` (audio fallback) | Input only: dynamics/volume via laptop mic | Degraded analysis (pitch only) |
| **Supabase Auth** | `src/lib/supabase/`, `src/middleware.ts` | Auth tokens via cookies | Guest mode continues; account features disabled |
| **Supabase PostgreSQL** | `src/lib/supabase/client.ts`, `server.ts` | CRUD for all persistent data | Dexie.js continues locally; sync queues |
| **LLM Providers** | `src/app/api/ai/*` via Vercel AI SDK | User's API key → streaming responses | "Connect API key" prompt; MIDI features unaffected |
| **Sentry** | `sentry.client.config.ts`, `sentry.server.config.ts` | Error reports + performance traces | Silent failure — monitoring degrades, app unaffected |
| **PostHog** | `src/lib/` (analytics wrapper) | Event tracking + user properties | Silent failure — analytics stop, app unaffected |

### Development Workflow Integration

**Local Development:**
- `pnpm dev` — Turbopack dev server with fast HMR
- `supabase start` — Local Supabase instance (Docker)
- MIDI testing requires physical device or Web MIDI API mock (`e2e/fixtures/mock-midi-device.ts`)

**Build Process:**
- `pnpm build` — Next.js production build (SWC compilation, tree shaking, code splitting)
- `pnpm test` — Vitest unit + integration tests
- `pnpm test:e2e` — Playwright E2E tests
- `pnpm lint` — ESLint + jsx-a11y checks

**Deployment:**
- Push to `main` → Vercel auto-deploys
- PR → Vercel preview deployment + CI checks
- Supabase migrations applied via `supabase db push` (linked project)

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:**
All technology choices are compatible and well-integrated. Next.js 16 + Supabase official template provides the foundation. Zustand 5.x integrates cleanly with both React components and Canvas via vanilla `subscribe`. Vercel AI SDK 6.x works natively with Next.js API routes for the BYOK model. Dexie.js 4.x for IndexedDB pairs with Supabase PostgreSQL via a background sync layer. shadcn/ui is source-owned and restyled — no version conflicts possible. Sentry + PostHog are standalone SDKs with no inter-dependency. No version conflicts detected across the stack.

**Pattern Consistency:**
Naming conventions are consistent across all areas: kebab-case files, PascalCase components, snake_case DB, camelCase API JSON — all clearly delineated. The `ApiResponse<T>` envelope covers all non-streaming endpoints; AI streaming uses Vercel AI SDK format. Zustand patterns (selectors, immutable updates, Canvas subscription) are documented with correct/wrong examples. Import rules (`@/` alias, one-level-up max) prevent circular dependencies.

**Structure Alignment:**
The 5-layer architecture maps cleanly to the project directory structure. Feature-based organization with co-located tests is fully realized in the directory tree. Boundary rules (Layer 3 has no framework imports, Layer 4 accessed only through `src/lib/`) are enforceable via ESLint. No contradictions found.

### Requirements Coverage Validation

**Functional Requirements — All 50 FRs covered:**

| FR Category | FRs | Coverage | Primary Directory |
|-------------|-----|----------|-------------------|
| MIDI & Audio Input | FR1-7 | Full | `src/features/midi/` |
| Real-Time Analysis | FR8-13 | Full | `src/features/analysis/` |
| Difficulty Engine | FR14-18 | Full | `src/features/difficulty/` + `/api/ai/analyze` |
| AI Drills & Demo | FR19-23 | Full | `src/features/drills/` + `/api/ai/drill` |
| AI Coaching Chat | FR24-28 | Full | `src/features/coaching/` + `/api/ai/chat` |
| Interaction Modes | FR29-33 | Full | `src/features/modes/` |
| Session Management | FR34-39 | Full | `src/features/session/` + Dexie |
| Engagement & Progress | FR40-44 | Full | `src/features/engagement/` |
| Accounts & API Keys | FR45-50 | Full | `src/features/auth/` + `/api/user/keys` |

**Non-Functional Requirements:**

| NFR | Architectural Support | Status |
|-----|----------------------|--------|
| <50ms MIDI latency | Client-side processing in Layer 3, no server round-trip | Covered |
| 60fps visualization | Canvas/WebGL layer with Zustand vanilla subscribe (bypasses React) | Covered |
| <500KB gzipped bundle | Dynamic imports for modes, lazy Canvas loading | Covered |
| <200MB memory / 30min | MIDI events stream to Dexie/IndexedDB, not held in memory | Covered |
| 99.5% uptime | Vercel managed hosting + client-side offline resilience | Covered |
| 100% recording integrity | Dexie.js local-first with background sync | Covered |
| GDPR / COPPA | Age-gating, data export/deletion endpoints, RLS per-user isolation | Covered |
| WCAG 2.1 AA | axe-core deploy gate, eslint-plugin-jsx-a11y pre-commit, Lighthouse CI nightly | Covered |
| API key security | AES-256 encryption in Supabase, server-side-only decryption, never logged | Covered |

### Implementation Readiness Validation

**Decision Completeness:**
All critical decisions documented with specific library versions. Implementation patterns include code examples for Zustand, API routes, error handling, and Canvas integration. Ten enforcement rules for AI agents are clear and actionable.

**Structure Completeness:**
Full directory tree with ~120 files specified. Every file has a comment explaining its purpose. All integration points clearly specified (API routes, Supabase, Dexie, LLM providers).

**Pattern Completeness:**
Naming, structure, format, communication, and process patterns all documented. Standard error codes defined. Date/time format conventions specified. Zod validation at boundaries documented.

### Gap Analysis Results

**Critical Gaps:** None. All 50 FRs and all NFRs are architecturally supported.

**Important Gaps (non-blocking, addressable during implementation):**

1. **Environment variable inventory** — `.env.example` is listed but specific variable names aren't enumerated. First implementation story should define the complete list (SUPABASE_URL, SUPABASE_ANON_KEY, SENTRY_DSN, NEXT_PUBLIC_POSTHOG_KEY, etc.).

2. **Supabase migration detail** — Migration files are listed but table schemas aren't fully specified (column types, indexes, RLS policies). Schema detail belongs in epic stories, not the architecture doc.

3. **AI prompt engineering** — `src/lib/ai/prompts.ts` is listed but system prompt content isn't specified. Growth mindset framing, genre-awareness, and session context injection patterns should be defined during the coaching epic implementation.

**Nice-to-Have Gaps:**

4. **Storybook setup** — Referenced in CI/CD (nightly visual regression) but not in the project tree. Can be added when component library matures.

5. **Token usage estimation** — FR50 requires transparent token/cost display. Architecture supports it (Vercel AI SDK provides token counts), but no specific component is listed for estimation logic. Can be co-located in `src/features/coaching/` during implementation.

### Validation Issues Addressed

No critical or blocking issues were found during validation. All architectural decisions are coherent, all requirements have explicit structural support, and implementation patterns are comprehensive enough for AI agent consistency.

### Architecture Completeness Checklist

**Requirements Analysis**

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped
- [x] UX-mandated constraints incorporated

**Architectural Decisions**

- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed
- [x] BYOK model fully architectured

**Implementation Patterns**

- [x] Naming conventions established (DB, API, code)
- [x] Structure patterns defined (feature-based, co-located tests)
- [x] Communication patterns specified (Zustand, Canvas, events)
- [x] Process patterns documented (error handling, loading, validation)
- [x] Enforcement guidelines for AI agents defined

**Project Structure**

- [x] Complete directory structure defined (~120 files)
- [x] Component boundaries established (5-layer architecture)
- [x] Integration points mapped (6 external services)
- [x] Requirements-to-structure mapping complete (all 50 FRs)

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — all requirements covered, no critical gaps, patterns are comprehensive with code examples.

**Key Strengths:**
1. The two-layer rendering architecture (React + Canvas) solves the core performance challenge cleanly
2. BYOK model is fully architectured with secure key handling and graceful degradation
3. Offline-first via Dexie.js ensures 100% recording integrity
4. Feature-based organization with co-located tests keeps the codebase navigable as it grows
5. The 5-layer boundary system prevents architectural erosion

**Areas for Future Enhancement:**
1. WebSocket server for real-time cross-device sync (post-MVP)
2. Storybook integration for component library documentation
3. Advanced caching strategy if query load increases beyond Supabase free tier

### Implementation Handoff

**AI Agent Guidelines:**

- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and 5-layer boundaries
- Refer to this document for all architectural questions

**First Implementation Priority:**

```bash
npx create-next-app@latest minstrel -e with-supabase
```
