# Sprint Change Proposal — Code Review Remediation

**Date:** 2026-02-13
**Proposed by:** BMAD Correct-Course Workflow
**Approved by:** Pending
**Scope:** Moderate — additive epics, no foundation changes

---

## Section 1: Issue Summary

**Problem Statement:** An adversarial code review of Epics 8-11 (commits 7f3afbe..7f88fb4, 180 files, 14,118 insertions) produced 99 findings across 4 domains:

| Domain                 | Critical | High   | Medium | Low    | Total  |
| ---------------------- | -------- | ------ | ------ | ------ | ------ |
| Security & Auth        | 2        | 3      | 4      | 3      | 12     |
| State & Data Integrity | 5        | 5      | 7      | 7      | 24     |
| UI & Accessibility     | 5        | 12     | 13     | 4      | 34     |
| AI & Coaching          | 5        | 7      | 11     | 6      | 29     |
| **Total**              | **17**   | **27** | **35** | **20** | **99** |

**Context:** Discovered during post-implementation adversarial review. All findings are code-level issues in the existing implementation — no architectural or requirements changes needed.

**Evidence:** Full findings documented at `_bmad-output/planning-artifacts/code-review-findings-epics-8-11.md` with exact file:line references for every finding.

---

## Section 2: Impact Analysis

### Epic Impact

- **Epics 1-17:** NO changes. All 106 existing stories remain untouched.
- **New Epics 18-21:** 4 remediation epics covering all 99 findings, grouped by severity.
- **Epic 17 remaining stories (17-7, 17-8):** Should be deprioritized — Epic 18 (CRITICAL) takes precedence.

### Artifact Conflicts

- **PRD:** None. All findings are implementation-level fixes within existing NFRs (NFR9-15 security, NFR19-24 accessibility, NFR26 recording integrity).
- **Architecture:** None. No technology, pattern, or component changes.
- **UX Design:** None. Accessibility fixes align with WCAG 2.1 AA (already specified).
- **Sprint Status:** Requires update with 4 new epics and 38 new stories.

### Technical Impact

- All fixes are within existing files — no new infrastructure, no new dependencies.
- 10 test coverage gaps identified in the review need to be added to testing strategy.

---

## Section 3: Recommended Approach

**Selected:** Direct Adjustment — Add Epics 18-21 to existing plan.

**Rationale:**

1. All findings are code-level fixes, not architectural changes
2. Existing code works correctly for happy paths; hardening needed for edge cases and security
3. No rollback needed — fixes are additive (guards, validations, error handling)
4. PRD MVP scope unchanged — these fixes fulfill existing NFRs
5. Low risk — each fix is scoped and testable independently

**Alternatives Considered:**

- Rollback (Option 2): Not viable — would lose all Epic 8-11 progress for no benefit
- MVP Review (Option 3): Not needed — findings are within existing requirements

**Effort Estimate:** Medium (38 stories across 4 epics)
**Risk Level:** Low (code-level fixes, no architectural changes)
**Timeline Impact:** Epic 18 (CRITICAL) must complete before launch. Epics 19-21 can ship iteratively.

---

## Section 4: Detailed Change Proposals

### New Epic Structure

| Epic      | Title                              | Stories | Priority | Blocks Launch? |
| --------- | ---------------------------------- | ------- | -------- | -------------- |
| 18        | Critical Security & Data Integrity | 8       | P0       | YES            |
| 19        | High Priority Fixes                | 10      | P1       | Recommended    |
| 20        | Medium Priority Polish             | 12      | P2       | No             |
| 21        | Low Priority Cleanup               | 8       | P3       | No             |
| **Total** |                                    | **38**  |          |                |

### Finding-to-Story Mapping

**Epic 18 (8 stories, 17 CRITICAL findings):**

- 18-1: CSRF Protection → SEC-C1
- 18-2: Encryption Key Hardening → SEC-C2
- 18-3: Session Buffer Data Loss → STATE-C1, STATE-C4
- 18-4: XP/Streak Race Conditions → STATE-C2, STATE-C3
- 18-5: Pattern Analysis Memory Leak → STATE-C5
- 18-6: UI Critical — Landmarks, Async, Memory → UI-C1, UI-C2, UI-C3, UI-C4, UI-C5
- 18-7: Token Extraction & Growth Mindset Stream → AI-C1, AI-C3
- 18-8: AI Security — Injection, Rate Limits → AI-C2, AI-C4, AI-C5

**Epic 19 (10 stories, 27 HIGH findings):**

- 19-1: Distributed Rate Limiting → SEC-H1, SEC-H3
- 19-2: Non-Charging API Key Validation → SEC-H2
- 19-3: Stale Closure & Reentrancy Fixes → STATE-H1, STATE-H4, STATE-H5
- 19-4: Atomic IndexedDB Transactions → STATE-H3
- 19-5: Token Budget & Error Classification → AI-H1, AI-H2, AI-H3, AI-H5
- 19-6: Drill/Replay Context & Timeout → AI-H4, AI-H6, AI-H7
- 19-7: Dashboard ARIA Attributes → UI-H1, UI-H2, UI-H3, UI-H4
- 19-8: Chat & Input Accessibility → UI-H5, UI-H6, UI-H12
- 19-9: Modal Focus Traps & Keyboard → UI-H8, UI-H9, UI-H10
- 19-10: Banner Behavior & Timeline Nav → UI-H7, UI-H11

**Epic 20 (12 stories, 35 MEDIUM findings):**

- 20-1: Security Polish — CI, Imports, Errors → SEC-M1, SEC-M2, SEC-M3, SEC-M4
- 20-2: Timezone & XP Error Handling → STATE-M1, STATE-M2
- 20-3: Drill Player Memory & Race Conditions → STATE-M3, STATE-M4, STATE-M6
- 20-4: Stale Closures & Buffer Guards → STATE-M5, STATE-M7
- 20-5: Data Export Completeness → AI-M1, AI-M2, AI-M3
- 20-6: Schema, Dead Code, Missing Context → AI-M4, AI-M5, AI-M6, AI-M8, AI-M9
- 20-7: AI Observability & Logging → AI-M7, AI-M10, AI-M11
- 20-8: Screen Reader & Landmark Fixes → UI-M1, UI-M2, UI-M3
- 20-9: Chat UX — Scroll, Submit, Color Logic → UI-M4, UI-M5, UI-M6
- 20-10: Animation & Cleanup Accessibility → UI-M7, UI-M8, UI-M10
- 20-11: Focus Traps & Reduced Motion → UI-M9, UI-M13
- 20-12: Virtualization & Pagination → UI-M11, UI-M12

**Epic 21 (8 stories, 20 LOW findings):**

- 21-1: Middleware & RLS Hardening → SEC-L1, SEC-L2, SEC-L3
- 21-2: DST & Accumulator Reset → STATE-L1, STATE-L2
- 21-3: Timer & Subscription Cleanup → STATE-L3, STATE-L5
- 21-4: Session Cache & Metadata Fixes → STATE-L4, STATE-L6, STATE-L7
- 21-5: Dead Code & Stale Pricing → AI-L1, AI-L3, AI-L4
- 21-6: Retry Logic & Export Compression → AI-L2, AI-L5
- 21-7: Growth Mindset Rules Expansion → AI-L6
- 21-8: UI Edge Cases — Limits, Magic Numbers, localStorage → UI-L1, UI-L2, UI-L3, UI-L4

---

## Section 5: Implementation Handoff

**Scope Classification:** Moderate — Backlog addition, no replan.

**Handoff Plan:**

1. Create `epics-18-21.md` with full story definitions and acceptance criteria
2. Create individual story files in `_bmad-output/implementation-artifacts/`
3. Update `sprint-status.yaml` with new epics and stories
4. Prioritize: Epic 18 → Epic 19 → Epic 20 → Epic 21
5. Epic 18 must complete before launch (blocks launch)

**Dependencies:**

- Epic 18: No dependencies (standalone, highest priority)
- Epic 19: After Epic 18 (fixes build on security foundation)
- Epic 20: After Epic 19 (polish after critical/high fixes)
- Epic 21: After Epic 20 (cleanup last)

**Success Criteria:**

- All 17 CRITICAL findings resolved and verified
- All 27 HIGH findings resolved
- Zero security vulnerabilities remaining
- WCAG 2.1 AA compliance verified for all accessibility fixes

**Next Action:** Route to Create Epics and Stories workflow (Step 2) for Epics 18-21.
