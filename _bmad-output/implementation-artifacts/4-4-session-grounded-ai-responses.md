# Story 4.4: Session-Grounded AI Responses

Status: ready-for-dev

## Story

As a musician,
I want AI responses that reference my actual playing data,
So that coaching is specific and trustworthy.

## Acceptance Criteria

1. **Given** the user asks a question in the coaching chat, **When** the system builds the AI prompt, **Then** `context-builder.ts` assembles a comprehensive session context object including: detected key, all chords played in session, timing accuracy percentage, average and current tempo, the last 3 analysis snapshots, playing tendency data (comfort zones and avoidance patterns), detected genre, and the user's specific question. **And** the context is structured as a JSON object that the LLM can reference precisely.

2. **Given** the AI receives a prompt with session context, **When** it generates a response, **Then** the response references specific data points from the session (e.g., "Your timing on beat 3 drifts 40ms late when you move to the F chord" or "You've used the Am chord 47 times this session but haven't touched Bm once"). **And** the system prompt explicitly instructs the LLM to cite data.

3. **Given** the AI is generating a response, **When** a claim would require data not present in the session context, **Then** the AI does not fabricate or assume data. **And** the AI states explicitly what data is missing or insufficient (e.g., "I don't have enough data on your tempo consistency yet -- play for another few minutes and I'll have a clearer picture").

4. **Given** the user has insufficient session data (e.g., just started playing, fewer than 10 notes), **When** they ask a question, **Then** the AI acknowledges the limited data and explains what it can and cannot assess. **And** it suggests what the user should do to generate enough data for meaningful coaching (e.g., "Play for a couple of minutes so I can analyze your timing and chord patterns").

5. **Given** the context builder assembles session data, **When** analysis snapshots are available from silence-triggered pauses (Story 2.5), **Then** the most recent 3 snapshots are included in the context with their timestamps, so the AI can reference trends within the session (e.g., "Your first snapshot showed 68% timing accuracy, and your latest shows 79% -- that's a strong trajectory").

6. **Given** the context builder runs, **When** it reads from `sessionStore` and `midiStore`, **Then** all data access uses Zustand selectors (not full store reads). **And** the context assembly completes in under 10ms (no expensive computation or DB queries). **And** co-located unit tests verify the context builder produces the correct structure with mock store data.

## Tasks / Subtasks

- [ ] Task 1: Implement the session context builder (AC: 1, 5, 6)
  - [ ] Create `src/features/coaching/context-builder.ts`
  - [ ] Implement `buildSessionContext(): SessionContext` function that reads from Zustand stores:
    - [ ] `currentKey` from `sessionStore`
    - [ ] `allChordsPlayed` from `sessionStore` (full list with frequency counts)
    - [ ] `timingAccuracy` from `sessionStore` (overall percentage)
    - [ ] `averageTempo` from `sessionStore`
    - [ ] `currentTempo` from `sessionStore`
    - [ ] `recentSnapshots` from `sessionStore` (last 3, with timestamps)
    - [ ] `tendencies` from `sessionStore` (comfort zones: most-played keys, chords, tempos; avoidances: never-played categories)
    - [ ] `detectedGenre` from `sessionStore`
    - [ ] `sessionDuration` computed from `sessionStore.startTime`
    - [ ] `totalNotesPlayed` from `midiStore` or `sessionStore`
  - [ ] Return typed `SessionContext` object matching `SessionContextSchema` from `src/lib/ai/schemas.ts`
  - [ ] Ensure all store reads use `getState()` (non-reactive, synchronous read for prompt building)
  - [ ] Write co-located test `src/features/coaching/context-builder.test.ts`

- [ ] Task 2: Implement data sufficiency detection (AC: 3, 4)
  - [ ] Add `assessDataSufficiency(context: SessionContext): DataSufficiency` function in `context-builder.ts`
  - [ ] Define `DataSufficiency` type: `{ hasSufficientData: boolean; availableInsights: string[]; missingInsights: string[]; recommendation?: string }`
  - [ ] Sufficiency thresholds:
    - [ ] Minimum 10 notes for any note-level analysis
    - [ ] Minimum 3 chords for chord pattern analysis
    - [ ] Minimum 30 seconds of play for timing analysis
    - [ ] Minimum 1 snapshot for session trend analysis
    - [ ] Minimum 2 snapshots for within-session trajectory
  - [ ] Return specific messages for each insufficient area (e.g., "Not enough chords detected for harmonic analysis")
  - [ ] Write tests for each sufficiency threshold with edge cases

- [ ] Task 3: Enhance system prompt with data-grounding instructions (AC: 2, 3)
  - [ ] Modify `src/lib/ai/prompts.ts` `buildChatSystemPrompt(context: SessionContext)`:
    - [ ] Add section: "SESSION DATA (reference these specific data points in your responses):"
    - [ ] Format session context as structured text the LLM can easily parse and cite:
      ```
      KEY: C Major
      TEMPO: 95 BPM (average), 98 BPM (current)
      TIMING ACCURACY: 73%
      CHORDS PLAYED: C (47x), Am (32x), F (28x), G (25x), Dm (3x)
      TENDENCIES: Strong in major keys, avoids minor 7ths and jazz voicings
      GENRE: Pop/Rock
      RECENT SNAPSHOTS:
        - [2:15] Key: C Major, Timing: 68%, Insight: "C to Am transition averaging 400ms"
        - [5:30] Key: C Major, Timing: 74%, Insight: "Tempo stabilizing around 95 BPM"
        - [8:45] Key: C Major, Timing: 79%, Insight: "Timing improving, F chord still hesitant"
      ```
    - [ ] Add instruction: "CRITICAL: Only reference data points present in the SESSION DATA above. If the user asks about something not covered by the data, say explicitly that you don't have enough information for that assessment yet."
    - [ ] Add instruction: "When referencing data, be precise: cite specific numbers, chord names, timestamps, and improvement deltas."
    - [ ] Add instruction: "If data sufficiency is limited, acknowledge it: 'I only have [N] notes to work with so far. Here's what I can see...'"
  - [ ] Include `DataSufficiency` result in the prompt so the LLM knows what it can and cannot assess
  - [ ] Write tests verifying prompt output with various context states (full data, partial data, minimal data)

- [ ] Task 4: Implement tendency data formatting for context (AC: 1, 2)
  - [ ] Create `src/features/coaching/tendency-formatter.ts`
  - [ ] Implement `formatTendenciesForPrompt(tendencies: TendencyData): string` that converts raw tendency tracking data into human-readable prompt text:
    - [ ] Comfort zones: "Most played: C Major key (67% of time), major chords (82%), tempo range 85-100 BPM"
    - [ ] Avoidance patterns: "Never played: any minor key, minor 7th chords, tempos above 120 BPM"
    - [ ] Improvement areas: "Chord transitions averaging 300ms+ : C->Am (400ms), F->G (350ms)"
  - [ ] Handle empty/null tendency data gracefully (return "Not enough session data for tendency analysis yet")
  - [ ] Write co-located test `src/features/coaching/tendency-formatter.test.ts`

- [ ] Task 5: Implement snapshot formatting for context (AC: 5)
  - [ ] Create `src/features/coaching/snapshot-formatter.ts`
  - [ ] Implement `formatSnapshotsForPrompt(snapshots: SessionSnapshot[]): string` that converts snapshot data into structured prompt text:
    - [ ] Include timestamp (relative to session start), key, timing accuracy, tempo, and key insight for each snapshot
    - [ ] If multiple snapshots exist, highlight trends: "Timing accuracy trajectory: 68% -> 74% -> 79% (improving)"
    - [ ] If only 1 snapshot, note: "Only one snapshot available -- play more for trend analysis"
    - [ ] If no snapshots, return: "No session snapshots yet"
  - [ ] Write co-located test `src/features/coaching/snapshot-formatter.test.ts`

- [ ] Task 6: Wire context builder into coaching client (AC: 1, 2, 3, 4)
  - [ ] Modify `src/features/coaching/coaching-client.ts` (`useCoachingChat` hook):
    - [ ] Call `buildSessionContext()` and `assessDataSufficiency()` before each chat submission
    - [ ] Include the full `SessionContext` in the `body` of the `useChat` request
    - [ ] If data sufficiency is severely limited (< 5 notes), add a preflight message in the chat: "I need a bit more playing data before I can give meaningful feedback. Play for a minute or two and then ask again."
  - [ ] Modify `/api/ai/chat/route.ts` to pass `sessionContext` from request body to `buildChatSystemPrompt()`
  - [ ] Verify the system prompt includes the formatted session data when calling `streamText`

- [ ] Task 7: Add sessionStore fields for tendency and snapshot data (AC: 1, 5)
  - [ ] Ensure `src/stores/session-store.ts` has:
    - [ ] `recentSnapshots: SessionSnapshot[]` (populated by Story 2.5, consumed here)
    - [ ] `tendencies: TendencyData | null` (populated by Story 2.4, consumed here)
    - [ ] `allChordsPlayed: Map<string, number>` or `Record<string, number>` (chord frequency map)
    - [ ] `totalNotesPlayed: number`
    - [ ] `sessionStartTime: number | null`
  - [ ] Define `TendencyData` type in `src/features/analysis/analysis-types.ts` if not already defined:
    ```typescript
    interface TendencyData {
      mostPlayedKeys: { key: string; percentage: number }[];
      mostPlayedChordTypes: { type: string; percentage: number }[];
      tempoRange: { min: number; max: number; average: number };
      avoidedKeys: string[];
      avoidedChordTypes: string[];
      slowTransitions: { from: string; to: string; avgMs: number }[];
    }
    ```
  - [ ] Define `SessionSnapshot` type in `src/features/analysis/analysis-types.ts` if not already defined:
    ```typescript
    interface SessionSnapshot {
      timestamp: number;
      relativeTime: number; // seconds since session start
      key: string;
      timingAccuracy: number;
      tempo: number;
      chords: string[];
      keyInsight: string;
    }
    ```

## Dev Notes

- **Context Builder Philosophy**: The context builder is the critical bridge between the real-time analysis engine (Epic 2) and the AI coaching layer (this epic). Its job is to take raw session state and format it so the LLM can be specific and accurate. The quality of AI coaching is directly proportional to the quality of context provided.

- **Data Grounding is a Prompt Engineering Problem**: The LLM will naturally try to be helpful even without data. The system prompt must explicitly constrain the LLM to only reference provided data. The "CRITICAL" instruction about not fabricating data is essential for trust. Testing should verify that prompts with minimal context produce responses that acknowledge limitations rather than hallucinating.

- **Performance Constraint**: Context building must be fast (<10ms) because it runs synchronously before each chat submission. All data comes from in-memory Zustand stores (no DB queries, no async operations). Use `getState()` for non-reactive reads rather than hooks.

- **Zustand Store Reads**: Use `useSessionStore.getState()` and `useMidiStore.getState()` for direct synchronous state access in the context builder (it is not a React component, so hooks are not appropriate). This is an intentional pattern for utility functions that need store data outside the React tree.

- **Dependency on Analysis Engine (Epic 2)**: This story consumes data populated by:
  - Story 2.1 (note/chord detection) -> `allChordsPlayed`
  - Story 2.2 (timing analysis) -> `timingAccuracy`, `currentTempo`
  - Story 2.3 (harmonic analysis) -> `currentKey`
  - Story 2.4 (tendency tracking) -> `tendencies`
  - Story 2.5 (session snapshots) -> `recentSnapshots`

  If these stores are not yet populated (analysis stories not complete), the context builder should handle empty/null values gracefully. The data sufficiency detector (Task 2) ensures the AI knows what data is available.

- **Testing Strategy**:
  - Unit tests for context builder with mock store data (full, partial, empty states)
  - Unit tests for data sufficiency thresholds
  - Unit tests for tendency and snapshot formatting
  - Integration test verifying the complete flow: store state -> context builder -> system prompt -> API request body
  - Snapshot tests for prompt output format to catch unintended changes

### Project Structure Notes

Files created or modified in this story:

```
src/features/coaching/
  context-builder.ts              # Session context assembly (NEW)
  context-builder.test.ts         # Context builder tests (NEW)
  tendency-formatter.ts           # Tendency data -> prompt text (NEW)
  tendency-formatter.test.ts      # Formatter tests (NEW)
  snapshot-formatter.ts           # Snapshot data -> prompt text (NEW)
  snapshot-formatter.test.ts      # Formatter tests (NEW)

src/lib/ai/
  prompts.ts                      # Enhance with data grounding instructions (MODIFY)
  prompts.test.ts                 # Update tests for grounded prompts (MODIFY)

src/features/coaching/
  coaching-client.ts              # Wire context builder into chat (MODIFY)

src/app/api/ai/chat/
  route.ts                        # Pass sessionContext to prompt builder (MODIFY)

src/stores/
  session-store.ts                # Ensure snapshot/tendency/chord fields exist (MODIFY)

src/features/analysis/
  analysis-types.ts               # TendencyData, SessionSnapshot types (MODIFY or NEW)
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.4] -- FR25 (session-grounded responses), FR27 (contextual explanations)
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] -- Zustand selector patterns, getState() usage
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Studio Engineer AI Persona] -- "Specific references: your C to Am transition averaged 280ms"
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Emotional Design Principles] -- "Precision Is Warmth", "every word carries information"
- [Source: _bmad-output/planning-artifacts/prd.md#User Journeys] -- Jake's session snapshot example, Aisha's chat example
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Flow Architecture] -- Analysis -> sessionStore -> coaching flow

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
