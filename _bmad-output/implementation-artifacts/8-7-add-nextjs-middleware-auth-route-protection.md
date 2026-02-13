# Story 8.7: Add Next.js Middleware Auth Route Protection

Status: ready-for-dev

## Story

As a developer,
I want Next.js middleware to redirect unauthenticated users from protected routes to the login page,
so that users never see broken auth-required pages.

## Acceptance Criteria

1. Given an unauthenticated user navigates to `/session`, `/replay`, or `/settings`, When the middleware runs, Then they are redirected to `/login?redirectTo={originalPath}`. And the `redirectTo` query parameter preserves the original intended destination so the user can be redirected back after login.

2. Given an authenticated user navigates to `/login` or `/signup`, When the middleware runs, Then they are redirected to `/session` (no need to re-authenticate). And existing auth cookies are validated server-side before redirecting.

3. Given the middleware checks Supabase auth cookies, When it validates the session, Then it uses `@supabase/ssr` server-side session validation via `createServerClient`. And it does NOT use client-side JavaScript auth checks. And the middleware client uses `request.cookies` and `response.cookies` (not the `next/headers` cookies() function).

4. Given guest routes like `/play` and `/`, When any user navigates there, Then no auth redirect occurs. And the middleware matcher config explicitly excludes public routes, static assets, and API routes.

## Tasks / Subtasks

- [ ] 1. Create the middleware file (AC: 1, 2, 3, 4)
  - [ ] 1.1 Create `src/middleware.ts` at the root of the `src/` directory (Next.js convention)
  - [ ] 1.2 Import `createServerClient` from `@supabase/ssr` and `NextResponse` from `next/server`
  - [ ] 1.3 Implement the middleware function that creates a Supabase server client using request/response cookies
  - [ ] 1.4 Call `supabase.auth.getUser()` to validate the session (NOT `getSession()` which only reads the JWT without validation)
  - [ ] 1.5 Define protected routes: `/session`, `/replay`, `/settings`
  - [ ] 1.6 Define auth routes (redirect if already authenticated): `/login`, `/signup`
  - [ ] 1.7 Define public routes that should never redirect: `/`, `/play`, `/api/*`, `/_next/*`, `/auth/*`

- [ ] 2. Implement redirect logic (AC: 1, 2)
  - [ ] 2.1 If the user is NOT authenticated and the route is in the protected list, redirect to `/login?redirectTo={pathname}`
  - [ ] 2.2 If the user IS authenticated and the route is in the auth routes list (`/login`, `/signup`), redirect to `/session`
  - [ ] 2.3 For all other routes, pass through without modification (return `NextResponse.next()` with updated cookies)

- [ ] 3. Configure the route matcher (AC: 4)
  - [ ] 3.1 Export a `config` object with a `matcher` array that excludes static assets:
    ```typescript
    export const config = {
      matcher: [
        '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
      ],
    };
    ```
  - [ ] 3.2 This pattern matches all routes EXCEPT Next.js internal routes and static files

- [ ] 4. Implement Supabase middleware client (AC: 3)
  - [ ] 4.1 Create the Supabase client inside the middleware using `createServerClient` from `@supabase/ssr`
  - [ ] 4.2 Use `request.cookies.getAll()` for reading cookies and `response.cookies.set()` for writing (middleware pattern differs from the server component pattern in `src/lib/supabase/server.ts`)
  - [ ] 4.3 Ensure cookie refresh is handled: if Supabase refreshes the auth token, the new cookies must be set on the response
  - [ ] 4.4 Reference the existing server client at `src/lib/supabase/server.ts` for env var names: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

- [ ] 5. Verify guest routes remain unprotected (AC: 4)
  - [ ] 5.1 Ensure `/` (marketing page) is accessible without auth
  - [ ] 5.2 Ensure `/play` (guest mode) is accessible without auth
  - [ ] 5.3 Ensure `/auth/confirm` and other auth callback routes are accessible without auth
  - [ ] 5.4 Ensure `/api/*` routes are not affected by middleware redirects (API routes handle their own auth)

- [ ] 6. Update login page to use redirectTo (AC: 1)
  - [ ] 6.1 Find the login page component (likely `src/app/(guest)/login/page.tsx` or similar)
  - [ ] 6.2 Read `redirectTo` from URL search params
  - [ ] 6.3 Pass `redirectTo` to the `signIn` function so that after successful login, the user is redirected to their original destination
  - [ ] 6.4 Verify `use-auth.ts` `signIn` method already accepts a `redirectTo` parameter (line 101: `async (data: SignInData, redirectTo?: string)` and line 112: `router.push(redirectTo ?? '/session')`) -- this is already implemented

- [ ] 7. Write tests (AC: 1, 2, 3, 4)
  - [ ] 7.1 Create `src/middleware.test.ts` (co-located test)
  - [ ] 7.2 Test: unauthenticated user on `/session` -> redirected to `/login?redirectTo=/session`
  - [ ] 7.3 Test: unauthenticated user on `/replay` -> redirected to `/login?redirectTo=/replay`
  - [ ] 7.4 Test: unauthenticated user on `/settings` -> redirected to `/login?redirectTo=/settings`
  - [ ] 7.5 Test: authenticated user on `/login` -> redirected to `/session`
  - [ ] 7.6 Test: authenticated user on `/session` -> passes through
  - [ ] 7.7 Test: any user on `/` -> passes through (no redirect)
  - [ ] 7.8 Test: any user on `/play` -> passes through (no redirect)

## Dev Notes

- **Architecture Layer**: Middleware is Layer 4 (Infrastructure) / cross-cutting concern. It runs at the edge before any page rendering.
- **No existing middleware**: `src/middleware.ts` does not exist in the current codebase. This is a new file.
- **Supabase middleware pattern**: The middleware Supabase client is different from the server component client (`src/lib/supabase/server.ts`). The server client uses `next/headers` `cookies()`, but middleware must use `request.cookies` and `response.cookies` from the `NextRequest`/`NextResponse` objects. The pattern is:
  ```typescript
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value); // for downstream middleware/route
          response.cookies.set(name, value, options); // for the browser
        });
      },
    },
  });
  ```
- **`getUser()` vs `getSession()`**: Always use `getUser()` in middleware for security. `getSession()` only decodes the JWT locally without server validation. `getUser()` makes a request to Supabase Auth to verify the token is valid and not revoked.
- **Environment variables**: Same as `src/lib/supabase/server.ts`:
  - `process.env.NEXT_PUBLIC_SUPABASE_URL!`
  - `process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!`
- **Existing signIn redirectTo support**: `src/features/auth/use-auth.ts` line 101 already accepts `redirectTo?: string` and line 112 does `router.push(redirectTo ?? '/session')`. The login page just needs to read the query param and pass it through.
- **Architecture spec requirement**: Story 3.1 AC in the architecture doc requires "Next.js middleware protects auth-required routes (`/session`, `/replay`, `/settings`)". This story fulfills that requirement.
- **Performance**: Middleware runs on every matched request. Keep it lightweight -- only check auth cookies, no heavy DB queries. `getUser()` is a single HTTP call to Supabase Auth.

### Project Structure Notes

- `src/middleware.ts` -- create new file (Next.js middleware convention: must be at `src/middleware.ts` when using `src/` directory)
- `src/middleware.test.ts` -- create co-located test
- `src/lib/supabase/server.ts` -- reference for env vars and Supabase client pattern
- `src/features/auth/use-auth.ts` -- reference for existing `redirectTo` support in signIn (line 101-112)
- Login page component -- update to read `redirectTo` from URL params

### References

- [Source: _bmad-output/planning-artifacts/architecture.md] -- "Next.js middleware protects auth-required routes" requirement from Story 3.1 AC
- [Source: _bmad-output/planning-artifacts/architecture.md] -- Auth flow: Supabase Auth with @supabase/ssr, cookie sessions
- [Source: _bmad-output/planning-artifacts/prd.md] -- FR45: User registration and authentication, route protection
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1] -- User registration and login, middleware requirement

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
