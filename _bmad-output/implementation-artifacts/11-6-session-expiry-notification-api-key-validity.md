# Story 11.6: Session Expiry Notification and API Key Validity Detection

Status: ready-for-dev

## Story

As a user,
I want clear notifications when my auth session or API key expires,
So that I can take action without confusion.

## Acceptance Criteria

1. Given a user's Supabase auth session expires during use, When the next API call fails with a 401, Then a clear modal appears: "Your session has expired. Please log in again." with a "Log in" button. And the modal uses the dark studio aesthetic with sharp corners (0px border radius).

2. Given the session expiry notification appears, When the user clicks "Log in", Then they are redirected to `/login?redirectTo={currentPath}` to return to their current page after re-authentication. And the current path is captured from `window.location.pathname`.

3. Given a user's API key becomes invalid after being saved, When an AI request fails with a provider auth error (401/403), Then the error message says "Your API key is no longer valid. Please update it in Settings." with a link to `/settings#api-keys`. And the existing `INVALID_KEY` error at `src/features/coaching/chat-error-handler.ts:5-9` is used.

4. Given API key errors are detected, When the error is specific to key validity, Then `appStore.setApiKeyStatus('invalid')` is called (as it already is at `chat-error-handler.ts:40-41` and `48`). And `appStore.hasApiKey` becomes `false` (via the setter at `app-store.ts:55-59`) to trigger graceful degradation in the UI.

5. Given a valid session and API key, When requests succeed normally, Then no expiry notifications appear. And the session expired modal is not rendered.

## Tasks / Subtasks

- [ ] 1. Create session-expired modal component (AC: 1, 2, 5)
  - [ ] 1.1 Create `src/components/session-expired-modal.tsx`
  - [ ] 1.2 The modal should overlay the screen with a semi-transparent dark backdrop
  - [ ] 1.3 Display: "Your session has expired. Please log in again." in the studio engineer aesthetic (font-mono, dark theme, sharp corners)
  - [ ] 1.4 Include a "Log in" button styled with `bg-primary text-background` (matching existing button styles)
  - [ ] 1.5 On click, redirect to `/login?redirectTo=${encodeURIComponent(window.location.pathname)}`
  - [ ] 1.6 The modal should be dismissable but persistent — it reappears on the next failed API call
  - [ ] 1.7 Accept `isOpen` and `onClose` props for controlled rendering

- [ ] 2. Add 401 detection to Supabase client or fetch wrapper (AC: 1, 2)
  - [ ] 2.1 Option A: Use Supabase `onAuthStateChange` listener to detect `SIGNED_OUT` events triggered by expired tokens. Add this listener in the auth provider or a global layout component.
  - [ ] 2.2 Option B: Create a fetch wrapper or API response interceptor that checks for 401 responses on any API call and triggers the session expired modal.
  - [ ] 2.3 Add a `sessionExpired` boolean to `appStore` at `src/stores/app-store.ts` with a `setSessionExpired(expired: boolean)` action
  - [ ] 2.4 When a 401 is detected on a non-auth API call, call `appStore.setSessionExpired(true)`
  - [ ] 2.5 Render the `SessionExpiredModal` in a global layout component (e.g., `src/app/(auth)/layout.tsx`) controlled by `appStore.sessionExpired`

- [ ] 3. Enhance API key error detection in chat error handler (AC: 3, 4)
  - [ ] 3.1 Review `src/features/coaching/chat-error-handler.ts:33-62` — the `parseChatError()` function already detects `INVALID_KEY` errors (lines 39-41) and sets `apiKeyStatus('invalid')` (lines 40, 48)
  - [ ] 3.2 Verify the `INVALID_KEY` error message at line 7 includes actionUrl: `/settings` — it does, but update it to `/settings#api-keys` for direct navigation to the API keys section
  - [ ] 3.3 Verify the error handler at `src/lib/ai/route-helpers.ts:87-97` properly classifies provider 401/403 errors as `INVALID_KEY` via `classifyAiError()`
  - [ ] 3.4 In `src/lib/ai/errors.ts` (or wherever `classifyAiError` is defined), ensure provider auth errors (401, 403, "invalid api key", "api key expired") are classified as `INVALID_KEY`

- [ ] 4. Wire session expired modal into app layout (AC: 1, 5)
  - [ ] 4.1 Import and render `SessionExpiredModal` in the authenticated layout
  - [ ] 4.2 Connect to `appStore.sessionExpired` state
  - [ ] 4.3 When `sessionExpired` is true, render the modal
  - [ ] 4.4 On successful re-auth (login page), reset `sessionExpired` to false

- [ ] 5. Add tests (AC: 1, 2, 3, 4, 5)
  - [ ] 5.1 Create `src/components/session-expired-modal.test.tsx` — test modal renders with correct text, button links to login with redirect
  - [ ] 5.2 Update `src/features/coaching/chat-error-handler.test.ts` — verify `INVALID_KEY` sets `apiKeyStatus('invalid')` and returns actionUrl `/settings#api-keys`
  - [ ] 5.3 Test: 401 on API call triggers `sessionExpired` in appStore
  - [ ] 5.4 Test: valid responses do not trigger session expired modal

## Dev Notes

- **Architecture Layer**: Layer 2 (Presentation) for the modal component; Layer 2 (Application) for the auth state management; Layer 4 (Infrastructure) for the API error detection.
- The `parseChatError()` function at `src/features/coaching/chat-error-handler.ts:33-62` already handles most error classification:
  - `INVALID_KEY` at line 5-9: `{ code: 'INVALID_KEY', message: 'Your API key appears to be invalid. Check your key in Settings.', actionUrl: '/settings' }`
  - Lines 39-41: When `INVALID_KEY` is detected, it calls `useAppStore.getState().setApiKeyStatus('invalid')`
  - Lines 47-49: Pattern-matches 401/403 and api key patterns to detect key invalidity
  - The actionUrl should be updated from `/settings` to `/settings#api-keys` for direct scroll to the API keys section
- The `appStore` at `src/stores/app-store.ts` currently has no `sessionExpired` state. It needs to be added alongside a `setSessionExpired` action.
- The `setApiKeyStatus('invalid')` at `app-store.ts:55-59` already sets `hasApiKey: false` when status is not 'active', which triggers graceful degradation in the `AIChatPanel` (line 106 of `ai-chat-panel.tsx` shows the "Connect your API key" message when `!hasApiKey`).
- The Supabase client at `src/lib/supabase/client.ts` creates a browser client. Supabase provides `onAuthStateChange` which fires `SIGNED_OUT` when the session expires.
- The chat API route at `src/app/api/ai/chat/route.ts:27-31` already returns 401 when the user is not authenticated (via `authenticateAiRequest()` at `route-helpers.ts:27-31`). The client needs to detect this 401 and show the modal.

### Project Structure Notes

- `src/components/session-expired-modal.tsx` — create new modal component
- `src/components/session-expired-modal.test.tsx` — create co-located test
- `src/stores/app-store.ts` — add `sessionExpired` state and `setSessionExpired` action (after line 28)
- `src/features/coaching/chat-error-handler.ts` — update `INVALID_KEY` actionUrl to `/settings#api-keys` (line 8)
- `src/app/(auth)/layout.tsx` — render SessionExpiredModal (or equivalent global location)
- `src/lib/supabase/client.ts` — reference for Supabase browser client

### References

- [Source: _bmad-output/planning-artifacts/prd.md] — FR45-50: Authentication, API key management, graceful degradation
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.5] — Graceful degradation without API key
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — Error messaging, "amber not red" principle
- [Source: _bmad-output/planning-artifacts/architecture.md] — Supabase Auth, session management, error handling patterns

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
