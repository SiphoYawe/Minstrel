# Story 4.5: Genre-Aware Advice and Growth Mindset Framing

Status: ready-for-dev

## Story

As a musician,
I want coaching that respects my style and encourages growth,
So feedback feels relevant and motivating.

## Acceptance Criteria

1. **Given** the AI is responding to a question, **When** genre context is available from the analysis engine (e.g., "Jazz", "Blues", "Pop/Rock", "Classical"), **Then** all musical advice is constrained to the detected genre/style context (FR26). **And** the AI does not suggest techniques or concepts from unrelated genres unless explicitly asked.

2. **Given** a specific genre is detected, **When** the AI explains musical concepts, **Then** genre-appropriate terminology is used throughout: "dominant 7th" and "ii-V-I" for jazz, "power chord" and "pentatonic" for rock, "tritone substitution" for advanced jazz, "Nashville numbers" for country/pop session players. **And** theory explanations use examples relevant to the detected genre.

3. **Given** the AI is providing any feedback about the user's playing, **When** the response is generated, **Then** all feedback uses growth mindset language: "not yet" instead of "wrong", trajectory framing instead of absolute judgments (FR28, UX9). **And** no response ever contains words like "wrong", "bad", "failed", "mistake", "error", or "poor".

4. **Given** the system prompt defines the Studio Engineer persona (UX10), **When** the AI generates any response, **Then** the persona is maintained: technical and precise (cites specific numbers and data), no filler phrases ("Great job!", "Keep it up!", "That's awesome!"), no cheerleading, every sentence carries information. **And** warmth emerges through precision and specificity, not through praise.

5. **Given** a user is struggling with a skill (low accuracy, slow improvement), **When** the AI references their struggle, **Then** it reframes the struggle as progress: "280ms -> 180ms over 5 attempts. Closing in." (UX emotional design). **And** the AI never uses language that implies the musician has failed or is deficient. **And** the trajectory is always emphasized.

6. **Given** the visual and textual feedback system, **When** any feedback about musical performance is displayed, **Then** no red or error-colored styling is used -- only amber/warm tones for in-progress states and pastel blue (#7CB9E8) for achieved/strong states (UX9 "Amber, Not Red" principle). **And** this applies to both AI response text styling and any associated UI indicators.

## Tasks / Subtasks

- [ ] Task 1: Create genre-specific terminology mappings (AC: 1, 2)
  - [ ] Create `src/features/coaching/genre-terminology.ts`
  - [ ] Define `GenreTerminology` type: `{ genre: string; chordTerms: Record<string, string>; scaleTerms: Record<string, string>; conceptTerms: Record<string, string>; commonProgressions: string[]; styleDescriptors: string[] }`
  - [ ] Implement terminology maps for supported genres:
    - [ ] **Jazz**: "ii-V-I", "altered dominant", "tritone substitution", "voice leading", "walking bass", "comping", "changes"
    - [ ] **Blues**: "12-bar", "turnaround", "shuffle feel", "blue note", "call and response", "bend"
    - [ ] **Pop/Rock**: "power chord", "pentatonic", "verse-chorus", "riff", "palm mute", "drop tuning"
    - [ ] **Classical**: "counterpoint", "cadence", "modulation", "resolution", "voice leading", "harmonic progression"
    - [ ] **R&B/Soul**: "groove", "syncopation", "extended chords", "9th", "soul voicing"
    - [ ] **Generic/Unknown**: Neutral music theory terminology
  - [ ] Implement `getTerminologyForGenre(genre: string): GenreTerminology` function
  - [ ] Write co-located test `src/features/coaching/genre-terminology.test.ts` verifying term lookup for each genre

- [ ] Task 2: Create growth mindset language rules and enforcement (AC: 3, 5)
  - [ ] Create `src/features/coaching/growth-mindset-rules.ts`
  - [ ] Define `PROHIBITED_WORDS` constant: `['wrong', 'bad', 'failed', 'mistake', 'error', 'poor', 'terrible', 'awful', 'incorrect', 'failure']`
  - [ ] Define `GROWTH_REFRAMES` mapping: `{ 'wrong' -> 'not yet there', 'mistake' -> 'opportunity', 'failed' -> 'in progress', 'error' -> 'area to develop' }`
  - [ ] Define `TRAJECTORY_TEMPLATES` array of template strings for reframing struggles:
    - [ ] "{metric} went from {old} to {new} over {attempts} attempts. {encouragement}"
    - [ ] "Not there yet -- but the trajectory is clear: {data_point}"
    - [ ] "This is exactly where improvement happens. {specific_feedback}"
  - [ ] Implement `validateGrowthMindset(text: string): { isCompliant: boolean; violations: string[] }` function that checks AI output for prohibited words (for testing/monitoring, not runtime blocking)
  - [ ] Write co-located test `src/features/coaching/growth-mindset-rules.test.ts`

- [ ] Task 3: Enhance system prompt with genre and growth mindset directives (AC: 1, 2, 3, 4, 5)
  - [ ] Modify `src/lib/ai/prompts.ts` `buildChatSystemPrompt(context: SessionContext)`:
    - [ ] Add genre-specific section when genre is detected:
      ```
      GENRE CONTEXT: Jazz
      Use jazz-specific terminology: ii-V-I, altered dominants, tritone substitution, voice leading.
      Frame all advice within jazz practice conventions.
      Do not suggest techniques from unrelated genres unless the musician explicitly asks.
      ```
    - [ ] Add growth mindset enforcement section:
      ```
      MANDATORY LANGUAGE RULES:
      - NEVER use: "wrong", "bad", "failed", "mistake", "error", "poor"
      - ALWAYS use trajectory language: "not yet", "in progress", "closing in", "developing"
      - When referencing struggles, ALWAYS include progress data: "Your timing went from X to Y"
      - Frame every area of improvement as forward motion, not deficit
      - If you must point out something that needs work, pair it with what IS working
      ```
    - [ ] Add Studio Engineer persona enforcement:
      ```
      PERSONA: Studio Engineer
      - Be technical and precise. Cite specific numbers from the session data.
      - No filler: never say "Great job!", "Keep it up!", "That's awesome!"
      - No cheerleading: warmth comes from precision and specificity, not praise
      - Every sentence must carry information. If it doesn't inform, remove it.
      - When the musician struggles, increase specificity (coach energy)
      ```
    - [ ] Add genre terminology hints from `getTerminologyForGenre()` into the prompt
  - [ ] Write tests verifying prompt output contains genre-specific and growth mindset sections

- [ ] Task 4: Implement AI response post-processing (AC: 3, 5)
  - [ ] Create `src/features/coaching/response-processor.ts`
  - [ ] Implement `processAiResponse(response: string): ProcessedResponse` that:
    - [ ] Runs growth mindset validation (log violations to Sentry as warnings, do not block)
    - [ ] Identifies data references in the response (metrics, chord names, timing values) for potential highlighting
    - [ ] Returns `{ content: string; dataReferences: DataReference[]; growthMindsetCompliant: boolean }`
  - [ ] `DataReference` type: `{ text: string; type: 'metric' | 'chord' | 'timing' | 'key'; startIndex: number; endIndex: number }`
  - [ ] Write co-located test `src/features/coaching/response-processor.test.ts`

- [ ] Task 5: Implement message styling for growth mindset and genre context (AC: 6)
  - [ ] Modify `src/components/ai-chat-panel.tsx` to apply conditional styling:
    - [ ] Metrics cited in AI responses rendered in JetBrains Mono with pastel blue accent (`#7CB9E8`)
    - [ ] Improvement deltas (e.g., "280ms -> 180ms") highlighted with amber-to-blue gradient indicating trajectory
    - [ ] No red (#FF0000 or similar) anywhere in the chat for performance feedback
    - [ ] Amber (`#D4A43C` or similar warm tone) for "in progress" indicators
    - [ ] Pastel blue (`#7CB9E8`) for "achieved" or "strong" indicators
  - [ ] Create CSS utility classes for growth mindset color scheme:
    - [ ] `.text-progress` (amber)
    - [ ] `.text-achieved` (pastel blue)
    - [ ] `.text-metric` (JetBrains Mono, pastel blue)
  - [ ] Ensure color contrast meets WCAG 2.1 AA (4.5:1 minimum) against dark backgrounds

- [ ] Task 6: Implement genre detection fallback for prompts (AC: 1)
  - [ ] In `context-builder.ts`, when `detectedGenre` is null or "Unknown":
    - [ ] System prompt uses generic music theory terminology
    - [ ] No genre-specific constraints applied
    - [ ] AI is instructed: "Genre has not been detected yet. Use neutral music theory terminology."
  - [ ] When genre changes mid-session (e.g., user switches from blues to jazz patterns):
    - [ ] Context builder picks up the latest detected genre from `sessionStore`
    - [ ] Subsequent AI responses adapt to the new genre context
    - [ ] No explicit notification to the user about genre change (it is invisible intelligence)
  - [ ] Write test verifying null/unknown genre handling in prompt

- [ ] Task 7: Create integration test for complete coaching pipeline (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Create `src/features/coaching/coaching-integration.test.ts`
  - [ ] Test scenario 1: Jazz genre detected, user asks about voicings -> verify prompt contains jazz terminology, growth mindset rules, and session data
  - [ ] Test scenario 2: No genre detected, user asks general question -> verify prompt uses neutral terminology
  - [ ] Test scenario 3: User is struggling (low accuracy) -> verify prompt emphasizes trajectory framing
  - [ ] Test scenario 4: Full data vs minimal data -> verify context builder handles both
  - [ ] Mock `streamText` to return test responses and verify post-processing catches any violations
  - [ ] Verify no prohibited words appear in test prompt templates

## Dev Notes

- **Genre Awareness is Prompt Engineering + Terminology**: The genre detection itself happens in Story 2.4 (`genre-detector.ts`). This story consumes the detected genre and uses it to constrain the AI's vocabulary and recommendations. The `genre-terminology.ts` module maps genres to specific terms that get injected into the system prompt. This ensures the LLM uses "ii-V-I" when talking to a jazz player, not "1-5-4 progression."

- **Growth Mindset is a System-Level Constraint**: Every AI-generated response must comply with growth mindset principles. This is enforced at three levels:
  1. **System prompt directives** (primary enforcement -- the LLM is instructed)
  2. **Post-processing validation** (monitoring -- log violations, don't block responses)
  3. **UI styling** (visual enforcement -- amber not red, trajectory not failure)

  The system prompt is the most effective enforcement mechanism. Post-processing exists for monitoring compliance, not for rewriting responses. If the LLM consistently violates growth mindset rules, the system prompt needs refinement.

- **Prohibited Words List**: The `PROHIBITED_WORDS` list is for validation/monitoring, not for runtime censorship. We do not filter or rewrite AI responses. If the LLM produces a prohibited word despite system prompt instructions, we:
  1. Log it to Sentry as a warning (for prompt engineering improvement)
  2. Display the response as-is (better to show the full response than to break it)
  3. Refine the system prompt to prevent future violations

- **"Amber, Not Red" Implementation**: This is a CSS/styling concern, not an AI concern. The AI response text itself follows growth mindset language, and the UI presentation uses warm amber tones for anything in progress. The chat panel never uses red text, red backgrounds, or red indicators for performance feedback. This principle extends to DataCard metrics (from Story 4.2) and any future visualization elements.

- **Studio Engineer Persona Consistency**: The persona must be consistent across all AI interactions (chat, drills, analysis). The system prompt in `prompts.ts` is the single source of truth for persona behavior. All prompt-building functions (`buildChatSystemPrompt`, `buildDrillSystemPrompt`, `buildAnalysisSystemPrompt`) share the persona section.

- **Testing Strategy**:
  - Unit tests for genre terminology lookup (all genres, unknown genre)
  - Unit tests for growth mindset validation (compliant text, violating text)
  - Unit tests for prompt construction (genre sections present, growth mindset rules present)
  - Integration tests for the full pipeline: context -> prompt -> (mock) response -> post-processing
  - No need to test actual LLM responses -- test the prompt construction and response processing

- **Dependencies on Previous Stories**:
  - Story 4.1: System prompts in `prompts.ts`, AI schemas
  - Story 4.3: Coaching client hook, chat pipeline
  - Story 4.4: Context builder, session context assembly
  - Story 2.4: Genre detection (`detectedGenre` in `sessionStore`)
  - Story 2.5: Session snapshots (for trajectory data in responses)

### Project Structure Notes

Files created or modified in this story:
```
src/features/coaching/
  genre-terminology.ts            # Genre-specific term mappings (NEW)
  genre-terminology.test.ts       # Terminology tests (NEW)
  growth-mindset-rules.ts         # Growth mindset validation rules (NEW)
  growth-mindset-rules.test.ts    # Validation tests (NEW)
  response-processor.ts           # AI response post-processing (NEW)
  response-processor.test.ts      # Post-processing tests (NEW)
  coaching-integration.test.ts    # Full pipeline integration tests (NEW)

src/lib/ai/
  prompts.ts                      # Add genre + growth mindset prompt sections (MODIFY)
  prompts.test.ts                 # Update prompt tests (MODIFY)

src/components/
  ai-chat-panel.tsx               # Add metric highlighting, amber/blue styling (MODIFY)

src/app/globals.css               # Add .text-progress, .text-achieved, .text-metric utilities (MODIFY)
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.5] -- FR26 (genre-constrained advice), FR28 (growth mindset framing)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Emotional Design Principles] -- "Amber, Not Red", "Earned Confidence, Not Given Praise", "Precision Is Warmth"
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Studio Engineer AI Persona] -- Technical, precise, no filler, specific data references
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Micro-Emotions] -- Trust, Competence, Momentum; prevent Shame, Judgment
- [Source: _bmad-output/planning-artifacts/prd.md#User Journeys] -- Aisha's jazz voicing example, Jake's improvement reframing example
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Handling Standards] -- Growth mindset in user-facing errors
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Implications] -- Coach Energy in Failure States

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
