# Story 19.2: Fix API Key Validation to Use Non-Charging Endpoints

Status: ready-for-dev

## Story

As a musician with a BYOK API key,
I want key validation to not consume my token quota,
So that repeated validations don't drain my account balance.

## Acceptance Criteria

1. Given a user submits an OpenAI API key for validation, When validation runs, Then it calls `GET /v1/models` (free endpoint) instead of generating tokens
2. Given a user submits an Anthropic API key for validation, When validation runs, Then it uses key format validation and a non-generating endpoint
3. Given repeated validation requests, When a user validates the same key multiple times, Then zero tokens are consumed on the user's account
4. Given an invalid API key is submitted, When validation fails, Then the error message clearly indicates why (invalid format, expired, wrong permissions)

## Tasks / Subtasks

1. Fix OpenAI validation
   - Replace `chat.completions.create` with `GET /v1/models` fetch
   - Parse response to verify key is valid
   - Map error codes to user-friendly messages
2. Fix Anthropic validation
   - Add format regex check: `^sk-ant-[a-zA-Z0-9-_]{95}$`
   - Use lightweight non-charging endpoint if available
   - Fallback to format-only validation
3. Add unit tests
   - Valid OpenAI key → models endpoint succeeds
   - Invalid OpenAI key → 401 → validation fails
   - Valid Anthropic key → format check passes
   - 100 validations → zero tokens consumed

## Dev Notes

**Architecture Layer**: Application Layer (auth/keys)
**Findings Covered**: SEC-H2
**File**: `src/app/api/user/keys/validate.ts` (lines 52-63, 82-94)
**Current Issue**: Validation makes real API calls with `max_tokens: 1`, consuming user quota. Could be weaponized.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
