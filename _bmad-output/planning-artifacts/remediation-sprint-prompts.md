# Remediation Sprint Prompts — Epics 12-15

**Date:** 2026-02-13
**Purpose:** Copy-paste prompts for each BMAD workflow step, designed for fully autonomous execution in fresh context windows.
**Source:** 99 adversarial code review findings at `_bmad-output/planning-artifacts/code-review-findings-epics-8-11.md`

---

## Context Management Rules (All Steps)

- Each prompt runs in a **fresh context window** — no prior conversation
- YOLO mode: skip confirmations, minimize prompts, execute continuously
- Never stop, ask, pause, or wait for approval
- Resolve ambiguity from project artifacts, log decisions, keep moving
- If a BMAD workflow has menus, select the correct option automatically based on the task description
- Update all BMAD status files (frontmatter, sprint-status.yaml) after every workflow completion

---

## Step 1: Correct Course

**Command:** `/bmad-bmm-correct-course`
**Agent:** Bob, Scrum Master
**Fresh context window: YES**

### Prompt

```
Run /bmad-bmm-correct-course in YOLO mode. Execute continuously without stopping.

CONTEXT: Minstrel is in Phase 4 Implementation. Epics 1-11 are ALL DONE (71 stories implemented, tested, committed). An adversarial code review of Epics 8-11 produced 99 findings documented at:
_bmad-output/planning-artifacts/code-review-findings-epics-8-11.md

TASK: Assess these 99 code review findings and determine the correct course correction. The findings break down as:
- 17 CRITICAL (security, data integrity, broken features — block launch)
- 27 HIGH (race conditions, accessibility violations, missing timeouts)
- 35 MEDIUM (polish, performance, dead code, minor a11y)
- 20 LOW (edge cases, cleanup, hardcoded values)

EXPECTED OUTCOME: The correct course is to ADD 4 new remediation epics to the existing epics.md file:
- Epic 12: Critical Security & Data Integrity (all 17 CRITICAL findings)
- Epic 13: High Priority Fixes (all 27 HIGH findings)
- Epic 14: Medium Priority Polish (all 35 MEDIUM findings)
- Epic 15: Low Priority Cleanup (all 20 LOW findings)

This is NOT a PRD change, NOT an architecture redo, NOT a full sprint replan. It is an ADDITIVE epic/story creation for remediation work. The existing Epics 1-11 and their 71 stories remain untouched.

ACTIONS:
1. Read the code review findings doc completely
2. Read the current epics.md to understand existing structure
3. Read the architecture.md and prd.md for reference
4. Analyze impact: these are all code-level fixes to existing implementation, no new features, no architectural changes
5. Propose the course correction: append Epics 12-15 to epics.md
6. Route to Step 2 (Create Epics and Stories) as the next action

RULES:
- Do NOT modify any existing epic (1-11) content
- Do NOT suggest redoing the PRD or architecture
- Do NOT suggest redoing sprint planning from scratch — just add to it
- Execute every step of the correct-course workflow without pausing
- Update the correct-course workflow frontmatter/status on completion
- Log all decisions made

When the workflow asks for user input or menu selections, choose the option that routes to updating epics/stories (not PRD, not architecture). If it asks for change scope, select "Moderate" — adding epics to existing plan without changing foundations.
```

---

## Step 2: Create Epics and Stories

**Command:** `/bmad-bmm-create-epics-and-stories`
**Agent:** John, Product Manager
**Fresh context window: YES**

### Prompt

```
Run /bmad-bmm-create-epics-and-stories in YOLO mode. Execute ALL 4 steps continuously without stopping.

CONTEXT: Minstrel has completed Epics 1-11 (71 stories). An adversarial code review produced 99 findings. The correct-course workflow determined we need 4 new remediation epics (12-15). This workflow creates those epics and their stories.

INPUT DOCUMENTS:
- Code review findings: _bmad-output/planning-artifacts/code-review-findings-epics-8-11.md (PRIMARY INPUT — read this FIRST and COMPLETELY)
- Existing epics: _bmad-output/planning-artifacts/epics.md (APPEND to this, do NOT replace)
- PRD: _bmad-output/planning-artifacts/prd.md (reference for NFRs)
- Architecture: _bmad-output/planning-artifacts/architecture.md (reference for patterns)
- UX Design: _bmad-output/planning-artifacts/ux-design-specification.md (reference for a11y standards)

TASK: Create Epics 12-15 with stories following the EXACT format of Epics 8-11 in the existing epics.md. APPEND to the existing file — do NOT overwrite Epics 1-11.

EPIC STRUCTURE:

### Epic 12: Critical Security & Data Integrity (17 findings — BLOCKS LAUNCH)
Group the 17 CRITICAL findings into stories. Suggested grouping:
- 12.1: CSRF Protection for All API Routes (SEC-C1)
- 12.2: Encryption Key Entropy Validation and Rotation (SEC-C2)
- 12.3: Session Buffer Crash Protection (STATE-C1, STATE-C4) — beforeunload flush + queue pattern
- 12.4: Atomic XP and Streak Updates (STATE-C2, STATE-C3) — Supabase RPC atomic operations
- 12.5: Memory Leak Fixes — Analysis Pipeline and Pointer Capture (STATE-C5, UI-C3)
- 12.6: Semantic Landmarks and Session Switch Error Handling (UI-C1, UI-C2, UI-C4, UI-C5)
- 12.7: Fix Token Usage Extraction and Silent Tracking Failures (AI-C1, AI-C2)
- 12.8: Growth Mindset Stream Transform and Prompt Injection Protection (AI-C3, AI-C4)
- 12.9: Separate Rate Limits for Drill Generation (AI-C5)

### Epic 13: High Priority Accessibility & State Fixes (27 findings)
Group the 27 HIGH findings into stories. Suggested grouping:
- 13.1: Distributed Rate Limiting with Upstash (SEC-H1, AI-M3 duplicate)
- 13.2: Non-Charging API Key Validation (SEC-H2)
- 13.3: Rate Limit Response Headers (SEC-H3)
- 13.4: Stale Closure and Reentrancy Fixes (STATE-H1, STATE-H4, STATE-H5)
- 13.5: Atomic IndexedDB Transactions and Metadata Writes (STATE-H2, STATE-H3)
- 13.6: Token Estimation and Budget Enforcement (AI-H1, AI-H2)
- 13.7: Context Trimming, Replay Window, and Error Classification (AI-H3, AI-H4, AI-H5)
- 13.8: Drill Timeout and Genre Logging (AI-H6, AI-H7)
- 13.9: Dashboard and Replay Accessibility — ARIA Attributes (UI-H1 through UI-H6)
- 13.10: Keyboard Navigation, Focus Traps, and Modal Fixes (UI-H7 through UI-H12)

### Epic 14: Medium Priority Polish (35 findings)
Group the 35 MEDIUM findings into stories. Suggested grouping:
- 14.1: CI Security Checks and Token Tracker Server Import (SEC-M1, SEC-M2, SEC-M3, SEC-M4)
- 14.2: Streak Timezone Persistence and XP Error Propagation (STATE-M1, STATE-M2)
- 14.3: Drill Player Timer and Audio Node Cleanup (STATE-M3, STATE-M4, STATE-M6)
- 14.4: Stale Closure and Reentrancy Fixes (STATE-M5, STATE-M7)
- 14.5: Data Export Completeness and Token Summary (AI-M1, AI-M2)
- 14.6: Dead Code Removal and Growth Mindset Monitoring (AI-M4, AI-M5, AI-M7)
- 14.7: Drill Schema Validation and PostHog User ID (AI-M6, AI-M8, AI-M9, AI-M10, AI-M11)
- 14.8: Landmark and Screen Reader Fixes (UI-M1, UI-M2, UI-M3)
- 14.9: Chat UX Improvements — Scroll, Submit, Color Logic (UI-M4, UI-M5, UI-M6)
- 14.10: Animation Accessibility and Focus Traps (UI-M7, UI-M8, UI-M9, UI-M10)
- 14.11: Performance — Virtualization and Pagination (UI-M11, UI-M12, UI-M13)

### Epic 15: Low Priority Cleanup (20 findings)
Group the 20 LOW findings into stories. Suggested grouping:
- 15.1: Middleware and RLS Security Hardening (SEC-L1, SEC-L2, SEC-L3)
- 15.2: DST, Accumulator, and Timer Edge Cases (STATE-L1, STATE-L2, STATE-L3)
- 15.3: Cache Invalidation and MIDI Subscription Cleanup (STATE-L4, STATE-L5, STATE-L6)
- 15.4: Dead Code Removal and Retry/Pricing Staleness (AI-L1, AI-L2, AI-L3, AI-L4)
- 15.5: Export Compression and Growth Mindset Expansion (AI-L5, AI-L6)
- 15.6: UI Polish — Limits, Magic Numbers, Typography, localStorage (UI-L1, UI-L2, UI-L3, UI-L4)

STORY FORMAT (follow EXACTLY — match Epics 8-11 pattern):

### Story X.Y: {Title}

As a {user/developer/musician},
I want {goal referencing the finding},
So that {benefit — why this fix matters}.

**Acceptance Criteria:**

**Given** {precondition}
**When** {action}
**Then** {expected outcome with specific technical detail}
**And** {additional assertions — reference finding IDs}

RULES:
- Every finding ID (SEC-C1, STATE-H2, etc.) MUST map to at least one story
- Stories within an epic are ordered by dependency (forward-only)
- Each story has 3-6 acceptance criteria with Given/When/Then format
- Reference specific files, line numbers, and function names from the findings doc
- Reference NFRs where applicable (NFR9-NFR15 for security, NFR19-NFR24 for accessibility)
- Include a "Test Coverage Gaps Addressed" note mapping to the 10 test coverage gaps at the bottom of the findings doc
- Update the epics.md frontmatter stepsCompleted array
- APPEND to the existing epics.md — preserve ALL existing content (Epics 1-11)
- Add an updated "## Validation Summary" section covering Epics 12-15
- Total estimated stories: 35-42 across 4 epics

STATE-L7 (Guest Session Double-Start) was verified as NOT a bug — exclude it from stories.
AI-M3 is a duplicate of SEC-H1 — handle in the SEC-H1 story only, note the dedup.

Execute ALL 4 steps of the create-epics-and-stories workflow without pausing:
Step 1: Validate prerequisites (read all input docs)
Step 2: Design epics (use the groupings above as starting point, adjust if needed)
Step 3: Create stories (write all stories with full ACs)
Step 4: Final validation (verify all 99 findings covered, minus STATE-L7 and AI-M3 dedup = 97 unique)
```

---

## Step 3: Sprint Planning

**Command:** `/bmad-bmm-sprint-planning`
**Agent:** Bob, Scrum Master
**Fresh context window: YES**

### Prompt

````
Run /bmad-bmm-sprint-planning in YOLO mode. Execute continuously without stopping.

CONTEXT: Minstrel has completed Epics 1-11 (all marked done in sprint-status.yaml). Epics 12-15 have just been added to epics.md as remediation sprints from code review findings. The sprint-status.yaml needs to be updated to include these new epics and stories.

INPUT DOCUMENTS:
- Updated epics file: _bmad-output/planning-artifacts/epics.md (contains Epics 1-15)
- Current sprint status: _bmad-output/implementation-artifacts/sprint-status.yaml (contains Epics 1-11, all done)
- Code review findings: _bmad-output/planning-artifacts/code-review-findings-epics-8-11.md (for context on priority)

TASK: Update sprint-status.yaml to include Epics 12-15 and all their stories. PRESERVE all existing Epics 1-11 entries (they are all done — do not modify them).

REQUIREMENTS:
1. Parse the updated epics.md to extract all new stories for Epics 12-15
2. Convert story titles to kebab-case keys following the existing pattern:
   - Epic 12, Story 1 → `12-1-{kebab-case-title}: backlog`
   - Example: `12-1-csrf-protection-all-api-routes: backlog`
3. Set all new epic statuses to `backlog`
4. Set all new story statuses to `backlog`
5. Add retrospective entries as `optional` for each new epic
6. Maintain the EXACT YAML format of the existing file:
   ```yaml
   # Epic 12: {Title}
   epic-12: backlog
   12-1-{title}: backlog
   12-2-{title}: backlog
   ...
   epic-12-retrospective: optional
````

7. Preserve the file header (generated date, project info, status definitions, workflow notes)
8. Update the `generated` date to today (2026-02-13)

EPIC PRIORITY ORDER (implementation order):

- Epic 12 (Critical) — MUST complete before launch
- Epic 13 (High) — SHOULD complete before launch
- Epic 14 (Medium) — NICE to complete before launch
- Epic 15 (Low) — Post-launch acceptable

RULES:

- Do NOT modify any Epic 1-11 entries — they are historical record
- Do NOT change any existing status values
- All new entries start as `backlog`
- Follow the exact kebab-case naming convention from existing stories
- Validate the final YAML is syntactically correct
- Report totals: new epics added, new stories added, total project stories

```

---

## Step 4: Create Story Files (Batch)

**Command:** `/bmad-bmm-create-story` (run for EACH story)
**Agent:** Bob, Scrum Master
**Fresh context window: YES — one per epic (batch stories within an epic)**

### Prompt Template (Epic 12 — Critical)

```

Run /bmad-bmm-create-story in YOLO mode for ALL stories in Epic 12. Execute continuously without stopping. Create ALL story files in sequence before finishing.

CONTEXT: Minstrel is in Phase 4 Implementation. Epics 1-11 are done. Epic 12 contains CRITICAL security and data integrity fixes from code review findings. Each story must have exhaustive implementation detail so a dev agent can implement without ambiguity.

INPUT DOCUMENTS:

- Epics file: \_bmad-output/planning-artifacts/epics.md (Epic 12 section)
- Code review findings: \_bmad-output/planning-artifacts/code-review-findings-epics-8-11.md (CRITICAL section — lines 21-107)
- Architecture: \_bmad-output/planning-artifacts/architecture.md
- Sprint status: \_bmad-output/implementation-artifacts/sprint-status.yaml
- Existing codebase (for file paths, current implementation, git history)

STORIES TO CREATE (in order):

1. 12.1 — Read findings SEC-C1, identify ALL API route files, write tasks with exact file paths
2. 12.2 — Read findings SEC-C2, identify crypto.ts, write tasks for entropy validation + rotation
3. 12.3 — Read findings STATE-C1 + STATE-C4, identify session-recorder.ts, write tasks for beforeunload + queue pattern
4. 12.4 — Read findings STATE-C2 + STATE-C3, identify use-xp.ts + use-streak.ts, write Supabase RPC tasks
5. 12.5 — Read findings STATE-C5 + UI-C3, identify analysis pipeline + timeline scrubber, write cleanup tasks
6. 12.6 — Read findings UI-C1 + UI-C2 + UI-C4 + UI-C5, identify dashboard + replay + session-history, write semantic HTML + error handling tasks
7. 12.7 — Read findings AI-C1 + AI-C2, identify chat route + token-tracker, write extraction + fallback tasks
8. 12.8 — Read findings AI-C3 + AI-C4, identify chat route + growth-mindset-rules, write stream transform + injection protection tasks
9. 12.9 — Read findings AI-C5, identify drill route + rate-limiter, write separate rate limit tasks

FOR EACH STORY:

1. Read the story's acceptance criteria from epics.md
2. Read the referenced finding(s) from code-review-findings doc — note exact files, line numbers, and fixes suggested
3. Read the ACTUAL current source files mentioned in the findings to verify they still match
4. Check git log for recent changes to those files
5. Write the story file following this EXACT structure:

# Story {X.Y}: {Title}

Status: ready-for-dev

## Story

As a {role}, I want {goal}, So that {benefit}.

## Acceptance Criteria

{Numbered list with Given/When/Then from epics.md}

## Tasks / Subtasks

{Hierarchical checklist with:}

- [ ] 1. {Task title} (AC: {numbers})
  - [ ] 1.1 {Specific subtask with file path, line number, exact code change}
  - [ ] 1.2 {Specific subtask}
  - [ ] 1.3 Write co-located tests: {file path}.test.ts
    - Test case 1: {description}
    - Test case 2: {description}
    - Test case 3: {description}

## Dev Notes

- **Architecture Layer**: {Which layer this touches}
- **Findings Addressed**: {Finding IDs}
- **Current Code**: {Brief description of what exists now}
- **Fix Pattern**: {Specific fix approach from findings doc}
- **Testing**: {Testing approach — unit/integration/e2e}
- **NFRs**: {Referenced NFRs}

### Project Structure Notes

- Files to modify: {list}
- Files to create: {list, if any}
- Dependencies: {any new packages needed}

### References

- PRD: \_bmad-output/planning-artifacts/prd.md
- Architecture: \_bmad-output/planning-artifacts/architecture.md
- Code Review Findings: \_bmad-output/planning-artifacts/code-review-findings-epics-8-11.md

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

6. Save story file to: \_bmad-output/implementation-artifacts/{epic}-{story}-{kebab-title}.md
7. Update sprint-status.yaml: change story status from `backlog` to `ready-for-dev`
8. Move to next story immediately

RULES:

- Read ACTUAL source files before writing tasks — never guess at line numbers or code structure
- Every task must have enough detail for a dev agent to implement WITHOUT reading the findings doc
- Every story MUST include test tasks with specific test cases
- Tasks must reference the architecture layer they touch
- No placeholders, no "TBD", no "see findings doc" — inline ALL context
- Each story file should be 80-150 lines (enough detail, not bloated)
- Mark each story as ready-for-dev in sprint-status.yaml after creation

```

### Prompt Template (Epic 13 — High)

```

Run /bmad-bmm-create-story in YOLO mode for ALL stories in Epic 13. Execute continuously without stopping. Create ALL story files in sequence before finishing.

CONTEXT: Minstrel is in Phase 4 Implementation. Epics 1-11 are done. Epic 12 story files are created (ready-for-dev). Epic 13 contains HIGH priority fixes from code review findings — accessibility violations, state management bugs, AI improvements.

INPUT DOCUMENTS:

- Epics file: \_bmad-output/planning-artifacts/epics.md (Epic 13 section)
- Code review findings: \_bmad-output/planning-artifacts/code-review-findings-epics-8-11.md (HIGH section — lines 110-246)
- Architecture: \_bmad-output/planning-artifacts/architecture.md
- Sprint status: \_bmad-output/implementation-artifacts/sprint-status.yaml
- Existing codebase (for file paths, current implementation, git history)

STORIES TO CREATE (in order):
{List all Epic 13 stories from epics.md}

FOR EACH STORY, follow the EXACT same process as Epic 12:

1. Read ACs from epics.md
2. Read finding(s) from findings doc
3. Read ACTUAL current source files
4. Check git log for those files
5. Write comprehensive story file with tasks, subtasks, test cases
6. Save to implementation-artifacts/
7. Update sprint-status.yaml to ready-for-dev
8. Move to next story immediately

RULES: Same as Epic 12 prompt. Additionally:

- Epic 13 stories may depend on Epic 12 fixes (e.g., rate limiting). Note dependencies in Dev Notes.
- Accessibility stories (UI-H\*) must reference specific WCAG 2.1 AA criteria
- State management stories must specify exact Zustand patterns to use
- AI stories must reference Vercel AI SDK 6.x APIs

```

### Prompt Template (Epic 14 — Medium)

```

Run /bmad-bmm-create-story in YOLO mode for ALL stories in Epic 14. Execute continuously without stopping. Create ALL story files in sequence before finishing.

CONTEXT: Minstrel is in Phase 4 Implementation. Epics 1-12 done/ready. Epic 13 story files created. Epic 14 contains MEDIUM priority polish fixes.

INPUT DOCUMENTS:

- Epics file: \_bmad-output/planning-artifacts/epics.md (Epic 14 section)
- Code review findings: \_bmad-output/planning-artifacts/code-review-findings-epics-8-11.md (MEDIUM section — lines 249-425)
- Architecture: \_bmad-output/planning-artifacts/architecture.md
- Sprint status: \_bmad-output/implementation-artifacts/sprint-status.yaml
- Existing codebase

STORIES TO CREATE: {All Epic 14 stories from epics.md, in order}

Same process and rules as Epics 12-13. Additional notes:

- Performance stories (UI-M11, UI-M12) may require new dependencies (virtual scroll library) — note in Dev Notes
- Some findings are duplicates (AI-M3 = SEC-H1) — skip duplicates, note in Dev Notes
- Animation accessibility stories must test prefers-reduced-motion

```

### Prompt Template (Epic 15 — Low)

```

Run /bmad-bmm-create-story in YOLO mode for ALL stories in Epic 15. Execute continuously without stopping. Create ALL story files in sequence before finishing.

CONTEXT: Minstrel is in Phase 4 Implementation. Epics 1-13 done/ready. Epic 14 story files created. Epic 15 contains LOW priority cleanup and edge case fixes.

INPUT DOCUMENTS:

- Epics file: \_bmad-output/planning-artifacts/epics.md (Epic 15 section)
- Code review findings: \_bmad-output/planning-artifacts/code-review-findings-epics-8-11.md (LOW section — lines 428-527)
- Architecture: \_bmad-output/planning-artifacts/architecture.md
- Sprint status: \_bmad-output/implementation-artifacts/sprint-status.yaml
- Existing codebase

STORIES TO CREATE: {All Epic 15 stories from epics.md, in order}

Same process and rules as Epics 12-14. Additional notes:

- STATE-L7 was verified as NOT a bug — it should NOT have a story. If it appears in epics.md, skip it.
- Low priority stories can have lighter test requirements (unit tests sufficient, no e2e needed)
- Dead code removal (AI-L1, AI-L3) stories should verify with grep that exports are truly unused before removal

```

---

## Step 5: Development Sprint (Per Epic)

**Command:** Dev agent workflow (loads /bmad:bmm:agents:dev + /bmad:bmm:workflows:dev-story)
**Agent:** Amelia, Developer
**Fresh context window: YES — one per epic**

### Prompt — Epic 12 (Critical Security & Data Integrity)

```

Minstrel Sprint — Epic 12: Critical Security & Data Integrity | Fully Autonomous

NEVER stop, ask, pause, or wait for approval. Run ALL stories in Epic 12 to completion in one uninterrupted execution. Resolve ambiguity from project artifacts. Log decisions, keep moving.

---

## Scope

Epic 12 stories (estimated 9 stories — read sprint-status.yaml for exact list):
All stories with keys starting with `12-` in sprint-status.yaml that have status `ready-for-dev`.

Priority: CRITICAL — these block launch. Zero shortcuts on security or data integrity.

---

## Workflow Per Story (strict order)

1. **Context** → Read the story file from `_bmad-output/implementation-artifacts/{story-key}.md` completely. Read referenced source files. Load dev agent persona from `_bmad/bmm/agents/dev.md`.
2. **Start** → Update sprint-status.yaml: story status → `in-progress`. Update story file: Status → `in-progress`.
3. **Develop** → Implement ALL tasks/subtasks from the story file in exact order. Follow red-green-refactor:
   - RED: Write failing test first
   - GREEN: Write minimum code to pass
   - REFACTOR: Clean up while tests stay green
4. **Test** → Write ALL tests specified in the story file:
   - Unit tests for every modified export (Vitest + RTL)
   - Integration tests for API routes and DB operations
   - Security-specific tests: CSRF token validation, encryption entropy, injection attempts
   - Edge case tests from the story's acceptance criteria
   - Co-located: `{module}.test.ts` next to `{module}.ts`
   - Gates: ≥90% line coverage, ≥85% branch coverage, 100% function coverage per modified file
5. **Verify** (run in parallel) → `pnpm lint` (0 warnings) ∥ `pnpm type-check` (0 errors) ∥ `pnpm test --coverage` (all pass + gates met). Fix and re-run on failure.
6. **Review** (run in parallel) → Run code review per `_bmad/bmm/workflows/4-implementation/code-review/workflow.yaml`:
   - Read EVERY file in the story's File List
   - Validate each AC is actually implemented
   - Verify each [x] task is really done
   - Find minimum 3 issues (security stories demand thoroughness)
   - Also review test quality: deterministic, behavior-focused, edge cases covered, no unnecessary mocks
7. **Fix** → Address ALL review findings. Loop Steps 5→6→7 until clean. Max 3 cycles — then log tech debt and proceed.
8. **Complete** → Update story file:
   - Check all task boxes [x]
   - Fill Dev Agent Record (model, completion notes, file list, change log)
   - Status → `done`
9. **Update Status** → sprint-status.yaml:
   - Story status → `done`
   - When ALL Epic 12 stories are done, set `epic-12: done`
10. **Commit** → Semantic commit message with story ID:
    ```
    fix(security): add CSRF protection to all API routes [12.1]
    ```
    Tests in same commit. Stage specific files (not `git add .`). Push immediately.
11. **Next** → Verify sprint-status.yaml accuracy, then immediately start next story.

---

## Security-Specific Rules for Epic 12

- CSRF fixes: Test with cross-origin requests (different Origin header)
- Encryption: Test with low-entropy keys, verify rejection
- Race conditions: Test with concurrent operations (Promise.all with multiple calls)
- Buffer flush: Test with simulated beforeunload event
- Prompt injection: Test with XML injection, role override attempts, system prompt extraction
- Rate limiting: Test that drill route has separate limits from chat route

---

## Failure Recovery (never stop)

| Failure                | Action                                              |
| ---------------------- | --------------------------------------------------- |
| Test/lint/type failure | Fix, re-run (max 3 tries)                           |
| Review issues          | Fix, re-review (max 3 cycles)                       |
| Max cycles hit         | Log tech debt in story Dev Notes, proceed           |
| Ambiguity              | Decide from story file + findings doc, log decision |
| Dependency missing     | Install it, document in story Dev Notes             |

Never: stop and ask, use `any`/`@ts-ignore`, skip tests, skip reviews, batch commits, defer work.

---

## Rules

- Tests are MANDATORY — no story completes without coverage gates met
- Code review after EVERY story — find real issues, not rubber stamps
- Commit and push after EVERY story — never batch
- sprint-status.yaml updated after EVERY story
- No placeholders, no // TODO, no deferred tests
- SECURITY stories require extra scrutiny: test the attack vector, not just the fix
- All API route changes must include CSRF verification tests
- All state management changes must include concurrency tests

---

## Sprint Done (after last Epic 12 story)

Run full project test suite + lint + type-check. Verify ALL Epic 12 stories show `done` in sprint-status.yaml. Verify `epic-12: done`. Output summary: stories completed, total tests added, coverage metrics, security tests added, decisions made, tech debt logged. Then stop.

```

### Prompt — Epic 13 (High Priority Fixes)

```

Minstrel Sprint — Epic 13: High Priority Accessibility & State Fixes | Fully Autonomous

NEVER stop, ask, pause, or wait for approval. Run ALL stories in Epic 13 to completion in one uninterrupted execution. Resolve ambiguity from project artifacts. Log decisions, keep moving.

---

## Scope

Epic 13 stories (estimated 10 stories — read sprint-status.yaml for exact list):
All stories with keys starting with `13-` in sprint-status.yaml that have status `ready-for-dev`.

Dependencies: Epic 12 must be done first (rate limiting, security foundations).

---

## Workflow Per Story (strict order)

Same 11-step workflow as Epic 12:

1. Context → Read story file + referenced source files + dev agent
2. Start → Mark in-progress in sprint-status.yaml and story file
3. Develop → Red-green-refactor per story tasks
4. Test → Unit + integration + accessibility + edge case tests
   - Accessibility tests: use `@testing-library/jest-dom` matchers (`toHaveAttribute`, `toBeVisible`)
   - Test ARIA attributes, keyboard navigation, screen reader announcements
   - Test focus management (focus trap, focus restoration)
   - Gates: ≥90% line, ≥85% branch, 100% function per file
5. Verify → lint ∥ type-check ∥ test --coverage (parallel, fix on failure)
6. Review → Code review ∥ Test quality review (parallel, min 3 findings)
7. Fix → Address findings, loop max 3 cycles
8. Complete → Update story file (tasks [x], Dev Agent Record, status done)
9. Update Status → sprint-status.yaml (story done, epic done when all complete)
10. Commit → `fix(a11y): add ARIA expanded to dashboard accordion [13.9]` — push immediately
11. Next → Verify status, start next story

---

## Accessibility-Specific Rules for Epic 13

- Every ARIA attribute change must have a test asserting the attribute exists and has correct value
- Focus trap implementations must test: Tab cycling, Shift+Tab reverse, Escape to close
- Arrow key navigation (UI-H3) must test: Left/Right cycling, Home/End, wrapping
- Screen reader announcements (UI-H4) must test: aria-live region content changes
- Keyboard shortcuts (UI-H10) must test: visible focus indicators on all interactive elements
- Reference WCAG 2.1 AA criteria numbers in test descriptions

---

## State Management Rules for Epic 13

- Zustand patterns: Use `set` with updater function `set((state) => ...)` for atomic updates
- Replace `useRef` caching with `getState()` for fresh reads
- IndexedDB: Use Dexie transactions for atomic multi-table writes
- Test concurrency: `Promise.all([action1(), action2()])` to trigger race conditions

---

## Failure Recovery

Same table as Epic 12. Never stop.

---

## Rules

Same as Epic 12. Additionally:

- Accessibility stories must pass axe-core automated checks (if configured)
- State management fixes must include before/after behavior tests
- Stale closure fixes must test with rapid re-renders (act + flushMicrotasks)

---

## Sprint Done (after last Epic 13 story)

Run full project test suite + lint + type-check. Verify ALL Epic 13 stories show `done`. Verify `epic-13: done`. Output summary: stories completed, total tests added, WCAG criteria addressed, state bugs fixed, decisions made, tech debt. Then stop.

```

### Prompt — Epic 14 (Medium Priority Polish)

```

Minstrel Sprint — Epic 14: Medium Priority Polish | Fully Autonomous

NEVER stop, ask, pause, or wait for approval. Run ALL stories in Epic 14 to completion in one uninterrupted execution. Resolve ambiguity from project artifacts. Log decisions, keep moving.

---

## Scope

Epic 14 stories (estimated 11 stories — read sprint-status.yaml for exact list):
All stories with keys starting with `14-` in sprint-status.yaml that have status `ready-for-dev`.

Dependencies: Epics 12-13 should be done (security + accessibility foundations).

---

## Parallelization

Epic 14 stories are largely independent. Where possible, group related work:

- Track A: Security/CI stories (14.1)
- Track B: State management stories (14.2, 14.3, 14.4)
- Track C: AI/backend stories (14.5, 14.6, 14.7)
- Track D: UI stories (14.8, 14.9, 14.10, 14.11)

Within each track, stories are sequential. Use subagents for parallel tracks where the tool supports it.

---

## Workflow Per Story

Same 11-step workflow as Epics 12-13.

Test coverage gates: ≥85% line, ≥80% branch, 100% function per file (slightly relaxed for medium priority polish).

Commit pattern: `fix(ui): add prefers-reduced-motion to session summary animation [14.10]`

---

## Medium-Priority Specific Rules

- Dead code removal: Verify with grep that the export/function is truly unused before deleting
- Performance stories (virtualization, pagination): Include benchmark assertions if feasible (e.g., render time < 100ms for 100 items)
- Animation accessibility: Test `prefers-reduced-motion` with `window.matchMedia` mock
- Schema validation: Test boundary values (0, 1, -1, max, overflow)
- PostHog fix: Verify correct user ID flows through without actually sending analytics

---

## Sprint Done

Same pattern. Verify all Epic 14 stories done, `epic-14: done`. Output summary. Then stop.

```

### Prompt — Epic 15 (Low Priority Cleanup)

```

Minstrel Sprint — Epic 15: Low Priority Cleanup | Fully Autonomous

NEVER stop, ask, pause, or wait for approval. Run ALL stories in Epic 15 to completion in one uninterrupted execution. Resolve ambiguity from project artifacts. Log decisions, keep moving.

---

## Scope

Epic 15 stories (estimated 6 stories — read sprint-status.yaml for exact list):
All stories with keys starting with `15-` in sprint-status.yaml that have status `ready-for-dev`.

Dependencies: No hard dependencies, but Epics 12-14 ideally complete first.

---

## Workflow Per Story

Same 11-step workflow.

Test coverage gates: ≥80% line, ≥75% branch, 100% function per file (relaxed for low priority cleanup).

Commit pattern: `chore(cleanup): remove unused trackTokenUsage export [15.4]`

---

## Low-Priority Specific Rules

- Edge case fixes: Write the test for the edge case FIRST, confirm it fails, then fix
- Hardcoded values: Extract to constants in `src/lib/constants.ts`
- localStorage safety: Wrap in try/catch, test with quota exceeded mock
- DST edge cases: Test with timezone offsets that cross DST boundaries
- Pricing staleness: Add a simple `Date.now() - Date.parse(PRICING_LAST_UPDATED) > 30 * 86400000` check

---

## Sprint Done

Same pattern. Verify all Epic 15 stories done, `epic-15: done`.

ADDITIONALLY — this is the FINAL remediation sprint:

1. Run FULL project test suite: `pnpm test --coverage`
2. Run FULL lint: `pnpm lint`
3. Run FULL type-check: `pnpm type-check`
4. Verify sprint-status.yaml shows Epics 12-15 ALL done
5. Count total findings addressed (should be 97 unique out of 99, minus STATE-L7 verified-not-bug and AI-M3 duplicate)
6. Output FINAL summary:
   - Total stories completed across Epics 12-15
   - Total tests added
   - Average coverage
   - Findings addressed by severity
   - Remaining tech debt (if any)
   - Total project status: Epics 1-15 all done

Then stop.

```

---

## Execution Order Summary

| Step | Command | Agent | Context Window | Estimated Stories |
|------|---------|-------|---------------|-------------------|
| 1 | /bmad-bmm-correct-course | Bob (SM) | Fresh #1 | N/A (routing) |
| 2 | /bmad-bmm-create-epics-and-stories | John (PM) | Fresh #2 | ~36 stories defined |
| 3 | /bmad-bmm-sprint-planning | Bob (SM) | Fresh #3 | N/A (YAML update) |
| 4a | /bmad-bmm-create-story (Epic 12) | Bob (SM) | Fresh #4 | ~9 story files |
| 4b | /bmad-bmm-create-story (Epic 13) | Bob (SM) | Fresh #5 | ~10 story files |
| 4c | /bmad-bmm-create-story (Epic 14) | Bob (SM) | Fresh #6 | ~11 story files |
| 4d | /bmad-bmm-create-story (Epic 15) | Bob (SM) | Fresh #7 | ~6 story files |
| 5a | Dev Sprint (Epic 12) | Amelia (Dev) | Fresh #8 | ~9 stories implemented |
| 5b | Dev Sprint (Epic 13) | Amelia (Dev) | Fresh #9 | ~10 stories implemented |
| 5c | Dev Sprint (Epic 14) | Amelia (Dev) | Fresh #10 | ~11 stories implemented |
| 5d | Dev Sprint (Epic 15) | Amelia (Dev) | Fresh #11 | ~6 stories + final report |

**Total: 11 context windows, ~36 stories, addressing 97 unique code review findings.**

---

## Notes

- Steps 1-3 are planning/routing — they produce artifacts, not code
- Step 4 (a-d) creates story files — detailed implementation specs, not code
- Step 5 (a-d) is where code gets written, tested, reviewed, and committed
- Each Step 5 prompt is self-contained — it reads its stories from the artifacts produced by Steps 2-4
- If a Step 5 context fills before completing all stories in an epic, start a new context with: "Continue Epic {N} sprint. Read sprint-status.yaml to find the next ready-for-dev story. Resume from there. Same rules apply."
- For code review validation, using a different LLM is recommended per BMAD guidelines
- The frontend-design skill must be invoked for any UI component changes (per CLAUDE.md rules)
- Context7 MCP must be used before implementing any third-party library changes (per CLAUDE.md rules)
```
