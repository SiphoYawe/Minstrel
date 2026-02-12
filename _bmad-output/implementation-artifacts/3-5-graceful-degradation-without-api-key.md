# Story 3.5: Graceful Degradation Without API Key

Status: ready-for-dev

## Story

As a user without an API key configured,
I want MIDI features to work fully while AI features show clear prompts to connect a key,
So that I can still use the core product.

## Acceptance Criteria

1. **Given** a logged-in user has no API key configured, **When** they use MIDI features (connecting a device, playing notes, real-time analysis, visualization, session recording), **Then** all MIDI features work fully with no degradation, no errors, and no prompts interrupting the experience.

2. **Given** a user without an API key navigates to Dashboard + Chat mode, **When** the AIChatPanel renders, **Then** instead of the chat input, a styled prompt is displayed: "Connect your API key in Settings to unlock AI coaching" with a direct link to the Settings API Keys section and a brief explanation of the BYOK model.

3. **Given** a user without an API key triggers drill generation (e.g., via a snapshot insight), **When** the DrillController would normally render a drill, **Then** a styled prompt is displayed: "Connect your API key to get personalized drills" with a direct link to the Settings API Keys section.

4. **Given** the degradation prompts are displayed, **When** the user views them, **Then** each prompt includes a clickable link (Next.js `Link` component) that navigates directly to `/settings` with the API Keys section scrolled into view (via URL hash `#api-keys` or scroll behavior).

5. **Given** `appStore` tracks `hasApiKey: boolean`, **When** any component checks for AI feature availability, **Then** it reads `hasApiKey` via a Zustand selector (`const hasApiKey = useAppStore((s) => s.hasApiKey)`) and conditionally renders either the AI feature or the degradation prompt.

6. **Given** no API key is configured, **When** any code path would normally call `/api/ai/chat`, `/api/ai/drill`, or `/api/ai/analyze`, **Then** no API request is made (the call is gated client-side by `hasApiKey`), preventing unnecessary 401 errors and wasted requests.

7. **Given** the user configures an API key while the app is open, **When** `appStore.hasApiKey` changes from `false` to `true`, **Then** AI features become available immediately without requiring a page reload, and any visible degradation prompts are replaced by the active AI UI.

## Tasks / Subtasks

- [ ] Task 1: Create reusable ApiKeyRequired component (AC: 2, 3, 4)
  - [ ] Create `src/features/auth/api-key-required.tsx` component that accepts props: `{ feature: 'coaching' | 'drills' | 'analysis', children: React.ReactNode }`
  - [ ] Component reads `hasApiKey` from `appStore` via selector
  - [ ] When `hasApiKey === true`, render `children` (the actual AI feature)
  - [ ] When `hasApiKey === false`, render a styled degradation prompt card
  - [ ] The prompt card includes: an icon (key or lock), feature-specific message, a `Link` to `/settings#api-keys`, and a brief BYOK explanation
  - [ ] Feature-specific messages:
    - `coaching`: "Connect your API key in Settings to unlock AI coaching"
    - `drills`: "Connect your API key to get personalized drills"
    - `analysis`: "Connect your API key for AI-powered analysis"
  - [ ] Style the prompt card using dark studio aesthetic: `#1A1A1A` card background, `#7CB9E8` link color, 0px border radius, Inter font, subtle border `#2A2A2A`

- [ ] Task 2: Create useAiAvailable hook (AC: 5, 6)
  - [ ] Create `src/features/auth/use-ai-available.ts` hook
  - [ ] Returns `{ isAiAvailable: boolean, provider: string | null }` based on `appStore.hasApiKey`
  - [ ] AI route call functions (to be created in Epic 4) should use this hook to gate requests before making API calls
  - [ ] Export from `src/features/auth/index.ts`

- [ ] Task 3: Integrate degradation into AIChatPanel placeholder (AC: 2, 7)
  - [ ] Create `src/features/coaching/ai-chat-placeholder.tsx` as the placeholder component that will later become the full AIChatPanel (Epic 4)
  - [ ] Wrap with `ApiKeyRequired` component: `<ApiKeyRequired feature="coaching"><ChatInterface /></ApiKeyRequired>`
  - [ ] When no API key: show the degradation prompt
  - [ ] When API key is configured: show a placeholder "AI coaching ready — start a session to begin" (actual chat UI comes in Epic 4)
  - [ ] Ensure the component reactively updates when `hasApiKey` changes (no reload required, AC: 7)

- [ ] Task 4: Integrate degradation into DrillController placeholder (AC: 3, 7)
  - [ ] Create `src/features/drills/drill-placeholder.tsx` as the placeholder component that will later become DrillController (Epic 5)
  - [ ] Wrap with `ApiKeyRequired` component: `<ApiKeyRequired feature="drills"><DrillInterface /></ApiKeyRequired>`
  - [ ] When no API key: show the degradation prompt
  - [ ] When API key is configured: show "Personalized drills ready — play to discover your growth areas" placeholder
  - [ ] Ensure the component reactively updates when `hasApiKey` changes

- [ ] Task 5: Add settings page scroll-to-anchor behavior (AC: 4)
  - [ ] Update `src/app/(auth)/settings/page.tsx` to add `id="api-keys"` to the API Keys section container
  - [ ] Ensure navigating to `/settings#api-keys` scrolls the API Keys section into view on page load
  - [ ] Use `scroll-margin-top` CSS property to account for any fixed headers

- [ ] Task 6: Verify MIDI features work without API key (AC: 1)
  - [ ] Review all MIDI-related code paths (from Epic 1 and Epic 2) to confirm no dependency on `hasApiKey`
  - [ ] Verify `midiStore`, `sessionStore`, and MIDI-related features have no conditional logic gated on API key presence
  - [ ] Document any integration points where MIDI and AI features intersect (e.g., snapshot insights suggesting drills) and ensure they degrade gracefully

- [ ] Task 7: Write tests (AC: all)
  - [ ] Create `src/features/auth/api-key-required.test.tsx` testing: renders children when hasApiKey is true, renders degradation prompt when hasApiKey is false, shows correct feature-specific message for coaching/drills/analysis, link points to /settings#api-keys, reactively updates when hasApiKey changes
  - [ ] Create `src/features/auth/use-ai-available.test.ts` testing: returns correct values based on appStore state
  - [ ] Create integration test verifying that toggling `appStore.hasApiKey` from false to true updates rendered components without remount

## Dev Notes

- **Reactive UI**: The key requirement here is that changing `hasApiKey` in `appStore` immediately updates all components. This is guaranteed by Zustand's subscription model — components using `useAppStore((s) => s.hasApiKey)` will re-render when the value changes. No custom event system needed.
- **No 401 Waterfall**: It is important that the client gates AI calls before making them, not after. If `hasApiKey` is false, no fetch to `/api/ai/*` should happen. This prevents a cascade of 401 errors that would pollute Sentry logs and waste bandwidth.
- **Placeholder Components**: This story creates placeholder AI feature components that will be replaced with full implementations in Epics 4 and 5. The `ApiKeyRequired` wrapper pattern should be preserved when the real components are built — it wraps the real UI and handles the degradation case.
- **Growth Mindset in Prompts**: The degradation messages should feel like an invitation, not a restriction. "Connect your API key to unlock AI coaching" is better than "AI coaching is unavailable." The tone is encouraging and action-oriented.
- **Link Behavior**: Use Next.js `Link` for the settings navigation (client-side routing, no full page reload). The `#api-keys` hash scrolls to the section after navigation.
- **Architecture Layer**: `ApiKeyRequired` is Layer 1 (Presentation). `useAiAvailable` is Layer 2 (Application). They bridge the `appStore` (Layer 2) to UI rendering (Layer 1).
- **Testing Strategy**: The tests should manipulate `appStore` state directly (Zustand allows external `setState` calls in tests) rather than mocking the store. This tests the actual integration.

### Project Structure Notes

Files created/modified in this story:
```
src/features/auth/api-key-required.tsx      (create)
src/features/auth/use-ai-available.ts       (create)
src/features/auth/index.ts                  (update - add exports)
src/features/coaching/ai-chat-placeholder.tsx (create)
src/features/drills/drill-placeholder.tsx    (create)
src/app/(auth)/settings/page.tsx            (update - add #api-keys id)
src/features/auth/api-key-required.test.tsx  (create)
src/features/auth/use-ai-available.test.ts   (create)
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns — Authentication & API Key Management]
- [Source: _bmad-output/planning-artifacts/architecture.md#External Integrations — LLM Providers failure mode]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture — Zustand Selector Patterns]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.5]
- [Source: _bmad-output/planning-artifacts/prd.md#FR49]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Growth mindset, amber not red]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
