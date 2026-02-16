# Story 27-7: Resolve Duplicate Auth Pages and Improve Auth UX

**Status**: done
**Author**: Melchizedek
**Date**: 2026-02-16

## Story

As a developer and user,
I want clean auth pages with proper validation and visible password recovery,
So that there's no confusion and the auth experience is smooth.

## Acceptance Criteria

1. **AC1** - Given two auth page directories exist, When audited, Then stale/duplicate set is removed
   - Removed 4 redirect stubs from `src/app/auth/` (login, sign-up, forgot-password, update-password)
   - Preserved critical routes: `auth/confirm` (OTP callback) and `auth/error` (error display)
   - Removed 3 dead form components: sign-up-form.tsx, login-form.tsx, forgot-password-form.tsx
   - Updated guest-prompt.tsx: `/auth/sign-up` → `/signup`
   - Canonical auth pages live in `src/app/(marketing)/`

2. **AC2** - Given email validation, When user enters email, Then domain validation checks for valid format
   - Already implemented: `isValidEmail()` with regex `/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i`
   - Validates on blur with error message "Please enter a valid email address"
   - Present on both login and signup pages

3. **AC3** - Given login page, When rendered, Then "Forgot Password" is visible without scrolling
   - Already implemented: link positioned inline with Password label in flex row
   - Visible without scrolling on standard viewports

4. **AC4** - Given guest converts to registered, When transition occurs, Then animation shows message
   - Already implemented: GuestConversionOverlay shows "Creating your account and migrating your practice data..."
   - Full-screen overlay with Loader2 spinner, proper ARIA attributes

## Implementation Summary

### Files Deleted

- `src/app/auth/login/page.tsx` — redirect stub to `/login`
- `src/app/auth/sign-up/page.tsx` — redirect stub to `/signup`
- `src/app/auth/forgot-password/page.tsx` — redirect stub to `/forgot-password`
- `src/app/auth/update-password/page.tsx` — redirect stub to `/update-password`
- `src/components/sign-up-form.tsx` — dead code (never imported)
- `src/components/login-form.tsx` — dead code (never imported)
- `src/components/forgot-password-form.tsx` — dead code (never imported)

### Files Modified

- `src/components/guest-prompt.tsx` — Updated link from `/auth/sign-up` to `/signup`
- `src/components/guest-prompt.test.tsx` — Updated test to match new link

### Files Created

- `src/app/(marketing)/__tests__/auth-ux.test.tsx` — 13 tests covering all 4 ACs

### Files Preserved (Critical Auth Routes)

- `src/app/auth/confirm/route.ts` — Supabase email OTP verification callback
- `src/app/auth/error/page.tsx` — Auth error display page

## Test Coverage

- **auth-ux.test.tsx**: 13 tests covering file removal verification, email validation, forgot password visibility, guest conversion overlay, and link updates
- **guest-prompt.test.tsx**: 6 tests (1 updated for new link)
- All 19 tests passing

## Dev Notes

**Findings Covered**: AUTH-C1, AUTH-H1, AUTH-H2, AUTH-H4

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Completion Notes

- AC2, AC3, AC4 were already implemented in earlier epics
- Primary work was AC1: removing duplicate auth directory and dead code
- `src/app/auth/confirm/route.ts` preserved (Supabase OTP callback at `/auth/confirm`)
- `src/app/auth/error/page.tsx` preserved (referenced by confirm route)
- Cleared `.next/types` cache to regenerate route types after deletion

### File List

**Deleted**: 7 files (4 redirect stubs + 3 dead form components)
**Modified**: 2 files (guest-prompt.tsx + test)
**Created**: 1 file (auth-ux.test.tsx)
