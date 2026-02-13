# Story 9.3: Refactor Raw Buttons and Inline Styles

Status: ready-for-dev

## Story

As a developer,
I want all interactive elements to use the shadcn/ui design system and all styles to use Tailwind/CSS modules,
So that the design system is consistent and maintainable.

## Acceptance Criteria

1. **Given** any component has raw `<button>` elements, **When** they are refactored, **Then** they use shadcn/ui `<Button>` with an appropriate variant (`default`, `outline`, `ghost`, `secondary`, etc.). Exceptions: raw `<button>` elements that are wrapped by Radix primitives (e.g., `DropdownMenuTrigger asChild`) are acceptable since the Radix primitive provides the semantics.

2. **Given** `src/components/snapshot-cta.tsx` has raw `<button>` elements (lines 13, 22), **When** they are refactored, **Then** they use `<Button variant="outline" size="sm">` and `<Button variant="default" size="sm">` (or similar appropriate variants) with Tailwind utility classes instead of inline hex colors.

3. **Given** `globals.css` already defines `@keyframes fadeUp` (line 105), **When** any component references `fadeUp`, **Then** it uses the Tailwind animation utility `animate-[fadeUp_300ms_ease-out]` (as snapshot-cta.tsx already does at line 12) rather than inline `<style>` tags. No inline `<style>` tags should exist in any `.tsx` component file.

4. **Given** all components follow the design system, **When** audited, **Then** zero raw `<button>` elements exist outside of shadcn/ui primitives or Radix wrapper patterns. The following files currently have raw buttons that need refactoring:
   - `src/app/global-error.tsx:23` — error recovery button
   - `src/components/progress-trends.tsx:301` — chart interaction button
   - `src/components/troubleshooting-panel.tsx:87,139,147,162` — panel action buttons
   - `src/features/modes/mode-switcher.tsx:71` — mode tab buttons (use Button with ghost variant or keep raw with `role="tab"` semantics)
   - `src/features/modes/replay-studio.tsx:169,487` — replay action buttons
   - `src/components/snapshot-cta.tsx:13,22` — snapshot action buttons
   - `src/features/modes/dashboard-chat.tsx:63` — engagement toggle button
   - `src/components/timeline-scrubber.tsx:247,289,303` — playback control buttons
   - `src/components/drill-controller.tsx:181,275,281` — drill phase buttons
   - `src/components/guest-prompt.tsx:65` — guest prompt button
   - `src/components/status-bar.tsx:126` — help link button
   - `src/components/migration-indicator.tsx:72` — migration action button
   - `src/components/logout-button.tsx:20` — logout button
   - `src/components/personal-records.tsx:62` — records interaction button

5. **Given** the mode-switcher uses raw `<button>` with `role="tab"` and `aria-selected`, **When** it is evaluated, **Then** it may remain as a raw button if wrapping in `<Button>` would conflict with the tab semantics. Document the decision in the code with a comment.

## Tasks / Subtasks

- [ ] 1. Audit all raw button usages (AC: 4)
  - [ ] 1.1 Run `grep -rn '<button' src/ --include='*.tsx'` to get the full list of raw button elements
  - [ ] 1.2 Categorize each into: (a) should use `<Button>`, (b) acceptable raw (Radix wrapper / tab semantics), (c) needs review

- [ ] 2. Refactor snapshot-cta.tsx (AC: 2, 3)
  - [ ] 2.1 Import `Button` from `@/components/ui/button` in `src/components/snapshot-cta.tsx`
  - [ ] 2.2 Replace the "View Dashboard" raw button (line 13) with `<Button variant="outline" size="sm">` with appropriate Tailwind classes
  - [ ] 2.3 Replace the "Generate Drill" raw button (line 22) with `<Button variant="default" size="sm">` or a custom primary variant
  - [ ] 2.4 Verify the `animate-[fadeUp_300ms_ease-out]` animation continues to work (it references the `@keyframes fadeUp` defined in `globals.css:105`)

- [ ] 3. Refactor troubleshooting-panel.tsx (AC: 4)
  - [ ] 3.1 Import `Button` and replace raw buttons at lines 87, 139, 147, 162 in `src/components/troubleshooting-panel.tsx`
  - [ ] 3.2 Use appropriate variants: `ghost` for dismiss, `default` for retry, `outline` for secondary actions

- [ ] 4. Refactor replay-studio.tsx (AC: 4)
  - [ ] 4.1 Import `Button` and replace raw buttons at lines 169, 487 in `src/features/modes/replay-studio.tsx`

- [ ] 5. Refactor dashboard-chat.tsx (AC: 4)
  - [ ] 5.1 Replace the engagement toggle button at line 63 in `src/features/modes/dashboard-chat.tsx` with `<Button variant="ghost" size="sm">`

- [ ] 6. Refactor timeline-scrubber.tsx (AC: 4)
  - [ ] 6.1 Import `Button` and replace raw buttons at lines 247, 289, 303 in `src/components/timeline-scrubber.tsx`
  - [ ] 6.2 Use `size="icon"` for playback control buttons (play, pause, skip)

- [ ] 7. Refactor drill-controller.tsx (AC: 4)
  - [ ] 7.1 Import `Button` and replace raw buttons at lines 181, 275, 281 in `src/components/drill-controller.tsx`

- [ ] 8. Refactor remaining files (AC: 4)
  - [ ] 8.1 `src/app/global-error.tsx:23` — replace with `<Button>` for error recovery
  - [ ] 8.2 `src/components/progress-trends.tsx:301` — replace with `<Button variant="ghost">`
  - [ ] 8.3 `src/components/guest-prompt.tsx:65` — replace with `<Button>`
  - [ ] 8.4 `src/components/status-bar.tsx:126` — replace with `<Button variant="link" size="sm">`
  - [ ] 8.5 `src/components/migration-indicator.tsx:72` — replace with `<Button>`
  - [ ] 8.6 `src/components/logout-button.tsx:20` — replace with `<Button variant="ghost">`
  - [ ] 8.7 `src/components/personal-records.tsx:62` — replace with `<Button variant="ghost">`

- [ ] 9. Handle mode-switcher tab buttons (AC: 5)
  - [ ] 9.1 Evaluate `src/features/modes/mode-switcher.tsx:71` — the raw button has `role="tab"` and `aria-selected` semantics
  - [ ] 9.2 If `<Button>` does not conflict with tab semantics, refactor; otherwise add a code comment explaining why it remains raw
  - [ ] 9.3 Ensure the DropdownMenuTrigger pattern in `src/components/profile-menu.tsx:47` is documented as acceptable (Radix wrapper)

- [ ] 10. Verify no inline `<style>` tags remain (AC: 3)
  - [ ] 10.1 Run `grep -rn '<style' src/ --include='*.tsx'` and verify zero results
  - [ ] 10.2 Ensure all animations are defined in `globals.css` or Tailwind config

- [ ] 11. Final verification (AC: 1, 2, 3, 4, 5)
  - [ ] 11.1 Run the full test suite
  - [ ] 11.2 Visually verify all refactored buttons maintain correct sizing (44px min touch target for primary actions, h-9 for smaller)
  - [ ] 11.3 Verify focus-visible states work correctly on all refactored buttons

## Dev Notes

- **Architecture Layer**: Presentation (Layer 1) — component standardization
- The shadcn/ui `Button` component (`src/components/ui/button.tsx`) provides variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`. Sizes: `default` (h-11), `sm` (h-9), `lg` (h-12), `icon` (h-11 w-11).
- When replacing raw buttons, ensure the `Button` component's built-in classes (focus ring, disabled states, transition) are leveraged rather than duplicated.
- Some raw buttons have complex className strings with hover/transition classes — these can often be simplified by choosing the right `Button` variant and adding minimal overrides.
- The `mode-switcher.tsx` buttons are a special case: they function as tabs with `role="tab"` and `aria-selected`. Using `<Button>` here could add conflicting ARIA semantics. Recommend keeping as raw buttons with a clarifying comment.
- The `profile-menu.tsx` button at line 47 is wrapped in `<DropdownMenuTrigger asChild>` — this is a standard Radix pattern and should NOT be changed to `<Button>`.

### Project Structure Notes

- `src/components/ui/button.tsx` — shadcn/ui Button component (source of truth for variants)
- `src/components/snapshot-cta.tsx` — 2 raw buttons to refactor
- `src/components/troubleshooting-panel.tsx` — 4 raw buttons to refactor
- `src/features/modes/replay-studio.tsx` — 2 raw buttons to refactor
- `src/features/modes/dashboard-chat.tsx` — 1 raw button to refactor
- `src/components/timeline-scrubber.tsx` — 3 raw buttons to refactor
- `src/components/drill-controller.tsx` — 3 raw buttons to refactor
- `src/features/modes/mode-switcher.tsx` — 3 raw buttons (tab semantics — evaluate)
- Plus 7 more files with 1 raw button each
- Total: ~25 raw buttons across 14 files (excluding Radix wrapper patterns)

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design System Components]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: _bmad-output/implementation-artifacts/1-2-configure-design-system-and-dark-studio-aesthetic.md#Task 4]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
