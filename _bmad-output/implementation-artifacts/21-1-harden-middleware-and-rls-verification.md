# Story 21.1: Harden Middleware and RLS Verification

Status: ready-for-dev

## Story

As a security-conscious developer,
I want redirect paths validated, API route middleware exclusion documented, and RLS policies tested automatically,
So that open redirects are prevented, design decisions are clear, and database policies are verified.

## Acceptance Criteria

1. Given the middleware processes a redirect, When building the redirect URL, Then the pathname is validated: `pathname.startsWith('/') && !pathname.includes('://')`
2. Given API routes are excluded from middleware, When the code is reviewed, Then a comment explains why API routes rely on per-route auth
3. Given RLS policies exist for all tables, When automated tests run, Then they verify RLS policies are in place for every table with user data

## Tasks / Subtasks

1. Add redirect path validation (SEC-L1)
   - Create `validateRedirectPath()` function
   - Block paths with `://` to prevent open redirect
2. Document API route middleware exclusion (SEC-L2)
   - Add explanatory comment to middleware config matcher
3. Add RLS verification tests (SEC-L3)
   - Create `supabase/tests/rls.test.sql`
   - Test all tables have RLS enabled
4. Add unit tests

## Dev Notes

**Findings Covered**: SEC-L1, SEC-L2, SEC-L3
**Files**: `src/middleware.ts`, `src/app/api/user/export/route.ts`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
