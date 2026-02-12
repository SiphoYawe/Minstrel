# Story 3.3: LLM API Key Configuration UI

Status: ready-for-dev

## Story

As a user,
I want to configure my LLM API key in settings,
So that I can unlock AI coaching and drill generation features.

## Acceptance Criteria

1. **Given** the user is logged in and on the Settings page, **When** they navigate to the API Keys section, **Then** a clearly labeled "API Keys" section is displayed with a provider selector dropdown (OpenAI, Anthropic, and a generic "Other" option) and a secure text input for the API key.

2. **Given** the user is entering their API key, **When** they paste or type a key into the input field, **Then** the input field uses `type="password"` to prevent over-the-shoulder exposure, and the field shows the raw key only while focused/typing.

3. **Given** the user has previously configured an API key, **When** they view the API Keys section, **Then** the key is displayed in masked form showing only the provider name and last 4 characters (e.g., "OpenAI: sk-...a4Bx"), and a status badge shows "Active" (green) or "Invalid" (amber).

4. **Given** the APIKeyPrompt component (P3 priority) is rendered, **When** displayed on the Settings page, **Then** it uses the dark studio aesthetic: `#0F0F0F` background, `#7CB9E8` accent for interactive elements, 0px border radius, Inter font, and matches the established design system.

5. **Given** the user wants to update or remove their key, **When** they click "Update Key" or "Remove Key", **Then** the update flow replaces the existing key via POST to `/api/user/keys`, and the delete flow calls DELETE to `/api/user/keys` with a confirmation dialog ("Remove your API key? AI features will be disabled.") before executing.

6. **Given** the user submits a new API key, **When** the form is submitted, **Then** the key is sent to `/api/user/keys` via POST with the payload `{ provider: string, apiKey: string }`, a loading spinner is shown during validation, and the result (success or error) is displayed inline without page navigation.

7. **Given** the user has no API key configured, **When** they view the API Keys section, **Then** an onboarding prompt explains the BYOK model: "Minstrel uses your own LLM API key for AI features. Your key is encrypted and never shared." with links to provider documentation for obtaining keys.

## Tasks / Subtasks

- [ ] Task 1: Create API key manager client module (AC: 5, 6)
  - [ ] Create `src/features/auth/api-key-manager.ts` with functions: `submitApiKey(provider: string, apiKey: string): Promise<ApiResponse<ApiKeyMetadata>>`, `getApiKeyMetadata(): Promise<ApiResponse<ApiKeyMetadata | null>>`, `deleteApiKey(provider: string): Promise<ApiResponse<void>>`
  - [ ] Define `ApiKeyMetadata` type in `src/features/auth/auth-types.ts`: `{ provider: string, lastFour: string, status: 'active' | 'invalid' | 'validating', createdAt: string, updatedAt: string }`
  - [ ] Implement `fetch` calls to `/api/user/keys` with appropriate HTTP methods (GET, POST, DELETE)
  - [ ] Handle error responses and map to user-friendly messages

- [ ] Task 2: Create APIKeyPrompt component (AC: 1, 2, 3, 4, 7)
  - [ ] Create `src/features/auth/api-key-prompt.tsx` component
  - [ ] Implement provider selector using shadcn/ui `Select` component with options: `{ value: 'openai', label: 'OpenAI' }`, `{ value: 'anthropic', label: 'Anthropic' }`, `{ value: 'other', label: 'Other Provider' }`
  - [ ] Implement secure key input using shadcn/ui `Input` with `type="password"`, placeholder "Paste your API key here"
  - [ ] Implement masked key display for existing keys: show `"{Provider}: {prefix}...{lastFour}"` with status badge (shadcn/ui `Badge`)
  - [ ] Add "Save Key" button (primary action, `#7CB9E8` accent), "Update Key" button (when key exists), "Remove Key" button (destructive action with confirmation dialog using shadcn/ui `Dialog`)
  - [ ] Add BYOK onboarding text when no key is configured, with external links to OpenAI and Anthropic API key pages
  - [ ] Apply dark studio aesthetic: 0px border radius on all elements, `#0F0F0F` section background, `#1A1A1A` input background, `#7CB9E8` interactive accents
  - [ ] Add loading state with spinner during key submission/validation

- [ ] Task 3: Create Zod validation schema for API key submission (AC: 6)
  - [ ] Create validation schema in `src/features/auth/auth-types.ts`: `apiKeySubmitSchema = z.object({ provider: z.enum(['openai', 'anthropic', 'other']), apiKey: z.string().min(10, 'API key seems too short').max(500, 'API key seems too long') })`
  - [ ] Validate on client before submission, show inline errors

- [ ] Task 4: Integrate APIKeyPrompt into Settings page (AC: 1, 4)
  - [ ] Update `src/app/(auth)/settings/page.tsx` to import and render `APIKeyPrompt` in the API Keys section
  - [ ] Fetch existing key metadata on page load via `getApiKeyMetadata()`
  - [ ] Pass key metadata and handlers as props to `APIKeyPrompt`

- [ ] Task 5: Update appStore on key changes (AC: 3, 5)
  - [ ] After successful key submission, set `appStore.hasApiKey = true`
  - [ ] After successful key deletion, set `appStore.hasApiKey = false`
  - [ ] On settings page load, fetch key metadata and set `appStore.hasApiKey` accordingly
  - [ ] Ensure `hasApiKey` state persists across navigation (Zustand in-memory is sufficient since it's fetched on auth load)

- [ ] Task 6: Initialize hasApiKey on auth load (AC: 3)
  - [ ] Update `src/features/auth/auth-provider.tsx` to call `getApiKeyMetadata()` when auth state confirms a logged-in user
  - [ ] Set `appStore.hasApiKey = true/false` based on whether metadata is returned

- [ ] Task 7: Write tests (AC: all)
  - [ ] Create `src/features/auth/api-key-manager.test.ts` testing: submitApiKey sends correct payload, getApiKeyMetadata returns metadata, deleteApiKey sends DELETE request, error handling for network failures
  - [ ] Create `src/features/auth/api-key-prompt.test.tsx` testing: renders provider selector and input, masks existing key, shows BYOK onboarding when no key, confirmation dialog on delete, loading state during submission
  - [ ] Mock fetch API for all tests

## Dev Notes

- **Component Priority**: APIKeyPrompt is classified as P3 (Phase 3, Weeks 5-7) in the UX spec. However, it is needed for the BYOK flow to function, so it is implemented here alongside the API key story arc.
- **Security — Client Side**: The raw API key is handled in memory only during the form submission. After submission, the client receives back only the masked metadata (provider + last 4). The key itself is never stored client-side, never in localStorage, never in cookies, never in Zustand state.
- **Provider-Specific Key Format Hints**: Consider adding placeholder text hints based on the selected provider: OpenAI keys start with `sk-`, Anthropic keys start with `sk-ant-`. This helps users confirm they're pasting the right key. This is a UX nicety, not a validation requirement.
- **Accessible Form**: The form must be keyboard-navigable (Tab through provider select, key input, submit button). Use `aria-label` on the password input since the visual label may be separate. Error messages should be associated via `aria-describedby`.
- **Design System Compliance**: All components must use 0px border radius (override any shadcn/ui defaults), the dark palette, and Inter font. Reference the design tokens in `tailwind.config.ts` set up in Story 1.2.
- **External Links**: Links to provider API key documentation should open in new tabs (`target="_blank" rel="noopener noreferrer"`). Include OpenAI (https://platform.openai.com/api-keys) and Anthropic (https://console.anthropic.com/settings/keys) links.

### Project Structure Notes

Files created/modified in this story:
```
src/features/auth/api-key-manager.ts       (create)
src/features/auth/api-key-prompt.tsx        (create)
src/features/auth/auth-types.ts            (update - add ApiKeyMetadata, apiKeySubmitSchema)
src/features/auth/index.ts                 (update - add exports)
src/features/auth/auth-provider.tsx        (update - fetch hasApiKey on auth)
src/app/(auth)/settings/page.tsx           (update - integrate APIKeyPrompt)
src/stores/app-store.ts                    (update - hasApiKey state)
src/features/auth/api-key-manager.test.ts  (create)
src/features/auth/api-key-prompt.test.tsx   (create)
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns — /api/user/keys]
- [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns — API Response Format]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — APIKeyPrompt P3 component]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3]
- [Source: _bmad-output/planning-artifacts/prd.md#FR47]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
