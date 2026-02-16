# Story 27.7: Resolve Duplicate Auth Pages and Improve Auth UX

Status: ready-for-dev

## Story

As a developer and user,
I want clean auth pages with proper validation and visible password recovery,
So that there's no confusion and the auth experience is smooth.

## Acceptance Criteria

1. Given two auth page directories exist, When audited, Then stale/duplicate set is removed
2. Given email validation, When user enters email, Then domain validation checks for valid format
3. Given login page, When rendered, Then "Forgot Password" is visible without scrolling
4. Given guest converts to registered, When transition occurs, Then animation and message show: "Creating your account and migrating your practice data..."

## Tasks / Subtasks

1. Audit and remove duplicate auth directory (AUTH-C1)
   - Identify which of `src/app/(auth)/` and `src/app/auth/` is canonical
   - Remove stale directory and update any references
2. Improve email validation with domain check (AUTH-H1)
   - Add client-side email format validation with domain check
   - Provide specific error messages for invalid email formats
3. Move "Forgot Password" link above fold (AUTH-H2)
   - Reposition link to be visible without scrolling on login page
   - Ensure adequate visual prominence
4. Add guest-to-auth transition animation (AUTH-H4)
   - Create transition overlay with progress message
   - Show "Creating your account and migrating your practice data..." during conversion
   - Ensure data migration completes before dismissing overlay

## Dev Notes

**Findings Covered**: AUTH-C1, AUTH-H1, AUTH-H2, AUTH-H4
**Files**: `src/app/(auth)/`, `src/app/auth/`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
