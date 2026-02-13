# Story 8.3: Add API Key Guard to Coaching Chat

Status: ready-for-dev

## Story

As a musician using the coaching chat,
I want the system to prevent me from sending messages if I haven't configured an API key,
so that I don't encounter confusing server errors.

## Acceptance Criteria

1. Given a user has no API key configured, When they attempt to submit a coaching chat message, Then the message is not sent and the input is disabled with a prompt to configure an API key. And the guard follows the same pattern as `use-replay-chat.ts` line 67: `if (!trimmed || isLoading || !hasApiKey) return;`.

2. Given the coaching client builds the request body, When it sets `providerId`, Then it reads the provider from the user's saved key metadata (not hardcoded `'openai'`). And it uses a shared `getActiveProvider()` utility that resolves the provider dynamically from appStore or key metadata.

3. Given `use-replay-chat.ts` already has the correct `!hasApiKey` guard pattern at line 67, When the coaching client is updated, Then both hooks share the same guard pattern: `!trimmed || isLoading || !hasApiKey`. And the coaching chat input shows a disabled state with helper text when no API key is configured.

## Tasks / Subtasks

- [ ] 1. Verify hasApiKey guard in coaching-client.ts (AC: 1, 3)
  - [ ] 1.1 Open `src/features/coaching/coaching-client.ts` line 82
  - [ ] 1.2 Current code at line 82: `if (!trimmed || isLoading || !hasApiKey) return;` -- this already includes the `!hasApiKey` guard
  - [ ] 1.3 Verify `hasApiKey` is read from appStore at line 19: `const hasApiKey = useAppStore((s) => s.hasApiKey);` -- confirmed present
  - [ ] 1.4 The guard appears to already be implemented. Verify it works end-to-end by checking that the chat input component disables when `hasApiKey` is false
  - [ ] 1.5 If the chat input component does not show a disabled state when `!hasApiKey`, add a disabled prop and helper text: "Configure an API key in Settings to use coaching chat"

- [ ] 2. Fix hardcoded providerId (AC: 2)
  - [ ] 2.1 Open `src/features/coaching/coaching-client.ts` line 27
  - [ ] 2.2 Current code: `providerId: 'openai'` -- hardcoded in the transport body
  - [ ] 2.3 Create a shared utility `src/features/coaching/provider-resolver.ts` with function `getActiveProviderId(): string` that reads the provider from the user's saved API key metadata
  - [ ] 2.4 The provider should be sourced from appStore or from the API key metadata fetched at settings load time. Check `src/features/auth/auth-types.ts` for `ApiKeyProvider` type and `src/features/auth/api-key-manager.ts` for metadata access
  - [ ] 2.5 Replace `providerId: 'openai'` with `providerId: getActiveProviderId()` in the transport body callback
  - [ ] 2.6 Similarly fix `src/features/coaching/use-replay-chat.ts` line 25: `providerId: 'openai'` -> `providerId: getActiveProviderId()`

- [ ] 3. Add disabled state to chat input (AC: 1, 3)
  - [ ] 3.1 Find the chat input component that consumes `useCoachingChat()` return values
  - [ ] 3.2 When `hasApiKey` is false: disable the textarea, show placeholder text "Configure an API key in Settings to start chatting", disable the submit button
  - [ ] 3.3 Ensure the same disabled pattern is applied in the replay chat input component

- [ ] 4. Write tests (AC: 1, 2, 3)
  - [ ] 4.1 Create `src/features/coaching/coaching-client.test.ts`
  - [ ] 4.2 Test that `handleSubmit` does not call `sendMessage` when `hasApiKey` is false
  - [ ] 4.3 Test that `getActiveProviderId()` returns the correct provider from stored metadata
  - [ ] 4.4 Test that `getActiveProviderId()` falls back to `'openai'` when no metadata is available

## Dev Notes

- **Architecture Layer**: `coaching-client.ts` is Layer 2 (Application Logic). `provider-resolver.ts` is Layer 2/3 (shared utility).
- **Current state of the guard**: Examining the actual code at `src/features/coaching/coaching-client.ts`:
  - Line 19: `const hasApiKey = useAppStore((s) => s.hasApiKey);` -- already reads from appStore
  - Line 82: `if (!trimmed || isLoading || !hasApiKey) return;` -- the guard IS already present
  - The bug description may reference an older version of the code. The `!hasApiKey` guard appears to have been added already. Focus on verifying it works end-to-end and fixing the hardcoded `providerId`.
- **Hardcoded providerId** is the confirmed remaining issue:
  - `coaching-client.ts` line 27: `providerId: 'openai'`
  - `use-replay-chat.ts` line 25: `providerId: 'openai'`
  - Both need to dynamically resolve the provider from the user's saved key metadata.
- **Provider resolution**: The `ApiKeyProvider` type in `src/features/auth/auth-types.ts` likely defines supported providers (openai, anthropic, etc.). The `getApiKeyMetadata()` function in `src/features/auth/api-key-manager.ts` returns `ApiKeyMetadata` which includes the provider. This needs to be accessible at request time without an async call (cache in appStore or read synchronously).
- **appStore**: Currently stores `hasApiKey: boolean` but not the provider. May need to extend with `apiKeyProvider: ApiKeyProvider | null` field.
- **use-replay-chat.ts reference** (correct pattern): Line 67: `if (!trimmed || isLoading || !hasApiKey) return;`

### Project Structure Notes

- `src/features/coaching/coaching-client.ts` -- fix hardcoded providerId (line 27), verify guard (line 82)
- `src/features/coaching/use-replay-chat.ts` -- fix hardcoded providerId (line 25)
- `src/features/coaching/provider-resolver.ts` -- create shared provider resolution utility
- `src/features/coaching/coaching-client.test.ts` -- create co-located test
- `src/stores/app-store.ts` -- potentially extend with `apiKeyProvider` field
- `src/features/auth/auth-types.ts` -- reference for `ApiKeyProvider` type
- `src/features/auth/api-key-manager.ts` -- reference for metadata access

### References

- [Source: _bmad-output/planning-artifacts/architecture.md] -- BYOK model, provider-agnostic AI architecture
- [Source: _bmad-output/planning-artifacts/prd.md] -- FR46-48: API key configuration and provider support
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3] -- LLM API key configuration UI
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.5] -- Graceful degradation without API key

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
