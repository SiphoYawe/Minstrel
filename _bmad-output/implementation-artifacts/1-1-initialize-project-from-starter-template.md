# Story 1.1: Initialize Project from Starter Template

Status: done

## Story

As a developer,
I want the Minstrel project initialized from the Next.js 16 + Supabase official template with all foundational tooling configured,
So that all subsequent stories have a consistent, working codebase to build upon.

## Acceptance Criteria

1. **Given** the Architecture specifies `npx create-next-app@latest minstrel -e with-supabase`, **When** the project is initialized, **Then** Next.js 16 with App Router, TypeScript strict mode, Tailwind CSS v4, and Supabase Auth (`@supabase/ssr`) are configured and the dev server starts without errors.

2. **Given** the Architecture defines a feature-based directory structure, **When** the project scaffold is complete, **Then** all directories exist: `src/features/midi/`, `src/features/analysis/`, `src/features/session/`, `src/features/auth/`, `src/features/engagement/`, `src/features/difficulty/`, `src/features/drills/`, `src/features/coaching/`, `src/features/modes/`, `src/components/ui/`, `src/components/viz/`, `src/stores/`, `src/lib/supabase/`, `src/lib/dexie/`, `src/lib/ai/`, `src/types/`, `src/test-utils/`, `e2e/fixtures/`, `public/fonts/`, `public/icons/`, and `supabase/migrations/`.

3. **Given** the Architecture requires Zustand 5.x with 3 stores (AR2), **When** dependencies are installed, **Then** `zustand` 5.x is in `package.json` and empty store files exist at `src/stores/midi-store.ts`, `src/stores/session-store.ts`, and `src/stores/app-store.ts` with typed skeleton exports.

4. **Given** the Architecture requires Vitest + React Testing Library + Playwright (AR9), **When** testing tooling is configured, **Then** `vitest.config.ts` is created with `@/` path alias support, `jsdom` environment, and coverage thresholds; `playwright.config.ts` is created targeting Chrome; `@testing-library/react` and `@testing-library/jest-dom` are installed; and `pnpm test` and `pnpm test:e2e` scripts run successfully.

5. **Given** the Architecture requires ESLint with `eslint-plugin-jsx-a11y` and Prettier, **When** linting is configured, **Then** `.eslintrc.json` includes `plugin:jsx-a11y/recommended`, Prettier is configured via `.prettierrc`, and `pnpm lint` passes on the starter code.

6. **Given** the Architecture requires Sentry 10.x (AR6), **When** Sentry is installed, **Then** `@sentry/nextjs` 10.x is in `package.json`, `sentry.client.config.ts` and `sentry.server.config.ts` exist with placeholder DSN from env, and `next.config.ts` includes Sentry webpack plugin configuration.

7. **Given** the Architecture requires PostHog (AR7), **When** PostHog is installed, **Then** `posthog-js` is in `package.json` and a basic analytics wrapper exists at `src/lib/analytics.ts` with `init()`, `capture()`, and `identify()` functions that read from `NEXT_PUBLIC_POSTHOG_KEY` env var.

8. **Given** the Architecture requires pre-commit hooks (AR8), **When** Husky is configured, **Then** `husky` and `lint-staged` are installed, `.husky/pre-commit` runs `lint-staged`, and `lint-staged` config runs `eslint --fix` and `tsc --noEmit` on staged files.

9. **Given** the Architecture requires env configuration, **When** `.env.example` is created, **Then** it lists all required variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `ENCRYPTION_KEY`.

10. **Given** all tooling is configured, **When** `pnpm build` is executed, **Then** the production build completes without errors and the app is deployable to Vercel.

## Tasks / Subtasks

- [ ] Task 1: Initialize project from official starter template (AC: 1)
  - [ ] Run `npx create-next-app@latest minstrel -e with-supabase`
  - [ ] Verify Next.js 16, TypeScript, Tailwind CSS v4, and Supabase Auth are configured
  - [ ] Enable `strict: true` in `tsconfig.json` if not already set
  - [ ] Verify `@/` path alias is configured in `tsconfig.json` pointing to `src/`
  - [ ] Confirm dev server starts with `pnpm dev`

- [ ] Task 2: Create feature-based directory structure (AC: 2)
  - [ ] Create `src/features/midi/`
  - [ ] Create `src/features/analysis/`
  - [ ] Create `src/features/session/`
  - [ ] Create `src/features/auth/`
  - [ ] Create `src/features/engagement/`
  - [ ] Create `src/features/difficulty/`
  - [ ] Create `src/features/drills/`
  - [ ] Create `src/features/coaching/`
  - [ ] Create `src/features/modes/`
  - [ ] Create `src/components/viz/`
  - [ ] Create `src/stores/`
  - [ ] Create `src/lib/dexie/`
  - [ ] Create `src/lib/ai/`
  - [ ] Create `src/types/`
  - [ ] Create `src/test-utils/`
  - [ ] Create `e2e/fixtures/`
  - [ ] Create `public/fonts/`
  - [ ] Create `public/icons/`
  - [ ] Create `supabase/migrations/`
  - [ ] Add `.gitkeep` files to empty directories to ensure they are tracked

- [ ] Task 3: Install and configure Zustand 5.x (AC: 3)
  - [ ] Run `pnpm add zustand@^5`
  - [ ] Create `src/stores/midi-store.ts` with typed skeleton (empty state + actions interface)
  - [ ] Create `src/stores/session-store.ts` with typed skeleton
  - [ ] Create `src/stores/app-store.ts` with typed skeleton
  - [ ] Add basic types for each store state interface

- [ ] Task 4: Install and configure Vitest + React Testing Library (AC: 4)
  - [ ] Run `pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`
  - [ ] Create `vitest.config.ts` with jsdom environment, `@/` path alias resolution, and coverage configuration
  - [ ] Create `src/test-utils/render.tsx` with custom render wrapper
  - [ ] Add `pnpm test` script to `package.json`
  - [ ] Verify `pnpm test` runs (even with no test files)

- [ ] Task 5: Install and configure Playwright (AC: 4)
  - [ ] Run `pnpm add -D @playwright/test`
  - [ ] Run `npx playwright install chromium`
  - [ ] Create `playwright.config.ts` targeting Chrome with base URL `http://localhost:3000`
  - [ ] Create `e2e/fixtures/mock-midi-device.ts` as an empty placeholder file
  - [ ] Create `e2e/fixtures/mock-ai-responses.ts` as an empty placeholder file
  - [ ] Add `pnpm test:e2e` script to `package.json`

- [ ] Task 6: Configure ESLint + Prettier (AC: 5)
  - [ ] Run `pnpm add -D eslint-plugin-jsx-a11y prettier eslint-config-prettier`
  - [ ] Update `.eslintrc.json` to extend `plugin:jsx-a11y/recommended`
  - [ ] Create `.prettierrc` with project conventions (singleQuote, semi, trailingComma, printWidth)
  - [ ] Verify `pnpm lint` passes

- [ ] Task 7: Install and configure Sentry (AC: 6)
  - [ ] Run `pnpm add @sentry/nextjs@^10`
  - [ ] Create `sentry.client.config.ts` reading DSN from `SENTRY_DSN` env var
  - [ ] Create `sentry.server.config.ts` reading DSN from `SENTRY_DSN` env var
  - [ ] Update `next.config.ts` to wrap with Sentry's `withSentryConfig`
  - [ ] Create `src/app/global-error.tsx` for Sentry error boundary at root level

- [ ] Task 8: Install and configure PostHog (AC: 7)
  - [ ] Run `pnpm add posthog-js`
  - [ ] Create `src/lib/analytics.ts` with `init()`, `capture(event, properties)`, and `identify(userId)` functions
  - [ ] Initialize PostHog conditionally (only when `NEXT_PUBLIC_POSTHOG_KEY` is set)
  - [ ] Add PostHog initialization to root layout or a provider component

- [ ] Task 9: Configure Husky + lint-staged (AC: 8)
  - [ ] Run `pnpm add -D husky lint-staged`
  - [ ] Run `npx husky init`
  - [ ] Configure `.husky/pre-commit` to run `pnpm lint-staged`
  - [ ] Add `lint-staged` config to `package.json` running `eslint --fix` on `*.{ts,tsx}` and `prettier --write` on `*.{ts,tsx,json,css,md}`
  - [ ] Add `tsc --noEmit` as a pre-commit check

- [ ] Task 10: Create .env.example (AC: 9)
  - [ ] Create `.env.example` listing all required env vars with descriptive comments
  - [ ] Verify `.env.local` is in `.gitignore`

- [ ] Task 11: Install additional foundational dependencies (AC: 2, 10)
  - [ ] Run `pnpm add dexie@^4` (Dexie.js for IndexedDB)
  - [ ] Run `pnpm add zod` (schema validation)
  - [ ] Create `src/types/api.ts` with `ApiResponse<T>` and `ApiErrorResponse` type definitions
  - [ ] Create `src/types/midi.ts` as empty placeholder
  - [ ] Create `src/types/database.ts` as empty placeholder
  - [ ] Create `src/lib/utils.ts` with `cn()` utility (clsx + tailwind-merge) if not already from starter
  - [ ] Create `src/lib/constants.ts` with placeholder app-wide constants

- [ ] Task 12: Verify build and deployment readiness (AC: 10)
  - [ ] Run `pnpm build` and verify it completes without errors
  - [ ] Verify the app runs in production mode with `pnpm start`
  - [ ] Verify Vercel deployment configuration (if applicable, via `vercel.json` or auto-detect)

## Dev Notes

- **Starter Template**: Use exactly `npx create-next-app@latest minstrel -e with-supabase`. This provides Next.js 16 + App Router + TypeScript + Tailwind CSS v4 + Supabase Auth via `@supabase/ssr` + shadcn/ui initialized.
- **Package Manager**: Use `pnpm` throughout the project as specified by the starter template.
- **TypeScript Strict Mode**: The starter may already have `strict: true` in tsconfig. Verify and enable if not. This is mandatory per architecture.
- **Zustand 5.x Store Pattern**: Empty stores should export typed hooks following the convention:
  ```typescript
  import { create } from 'zustand';

  interface MidiState {
    // State properties TBD in Story 1.3
  }

  export const useMidiStore = create<MidiState>()(() => ({
    // Initial state TBD
  }));
  ```
- **ApiResponse Envelope** (from Architecture): Must define in `src/types/api.ts`:
  ```typescript
  type ApiResponse<T> = { data: T; error: null };
  type ApiErrorResponse = { data: null; error: { code: string; message: string } };
  ```
- **Sentry**: Use placeholder DSN for now; real DSN added when Vercel/Sentry integration is configured. Wrap `next.config.ts` with `withSentryConfig()`.
- **PostHog**: Initialize conditionally so development without keys does not throw errors.
- **Vitest Config**: Must resolve `@/` path alias to `src/` to match `tsconfig.json` paths. Use `jsdom` environment for React component tests.
- **Layer Architecture**: This story establishes Layer 4 (Infrastructure) scaffolding. No domain logic (Layer 3) or presentation (Layer 1) code beyond what the starter provides.
- **Import Rules**: `@/` alias for all imports from `src/`. No relative imports up more than 1 level.
- **File Naming**: All files use kebab-case as per architecture naming patterns.

### Project Structure Notes

- Root config files: `vitest.config.ts`, `playwright.config.ts`, `sentry.client.config.ts`, `sentry.server.config.ts`, `.prettierrc`, `.eslintrc.json`
- Stores at `src/stores/{name}-store.ts` (kebab-case)
- Types at `src/types/{name}.ts` (kebab-case)
- Lib utilities at `src/lib/{name}.ts` or `src/lib/{feature}/` (kebab-case dirs)
- Test utilities at `src/test-utils/`
- E2E tests and fixtures at `e2e/` and `e2e/fixtures/`
- Public assets at `public/fonts/` and `public/icons/`
- Supabase migrations at `supabase/migrations/`

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Starter Template Evaluation]
- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: _bmad-output/planning-artifacts/architecture.md#Gap Analysis Results] (env var inventory gap addressed in AC 9)
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Template uses Tailwind CSS 3.4.19 (not v4); upgrade deferred to Story 1.2
- Template uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` env var; both ANON_KEY and PUBLISHABLE_KEY listed in .env.example
- Next.js 16 uses `proxy.ts` instead of `middleware.ts`
- eslint-config-next@16 ships as native flat config with bundled jsx-a11y; removed FlatCompat wrapper
- Sentry tracesSampleRate set to 0.1 in production, 1.0 in development
- Pinned all critical deps to semver ranges (next ^16, supabase ^0.8/^2)
- All 10 review issues resolved in single pass
- 70 tests passing across 7 test files
- Lint clean, build clean, TypeScript strict

### File List

**Config files (root):**
- next.config.ts (Sentry-wrapped)
- eslint.config.mjs (flat config, next@16 native)
- tailwind.config.ts (content paths, ESM import for tailwindcss-animate)
- vitest.config.ts (jsdom, @/ alias, v8 coverage 80% thresholds)
- playwright.config.ts (chromium, localhost:3000)
- sentry.client.config.ts (env-aware sampling)
- sentry.server.config.ts (env-aware sampling)
- .prettierrc
- .env.example (all required vars)
- .husky/pre-commit (lint-staged + tsc --noEmit)
- components.json (updated CSS path)
- tsconfig.json (updated @/ path to src/)
- package.json (pinned deps, scripts, lint-staged)

**Source files:**
- src/stores/midi-store.ts (skeleton Zustand store)
- src/stores/session-store.ts (skeleton Zustand store)
- src/stores/app-store.ts (skeleton Zustand store)
- src/lib/analytics.ts (PostHog wrapper: init/capture/identify)
- src/lib/constants.ts (APP_NAME, APP_DESCRIPTION)
- src/types/api.ts (ApiResponse, ApiErrorResponse, ApiResult)
- src/types/midi.ts (placeholder)
- src/types/database.ts (placeholder)
- src/app/global-error.tsx (Sentry error boundary)
- src/app/globals.css (--radius: 0rem for sharp corners)
- src/components/theme-switcher.tsx (fixed hydration via useSyncExternalStore)
- src/test-utils/setup.ts (jest-dom/vitest)
- src/test-utils/render.tsx (custom render with AllProviders)

**Test files:**
- src/stores/midi-store.test.ts
- src/stores/session-store.test.ts
- src/stores/app-store.test.ts
- src/lib/analytics.test.ts
- src/lib/constants.test.ts
- src/types/api.test.ts
- src/scaffold.test.ts (52 directory/file existence checks + 12 package.json checks)

**E2E fixtures:**
- e2e/fixtures/mock-midi-device.ts (placeholder)
- e2e/fixtures/mock-ai-responses.ts (placeholder)

**Feature directories (with .gitkeep):**
- src/features/{midi,analysis,session,auth,engagement,difficulty,drills,coaching,modes}
- src/components/viz
- src/lib/{dexie,ai}
- public/{fonts,icons}
- supabase/migrations
