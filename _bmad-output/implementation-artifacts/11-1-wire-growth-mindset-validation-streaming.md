# Story 11.1: Wire Growth Mindset Validation to Streaming AI Output

Status: ready-for-dev

## Story

As a musician,
I want all AI coaching responses to be validated for growth mindset language,
So that I never receive discouraging or negative feedback.

## Acceptance Criteria

1. Given the AI streams a coaching response, When each text chunk arrives, Then `validateGrowthMindset()` scans the text for prohibited words. And the validation integrates into the streaming pipeline without blocking chunk delivery.

2. Given a prohibited word is detected in AI output, When validation fails, Then the word is replaced with its growth-mindset alternative from `GROWTH_REFRAMES` (e.g., "wrong" -> "not yet there", "failed" -> "in progress", "mistake" -> "opportunity"). And the replacement is applied before the text reaches the client.

3. Given the validation runs on streaming text, When it processes chunks, Then it handles word boundaries correctly using the existing `\b` regex anchors (does not flag "wrongful" when looking for "wrong", does not flag "errors" when looking for "error"). And streaming latency remains under 5ms per chunk.

4. Given the growth mindset rules exist in `growth-mindset-rules.ts`, When they are wired into the chat flow, Then the integration point is a `TransformStream` in the server-side API route (`src/app/api/ai/chat/route.ts`) that processes the streamed text between `streamText()` and `toUIMessageStreamResponse()`.

5. Given the validation is active, When the AI response completes, Then the full response delivered to the client has zero prohibited words from the `PROHIBITED_WORDS` list (all 10 words).

## Tasks / Subtasks

- [ ] 1. Create growth mindset text replacement function (AC: 2, 3)
  - [ ] 1.1 In `src/features/coaching/growth-mindset-rules.ts`, add a new export `replaceProhibitedWords(text: string): string` that replaces all prohibited words with their `GROWTH_REFRAMES` alternatives using word-boundary-aware regex replacement
  - [ ] 1.2 Ensure the replacement preserves original casing pattern (e.g., "Wrong" -> "Not yet there", "WRONG" -> "NOT YET THERE")
  - [ ] 1.3 Handle edge case where chunks split a word across boundaries (e.g., "wro" + "ng") by buffering incomplete words at chunk boundaries

- [ ] 2. Create streaming transform for growth mindset filtering (AC: 1, 4)
  - [ ] 2.1 In `src/features/coaching/growth-mindset-rules.ts`, add `createGrowthMindsetTransform(): TransformStream<string, string>` that wraps `replaceProhibitedWords` for streaming use
  - [ ] 2.2 The transform must buffer partial words at chunk boundaries — if a chunk ends mid-word, hold the partial until the next chunk completes it
  - [ ] 2.3 On `flush()`, process any remaining buffered text

- [ ] 3. Wire transform into the chat API route (AC: 4, 5)
  - [ ] 3.1 Open `src/app/api/ai/chat/route.ts` (line 61-67)
  - [ ] 3.2 After `streamText()` returns `result`, pipe the text stream through the growth mindset transform before calling `toUIMessageStreamResponse()`
  - [ ] 3.3 Use Vercel AI SDK's `pipeDataStreamToResponse` or `result.textStream.pipeThrough(transform)` pattern — consult Vercel AI SDK 6.x docs for the correct streaming transform integration point

- [ ] 4. Add unit tests (AC: 1, 2, 3, 5)
  - [ ] 4.1 Create `src/features/coaching/growth-mindset-rules.test.ts` — update existing test file with new tests for `replaceProhibitedWords()`
  - [ ] 4.2 Test: all 10 prohibited words are replaced with their reframes
  - [ ] 4.3 Test: word boundaries respected — "wrongful" is NOT modified, "errors" is NOT modified
  - [ ] 4.4 Test: multiple prohibited words in one string are all replaced
  - [ ] 4.5 Test: streaming chunk boundary handling — word split across chunks is correctly processed
  - [ ] 4.6 Test: performance — processing 1000 chars completes in under 5ms

## Dev Notes

- **Architecture Layer**: Layer 4 (Infrastructure) for the streaming transform; Layer 3 (Domain Logic) for the replacement function.
- The `validateGrowthMindset()` function at `src/features/coaching/growth-mindset-rules.ts:40` already uses `\b` word boundary regex at line 46, so the replacement function should follow the same pattern.
- The 10 prohibited words are defined at lines 1-12: wrong, bad, failed, mistake, error, poor, terrible, awful, incorrect, failure.
- The `GROWTH_REFRAMES` map at lines 14-25 provides the replacement text for each prohibited word.
- The `response-processor.ts` at line 24 already calls `validateGrowthMindset(response)` but only checks compliance — it does NOT replace text. This story adds active replacement.
- The chat API route at `src/app/api/ai/chat/route.ts` line 61 calls `streamText()` and line 67 calls `result.toUIMessageStreamResponse()`. The transform must be inserted between these two calls.
- **Streaming chunk boundary challenge**: The Vercel AI SDK streams text in arbitrary chunks. A word like "mistake" could arrive as "mis" + "take". The transform must buffer potential partial matches at chunk boundaries.

### Project Structure Notes

- `src/features/coaching/growth-mindset-rules.ts` — add `replaceProhibitedWords()` and `createGrowthMindsetTransform()`
- `src/features/coaching/growth-mindset-rules.test.ts` — add tests for replacement and streaming transform
- `src/app/api/ai/chat/route.ts` — wire the transform into the streaming pipeline (lines 61-67)

### References

- [Source: _bmad-output/planning-artifacts/prd.md] — FR24-28: AI coaching features, growth mindset language requirement
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — "Amber, not red" principle, growth mindset framing
- [Source: _bmad-output/planning-artifacts/architecture.md] — Vercel AI SDK streaming patterns, Layer 4 infrastructure

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
