# Story 18.1: Add CSRF Protection to All API Routes

Status: done

## Story

As a security-conscious developer,
I want CSRF token validation on all POST/DELETE API routes,
So that cross-site request forgery attacks cannot force authenticated users to perform unauthorized actions.

## Acceptance Criteria

1. Given any POST/DELETE API route, When a request arrives with an Origin header that does not match the app's domain, Then the request is rejected with 403 Forbidden
2. Given any POST/DELETE API route, When a request arrives with a valid Origin header matching the app's domain, Then the request proceeds normally
3. Given the CSRF validation logic, When implemented, Then it exists as a reusable middleware function in `src/lib/middleware/csrf.ts` applied to all POST/DELETE routes
4. Given a cross-origin form submission targeting any API route, When the browser sends the request, Then it is blocked before reaching the route handler

## Tasks / Subtasks

1. Create `src/lib/middleware/csrf.ts` with `validateCsrf(request: Request)` function
   - Check `Origin` header first, fallback to `Referer` if Origin absent
   - Compare against `process.env.NEXT_PUBLIC_APP_URL`
   - Add Vercel preview URL pattern whitelist
   - Return 403 with clear error message on mismatch
2. Apply CSRF validation to all POST/DELETE API routes
   - `/api/ai/chat`
   - `/api/user/keys`
   - `/api/user/export`
   - `/api/ai/drill`
   - `/api/ai/analyze`
   - `/api/ai/recalibrate`
3. Add unit tests for CSRF middleware
   - Test cross-origin POST rejection (403)
   - Test same-origin POST success (200)
   - Test missing Origin/Referer rejection (403)
   - Test Vercel preview URL whitelist acceptance (200)

## Dev Notes

**Architecture Layer**: Infrastructure Layer (middleware)
**Findings Covered**: SEC-C1
**Files**: All API routes in `src/app/api/`
**Implementation**: Verify Origin/Referer headers match expected domain. Whitelist `process.env.NEXT_PUBLIC_APP_URL` and Vercel preview URLs pattern.
**Test Cases**: Cross-origin POST to `/api/user/keys` → 403; Same-origin POST to `/api/ai/chat` → 200; Missing Origin/Referer → 403; Vercel preview URL → 200

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- All 12 CSRF tests pass
- TypeScript compiles clean (tsc --noEmit)

### Completion Notes List

- Created CSRF middleware with Origin/Referer validation
- Applied to all 6 POST/DELETE handlers across 5 route files
- Vercel preview URL pattern whitelisted
- localhost/127.0.0.1 allowed for development
- Added NEXT_PUBLIC_APP_URL to .env.example
- Note: /api/user/export is GET-only, so CSRF not needed there

### File List

- src/lib/middleware/csrf.ts (new)
- src/lib/middleware/csrf.test.ts (new)
- src/app/api/ai/chat/route.ts (modified)
- src/app/api/ai/drill/route.ts (modified)
- src/app/api/ai/analyze/route.ts (modified)
- src/app/api/ai/recalibrate/route.ts (modified)
- src/app/api/user/keys/route.ts (modified)
- .env.example (modified)
