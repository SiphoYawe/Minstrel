# Story 3.4: API Key Validation and Encrypted Storage

Status: ready-for-dev

## Story

As a user,
I want my API key validated and stored securely,
So that I know it works and that it's protected.

## Acceptance Criteria

1. **Given** a user submits an API key via the Settings UI, **When** the `/api/user/keys` POST endpoint receives the request, **Then** the endpoint validates the user's session via Supabase Auth, extracts the key and provider from the request body, and proceeds to validation.

2. **Given** the endpoint receives a valid provider and key, **When** validation runs, **Then** the system makes a lightweight test call to the specified LLM provider (e.g., a minimal chat completion with `max_tokens: 1` for OpenAI, or equivalent for Anthropic) and returns the validation result within 5 seconds.

3. **Given** the validation succeeds, **When** the key is confirmed valid, **Then** the key is encrypted using AES-256-GCM with a server-side encryption key from the `ENCRYPTION_KEY` environment variable, the encrypted key (with IV and auth tag) is stored in the `user_api_keys` table, and the response returns `{ data: { provider, lastFour, status: 'active' }, error: null }`.

4. **Given** the validation fails, **When** the key is invalid, expired, or the provider is unreachable, **Then** the response returns a clear error distinguishing: `INVALID_KEY` ("This API key doesn't appear to be valid — check it and try again"), `PROVIDER_DOWN` ("We couldn't reach the provider right now — try again in a moment"), or `RATE_LIMITED` ("The provider says you're sending too many requests — wait a moment").

5. **Given** a user makes a GET request to `/api/user/keys`, **When** the endpoint processes the request, **Then** it returns only key metadata: `{ data: { provider, lastFour, status, createdAt, updatedAt }, error: null }` and NEVER returns the actual key or its encrypted form.

6. **Given** a user makes a DELETE request to `/api/user/keys` with `{ provider: string }`, **When** the endpoint processes the request, **Then** the encrypted key row is deleted from `user_api_keys`, the response confirms deletion, and `appStore.hasApiKey` is subsequently updated to `false` on the client.

7. **Given** security requirements (NFR12), **When** the API key is handled anywhere in the system, **Then** the key is never logged (not in console, not in Sentry, not in server logs), never included in error report metadata, never stored in plain text, and never returned to the client after initial submission.

8. **Given** a user already has a key for the same provider, **When** they submit a new key, **Then** the existing key is replaced (upsert behavior) rather than creating a duplicate, and the new key goes through validation before replacing the old one.

## Tasks / Subtasks

- [ ] Task 1: Implement AES-256-GCM encryption module (AC: 3, 7)
  - [ ] Create `src/lib/crypto.ts` with `encrypt(plaintext: string, encryptionKey: string): EncryptedPayload` function
  - [ ] Create `decrypt(encryptedPayload: EncryptedPayload, encryptionKey: string): string` function
  - [ ] Define `EncryptedPayload` type: `{ ciphertext: string, iv: string, authTag: string }` (all base64-encoded)
  - [ ] Use Node.js built-in `crypto` module: `crypto.createCipheriv('aes-256-gcm', key, iv)` with a random 12-byte IV per encryption
  - [ ] Derive the AES key from `ENCRYPTION_KEY` env var using `crypto.scryptSync(key, salt, 32)` with a fixed application salt
  - [ ] Store as a single concatenated base64 string in the database: `${iv}:${authTag}:${ciphertext}`
  - [ ] Add input validation: reject empty strings, enforce minimum key length
  - [ ] CRITICAL: This module must only be imported in server-side code (API routes). Add a runtime check that throws if `typeof window !== 'undefined'`

- [ ] Task 2: Implement provider-specific validation functions (AC: 2, 4)
  - [ ] Create `src/app/api/user/keys/validate.ts` with `validateApiKey(provider: string, apiKey: string): Promise<ValidationResult>` function
  - [ ] Implement OpenAI validation: `POST https://api.openai.com/v1/chat/completions` with `{ model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 }` and the user's key in `Authorization: Bearer {key}` header
  - [ ] Implement Anthropic validation: `POST https://api.anthropic.com/v1/messages` with `{ model: 'claude-3-5-haiku-20241022', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 }` and the user's key in `x-api-key: {key}` header
  - [ ] Implement generic "other" provider validation: skip validation, store with status `'unverified'`
  - [ ] Parse provider error responses to distinguish: 401/403 -> `INVALID_KEY`, 429 -> `RATE_LIMITED`, 500/502/503 -> `PROVIDER_DOWN`, timeout (>5s) -> `PROVIDER_DOWN`
  - [ ] Define `ValidationResult` type: `{ valid: boolean, error?: { code: string, message: string } }`
  - [ ] Set a 5-second timeout on all validation requests

- [ ] Task 3: Implement POST /api/user/keys endpoint (AC: 1, 2, 3, 4, 7, 8)
  - [ ] Create `src/app/api/user/keys/route.ts` with POST handler
  - [ ] Authenticate request: create server Supabase client, get session, return 401 if unauthenticated
  - [ ] Validate request body with Zod schema: `{ provider: z.enum(['openai', 'anthropic', 'other']), apiKey: z.string().min(10).max(500) }`
  - [ ] Call `validateApiKey(provider, apiKey)` — return validation error if invalid
  - [ ] On validation success: encrypt the key via `encrypt(apiKey, process.env.ENCRYPTION_KEY!)`
  - [ ] Upsert into `user_api_keys`: insert if no existing row for `(user_id, provider)`, update if exists
  - [ ] Store: `user_id`, `provider`, `encrypted_key` (the concatenated base64 string), `key_last_four` (last 4 chars of the original key), `status: 'active'`
  - [ ] Return `ApiResponse<ApiKeyMetadata>` with provider, lastFour, status
  - [ ] Wrap entire handler in try/catch, report errors to Sentry WITHOUT including the API key in the error context
  - [ ] NEVER log the API key at any log level

- [ ] Task 4: Implement GET /api/user/keys endpoint (AC: 5)
  - [ ] Add GET handler to `src/app/api/user/keys/route.ts`
  - [ ] Authenticate request via server Supabase client
  - [ ] Query `user_api_keys` for the authenticated user: `SELECT provider, key_last_four, status, created_at, updated_at`
  - [ ] NEVER select `encrypted_key` column in the GET query
  - [ ] Return `ApiResponse<ApiKeyMetadata[]>` (array, since user could have keys for multiple providers)
  - [ ] Return empty array if no keys configured

- [ ] Task 5: Implement DELETE /api/user/keys endpoint (AC: 6)
  - [ ] Add DELETE handler to `src/app/api/user/keys/route.ts`
  - [ ] Authenticate request via server Supabase client
  - [ ] Validate request body: `{ provider: z.string() }`
  - [ ] Delete from `user_api_keys` where `user_id` matches and `provider` matches
  - [ ] Return `ApiResponse<{ deleted: true }>`
  - [ ] If no key found for that provider, return 404 with `NOT_FOUND` error code

- [ ] Task 6: Create server-side key decryption utility for AI routes (AC: 3)
  - [ ] Create `src/lib/crypto.ts` helper function `getDecryptedApiKey(userId: string, provider: string): Promise<string | null>`
  - [ ] This function queries `user_api_keys`, retrieves the `encrypted_key`, and calls `decrypt()`
  - [ ] This is the ONLY path by which AI API routes (`/api/ai/*`) will access the user's key
  - [ ] Returns `null` if no key found for the user/provider combination
  - [ ] This function will be consumed by Story 4.1 (Vercel AI SDK Integration)

- [ ] Task 7: Add rate limiting to API key endpoints (AC: 1)
  - [ ] Implement basic rate limiting on `/api/user/keys` POST: max 10 key submissions per user per hour (prevents abuse of validation calls to LLM providers)
  - [ ] Use in-memory rate limiting (Map with user_id -> timestamp array) for MVP; upgrade to Redis in production if needed
  - [ ] Return 429 with `RATE_LIMITED` error code when exceeded

- [ ] Task 8: Write tests (AC: all)
  - [ ] Create `src/lib/crypto.test.ts` testing: encrypt then decrypt round-trip, different keys produce different ciphertexts, decryption with wrong key fails, empty string handling, IV uniqueness (encrypt same plaintext twice, get different ciphertexts)
  - [ ] Create `src/app/api/user/keys/validate.test.ts` testing: OpenAI success, Anthropic success, invalid key (401 response), rate limited (429 response), provider down (timeout), provider down (500 response)
  - [ ] Create `src/app/api/user/keys/route.test.ts` testing: POST creates key, POST replaces existing key (upsert), GET returns metadata only, GET returns empty when no keys, DELETE removes key, unauthenticated requests return 401, invalid body returns 400
  - [ ] Mock external provider API calls in validation tests (never make real LLM API calls in tests)
  - [ ] Verify that no test logs or assertions expose the API key value

## Dev Notes

- **Encryption Approach**: Use application-level AES-256-GCM encryption rather than `pgcrypto` in PostgreSQL. This gives us more control, keeps the encryption key out of the database, and makes the crypto testable in Node.js. The `ENCRYPTION_KEY` env var must be at least 32 characters and should be a random hex string.
- **AES-256-GCM**: GCM mode provides both confidentiality and authenticity. The auth tag ensures the ciphertext hasn't been tampered with. Always use a random IV (never reuse IVs with the same key). Store IV + authTag + ciphertext together.
- **Key Derivation**: Use `crypto.scryptSync` to derive the actual 256-bit AES key from the `ENCRYPTION_KEY` env var. This handles the case where the env var is a passphrase rather than a raw 32-byte key.
- **Storage Format**: Store the encrypted key as a single string `{iv_base64}:{authTag_base64}:{ciphertext_base64}` in the `encrypted_key` column. This is simpler than separate columns and the parsing is trivial.
- **Validation Cost**: Each validation call costs a tiny amount of the user's API quota (1 token for OpenAI, minimal for Anthropic). This is acceptable for a one-time validation. The 10-per-hour rate limit prevents abuse.
- **Security Checklist**:
  - API key never in logs (configure Sentry to scrub request bodies on this endpoint)
  - API key never returned after storage (GET returns metadata only)
  - API key never in client-side state after submission
  - Encrypted at rest in Supabase (AES-256-GCM)
  - Decrypted only in API routes (server-side, never in middleware or client code)
  - `ENCRYPTION_KEY` is a Vercel environment variable, never in source code
  - RLS on `user_api_keys` ensures users can only access their own keys
- **Sentry Configuration**: Add `ENCRYPTION_KEY` and any request body field containing `apiKey` or `key` to Sentry's `beforeSend` scrub list. This prevents accidental exposure through error reports.
- **Provider API Endpoints**: The validation calls use the cheapest available models. As providers release newer/cheaper models, update the validation model names. The validation payload is intentionally minimal.

### Project Structure Notes

Files created/modified in this story:
```
src/lib/crypto.ts                           (create)
src/app/api/user/keys/route.ts              (create)
src/app/api/user/keys/validate.ts           (create)
src/lib/crypto.test.ts                      (create)
src/app/api/user/keys/validate.test.ts      (create)
src/app/api/user/keys/route.test.ts         (create)
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security — API Key Security]
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns — /api/user/keys]
- [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns — ApiResponse, Standard Error Codes]
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns — Error Handling]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.4]
- [Source: _bmad-output/planning-artifacts/prd.md#FR48, NFR9, NFR12]
- AR12: API key encryption/decryption using AES-256

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
