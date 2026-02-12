# Story 1.7: Guest Mode Entry Point

Status: ready-for-dev

## Story

As a new visitor,
I want to start playing immediately without creating an account,
So that I can experience Minstrel's value before committing.

## Acceptance Criteria

1. **Given** a user visits Minstrel for the first time, **When** they navigate to `/play` (the guest play route), **Then** the page loads without requiring any authentication, account creation, email, or sign-up flow. The MIDI connection flow from Story 1.3 initiates immediately.

2. **Given** a guest user is on the `/play` page with a connected MIDI device, **When** they play notes, **Then** MIDI event capture (Story 1.4) and real-time Canvas visualization work fully, identical to the authenticated experience. Audio fallback (Story 1.6) also works for guests.

3. **Given** a guest user is actively using Minstrel, **When** the UI renders, **Then** a subtle, non-blocking prompt is displayed: "Create an account to save your progress" -- styled as a small banner or inline message, NOT a modal or popup. The prompt links to a sign-up page (implemented in Epic 3) and does not interrupt playing.

4. **Given** a guest user is using Minstrel, **When** AI features would normally be available (coaching chat, drill generation), **Then** those sections display: "Connect your API key to unlock AI coaching" with a link to the settings page. The prompt is informational, not an error state. MIDI visualization and analysis continue unaffected.

5. **Given** a guest user generates session data (MIDI events, analysis snapshots), **When** data is stored, **Then** it is persisted in browser IndexedDB via Dexie.js only (no server persistence). The Dexie.js database schema includes tables for guest sessions, MIDI events, and analysis snapshots. Data persists across page refreshes within the same browser.

6. **Given** a guest user is on the `/play` page, **When** the full experience is rendered, **Then** the guest experience demonstrates the complete MIDI visualization value proposition: StatusBar shows connection state, VisualizationCanvas renders notes, troubleshooting is available if needed, and the interface uses the full dark studio aesthetic.

7. **Given** a guest user has session data in IndexedDB, **When** they clear browser data or use a different browser, **Then** guest data is lost (expected behavior for browser-only storage). This is the trade-off communicated by the "Create an account to save your progress" prompt.

## Tasks / Subtasks

- [ ] Task 1: Create guest play route (AC: 1, 6)
  - [ ] Create `src/app/(guest)/play/page.tsx`:
    - `'use client'` directive (uses MIDI hooks, Canvas, browser APIs)
    - Renders the main practice view without auth guards
    - Includes: StatusBar, VisualizationCanvas, TroubleshootingPanel (conditional), AudioModeBanner (conditional)
    - Initializes MIDI connection via `useMidi()` hook on mount
    - Full dark studio aesthetic applied
  - [ ] Create `src/app/(guest)/layout.tsx`:
    - Guest-specific layout wrapper (no auth middleware, no auth provider required)
    - Includes root-level providers needed for guest mode (e.g., Zustand stores work without auth)
  - [ ] Verify route is accessible at `/play` without any auth redirect

- [ ] Task 2: Set up Dexie.js database for guest data (AC: 5, 7)
  - [ ] Create `src/lib/dexie/db.ts`:
    - Initialize Dexie database named `'minstrel-local'`
    - Define schema version 1 with tables:
      - `sessions`: `++id, startedAt, endedAt, duration, inputSource, [metadata]`
      - `midiEvents`: `++id, sessionId, type, note, velocity, channel, timestamp, source`
      - `analysisSnapshots`: `++id, sessionId, createdAt, [snapshotData]`
    - Export typed `db` instance
  - [ ] Add compound indexes for efficient queries: `midiEvents` indexed on `[sessionId+timestamp]`
  - [ ] Create `src/lib/dexie/db.test.ts`:
    - Test database opens and tables are accessible
    - Test write and read operations on each table
    - Test data persists across db.close() and db.open() cycles

- [ ] Task 3: Implement guest session recording (AC: 5)
  - [ ] Create `src/features/session/guest-session.ts` (lightweight, minimal for guest):
    - `startGuestSession()`: Creates a new session record in Dexie, returns session ID
    - `endGuestSession(sessionId)`: Updates session with endedAt and duration
    - `recordGuestEvent(sessionId, event: MidiEvent)`: Writes MIDI event to Dexie
  - [ ] Wire into the MIDI event pipeline:
    - When a guest user's first note is detected, auto-start a guest session
    - All subsequent MIDI events (from `midiStore`) are written to Dexie in the background
    - Session auto-ends after configurable inactivity timeout (e.g., 5 minutes of silence)
  - [ ] Ensure writes are non-blocking (use Dexie's async API with `.put()` or `.bulkPut()`)
  - [ ] Add error handling: if Dexie write fails, log to Sentry but do NOT interrupt the user experience

- [ ] Task 4: Build account creation prompt (AC: 3)
  - [ ] Create `src/components/guest-prompt.tsx`:
    - `'use client'` directive
    - Renders a subtle inline banner: "Create an account to save your progress"
    - Includes a "Sign Up" link/button that navigates to the auth flow (placeholder route `/sign-up` for now, implemented in Epic 3)
    - Styled as a small, non-intrusive element:
      - Background: `#1A1A1A` or transparent
      - Text: `#999999` (secondary text color)
      - Link/button: `#7CB9E8` primary accent
      - 0px border radius
      - Positioned below the StatusBar or at the bottom of the viewport
    - Dismissible: user can close it for the current session (store dismissed state in `sessionStorage`)
    - Does NOT appear as a modal or popup
    - Does NOT interrupt playing or cover the visualization

- [ ] Task 5: Build AI features placeholder prompts (AC: 4)
  - [ ] Create `src/components/api-key-prompt.tsx`:
    - `'use client'` directive
    - Renders an informational card: "Connect your API key to unlock AI coaching"
    - Includes a link to Settings (placeholder route `/settings` for now)
    - Used in places where AI coaching chat or drill generation would appear
    - Styled with dark studio aesthetic, `#7CB9E8` accent, 0px radius
    - Uses growth mindset language: "unlock" not "upgrade" or "pay for"
    - Not an error state: calm, informational, non-urgent
  - [ ] This component will be reused in Stories 3.5 (graceful degradation) and 4.2 (Dashboard+Chat mode)

- [ ] Task 6: Compose guest play page (AC: 1, 2, 3, 4, 6)
  - [ ] In `src/app/(guest)/play/page.tsx`, compose all components:
    - StatusBar (from Story 1.3)
    - VisualizationCanvas (from Story 1.4)
    - TroubleshootingPanel (conditional, from Story 1.5)
    - AudioModeBanner (conditional, from Story 1.6)
    - GuestPrompt (dismissible account creation banner)
    - ApiKeyPrompt (in the future sidebar/panel area for AI features)
  - [ ] Ensure proper z-index layering: StatusBar on top, banners below, Canvas fills remaining space
  - [ ] Verify the full flow works end-to-end:
    1. User navigates to `/play`
    2. MIDI auto-detection starts
    3. If device found: StatusBar shows "Connected", user plays, notes visualize
    4. If no device: TroubleshootingPanel appears, audio fallback offered
    5. Guest prompt visible but non-intrusive
    6. AI feature areas show API key prompt

- [ ] Task 7: Update marketing landing page CTA (AC: 1)
  - [ ] Update `src/app/(marketing)/page.tsx` CTA button to link to `/play`
  - [ ] Ensure the landing page -> guest play transition is seamless (no auth wall)

- [ ] Task 8: Write co-located tests (AC: 1, 5)
  - [ ] Create `src/app/(guest)/play/page.test.tsx`:
    - Test page renders without authentication
    - Test StatusBar is present
    - Test VisualizationCanvas is present
    - Test guest prompt banner is displayed
    - Test API key prompt is displayed in appropriate section
  - [ ] Create `src/components/guest-prompt.test.tsx`:
    - Test banner renders with correct text
    - Test "Sign Up" link is present and navigates correctly
    - Test banner is dismissible
    - Test dismissed state persists in sessionStorage
  - [ ] Create `src/components/api-key-prompt.test.tsx`:
    - Test prompt renders with correct text
    - Test settings link is present
    - Test growth mindset language (no "error" or "missing" language)
  - [ ] Create `src/features/session/guest-session.test.ts`:
    - Test `startGuestSession()` creates a record in Dexie
    - Test `recordGuestEvent()` writes events to Dexie
    - Test `endGuestSession()` updates session with end time

## Dev Notes

- **Guest Mode Architecture**: The guest play page at `src/app/(guest)/play/page.tsx` is in the `(guest)` route group, which has NO auth middleware. This is separate from the `(auth)` route group where `/session` lives (authenticated practice). Both use the same components (StatusBar, Canvas, etc.) but with different data persistence strategies.
- **Dexie.js Schema**: This is the first story that initializes the Dexie.js database. The schema defined here is the foundation for all client-side persistence. Keep it minimal -- only tables needed for guest mode. Additional tables (progress, AI conversations, etc.) will be added in later stories when needed.
- **IndexedDB Limitations**: Data in IndexedDB persists in the browser but is subject to browser storage eviction under storage pressure (especially in incognito mode). This is acceptable for guest mode since the "Create an account" prompt communicates the trade-off.
- **Dexie.js 4.x**: Use Dexie 4.x which provides better TypeScript support and the `liveQuery` API. For this story, basic CRUD operations suffice. The sync layer (Dexie -> Supabase) will be added in Story 3.2.
- **No Auth Required**: The guest page must NOT import or depend on Supabase auth. All data flows stay client-side (Zustand + Dexie). This is critical for demonstrating the "Play First" principle.
- **API Key Prompt Component**: `api-key-prompt.tsx` will be reused across multiple stories (3.5, 4.2). Design it as a generic, configurable component that accepts context-specific text (e.g., "Connect your API key to unlock AI coaching" vs. "Connect your API key to get personalized drills").
- **Session Auto-Start**: Guest sessions auto-start on the first MIDI event. There is no "Start Session" button. This follows the "Play First, Everything Else Follows" principle. Session data silently records in the background.
- **Bundle Optimization**: Dexie.js adds ~25KB gzipped to the bundle. It should be imported normally (not dynamically) since IndexedDB is needed for all user types (guest and authenticated).
- **Layer Compliance**: `guest-session.ts` is Layer 2/3 (Application/Domain logic). Dexie `db.ts` is Layer 4 (Infrastructure). Components are Layer 1 (Presentation). Guest session should access Dexie through the `db` wrapper, not by instantiating Dexie directly.
- **`'use client'`**: The guest play page and all interactive components require `'use client'` directive.

### Project Structure Notes

- Guest play page: `src/app/(guest)/play/page.tsx`
- Guest layout: `src/app/(guest)/layout.tsx`
- Guest play page tests: `src/app/(guest)/play/page.test.tsx`
- Dexie database: `src/lib/dexie/db.ts`
- Dexie database tests: `src/lib/dexie/db.test.ts`
- Guest session logic: `src/features/session/guest-session.ts`
- Guest session tests: `src/features/session/guest-session.test.ts`
- Guest prompt component: `src/components/guest-prompt.tsx`
- Guest prompt tests: `src/components/guest-prompt.test.tsx`
- API key prompt component: `src/components/api-key-prompt.tsx`
- API key prompt tests: `src/components/api-key-prompt.test.tsx`
- Updated files: `src/app/(marketing)/page.tsx` (CTA link to /play)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] (Dexie.js 4.3.x for IndexedDB, schema design)
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security] (Guest mode: MIDI analysis works without account)
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure] (`src/app/(guest)/play/`, `src/lib/dexie/db.ts`)
- [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries] (Layer 4 accessed through src/lib/ wrappers)
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.7]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Experience Principles] ("Play First, Everything Else Follows")
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Core User Experience] (Zero-friction entry)
- [Source: _bmad-output/planning-artifacts/prd.md#FR45] (Guest mode with MIDI connection only)
- [Source: _bmad-output/planning-artifacts/prd.md#FR49] (Graceful degradation when no API key configured)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
