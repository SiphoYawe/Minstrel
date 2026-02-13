# Story 8.2: Fix Snapshot CTA Drill Generation Flow

Status: ready-for-dev

## Story

As a musician,
I want the "Generate Drill" button on the session snapshot to actually generate a drill targeting my identified weakness,
so that I can immediately practice what needs improvement.

## Acceptance Criteria

1. Given a session snapshot is displayed with a key insight, When the user clicks "Generate Drill", Then a drill is generated via `/api/ai/drill` targeting the weakness identified in the snapshot. And the snapshot's `keyInsight` and `insightCategory` are passed as the drill generation target.

2. Given the drill generation flow starts, When the user clicks "Generate Drill", Then the UI transitions to the DrillController component with the generated drill loaded. And a loading state is shown during drill generation.

3. Given the snapshot CTA component renders, When both buttons are visible, Then "View Dashboard" navigates to `dashboard-chat` mode AND "Generate Drill" triggers actual drill generation via the API (not just a mode switch).

4. Given the Generate Drill button is clicked, When no API key is configured, Then the user sees the graceful degradation prompt instead of a server error. And the `hasApiKey` guard from `appStore` prevents the API call.

5. Given the snapshot CTA component uses inline styles and hardcoded colors, When the component is updated, Then the `@keyframes fadeUp` animation is moved to a Tailwind animation utility or CSS module (DS-5 compliance). And all hardcoded colors (`#2A2A2A`, `#0F0F0F`, `#7CB9E8`, `#999`) are replaced with design tokens (`border-border`, `bg-background`, `text-primary`, `text-muted-foreground`).

## Tasks / Subtasks

- [ ] 1. Wire "Generate Drill" button to actual drill generation (AC: 1, 2, 3)
  - [ ] 1.1 Open `src/components/snapshot-cta.tsx`
  - [ ] 1.2 Current code at line 23-26: the "Generate Drill" button calls `setPendingDrillRequest(true)` then `setCurrentMode('dashboard-chat')`. This sets a flag but may not trigger actual drill generation
  - [ ] 1.3 Verify that `setPendingDrillRequest(true)` is consumed downstream -- check if `dashboard-chat` mode reads this flag and auto-triggers drill generation
  - [ ] 1.4 If the flag is not consumed: wire the button to call the `/api/ai/drill` endpoint directly, passing `currentSnapshot.keyInsight` and `currentSnapshot.insightCategory` as the drill target
  - [ ] 1.5 On successful drill generation, transition to the DrillController component (or the appropriate mode that displays drills)
  - [ ] 1.6 Add loading state to the button during drill generation (disable + spinner/text change)

- [ ] 2. Add API key guard to drill generation (AC: 4)
  - [ ] 2.1 Import `useAppStore` and read `hasApiKey` state
  - [ ] 2.2 Guard the "Generate Drill" onClick: if `!hasApiKey`, show the graceful degradation prompt (reference `src/features/auth/api-key-prompt.tsx` pattern from Story 3.5)
  - [ ] 2.3 Visually disable the "Generate Drill" button when `!hasApiKey` with a tooltip: "Configure an API key in Settings to generate drills"

- [ ] 3. Fix design system violations (AC: 5)
  - [ ] 3.1 Remove inline `animate-[fadeUp_300ms_ease-out]` and replace with a proper Tailwind animation utility. Define `fadeUp` keyframes in `tailwind.config.ts` under `theme.extend.animation` and `theme.extend.keyframes`, or use an existing Tailwind animation class
  - [ ] 3.2 Replace hardcoded color `border-[#2A2A2A]` with `border-border`
  - [ ] 3.3 Replace hardcoded color `bg-[#0F0F0F]/90` with `bg-background/90`
  - [ ] 3.4 Replace hardcoded color `text-[#999]` with `text-muted-foreground`
  - [ ] 3.5 Replace hardcoded color `text-[#7CB9E8]` with `text-primary`
  - [ ] 3.6 Replace hardcoded color `bg-[#7CB9E8]/10` with `bg-primary/10`
  - [ ] 3.7 Replace hardcoded color `border-[#7CB9E8]/20` with `border-primary/20`
  - [ ] 3.8 Replace hover color variants similarly: `hover:border-[#7CB9E8]/30` -> `hover:border-primary/30`, etc.

- [ ] 4. Write tests (AC: 1, 3, 4)
  - [ ] 4.1 Create `src/components/snapshot-cta.test.tsx` -- test that "View Dashboard" sets mode to `dashboard-chat`
  - [ ] 4.2 Test that "Generate Drill" triggers drill generation (not just mode switch)
  - [ ] 4.3 Test that "Generate Drill" is guarded when `hasApiKey` is false

## Dev Notes

- **Architecture Layer**: `snapshot-cta.tsx` is Layer 1 (Presentation). Drill generation API call is Layer 4 (Infrastructure).
- **Current code** (`src/components/snapshot-cta.tsx`):
  - Line 23-25: "Generate Drill" onClick calls `setPendingDrillRequest(true)` then `setCurrentMode('dashboard-chat')`. The `setPendingDrillRequest` flag exists in sessionStore but needs verification that it's consumed downstream.
  - Line 12: Uses `animate-[fadeUp_300ms_ease-out]` which is a Tailwind arbitrary value -- technically works but the keyframes may not be defined, making it a no-op or requiring an inline `<style>` tag elsewhere.
  - Lines 15-18, 27-30: Hardcoded hex colors throughout instead of design tokens.
- **Drill generation endpoint**: `/api/ai/drill` -- verify this route exists and accepts `{ target: string, category: string }` or similar payload.
- **Graceful degradation pattern**: Reference `src/features/auth/api-key-prompt.tsx` and Story 3.5 for the correct UX when no API key is configured.
- **Design tokens**: The project uses CSS custom properties mapped to Tailwind classes: `--background` -> `bg-background`, `--border` -> `border-border`, `--primary` -> `text-primary`, `--muted-foreground` -> `text-muted-foreground`.

### Project Structure Notes

- `src/components/snapshot-cta.tsx` -- primary file to modify
- `src/components/snapshot-cta.test.tsx` -- create co-located test
- `src/stores/session-store.ts` -- verify `setPendingDrillRequest` and its consumers
- `src/features/coaching/` -- drill generation modules (verify API endpoint)
- `tailwind.config.ts` -- add `fadeUp` keyframes if needed

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] -- Design system tokens, "amber not red" principle, DS-5 compliance rules
- [Source: _bmad-output/planning-artifacts/architecture.md] -- Layer 1 presentation rules, design token usage
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.4] -- AI drill generation story
- [Source: _bmad-output/planning-artifacts/prd.md] -- FR14-23: Difficulty Engine and drill generation

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
