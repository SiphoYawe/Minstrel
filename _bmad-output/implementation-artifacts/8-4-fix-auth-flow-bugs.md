# Story 8.4: Fix Auth Flow Bugs

Status: ready-for-dev

## Story

As a user,
I want authentication flows to redirect me to sensible destinations,
so that I don't get lost after confirming my email, signing out, or signing up.

## Acceptance Criteria

1. Given a user confirms their email via the confirmation link, When the `auth/confirm` route processes the OTP, Then the default redirect is `/session` (not `/`). And the `next` query parameter can still override the default destination.

2. Given a user signs out from any location, When sign-out completes, Then they are redirected to `/` (marketing/landing page) consistently across all sign-out implementations. And both `profile-menu.tsx` and `use-auth.ts` redirect to the same destination.

3. Given the sign-up success page exists at `/auth/sign-up-success`, When a user navigates there, Then the route either redirects to `/login` or has been removed entirely (dead route from Supabase template). And the custom signup flow continues to show inline success without relying on this route.

4. Given both `profile-menu.tsx` and `use-auth.ts` have sign-out logic, When sign-out is triggered from either location, Then both redirect to `/` (not `/login`). And the redirect is consistent regardless of which component initiates the sign-out.

## Tasks / Subtasks

- [ ] 1. Verify auth/confirm redirect default (AC: 1)
  - [ ] 1.1 Open `src/app/auth/confirm/route.ts` line 10
  - [ ] 1.2 Current code: `const next = searchParams.get('next') ?? '/session';` -- this already defaults to `/session`
  - [ ] 1.3 The bug (BUG-5) described the default as `/` but the current code shows `/session`. Verify this was already fixed. If so, mark as verified and add a regression test

- [ ] 2. Unify sign-out redirects to `/` (AC: 2, 4)
  - [ ] 2.1 Open `src/components/profile-menu.tsx` line 33
  - [ ] 2.2 Current code: `router.push('/login');` -- this redirects to `/login` after sign-out
  - [ ] 2.3 Change to `router.push('/');` to redirect to the marketing/landing page
  - [ ] 2.4 Open `src/features/auth/use-auth.ts` line 123
  - [ ] 2.5 Current code: `router.push('/login');` -- this also redirects to `/login` after sign-out
  - [ ] 2.6 Change to `router.push('/');` to match the unified redirect destination
  - [ ] 2.7 Verify no other sign-out implementations exist by searching for `signOut` and `sign-out` across the codebase

- [ ] 3. Handle dead sign-up-success route (AC: 3)
  - [ ] 3.1 Check if `src/app/auth/sign-up-success/page.tsx` exists -- current search shows it does NOT exist in the filesystem
  - [ ] 3.2 If it does not exist, verify the custom signup flow handles success inline (check the signup page/component)
  - [ ] 3.3 If it does exist in another location, either delete it or replace contents with a redirect to `/login`

- [ ] 4. Write tests (AC: 1, 2, 4)
  - [ ] 4.1 Add integration test for auth/confirm route verifying default redirect is `/session`
  - [ ] 4.2 Add test verifying profile-menu sign-out redirects to `/`
  - [ ] 4.3 Add test verifying use-auth sign-out redirects to `/`

## Dev Notes

- **Architecture Layer**: Auth routes are Layer 4 (Infrastructure). Components are Layer 1 (Presentation). `use-auth.ts` is Layer 2 (Application Logic).
- **BUG-5 (auth/confirm redirect)**: Current code at `src/app/auth/confirm/route.ts` line 10 shows `const next = searchParams.get('next') ?? '/session';`. This appears to already be fixed (defaults to `/session`). Needs verification only.
- **BUG-6 (conflicting sign-out redirects)**:
  - `src/components/profile-menu.tsx` line 33: `router.push('/login');` -- should be `router.push('/');`
  - `src/features/auth/use-auth.ts` line 123: `router.push('/login');` -- should be `router.push('/');`
  - Both currently redirect to `/login` which is inconsistent with the desired behavior of going to the marketing page.
  - Expected behavior: After sign-out, user lands on `/` (marketing/landing page) where they can see the product value prop and choose to sign in again.
- **BUG-7 (dead sign-up-success route)**: File search shows `src/app/auth/sign-up-success/page.tsx` does NOT exist in the current filesystem. This may have already been cleaned up. Verify and document.
- **Sign-out code duplication**: Both `profile-menu.tsx` and `use-auth.ts` implement sign-out independently. Consider whether `profile-menu.tsx` should delegate to `useAuth().signOut()` to eliminate duplication. However, `profile-menu.tsx` also calls `capture('user_logged_out')` and `reset()` for analytics, which `use-auth.ts` does not. A future story could unify these.

### Project Structure Notes

- `src/app/auth/confirm/route.ts` -- verify redirect default (line 10)
- `src/components/profile-menu.tsx` -- fix sign-out redirect (line 33): `/login` -> `/`
- `src/features/auth/use-auth.ts` -- fix sign-out redirect (line 123): `/login` -> `/`
- `src/app/auth/sign-up-success/page.tsx` -- verify does not exist (already cleaned up)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md] -- Auth flow: Supabase Auth with @supabase/ssr, cookie sessions
- [Source: _bmad-output/planning-artifacts/prd.md] -- FR45: User registration and authentication
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1] -- User registration and login story
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] -- Navigation flows, post-auth destinations

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
