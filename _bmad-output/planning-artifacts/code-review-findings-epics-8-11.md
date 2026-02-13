# Adversarial Code Review Findings — Epics 8-11

**Date:** 2026-02-13
**Scope:** All code changes in Epics 8-11 (commits 7f3afbe..7f88fb4, 180 files, 14,118 insertions)
**Reviews Conducted:** 4 parallel adversarial reviews (Security, State Management, UI/Accessibility, AI/Coaching)

---

## Summary

| Domain                 | Critical | High   | Medium | Low    | Total  |
| ---------------------- | -------- | ------ | ------ | ------ | ------ |
| Security & Auth        | 2        | 3      | 4      | 3      | 12     |
| State & Data Integrity | 5        | 5      | 7      | 7      | 24     |
| UI & Accessibility     | 5        | 12     | 13     | 4      | 34     |
| AI & Coaching          | 5        | 7      | 11     | 6      | 29     |
| **Total**              | **17**   | **27** | **35** | **20** | **99** |

---

## CRITICAL Findings (17)

### SEC-C1: API Routes Missing CSRF Protection

- **Files:** All API routes (`/api/ai/chat`, `/api/user/keys`, `/api/user/export`, `/api/ai/drill`, `/api/ai/analyze`, `/api/ai/recalibrate`)
- **Issue:** No CSRF token validation. POST/DELETE endpoints vulnerable to cross-origin request forgery — attacker could force authenticated users to submit/delete API keys, trigger expensive AI operations, or export user data.
- **Fix:** Verify Origin/Referer headers match expected domain on all POST/DELETE routes.

### SEC-C2: Encryption Key Validation Insufficient

- **File:** `src/lib/crypto.ts` (lines 32-34, 52-54)
- **Issue:** Encryption key validation only checks length (≥32 chars) but doesn't verify entropy/randomness. Weak keys like `"a".repeat(32)` pass. No key rotation mechanism. No detection of compromised keys.
- **Fix:** Implement key entropy validation at startup. Add key rotation with versioning.

### STATE-C1: Data Loss — Session Buffer Not Flushed on Abnormal Exit

- **File:** `src/features/session/session-recorder.ts` (lines 126-143, 196-243)
- **Issue:** `eventBuffer` only flushed on autosave (30s interval), buffer cap (10K events), or explicit `stopRecording()`. Browser tab crash/close loses up to 29.99 seconds of MIDI data.
- **Fix:** Add `beforeunload` event listener to force-flush buffer. Consider using `navigator.sendBeacon` for reliable delivery.

### STATE-C2: Race Condition — Concurrent XP Award from Multiple Sources

- **File:** `src/features/engagement/use-xp.ts` (lines 49-70)
- **Issue:** `awardSessionXp` performs optimistic local state update before awaiting Supabase RPC. If session end AND achievement unlock trigger simultaneously, both read stale `lifetimeXp` and one update is lost. Supabase RPC is atomic but local React state desyncs.
- **Fix:** Refactor to fetch-before-update pattern or use Supabase RPC return value to set local state.

### STATE-C3: Race Condition — Streak Update from Concurrent Sessions

- **File:** `src/features/engagement/use-streak.ts` (lines 46-55)
- **Issue:** `recordSession` uses `streakRef.current` to calculate update. Two browser tabs ending sessions simultaneously both read same streak value, last write wins, one day's increment lost.
- **Fix:** Use Supabase RPC for atomic streak increment, read return value for local state.

### STATE-C4: Race Condition — Flush Reentrancy Guard Insufficient

- **File:** `src/features/session/session-recorder.ts` (lines 126-143)
- **Issue:** `flushInProgress` guard prevents concurrent flushes, but error handler re-appends failed events after setting `flushInProgress = false`. Second flush can trigger between flag reset and re-append, causing data loss and order corruption.
- **Fix:** Use a queue pattern instead of re-appending to buffer. Process queue sequentially.

### STATE-C5: Memory Leak — Pattern Analysis Interval Not Cleared in Edge Cases

- **File:** `src/features/analysis/use-analysis-pipeline.ts` (lines 105, 349)
- **Issue:** `patternInterval` created unconditionally but only cleared in cleanup. If component unmounts during async operations, interval fires after component is destroyed, accessing stale Zustand getters.
- **Fix:** Store interval ID in ref and clear on unmount before any async cleanup.

### UI-C1: Missing Semantic Landmark for Main Content

- **File:** `src/features/modes/dashboard-chat.tsx` (line 39)
- **Issue:** `id="main-content"` on a `<div>` without `role="main"` or semantic `<main>` element. Screen readers cannot navigate to main content landmark.
- **Fix:** Change to `<main id="main-content">` or add `role="main"`.

### UI-C2: Unhandled Async Error in Session Switch

- **File:** `src/features/modes/replay-studio.tsx` (lines 556-577)
- **Issue:** Promise chain in onClick handler for session switching has no error boundary or `.catch()`. Unhandled rejection if IndexedDB fails.
- **Fix:** Add try/catch or `.catch()` with user-facing error state.

### UI-C3: Timeline Scrubber Memory Leak — Pointer Capture

- **File:** `src/components/timeline-scrubber.tsx` (lines 100-123)
- **Issue:** Pointer capture not released if component unmounts during drag. Browser keeps pointer captured, blocking other interactions.
- **Fix:** Add cleanup in useEffect to release pointer capture and reset `document.body.style.userSelect` on unmount.

### UI-C4: Session History Inefficient Re-renders

- **File:** `src/components/session-history-list.tsx` (lines 54-94)
- **Issue:** Async session loading triggers individual re-renders per session. Performance degradation with large session lists (>50 sessions).
- **Fix:** Batch state updates using single `setSessions` call.

### UI-C5: Replay Studio Missing Key Prop Stability

- **File:** `src/features/modes/replay-studio.tsx` (lines 166-193)
- **Issue:** Tab buttons in TABS.map rely on tab.id but potential React reconciliation issues when sessionId changes cause full re-render of tab panel.
- **Fix:** Ensure stable keys and memoize tab rendering.

### AI-C1: Token Usage Extraction Completely Broken

- **File:** `src/app/api/ai/chat/route.ts` (lines 168-174)
- **Issue:** `extractTokenUsage` called with `{ text }` but Vercel AI SDK `streamText` result contains usage data in `result.usage`, not in the object passed. Always falls back to character-based estimation (~4 chars/token heuristic).
- **Fix:** Pass the entire `result` object from `streamText` which contains `result.usage`.

### AI-C2: Silent Token Tracking Failures

- **File:** `src/features/coaching/token-tracker.ts` (lines 90-92, 125-127)
- **Issue:** Token tracking failures silently swallowed with `console.error`. No retry, no alerting, no fallback storage. Cost tracking and rate limiting become unreliable.
- **Fix:** Send failures to Sentry. Implement IndexedDB fallback for failed writes. Add retry with exponential backoff.

### AI-C3: Growth Mindset Filtering Only on Stored Text, Not Stream

- **File:** `src/app/api/ai/chat/route.ts` (lines 153-158, 164)
- **Issue:** Growth mindset word replacement happens in `onFinish`, filtering only the final stored text. Users see prohibited words ("wrong", "bad", "failed") in real-time streaming, violating core product principle ("amber, not red").
- **Fix:** Implement `createGrowthMindsetTransform()` TransformStream (already defined in `growth-mindset-rules.ts` lines 64-92) and pipe `textStream` through it before returning.

### AI-C4: Prompt Injection via User Message Content

- **File:** `src/app/api/ai/chat/route.ts` (lines 145-149)
- **Issue:** User messages directly inserted into prompt without sanitization or delimiter enforcement. Users can override Studio Engineer persona, extract system prompt, or inject cost-maximizing prompts.
- **Fix:** Add XML-style delimiters around user content. Escape existing XML tags in user input. Add explicit role-override rejection to system prompt.

### AI-C5: Missing Rate Limit on Drill Generation Route

- **File:** `src/app/api/ai/drill/route.ts` (lines 31-34)
- **Issue:** Drill generation uses same shared rate limit as chat. Structured output generation is 3-5x more expensive. User can exhaust rate limit on cheap chat, blocking expensive drill generation.
- **Fix:** Implement separate rate limits per route type (chat: 100/min, drill: 10/min).

---

## HIGH Findings (27)

### SEC-H1: Rate Limiting Vulnerable to Bypass

- **Files:** `src/lib/ai/rate-limiter.ts` (line 10), `src/app/api/user/keys/rate-limit.ts` (line 7)
- **Issue:** In-memory rate limiting is per-isolate. Resets on cold starts, not shared across Vercel instances. Attacker can bypass by triggering cold starts or distributing requests.
- **Fix:** Migrate to Redis/Upstash for distributed rate limiting.

### SEC-H2: API Key Validation Charges User Account

- **File:** `src/app/api/user/keys/validate.ts` (lines 52-63, 82-94)
- **Issue:** Validation makes real API calls with `max_tokens: 1`, consuming user quota. Could be weaponized to drain accounts via repeated validation.
- **Fix:** Use non-charging validation endpoints (OpenAI: `GET /v1/models`, Anthropic: key format check).

### SEC-H3: Missing Rate Limit Headers

- **Files:** All API routes
- **Issue:** 429 responses don't include `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers.
- **Fix:** Add standard rate limit headers to all 429 responses.

### STATE-H1: Stale Closure — streakRef Not Updated in Concurrent Renders

- **File:** `src/features/engagement/use-streak.ts` (lines 18-22, 52)
- **Issue:** `useEffect` updates `streakRef.current = streak` but React batching can cause `recordSession` to read stale ref before update propagates.
- **Fix:** Use Zustand `getState()` directly instead of ref-based caching.

### STATE-H2: Metadata Update Skipped Due to Stale Comparison

- **File:** `src/features/session/session-recorder.ts` (lines 149-159)
- **Issue:** `updateMetadata` caches `lastMetadataKey`/`lastMetadataTempo` and skips if unchanged. Rapid key changes (C→D→C) within 10s interval cause the return-to-C to be skipped because it matches cache.
- **Fix:** Always write metadata on interval, not just on change.

### STATE-H3: IndexedDB Transaction Integrity — No Atomic Session+Events Write

- **File:** `src/features/session/session-recorder.ts` (lines 36-48, 135)
- **Issue:** Session creation and event writing use separate IndexedDB transactions. Browser crash between them creates orphan sessions with zero events.
- **Fix:** Use Dexie transactions to wrap session+events writes atomically.

### STATE-H4: Stale Closure — getMetadata Function Reentrancy

- **File:** `src/features/session/session-recorder.ts` (lines 180-191)
- **Issue:** `startMetadataSync` can create multiple intervals if called in rapid succession before interval ID is assigned.
- **Fix:** Add guard using ref or flag before interval creation.

### STATE-H5: Race Condition — Drill Rep History Mutation

- **File:** `src/stores/session-store.ts` (lines 343-372)
- **Issue:** `addDrillRepResult` reads `state.drillRepHistory`, computes improvement, and sets new state. Truly concurrent calls from different event sources could overwrite each other's updates.
- **Fix:** Use Zustand's `set` with updater function pattern to ensure sequential state reads.

### AI-H1: Token Estimation Heuristic Too Naive

- **File:** `src/features/coaching/context-length-manager.ts` (lines 27-29)
- **Issue:** Fixed 4 chars/token ratio. Technical content is 2-3 chars/token, non-English text severely miscounted. Code-heavy prompts (MIDI sequences) underestimated.
- **Fix:** Use lightweight tokenizer (e.g., `gpt-tokenizer` npm package) or implement BPE estimation.

### AI-H2: No Maximum Token Budget Enforcement

- **File:** `src/app/api/ai/chat/route.ts` (lines 119-189)
- **Issue:** Context length trimmed to provider limits (128K/200K) but no per-request or per-user maximum. Single request could cost $600 with Claude Opus on 200K context.
- **Fix:** Add hardcoded max token limit (~8K tokens per request, ~$0.10 max).

### AI-H3: Context Trimming Summary Injected as Assistant Message

- **File:** `src/app/api/ai/chat/route.ts` (lines 141-143)
- **Issue:** Truncation summary injected as `role: 'assistant'` message. Model may reference it as its own response. Confuses conversation flow.
- **Fix:** Use system message or prefix the user's first message instead.

### AI-H4: Replay Context Window Hardcoded

- **File:** `src/features/coaching/context-builder.ts` (lines 131, 172)
- **Issue:** Replay context hardcoded to 10 seconds. At 40 BPM = 8 beats (insufficient), at 180 BPM = 30 beats (noisy).
- **Fix:** Make window adaptive based on detected tempo (e.g., always 16 beats).

### AI-H5: Error Classification Relies on String Matching

- **File:** `src/lib/ai/errors.ts` (lines 43-62)
- **Issue:** Error classification uses regex on error messages, which is brittle and provider-specific. New error formats from providers break classification.
- **Fix:** Use structured error response parsing (`errorBody.error?.code`).

### AI-H6: Drill Generation Has No Timeout

- **File:** `src/app/api/ai/drill/route.ts` (lines 68-73)
- **Issue:** `generateText` with structured output has no timeout. Can hang for 30+ seconds. Vercel function timeout is 10s default.
- **Fix:** Add AbortController with 20s timeout.

### AI-H7: Genre Terminology Not Validated Against Known Genres

- **File:** `src/features/coaching/genre-terminology.ts` (lines 447-450)
- **Issue:** Unknown genres silently fall back to GENERIC with no logging. No way to detect when new genres need to be added.
- **Fix:** Log unknown genres to Sentry for monitoring.

### UI-H1: Dashboard Accordion Missing aria-expanded

- **File:** `src/features/modes/dashboard-chat.tsx` (lines 62-72)
- **Issue:** Engagement toggle button lacks `aria-expanded` attribute. Screen readers can't announce expand/collapse state.
- **Fix:** Add `aria-expanded={showEngagement}` to the button.

### UI-H2: Dashboard Focus Management Issue

- **File:** `src/features/modes/dashboard-chat.tsx` (line 62)
- **Issue:** When accordion closes, focus remains on button but content disappears with no state change announcement.
- **Fix:** Announce state change with aria-live region.

### UI-H3: Replay Tab List Missing Arrow Key Navigation

- **File:** `src/features/modes/replay-studio.tsx` (lines 166-193)
- **Issue:** Tab list doesn't implement Left/Right arrow key navigation. Required by ARIA tablist specification. Violates WCAG 2.1 AA (4.1.2).
- **Fix:** Implement arrow key cycling through tabs with `roving tabindex` pattern.

### UI-H4: Replay Loading State Not Announced

- **File:** `src/features/modes/replay-studio.tsx` (lines 90-116)
- **Issue:** Loading spinner has `aria-label` but no `aria-live` announcement. Screen readers don't announce when loading starts.
- **Fix:** Add `aria-live="assertive"` to loading container.

### UI-H5: AI Chat Missing Visible Label

- **File:** `src/components/ai-chat-panel.tsx` (lines 205-214)
- **Issue:** Textarea has `aria-label` but no visible label element. Fails WCAG 2.5.3 (Label in Name).
- **Fix:** Add visible label or use `<label>` element.

### UI-H6: Snapshot CTA No Focus Management

- **File:** `src/components/snapshot-cta.tsx` (lines 14-41)
- **Issue:** CTAs appear with animation but don't receive focus. Keyboard users may not notice new interactive elements.
- **Fix:** Auto-focus first button when component mounts.

### UI-H7: Return Session Banner Auto-dismiss Breaks Keyboard Flow

- **File:** `src/components/return-session-banner.tsx` (lines 57-70)
- **Issue:** Banner dismisses on MIDI input even if user is mid-interaction. Keyboard focus lost.
- **Fix:** Check if banner has focus before auto-dismissing.

### UI-H8: Keyboard Shortcuts Panel Missing Focus Trap

- **File:** `src/components/keyboard-shortcuts-panel.tsx` (lines 58-110)
- **Issue:** Modal dialog has no focus trap. Tab key escapes to background content. Violates WCAG 2.4.3 (Focus Order).
- **Fix:** Implement focus trap to keep Tab within modal.

### UI-H9: Mobile Redirect Overlay Doesn't Disable Background

- **File:** `src/components/mobile-redirect.tsx` (lines 48-76)
- **Issue:** Full-screen overlay with `z-[100]` doesn't add `aria-hidden="true"` to background. Screen readers can still navigate behind overlay.
- **Fix:** Add `aria-hidden="true"` to `#__next` when overlay is active.

### UI-H10: Drill Controller Incomplete Keyboard Support

- **File:** `src/components/drill-controller.tsx` (lines 176-185)
- **Issue:** "Start Drill" button inside div without keyboard navigation hints. Non-obvious keyboard access pattern.
- **Fix:** Add keyboard shortcut hint or visual focus indicator.

### UI-H11: Timeline Marker List Navigation

- **File:** `src/components/timeline-scrubber.tsx` (lines 238-282)
- **Issue:** Marker buttons are focusable but not in semantic list. Keyboard users can't efficiently navigate markers.
- **Fix:** Add `role="list"` to marker container, `role="listitem"` to markers.

### UI-H12: AI Chat Textarea Height Change Unannounced

- **File:** `src/components/ai-chat-panel.tsx` (lines 93-98)
- **Issue:** Auto-resizing textarea changes layout without screen reader announcement.
- **Fix:** Add aria-live region to announce expansion.

---

## MEDIUM Findings (35)

### SEC-M1: SQL Injection via RLS Bypass Potential

- **File:** `supabase/migrations/20260213000010_rls_policies.sql`
- **Issue:** RLS policies secure IF service_role key is never exposed. No CI/CD check for accidental service_role usage in non-admin code.
- **Fix:** Add CI check to detect service_role usage outside admin code.

### SEC-M2: Token Tracker Uses Client-Side Supabase Import

- **File:** `src/features/coaching/token-tracker.ts` (lines 1, 72-74)
- **Issue:** Imports from `@/lib/supabase/client` (browser client) but called from server-side API routes. Comment says "switch to server" but not done.
- **Fix:** Change import to `@/lib/supabase/server` or accept client parameter.

### SEC-M3: Error Messages Leak Implementation Details

- **File:** `src/lib/ai/errors.ts` (lines 13-18)
- **Issue:** Error messages reveal backend architecture (Settings page existence, AI/MIDI separation). Aids reconnaissance.
- **Fix:** Generic production errors, detailed errors only in dev mode.

### SEC-M4: Missing Input Sanitization on sessionId

- **File:** `src/features/coaching/token-tracker.ts` (line 170)
- **Issue:** `sessionId` stored directly to database without format validation.
- **Fix:** Add UUID format validation before database insert.

### STATE-M1: Timezone Bug — Streak Calculation Uses Client Timezone Without Persistence

- **File:** `src/features/engagement/use-streak.ts` (lines 32, 52)
- **Issue:** `timezoneOffsetMinutes` computed from `Date.getTimezoneOffset()` but never persisted. Travel across timezones can break or double-count streaks.
- **Fix:** Persist user's primary timezone and use it consistently.

### STATE-M2: XP Service Uses Fire-and-Forget Error Handling

- **File:** `src/features/engagement/xp-service.ts` (lines 40-54)
- **Issue:** `awardXp` logs errors but doesn't throw. Caller ignores failures. Local state reflects XP gains that don't persist after page reload.
- **Fix:** Return error status from `awardXp`, handle in caller, sync local state from DB return.

### STATE-M3: Memory Leak — Drill Player Timers Not Cleared on Early Stop

- **File:** `src/features/drills/drill-player.ts` (lines 63-135)
- **Issue:** `playDrill` creates `setTimeout` timers pushed to array. If `stop()` called before all timers created, remaining timers fire after stop, calling `onNotePlay` callbacks.
- **Fix:** Use `stopped` flag check inside each timer callback.

### STATE-M4: Race Condition — Listen Timer Fires After Drill Cycle Stopped

- **File:** `src/features/drills/drill-player.ts` (lines 216-220, 229)
- **Issue:** Listen phase transition scheduled after playback. If `stop()` called during 1.5s window, timer may fire at exact moment of stop due to JS event loop timing.
- **Fix:** Add `stopped` check at start of timer callback.

### STATE-M5: Stale Closure — createMidiCallbacks in useMidi Hook

- **File:** `src/features/midi/use-midi.ts` (lines 13-51, 78, 101)
- **Issue:** `createMidiCallbacks()` creates closure capturing state once. `retryConnection` creates new instance but if `channelChecked` still true from first instance, drum channel detection skipped.
- **Fix:** Reset `channelChecked` on retry.

### STATE-M6: Memory Leak — Audio Context Not Released in Drill Player

- **File:** `src/features/drills/drill-player.ts` (lines 142-172)
- **Issue:** Oscillator and gain nodes created but never explicitly disconnected. Rapid drill playback accumulates audio nodes.
- **Fix:** Disconnect nodes after playback completes.

### STATE-M7: Pending Event Buffer Not Checked Before Session Start

- **File:** `src/features/session/session-recorder.ts` (lines 54-68)
- **Issue:** If `recordEvent` called before `startRecording` completes, events buffered in `pendingBuffer`. Double-start race can cause first session to miss events.
- **Fix:** Add reentrancy guard with async lock.

### AI-M1: Data Export Missing Local IndexedDB Drill Records on Failure

- **File:** `src/features/auth/data-export.ts` (lines 50-67)
- **Issue:** If IndexedDB query fails, returns empty arrays with console warning. GDPR export incomplete silently.
- **Fix:** Add export status flags to indicate completeness.

### AI-M2: Server Export Missing Token Usage Breakdown

- **File:** `src/app/api/user/export/route.ts` (line 31)
- **Issue:** Export includes raw `ai_conversations` rows but no aggregated token usage by provider/model. Users can't see cost breakdown.
- **Fix:** Add aggregated token summary to export.

### AI-M3: Rate Limiter Uses In-Memory Store

- **File:** `src/lib/ai/rate-limiter.ts` (line 10)
- **Issue:** Duplicate of SEC-H1. Rate limit state lost on cold starts.
- **Fix:** Use Vercel KV/Upstash.

### AI-M4: Snapshot Overlay Fade Constants Not Used

- **File:** `src/lib/constants.ts` (lines 33-34)
- **Issue:** `SNAPSHOT_FADE_IN_MS` and `SNAPSHOT_FADE_OUT_MS` defined but not imported anywhere. Dead code.
- **Fix:** Wire up or remove.

### AI-M5: Growth Mindset Validator Violations Not Surfaced

- **File:** `src/features/coaching/response-processor.ts` (line 24)
- **Issue:** `validateGrowthMindset` returns boolean but violations array (with suggested replacements) never logged or shown.
- **Fix:** Log violations to Sentry for monitoring.

### AI-M6: Drill Request Missing Genre Context in Payload

- **File:** `src/features/drills/drill-generator.ts` (lines 29-40)
- **Issue:** `buildApiPayload` doesn't include genre context from request. Drills generated without genre-specific terminology.
- **Fix:** Ensure drill prompt uses `sessionContext.genre`.

### AI-M7: Chat Error Handler Mutates Global Store

- **File:** `src/features/coaching/chat-error-handler.ts` (lines 40, 48)
- **Issue:** `parseChatError` directly mutates global app store (`setApiKeyStatus('invalid')`). Couples parsing to state management. Hard to test.
- **Fix:** Return error + suggested action, let caller update store.

### AI-M8: Timing Accuracy Schema/Source Mismatch

- **File:** `src/lib/ai/schemas.ts` (line 8) + `src/features/coaching/context-builder.ts` (line 34)
- **Issue:** Schema constrains `timingAccuracy` to 0-1 but source data is 0-100, divided by 100 in context builder. No validation at conversion boundary.
- **Fix:** Add runtime clamping: `Math.max(0, Math.min(1, value / 100))`.

### AI-M9: Drill Schema Allows Absurdly Long Note Sequences

- **File:** `src/lib/ai/schemas.ts` (line 93)
- **Issue:** `DrillNoteSchema` array has `min(1)` but no max length. Model could return 1000+ notes.
- **Fix:** Add `.max(64)` to array schema.

### AI-M10: PostHog Event Uses 'server' as User ID

- **File:** `src/app/api/ai/drill/route.ts` (line 90)
- **Issue:** PostHog `distinctId: 'server'` instead of actual user ID. Per-user analytics impossible.
- **Fix:** Use `authResult.userId`.

### AI-M11: Message Adapter Silently Drops Non-Text Parts

- **File:** `src/features/coaching/message-adapter.ts` (lines 14-17)
- **Issue:** `uiMessagesToSimple` filters out non-text parts without logging. Future multimodal features silently ignored.
- **Fix:** Log when non-text parts encountered.

### UI-M1: Silent Coach Missing Main Landmark

- **File:** `src/features/modes/silent-coach.tsx` (lines 14-30)
- **Issue:** No `<main>` or `role="main"` landmark.
- **Fix:** Wrap in `<main>` element.

### UI-M2: Mode Switcher Responsive Label Breaks Screen Reader

- **File:** `src/features/modes/mode-switcher.tsx` (lines 103-106)
- **Issue:** Hidden prefix text (`hidden sm:inline`) causes screen reader to read partial word ("Coach" instead of "Silent Coach").
- **Fix:** Use `aria-label` with full text.

### UI-M3: Mode Switcher Redundant aria-live Update

- **File:** `src/features/modes/mode-switcher.tsx` (lines 56-61)
- **Issue:** Effect manually updates announcement ref on every mode change, but `role="status"` already announces. Causes duplicate announcements.
- **Fix:** Remove manual textContent update.

### UI-M4: AI Chat Scroll Jump on New Message

- **File:** `src/components/ai-chat-panel.tsx` (lines 76-80)
- **Issue:** `scrollIntoView({ behavior: 'smooth' })` fires on every message change. Disorienting for users reading previous messages.
- **Fix:** Only scroll if user is already at bottom of chat.

### UI-M5: AI Chat Form Submit via dispatchEvent

- **File:** `src/components/ai-chat-panel.tsx` (lines 85-86)
- **Issue:** Creates synthetic Event instead of using `form.requestSubmit()`. May not trigger validation or form event listeners.
- **Fix:** Use `textareaRef.current?.form?.requestSubmit()`.

### UI-M6: Drill Controller Improvement Color Logic Error

- **File:** `src/components/drill-controller.tsx` (lines 236-248)
- **Issue:** Shows same color (`accent-warm`) for both negative and zero improvement. No distinction between stagnation and regression.
- **Fix:** Add distinct color for negative values.

### UI-M7: Timeline Scrubber userSelect Not Cleaned Up

- **File:** `src/components/timeline-scrubber.tsx` (lines 120-123)
- **Issue:** `document.body.style.userSelect` set during drag but not cleaned on unmount.
- **Fix:** Add useEffect cleanup.

### UI-M8: Session Summary Animation Not Accessible

- **File:** `src/components/session-summary.tsx` (lines 74-82)
- **Issue:** Custom animation via inline style bypasses `prefers-reduced-motion`.
- **Fix:** Use CSS animation that respects the media query.

### UI-M9: Session Summary Missing Focus Trap

- **File:** `src/components/session-summary.tsx` (lines 72-188)
- **Issue:** Modal opens but doesn't trap or move focus to first interactive element. Violates WCAG 2.4.3.
- **Fix:** Auto-focus first button and implement focus trap.

### UI-M10: Return Session Banner Animation Not Accessible

- **File:** `src/components/return-session-banner.tsx` (line 97)
- **Issue:** Custom animation doesn't respect `prefers-reduced-motion`.
- **Fix:** Add media query check.

### UI-M11: Achievement Gallery Without Virtualization

- **File:** `src/components/achievement-gallery.tsx` (lines 179-242)
- **Issue:** Renders all achievement cards (43+) without virtual scrolling. Performance issues on low-end devices; long tab traversal.
- **Fix:** Implement virtual scrolling or pagination.

### UI-M12: Session History No Pagination

- **File:** `src/components/session-history-list.tsx` (lines 54-56)
- **Issue:** Loads ALL sessions without limit. Performance degradation with hundreds of sessions.
- **Fix:** Add pagination or limit to recent 50 sessions.

### UI-M13: Small Screen Banner Media Query Listener Cleanup

- **File:** `src/components/small-screen-banner.tsx` (lines 15-29)
- **Issue:** useEffect cleanup may fire after component fully unmounted on fast re-mount. Potential memory leak.
- **Fix:** Verify removeEventListener is called properly.

---

## LOW Findings (20)

### SEC-L1: Middleware Redirect Open Redirect Potential

- **File:** `src/middleware.ts` (lines 43-46)
- **Issue:** Redirect uses unsanitized pathname. Low risk because Next.js `pathname` doesn't include domain.
- **Fix:** Add explicit validation: `pathname.startsWith('/') && !pathname.includes('://')`.

### SEC-L2: Missing API Route Protection in Middleware

- **File:** `src/middleware.ts` (lines 59-66)
- **Issue:** Middleware config only protects page routes, not API routes. API routes rely on per-route auth, which is correct but inconsistent.
- **Fix:** Document explicitly why API routes excluded, or add to matcher.

### SEC-L3: Export Endpoint Doesn't Verify RLS Coverage

- **File:** `src/app/api/user/export/route.ts` (lines 23-34)
- **Issue:** Queries multiple tables but doesn't verify RLS enforcement. If policy accidentally dropped, could leak data.
- **Fix:** Add automated tests to verify RLS policies exist.

### STATE-L1: DST Edge Case in Streak Calculation

- **File:** `src/features/engagement/streak-tracker.ts` (lines 12-21)
- **Issue:** `isSameCalendarDay` applies timezone offset without DST handling. On DST switch days, offset changes mid-day.
- **Fix:** Use `Intl.DateTimeFormat` for timezone-aware date comparison.

### STATE-L2: Accumulator Not Reset on Component Remount

- **File:** `src/features/analysis/use-analysis-pipeline.ts` (lines 58-79)
- **Issue:** Accumulator data lost on unmount/remount. `resetAccumulator()` doesn't reset `startTimestamp`.
- **Fix:** Reset all properties including `startTimestamp`.

### STATE-L3: Silence Timer Fires During Unmount

- **File:** `src/features/analysis/use-analysis-pipeline.ts` (lines 169-217, 351)
- **Issue:** 10-second silence timeout can fire during unmount. Safe because Zustand persists, but wastes CPU.
- **Fix:** Add mounted flag check in timeout callback.

### STATE-L4: Continuity Context Cache Not Invalidated on New Session

- **File:** `src/features/session/session-manager.ts` (lines 112-143)
- **Issue:** Cached context doesn't include just-completed session. User won't see latest session in continuity until reload.
- **Fix:** Invalidate cache after session completion.

### STATE-L5: MIDI Subscription Not Cleaned in useMidi on Fast Unmount

- **File:** `src/features/midi/use-midi.ts` (lines 64-94)
- **Issue:** MIDI access request is async. If component unmounts before it resolves, subscription created after cleanup. Requires sub-100ms timing.
- **Fix:** Add mounted check after async resolve.

### STATE-L6: Session Recorder Metadata Skips First Update

- **File:** `src/features/session/session-recorder.ts` (lines 149-159, 185-190)
- **Issue:** First metadata update compares against `null` defaults. If key detected 1 second after start, 9-second lag before metadata written.
- **Fix:** Write metadata immediately on first detection.

### STATE-L7: Guest Session Double-Start Protection Verified

- **File:** `src/features/session/use-guest-session.ts` (lines 23-49)
- **Issue:** Initially flagged but verified that `startingRef` guard correctly prevents double-start. No action needed.

### AI-L1: Unused Export Function in Token Tracker

- **File:** `src/features/coaching/token-tracker.ts` (lines 100-128)
- **Issue:** `trackTokenUsage` function defined but never imported. Dead code.
- **Fix:** Remove or document for future use.

### AI-L2: Hardcoded Retry Delay in Chat Route

- **File:** `src/app/api/ai/chat/route.ts` (lines 17, 63)
- **Issue:** Retry delay uses exponential backoff but doesn't honor provider's `Retry-After` header.
- **Fix:** Parse `Retry-After` header from 429 responses.

### AI-L3: Drill Parser File Missing

- **Issue:** `src/features/drills/drill-parser.ts` referenced but doesn't exist. Structured output may handle parsing.
- **Fix:** Confirm if parser is needed.

### AI-L4: Pricing Last Updated Comment Potentially Stale

- **File:** `src/lib/ai/pricing.ts` (line 12)
- **Issue:** `PRICING_LAST_UPDATED = '2026-02-12'`. No automated staleness check.
- **Fix:** Add alert when pricing >30 days old.

### AI-L5: No Compression for Large Exports

- **File:** `src/app/api/user/export/route.ts` (line 50)
- **Issue:** Raw JSON without compression. 1000+ sessions could be 10+ MB, exceeding Vercel 4.5MB limit.
- **Fix:** Add gzip compression or streaming.

### AI-L6: Growth Mindset Rules Don't Cover All Negative Words

- **File:** `src/features/coaching/growth-mindset-rules.ts` (lines 1-12)
- **Issue:** 12 prohibited words. Common negatives like "can't", "never", "impossible" not included.
- **Fix:** Expand list or use sentiment analysis.

### UI-L1: Replay Studio Hardcoded Session Limit

- **File:** `src/features/modes/replay-studio.tsx` (line 520)
- **Issue:** `.limit(20)` hardcoded. Users with >20 sessions can't see full history.
- **Fix:** Make configurable or add "Load More".

### UI-L2: AI Chat Textarea Magic Number

- **File:** `src/components/ai-chat-panel.tsx` (line 97)
- **Issue:** `Math.min(el.scrollHeight, 120)` hardcoded max height. Not responsive.
- **Fix:** Use CSS max-height or viewport-based calculation.

### UI-L3: Drill Controller Inconsistent Typography Tokens

- **File:** `src/components/drill-controller.tsx` (lines 134, 202, 256)
- **Issue:** Mixed design token classes and raw `text-xs`. Inconsistent styling.
- **Fix:** Audit all text size classes for token usage.

### UI-L4: Mobile Redirect localStorage Not Wrapped in Try/Catch

- **File:** `src/components/mobile-redirect.tsx` (lines 27, 32, 36, 41)
- **Issue:** Direct `localStorage` access without error handling. Crashes if storage disabled or quota exceeded.
- **Fix:** Wrap in try/catch with fallback.

---

## Recommended Sprint Structure

### Sprint 12 — Critical Security & Data Integrity (Block Launch)

- All 17 CRITICAL findings
- Estimated: 7-10 stories

### Sprint 13 — High Priority Fixes

- All 27 HIGH findings
- Estimated: 10-14 stories

### Sprint 14 — Medium Priority Polish

- All 35 MEDIUM findings
- Estimated: 12-15 stories

### Sprint 15 — Low Priority Cleanup

- All 20 LOW findings
- Estimated: 8-10 stories

---

## Test Coverage Gaps Identified

1. Concurrent `awardSessionXp` calls from different sources
2. Browser crash simulation (close tab during active recording)
3. Timezone changes mid-session (mock `Date.getTimezoneOffset`)
4. Drill playback early stop with pending timers
5. Component unmount during async session start
6. CSRF protection verification on all POST routes
7. Rate limit bypass via cold start simulation
8. RLS policy verification for all tables
9. Growth mindset word filtering in streamed responses
10. Token usage extraction accuracy vs estimation
