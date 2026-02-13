# Story 9.1: Change Destructive/Error Colors to Amber

Status: ready-for-dev

## Story

As a user,
I want error and warning states to use amber tones instead of red,
So that the interface maintains the growth mindset principle of "trajectory, not failure."

## Acceptance Criteria

1. **Given** the `globals.css` design tokens, **When** `--destructive` and `--accent-error` are defined, **Then** they use warm amber HSL values (not red hue 0). The `--destructive` token should match or be derived from `--accent-warm` (hue ~42), and `--accent-error` should also use a warm amber hue.

2. **Given** any component uses `variant="destructive"` or error styling, **When** it renders, **Then** it appears in amber/warm tones, not red. This includes the shadcn/ui `Button` destructive variant in `src/components/ui/button.tsx:13-14`.

3. **Given** the login form shows validation errors, **When** an error message appears, **Then** it uses `text-destructive` (which is now amber), not `text-red-500` or any hardcoded red class. The error message at `src/components/login-form.tsx:89` currently uses `text-destructive` (verify it stays amber-backed).

4. **Given** the shadcn/ui button destructive variant, **When** its CSS is updated via the `--destructive` token, **Then** the button renders with amber background/text, not red. The settings page at `src/app/(auth)/settings/page.tsx:271` uses `variant="destructive"` and must render amber.

5. **Given** the full codebase is audited, **When** all instances of red-hue colors are checked, **Then** zero hardcoded red (`text-red-*`, `bg-red-*`, `border-red-*`) classes remain in any component file.

## Tasks / Subtasks

- [ ] 1. Audit current destructive/error token values (AC: 1)
  - [ ] 1.1 Open `src/app/globals.css` and verify current values for `--destructive` (line 22) and `--accent-error` (line 51)
  - [ ] 1.2 Confirm both tokens are already using amber hues (hue ~42). If not, update to `42 70% 70%` for `--destructive` and `42 60% 65%` for `--accent-error`
  - [ ] 1.3 Verify `--destructive-foreground` (line 23) has sufficient contrast against the amber background

- [ ] 2. Audit all red color usages across the codebase (AC: 5)
  - [ ] 2.1 Run `grep -rn 'text-red-\|bg-red-\|border-red-' src/` to find any hardcoded red Tailwind classes
  - [ ] 2.2 Replace each instance with the appropriate design token class (`text-destructive`, `text-accent-error`, `text-accent-warm`, etc.)
  - [ ] 2.3 Verify zero red-hue classes remain after replacements

- [ ] 3. Verify destructive button variant renders amber (AC: 2, 4)
  - [ ] 3.1 Open `src/components/ui/button.tsx` and confirm the destructive variant at line 13-14 references `bg-destructive text-destructive-foreground`
  - [ ] 3.2 Visually verify the destructive button on the settings page (`src/app/(auth)/settings/page.tsx:271`) renders with amber background
  - [ ] 3.3 Verify hover/active states (`hover:brightness-110 active:brightness-90`) look correct with amber

- [ ] 4. Verify login form error state (AC: 3)
  - [ ] 4.1 Open `src/components/login-form.tsx` line 89 and confirm it uses `text-destructive` (not `text-red-500`)
  - [ ] 4.2 Trigger a login error and verify the message renders in amber tone

- [ ] 5. Visual regression check (AC: 1, 2, 3, 4)
  - [ ] 5.1 Test all error/destructive states: login errors, settings destructive button, any toast notifications
  - [ ] 5.2 Confirm all render with warm amber tones, never red

## Dev Notes

- **Architecture Layer**: Presentation (Layer 1) — CSS tokens and component styling
- The current `globals.css` already defines `--destructive: 42 70% 70%` and `--accent-error: 42 60% 65%` which are amber. This story is primarily an audit and verification task to ensure no red leaks through.
- The `text-destructive` class in `login-form.tsx:89` is correct since it references the CSS custom property, which is amber-backed.
- The `button.tsx` destructive variant at lines 13-14 uses `bg-destructive text-destructive-foreground` which will automatically pick up the amber token.
- Key principle from UX spec: "Amber, Not Red" — no failure states, only trajectory (UX9).

### Project Structure Notes

- `src/app/globals.css` — CSS custom properties for `--destructive` and `--accent-error` (lines 22-23, 51)
- `src/components/ui/button.tsx` — destructive variant definition (lines 13-14)
- `src/components/login-form.tsx` — error message display (line 89)
- `src/app/(auth)/settings/page.tsx` — destructive button usage (line 271)

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Emotional Design Principles]
- [Source: _bmad-output/planning-artifacts/architecture.md#UX-Mandated Architecture Constraints]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2] (original design system story)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
