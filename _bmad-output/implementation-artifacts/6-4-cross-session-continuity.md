# Story 6.4: Cross-Session Continuity

Status: ready-for-dev

## Story

As a returning musician,
I want Minstrel to remember my previous sessions and reference them in coaching,
so that my practice feels continuous and personalized.

## Acceptance Criteria

1. Given the user has completed previous sessions and starts a new session, When the AI coaching is invoked (in Dashboard + Chat mode or during drill generation), Then the AI context includes a summary of recent session history: the last 3-5 sessions with their dates, keys practiced, chords worked on, timing accuracy trends, drills completed, and key insights. And the AI references this history naturally (e.g., "Yesterday you were working on ii-V-I voicings -- let's build on that") (FR38). And the context never includes raw MIDI events from past sessions -- only aggregated summaries and metrics.

2. Given the user has recent session data with identified weaknesses, When a drill is requested (automatically or manually), Then drill selection prioritizes skills that showed weakness in the most recent 3 sessions. And if the user struggled with chord transitions in the last session, the first suggested drill targets chord transitions. And the drill generator receives a `recentWeaknesses` field in its context, ranked by recency and severity. And the prioritization logic lives in the domain layer, not in the AI prompt.

3. Given the user has practiced recently, When a warm-up is auto-generated for a new session, Then the warm-up considers what was practiced in the last 1-2 sessions to avoid redundancy. And if the user practiced major scales yesterday, today's warm-up emphasizes something different (e.g., minor scales or chord voicings). And the warm-up builds on recent progress: if timing accuracy improved on a specific pattern, the warm-up introduces the next progression of that pattern. And the warm-up generator receives a `recentPractice` summary from the continuity service.

4. Given the user is authenticated and has an account, When the system needs cross-session history, Then session summaries are queryable from Supabase via the AI context endpoints. And queries are scoped to the authenticated user via RLS policies. And the query returns session metadata and analysis snapshots -- not full MIDI event arrays (to keep payloads small). And results are cached in `sessionStore` for the duration of the current session to avoid repeated queries.

5. Given the user has recent sessions stored in Dexie.js that have not yet synced to Supabase, When the system needs cross-session context, Then the Dexie-to-Supabase sync layer ensures recent completed sessions are uploaded to Supabase before or during the new session start. And if sync is pending, the system falls back to querying Dexie.js directly for local session summaries. And the continuity service merges local (Dexie) and remote (Supabase) session data, deduplicating by session ID. And sync status is visible to the developer (logged) but not to the user.

6. Given a guest user without an account, When they start a new session, Then cross-session continuity still works using Dexie.js local session data only. And the AI context includes local session history from IndexedDB. And the experience degrades gracefully: continuity works within the same browser but not across devices. And a subtle prompt suggests creating an account for cross-device continuity (non-blocking).

## Tasks / Subtasks

- [ ] 1. Create the session continuity service (AC: 1, 4, 5)
  - [ ] 1.1 Create `src/features/session/continuity-service.ts` -- domain logic (Layer 3) for assembling cross-session context
  - [ ] 1.2 Implement `getRecentSessionSummaries(userId: string, count?: number): Promise<SessionSummary[]>` -- queries the last N sessions (default 5) from Supabase, falling back to Dexie.js for unsynced sessions
  - [ ] 1.3 Define `SessionSummary` type in `src/features/session/session-types.ts`: `{ id, date, durationMs, detectedKey, averageTempo, timingAccuracy, chordsUsed, drillsCompleted, keyInsight, weaknessAreas, snapshotCount }`
  - [ ] 1.4 Implement deduplication: merge Supabase and Dexie results by session ID, preferring Supabase data (more complete from sync)
  - [ ] 1.5 Cache results in `sessionStore.recentSessions` for the duration of the current session (avoid repeated queries)

- [ ] 2. Build cross-session AI context assembly (AC: 1)
  - [ ] 2.1 Extend `src/features/coaching/context-builder.ts` with `buildContinuityContext(recentSessions: SessionSummary[]): ContinuityContext`
  - [ ] 2.2 Format the continuity context as a structured section for the AI system prompt: list of recent sessions with dates, keys, accuracy trends, key insights, and identified patterns
  - [ ] 2.3 Include trend analysis: "Timing accuracy: 72% -> 78% -> 83% over last 3 sessions" (computed from the summaries)
  - [ ] 2.4 Include the most recent session's key insight prominently (e.g., "Last session insight: Your C to Am transition averages 400ms")
  - [ ] 2.5 Limit continuity context to ~500 tokens maximum to avoid consuming too much of the LLM context window

- [ ] 3. Implement weakness prioritization for drill selection (AC: 2)
  - [ ] 3.1 Create `src/features/session/weakness-prioritizer.ts` -- pure domain logic (Layer 3)
  - [ ] 3.2 Implement `prioritizeWeaknesses(recentSessions: SessionSummary[]): RankedWeakness[]` -- extracts weakness areas from recent sessions, ranks by recency (more recent = higher priority) and severity (lower accuracy = higher priority)
  - [ ] 3.3 Define `RankedWeakness` type: `{ skill: string, severity: number, lastSessionDate: string, trend: 'improving' | 'stable' | 'declining' }`
  - [ ] 3.4 Integrate with drill generation: pass `recentWeaknesses` to the drill generator context so that `/api/ai/drill` can prioritize targeted exercises
  - [ ] 3.5 Implement "improving" detection: if a weakness has shown improvement over 2+ sessions, rank it lower (the user is already working on it)

- [ ] 4. Implement warm-up adaptation for recent practice (AC: 3)
  - [ ] 4.1 Extend `src/features/session/warmup-generator.ts` to accept a `recentPractice` parameter from the continuity service
  - [ ] 4.2 Implement avoidance logic: if the user practiced in key X yesterday, today's warm-up uses a different key or mode
  - [ ] 4.3 Implement building logic: if the user improved at pattern Y, today's warm-up introduces the next difficulty level of Y
  - [ ] 4.4 Create `buildWarmupContext(recentSessions: SessionSummary[]): WarmupContext` that provides the warm-up generator with recent practice metadata

- [ ] 5. Ensure Dexie-to-Supabase sync for continuity (AC: 5)
  - [ ] 5.1 Extend `src/lib/dexie/sync.ts` to trigger a sync check on new session start (before continuity context is assembled)
  - [ ] 5.2 Implement `syncPendingSessions(): Promise<SyncResult>` -- uploads any completed but unsynced sessions from Dexie to Supabase
  - [ ] 5.3 The sync uploads session metadata and analysis snapshots (not raw MIDI events, which sync separately in the background)
  - [ ] 5.4 Handle sync failures gracefully: if Supabase is unreachable, fall back to Dexie-only continuity context and queue the sync for retry
  - [ ] 5.5 Log sync status for debugging but do not surface it in the UI

- [ ] 6. Handle guest user continuity (AC: 6)
  - [ ] 6.1 In `continuity-service.ts`, detect whether the user is authenticated (from `appStore.isAuthenticated`)
  - [ ] 6.2 For authenticated users: query Supabase + Dexie (full continuity)
  - [ ] 6.3 For guest users: query Dexie only (local continuity)
  - [ ] 6.4 If guest user has local session history, include it in the AI context identically to authenticated users
  - [ ] 6.5 Add a non-blocking prompt in the session start flow: "Create an account to keep your practice history across devices" (only shown to guests with 2+ local sessions)

- [ ] 7. Integrate continuity context into session start flow (AC: 1, 2, 3)
  - [ ] 7.1 Extend `src/features/session/session-manager.ts` `startSession()` to call `getRecentSessionSummaries` and cache in `sessionStore.recentSessions`
  - [ ] 7.2 Pass continuity context to the coaching chat context builder (extends the system prompt with recent history)
  - [ ] 7.3 Pass ranked weaknesses to the drill generator on drill request
  - [ ] 7.4 Pass recent practice summary to the warm-up generator on session start

- [ ] 8. Write co-located tests (AC: 1, 2, 3, 5, 6)
  - [ ] 8.1 Create `src/features/session/continuity-service.test.ts` -- test Supabase + Dexie merge, deduplication, caching, guest fallback
  - [ ] 8.2 Create `src/features/session/weakness-prioritizer.test.ts` -- test ranking by recency and severity, improving trend detection, empty session history
  - [ ] 8.3 Extend `src/features/coaching/context-builder.test.ts` -- test `buildContinuityContext` output format, token limit, trend computation
  - [ ] 8.4 Test warm-up adaptation: verify avoidance of recent practice keys, building on recent improvements
  - [ ] 8.5 Test sync trigger on session start: verify `syncPendingSessions` is called, fallback to Dexie on sync failure

## Dev Notes

- **Architecture Layer**: The `continuity-service.ts` is Layer 3 (Domain Logic) -- it accepts session summaries and produces structured context. It does not import Dexie or Supabase directly. Data fetching is done at Layer 2 (Application Logic) in the `session-manager.ts` or a dedicated hook, which calls Layer 4 (Infrastructure) via `src/lib/dexie/db.ts` and `src/lib/supabase/client.ts`, then passes the data to the continuity service.
- **Data Size Management**: Cross-session context must not overwhelm the LLM context window. Each session summary is ~100 tokens. With 5 recent sessions, that is ~500 tokens of continuity context. The `buildContinuityContext` function should enforce a max token budget and truncate if necessary (drop the oldest sessions first). Raw MIDI events from past sessions are never included -- only aggregated summaries.
- **Weakness Prioritization Algorithm**: Score each weakness as `(recencyWeight * recencyScore) + (severityWeight * severityScore)` where recencyScore = 1.0 for today, 0.8 for yesterday, 0.6 for 2 days ago, etc. (exponential decay). SeverityScore = `1 - accuracyPercentage`. Weaknesses showing improvement (accuracy increasing over 2+ sessions) get a 0.5x multiplier to deprioritize them. This keeps the drill generator focused on stagnant or declining areas.
- **Warm-Up Avoidance Logic**: Track the keys, chord types, and skill areas from the last 2 sessions. If key C major was heavily practiced, score it lower in warm-up key selection. Use a weighted random selection that favors unpracticed areas while still allowing revisits if the skill is declining.
- **Dexie-to-Supabase Sync Timing**: The sync check on session start should be non-blocking. Call `syncPendingSessions()` in parallel with session initialization. If sync completes before the first AI interaction, the continuity context will have the latest data. If not, the system uses whatever is available locally. This avoids a blocking wait on sync at session start.
- **Supabase Query Pattern**: Use a single RPC call or a composable query: `supabase.from('sessions').select('id, created_at, duration_ms, detected_key, average_tempo, timing_accuracy, chords_used, key_insight').eq('user_id', userId).order('created_at', { ascending: false }).limit(5)`. This returns only the columns needed for summaries. Analysis snapshots can be loaded separately if needed.
- **Guest User Experience**: Guest continuity uses the same code paths with the Supabase queries replaced by Dexie-only queries. The `continuity-service.ts` is data-source agnostic -- it receives `SessionSummary[]` regardless of origin. The orchestration layer decides whether to query Supabase, Dexie, or both.
- **Library Versions**: Dexie.js 4.x, Supabase client SDK (`@supabase/supabase-js`), Zustand 5.x, Vercel AI SDK 6.x.
- **Dependencies**: This story depends on Story 2.8 (session recording to IndexedDB), Story 3.1 (Supabase schema and auth), Story 3.2 (Dexie-to-Supabase sync layer), Story 4.1 (AI SDK integration), and Story 4.4 (context-builder.ts). It also benefits from Story 5.4 (drill generation) and Story 5.7 (warm-up generator) being implemented, but the continuity service can be built independently and integrated with those features when they are ready.

### Project Structure Notes

- `src/features/session/continuity-service.ts` -- cross-session context assembly (new)
- `src/features/session/continuity-service.test.ts` -- co-located tests (new)
- `src/features/session/weakness-prioritizer.ts` -- weakness ranking logic (new)
- `src/features/session/weakness-prioritizer.test.ts` -- co-located tests (new)
- `src/features/session/session-types.ts` -- extended with `SessionSummary`, `RankedWeakness`, `WarmupContext`, `ContinuityContext` types
- `src/features/session/session-manager.ts` -- extended `startSession()` to load continuity context
- `src/features/session/warmup-generator.ts` -- extended to accept `recentPractice` parameter
- `src/features/coaching/context-builder.ts` -- extended with `buildContinuityContext`
- `src/features/coaching/context-builder.test.ts` -- extended with continuity context tests
- `src/lib/dexie/sync.ts` -- extended with `syncPendingSessions()` and session-start sync trigger
- `src/lib/dexie/db.ts` -- session summary query methods used
- `src/lib/supabase/client.ts` -- Supabase session summary queries
- `src/stores/session-store.ts` -- extended with `recentSessions: SessionSummary[]` cache
- `src/stores/app-store.ts` -- `isAuthenticated` read for guest detection

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] -- Dexie.js session/event schema, Supabase session tables, sync strategy
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Communication Patterns] -- `/api/ai/chat`, `/api/ai/drill`, Vercel AI SDK context patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns] -- Supabase RLS, Dexie-to-Supabase sync, caching strategy
- [Source: _bmad-output/planning-artifacts/architecture.md#Architectural Boundaries] -- Layer 3 domain logic has no framework imports, data fetching at Layer 4
- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.4] -- acceptance criteria, FR38 coverage
- [Source: _bmad-output/planning-artifacts/prd.md#Session Management] -- FR38: session continuity referencing previous sessions
- [Source: _bmad-output/planning-artifacts/prd.md#The Difficulty Engine] -- FR18: cross-session recalibration
- [Source: _bmad-output/planning-artifacts/prd.md#AI Drill Generation] -- FR19: targeted drills based on identified weaknesses
- [Source: _bmad-output/planning-artifacts/prd.md#Session Management] -- FR36: warm-ups based on recent work

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
