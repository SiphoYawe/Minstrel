# Story 8.6: Wire AI Provider Selection From Saved Key

Status: ready-for-dev

## Story

As a user who configured an Anthropic (or other) API key,
I want the AI coaching to use my configured provider,
so that requests don't fail with an OpenAI-only hardcode.

## Acceptance Criteria

1. Given a user has saved an API key for provider X (e.g., Anthropic), When the coaching chat sends a request, Then `providerId` in the request body matches the user's configured provider (e.g., `'anthropic'`). And requests are routed to the correct provider's API endpoint.

2. Given the appStore or key metadata tracks the provider, When any AI feature builds a request, Then it reads the provider dynamically using a shared `getActiveProviderId()` utility, not from a hardcoded string. And the utility falls back to `'openai'` when no key metadata is available.

3. Given both `coaching-client.ts` and `use-replay-chat.ts` build requests, When provider selection is implemented, Then both use the same `getActiveProviderId()` function from `provider-resolver.ts`. And any future AI feature hooks can import and use the same utility.

4. Given the appStore currently only stores `hasApiKey: boolean`, When provider tracking is needed, Then the appStore is extended with `apiKeyProvider: string | null` to cache the active provider. And the provider is set when API key metadata is fetched (in settings or on auth load).

## Tasks / Subtasks

- [ ] 1. Extend appStore with provider tracking (AC: 4)
  - [ ] 1.1 Open `src/stores/app-store.ts`
  - [ ] 1.2 Add `apiKeyProvider: string | null` to `AppState` interface (after `hasApiKey` at line 15)
  - [ ] 1.3 Add `setApiKeyProvider: (provider: string | null) => void` action
  - [ ] 1.4 Initialize `apiKeyProvider: null` in the store defaults
  - [ ] 1.5 Update `clearUser` action to also reset `apiKeyProvider: null`
  - [ ] 1.6 Update `setHasApiKey` to optionally accept provider: `setHasApiKey: (hasKey: boolean, provider?: string) => void`

- [ ] 2. Create shared provider resolver utility (AC: 2, 3)
  - [ ] 2.1 Create `src/features/coaching/provider-resolver.ts`
  - [ ] 2.2 Implement `getActiveProviderId(): string` -- reads `apiKeyProvider` from `useAppStore.getState()`, falls back to `'openai'` if null
  - [ ] 2.3 Export as a synchronous function (uses `getState()` for non-reactive read, suitable for use in transport body callbacks)

- [ ] 3. Wire provider resolver into coaching-client.ts (AC: 1, 3)
  - [ ] 3.1 Open `src/features/coaching/coaching-client.ts` line 27
  - [ ] 3.2 Import `getActiveProviderId` from `./provider-resolver`
  - [ ] 3.3 Replace `providerId: 'openai'` with `providerId: getActiveProviderId()`

- [ ] 4. Wire provider resolver into use-replay-chat.ts (AC: 1, 3)
  - [ ] 4.1 Open `src/features/coaching/use-replay-chat.ts` line 25
  - [ ] 4.2 Import `getActiveProviderId` from `./provider-resolver`
  - [ ] 4.3 Replace `providerId: 'openai'` with `providerId: getActiveProviderId()`

- [ ] 5. Set provider when API key metadata is loaded (AC: 4)
  - [ ] 5.1 Open `src/app/(auth)/settings/page.tsx` -- in the `useEffect` that fetches key metadata (lines 45-65)
  - [ ] 5.2 When `result.data` is available, call `useAppStore.getState().setApiKeyProvider(result.data.provider)` alongside `setHasApiKey(true)`
  - [ ] 5.3 When key is deleted, call `useAppStore.getState().setApiKeyProvider(null)` alongside `setHasApiKey(false)`
  - [ ] 5.4 Find the AuthProvider or app initialization code that checks for API keys on auth load -- ensure it also sets the provider in appStore

- [ ] 6. Validate provider on the API route (AC: 1)
  - [ ] 6.1 Open the `/api/ai/chat` route handler
  - [ ] 6.2 Verify it reads `providerId` from the request body and routes to the correct AI provider
  - [ ] 6.3 If the API route has a hardcoded provider fallback, ensure it matches the expected behavior

- [ ] 7. Write tests (AC: 1, 2, 3, 4)
  - [ ] 7.1 Create `src/features/coaching/provider-resolver.test.ts`
  - [ ] 7.2 Test `getActiveProviderId()` returns `'openai'` when `apiKeyProvider` is null
  - [ ] 7.3 Test `getActiveProviderId()` returns `'anthropic'` when `apiKeyProvider` is `'anthropic'`
  - [ ] 7.4 Test appStore `setApiKeyProvider` correctly updates state
  - [ ] 7.5 Test appStore `clearUser` resets `apiKeyProvider` to null

## Dev Notes

- **Architecture Layer**: `provider-resolver.ts` is Layer 2/3 (Application/Domain utility). `app-store.ts` is Layer 2 (Application State). Transport configuration in hooks is Layer 2 (Application Logic).
- **Current hardcoded provider locations**:
  - `src/features/coaching/coaching-client.ts` line 27: `providerId: 'openai'`
  - `src/features/coaching/use-replay-chat.ts` line 25: `providerId: 'openai'`
- **appStore current state** (`src/stores/app-store.ts`):
  ```typescript
  interface AppState {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    hasApiKey: boolean;
    // ... missing: apiKeyProvider
  }
  ```
  Only stores `hasApiKey: boolean` -- no provider information. Need to add `apiKeyProvider: string | null`.
- **Provider types**: Check `src/features/auth/auth-types.ts` for `ApiKeyProvider` type definition. The provider should match what's stored in the encrypted API key metadata in Supabase.
- **Synchronous access pattern**: Both `coaching-client.ts` and `use-replay-chat.ts` build the request body in a callback passed to `DefaultChatTransport`. This callback is synchronous, so `getActiveProviderId()` must use `useAppStore.getState()` (synchronous Zustand read), NOT a React hook.
- **Overlap with Story 8.3**: Story 8.3 also references the hardcoded `providerId`. If both stories are implemented, ensure they don't conflict. Story 8.6 is the comprehensive fix; Story 8.3 focuses on the guard. Consider implementing 8.6 after 8.3 or combining the provider fix.
- **BYOK model**: The project uses a Bring Your Own Key model where users provide their own LLM API keys. Supporting multiple providers (OpenAI, Anthropic, etc.) is a core architectural requirement.

### Project Structure Notes

- `src/stores/app-store.ts` -- extend with `apiKeyProvider` field
- `src/features/coaching/provider-resolver.ts` -- create new shared utility
- `src/features/coaching/provider-resolver.test.ts` -- create co-located test
- `src/features/coaching/coaching-client.ts` -- replace hardcoded `providerId` (line 27)
- `src/features/coaching/use-replay-chat.ts` -- replace hardcoded `providerId` (line 25)
- `src/app/(auth)/settings/page.tsx` -- set provider when key metadata loads (lines 45-65)
- `src/features/auth/auth-types.ts` -- reference for `ApiKeyProvider` type

### References

- [Source: _bmad-output/planning-artifacts/architecture.md] -- BYOK model, Vercel AI SDK 6.x provider-agnostic design, provider routing
- [Source: _bmad-output/planning-artifacts/prd.md] -- FR46-48: API key management, multi-provider support
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1] -- Vercel AI SDK integration and provider setup
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3] -- LLM API key configuration UI
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.4] -- API key validation and encrypted storage

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
