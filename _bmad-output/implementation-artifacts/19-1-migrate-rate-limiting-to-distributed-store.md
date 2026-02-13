# Story 19.1: Migrate Rate Limiting to Distributed Store

Status: ready-for-dev

## Story

As a platform operator,
I want rate limiting backed by a distributed store,
So that limits are enforced consistently across Vercel function instances and clients receive proper rate limit headers.

## Acceptance Criteria

1. Given rate limit state, When stored, Then it uses Upstash Redis (or equivalent distributed store) instead of in-memory Map
2. Given a Vercel cold start, When the new function instance handles a request, Then rate limit state from other instances is available
3. Given any API route returns 429, When the response is sent, Then it includes `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers
4. Given rate limiting is distributed, When tested across multiple concurrent function instances, Then the combined request count is enforced correctly

## Tasks / Subtasks

1. Add Upstash Redis dependency and client
   - Install `@upstash/redis`
   - Create `src/lib/redis.ts` with Redis client configuration
   - Add `UPSTASH_REDIS_URL` and `UPSTASH_REDIS_TOKEN` to `.env.example`
2. Migrate rate limiter to Redis
   - Replace in-memory Map with Redis INCR + EXPIRE pattern
   - Key format: `ratelimit:{namespace}:{userId}`
   - Atomic increment with TTL on first request
3. Add rate limit headers to 429 responses
   - Add `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers
   - Apply to all API routes returning 429
4. Add unit tests
   - Multi-instance enforcement
   - Cold start persistence
   - 429 response headers present

## Dev Notes

**Architecture Layer**: Infrastructure Layer
**Findings Covered**: SEC-H1, SEC-H3
**Files**: `src/lib/ai/rate-limiter.ts`, `src/app/api/user/keys/rate-limit.ts`, all API routes
**Current Issue**: In-memory Map is per-isolate, resets on cold starts. 429 responses missing standard headers.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
