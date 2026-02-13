# Story 20.1: Fix Security Polish — CI Checks, Token Tracker Import, Error Messages

Status: ready-for-dev

## Story

As a security-conscious developer,
I want CI checks for service_role usage, correct server imports, generic error messages, and UUID validation,
So that secrets don't leak, server-side code works correctly, implementation details stay hidden, and invalid data is rejected.

## Acceptance Criteria

1. Given CI/CD pipeline runs, When code is scanned, Then a check detects any `service_role` key usage outside admin-designated files
2. Given the token tracker module, When it imports Supabase client, Then it uses `@/lib/supabase/server` (not client)
3. Given an API error occurs in production, When the error message is sent to the client, Then it contains generic messages without implementation details
4. Given a sessionId is received, When stored in the database, Then it is validated as UUID format before insertion

## Tasks / Subtasks

1. Add CI check for service_role usage (SEC-M1)
   - Add grep-based CI step to detect `service_role` in `src/` outside admin files
2. Fix token tracker import (SEC-M2)
   - Change import from `@/lib/supabase/client` to `@/lib/supabase/server`
3. Genericize production error messages (SEC-M3)
   - Create `sanitizeError()` utility
   - Return generic messages in production, detailed in development
4. Add UUID validation (SEC-M4)
   - Create Zod schema: `z.string().uuid()`
   - Validate sessionId before DB operations
5. Add unit tests

## Dev Notes

**Findings Covered**: SEC-M1, SEC-M2, SEC-M3, SEC-M4
**Files**: `supabase/migrations/`, `src/features/coaching/token-tracker.ts`, `src/lib/ai/errors.ts`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
