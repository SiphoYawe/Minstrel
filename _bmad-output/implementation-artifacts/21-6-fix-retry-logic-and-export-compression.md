# Story 21.6: Fix Retry Logic and Export Compression

Status: ready-for-dev

## Story

As a user interacting with AI providers,
I want retry logic to respect Retry-After headers and large exports to be compressed,
So that retries are efficient and exports succeed regardless of data size.

## Acceptance Criteria

1. Given a 429 response is received from an AI provider, When retry is scheduled, Then the `Retry-After` header value is used (falling back to exponential backoff)
2. Given a data export is generated for a user with 1000+ sessions, When the response is sent, Then it uses gzip compression to stay under Vercel's response size limit

## Tasks / Subtasks

1. Parse Retry-After header (AI-L2)
   - Extract `Retry-After` from 429 response headers
   - Use as delay, fallback to `Math.pow(2, attempt) * 1000`
2. Add gzip compression to exports (AI-L5)
   - Compress JSON export with gzip
   - Set `Content-Encoding: gzip` header
3. Add unit tests

## Dev Notes

**Findings Covered**: AI-L2, AI-L5
**Files**: `src/app/api/ai/chat/route.ts`, `src/app/api/user/export/route.ts`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
