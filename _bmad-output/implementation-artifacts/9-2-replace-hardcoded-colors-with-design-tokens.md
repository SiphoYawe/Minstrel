# Story 9.2: Replace Hardcoded Colors with Design Tokens

Status: ready-for-dev

## Story

As a developer,
I want all colors to reference design tokens instead of hardcoded hex values,
So that theming is consistent and maintainable.

## Acceptance Criteria

1. **Given** any component file in `src/`, **When** it uses a color, **Then** it references a Tailwind utility class backed by a CSS custom property (e.g., `text-primary`, `bg-background`, `text-muted-foreground`), not a hardcoded hex value like `#7CB9E8` or `#0F0F0F`.

2. **Given** the `globals.css` design token system, **When** all hex-to-token mappings are established, **Then** the following mapping is applied consistently:
   - `#0F0F0F` → `bg-background` / `text-background`
   - `#7CB9E8` → `text-primary` / `bg-primary` / `border-primary`
   - `#1A1A1A` → `bg-card` / `border-border` / `bg-surface`
   - `#141414` → `bg-surface-light`
   - `#242424` → `bg-surface-light`
   - `#2A2A2A` → `border-surface-border`
   - `#333` / `#333333` → `text-text-tertiary` / `bg-surface-border`
   - `#444` → `text-text-tertiary`
   - `#666` → `text-text-tertiary` / `text-muted-foreground`
   - `#999` / `#A3A3A3` → `text-muted-foreground`
   - `#E0E0E0` / `#E5E5E5` → `text-foreground`

3. **Given** the marketing page (`src/app/(marketing)/page.tsx`) has 18 hardcoded hex occurrences, **When** it is updated, **Then** all hex values are replaced with semantic token classes. Specifically:
   - Lines 50, 57, 73, 86, 104, 114: `text-[#7CB9E8]` → `text-primary`
   - Lines 76, 107: `bg-[#7CB9E8]` → `bg-primary`
   - Lines 60, 93: `text-[#A3A3A3]` → `text-muted-foreground`
   - Lines 68, 79, 83, 99, 126: `border-[#1A1A1A]` / `bg-[#1A1A1A]` → `border-border` / `bg-border`
   - Line 83: `bg-[#0F0F0F]` → `bg-background`
   - Line 83: `hover:bg-[#141414]` → `hover:bg-surface-light`
   - Lines 89, 134: `text-[#333]` → `text-text-tertiary`
   - Line 119: `text-[#666]` → `text-muted-foreground`
   - Line 114: `text-[#7CB9E8]/20` and `text-[#7CB9E8]/40` → `text-primary/20` and `text-primary/40`

4. **Given** the profile-menu and snapshot-cta components, **When** they are updated, **Then** inline hex colors are replaced with design token utilities. Specifically:
   - `src/components/snapshot-cta.tsx`: `border-[#2A2A2A]` → `border-surface-border`, `bg-[#0F0F0F]/90` → `bg-background/90`, `text-[#999]` → `text-muted-foreground`, `hover:border-[#7CB9E8]/30` → `hover:border-primary/30`, `hover:text-[#7CB9E8]` → `hover:text-primary`, `bg-[#7CB9E8]/10` → `bg-primary/10`, `border-[#7CB9E8]/20` → `border-primary/20`, `text-[#7CB9E8]` → `text-primary`, `hover:bg-[#7CB9E8]/20` → `hover:bg-primary/20`, `hover:border-[#7CB9E8]/40` → `hover:border-primary/40`
   - `src/components/profile-menu.tsx`: `text-[#7CB9E8]` → `text-primary`, `text-[#999]` → `text-muted-foreground`, `border-[#1A1A1A]` → `border-border`, `bg-[#0F0F0F]` → `bg-background`, `focus:bg-[#141414]` → `focus:bg-surface-light`, `bg-[#1A1A1A]` → `bg-border`, `text-[#666]` → `text-muted-foreground`, `bg-[#7CB9E8]/15` → `bg-primary/15`

5. **Given** all 21 files with hardcoded hex colors are identified, **When** the audit is complete, **Then** zero hardcoded hex color values remain in any `.tsx` component file under `src/` (excluding test files, SVG files, and `globals.css` where tokens are defined).

## Tasks / Subtasks

- [ ] 1. Create hex-to-token mapping reference (AC: 2)
  - [ ] 1.1 Document the complete hex → token mapping as a code comment in `src/app/globals.css`
  - [ ] 1.2 Verify all needed tokens exist in the `:root` CSS custom properties; add any missing mappings

- [ ] 2. Update marketing page (AC: 3) — highest density of hardcoded colors (18 occurrences)
  - [ ] 2.1 Replace all `text-[#7CB9E8]` with `text-primary` in `src/app/(marketing)/page.tsx`
  - [ ] 2.2 Replace all `bg-[#7CB9E8]` with `bg-primary`
  - [ ] 2.3 Replace all `text-[#A3A3A3]` with `text-muted-foreground`
  - [ ] 2.4 Replace all `border-[#1A1A1A]`, `bg-[#1A1A1A]` with `border-border`, `bg-border`
  - [ ] 2.5 Replace `bg-[#0F0F0F]` with `bg-background`, `hover:bg-[#141414]` with `hover:bg-surface-light`
  - [ ] 2.6 Replace `text-[#333]` with `text-text-tertiary`, `text-[#666]` with `text-muted-foreground`
  - [ ] 2.7 Replace opacity variants: `text-[#7CB9E8]/20` → `text-primary/20`, etc.
  - [ ] 2.8 Visually verify the marketing page looks identical before and after

- [ ] 3. Update snapshot-cta.tsx (AC: 4)
  - [ ] 3.1 Replace all 6 hardcoded hex colors in `src/components/snapshot-cta.tsx` (lines 15-30) with token classes
  - [ ] 3.2 Verify snapshot CTA renders identically

- [ ] 4. Update profile-menu.tsx (AC: 4)
  - [ ] 4.1 Replace all hardcoded hex colors in `src/components/profile-menu.tsx` (lines 40-77) with token classes
  - [ ] 4.2 Verify profile dropdown renders identically

- [ ] 5. Update status-bar.tsx (AC: 1)
  - [ ] 5.1 Replace hardcoded hex values in `src/components/status-bar.tsx`: `border-[#2A2A2A]` (line 89), `bg-[#0F0F0F]/80` (line 89), `text-[#7CB9E8]` (line 142), `bg-[#333333]` (line 147), `text-[#E0E0E0]` (line 150)
  - [ ] 5.2 Verify status bar renders identically

- [ ] 6. Update dashboard-chat.tsx (AC: 1)
  - [ ] 6.1 Replace hardcoded hex values in `src/features/modes/dashboard-chat.tsx`: `border-[#1A1A1A]` (lines 54, 58, 65, 75, 77), `hover:bg-[#141414]` (line 65), `text-[#666]` (line 67), `text-[#444]` (line 70), `bg-[#1A1A1A]` (line 58)
  - [ ] 6.2 Verify dashboard layout renders identically

- [ ] 7. Update replay-studio.tsx (AC: 1)
  - [ ] 7.1 Replace all 34 hardcoded hex color occurrences in `src/features/modes/replay-studio.tsx`
  - [ ] 7.2 Verify replay studio renders identically

- [ ] 8. Update remaining files (AC: 5)
  - [ ] 8.1 Update `src/components/progress-trends.tsx` (6 occurrences)
  - [ ] 8.2 Update `src/components/migration-indicator.tsx` (9 occurrences)
  - [ ] 8.3 Update `src/components/data-card.tsx` (4 occurrences)
  - [ ] 8.4 Update `src/components/troubleshooting-panel.tsx` (1 occurrence)
  - [ ] 8.5 Update `src/components/drill-controller.tsx` (3 occurrences)
  - [ ] 8.6 Update `src/components/guest-prompt.tsx` (1 occurrence)
  - [ ] 8.7 Update `src/components/logout-button.tsx` (1 occurrence)
  - [ ] 8.8 Update `src/components/api-key-prompt.tsx` (1 occurrence)
  - [ ] 8.9 Update `src/features/auth/api-key-prompt.tsx` (14 occurrences)
  - [ ] 8.10 Update `src/app/(auth)/settings/page.tsx` (3 occurrences)
  - [ ] 8.11 Update `src/app/(marketing)/layout.tsx` (2 occurrences)
  - [ ] 8.12 Update `src/app/(marketing)/login/page.tsx` (5 occurrences)
  - [ ] 8.13 Update `src/app/(marketing)/signup/page.tsx` (7 occurrences)

- [ ] 9. Final audit (AC: 5)
  - [ ] 9.1 Run `grep -rn '#[0-9a-fA-F]\{3,6\}' src/ --include='*.tsx'` and verify zero results (excluding test files)
  - [ ] 9.2 Run the full test suite to verify no regressions
  - [ ] 9.3 Visual spot-check all major pages: marketing, session, settings, replay

## Dev Notes

- **Architecture Layer**: Presentation (Layer 1) — CSS token references in components
- There are 132 total hardcoded hex color occurrences across 21 `.tsx` files. This is the largest remediation task in Epic 9.
- The existing CSS custom properties in `globals.css` (lines 5-52) already cover most needed tokens. A few mappings may need new utility classes (e.g., `bg-border` if not already available).
- Tailwind v4 allows `bg-[hsl(var(--border))]` as a fallback if a utility class does not exist for a given token.
- Opacity modifiers like `text-primary/20` work with HSL-based tokens in Tailwind when the color is defined as a bare HSL triplet (which it is in this project).
- `replay-studio.tsx` has the highest count (34 occurrences) and should be approached methodically section by section.
- Test files (`*.test.tsx`) may contain hardcoded hex values in assertions — these can be updated separately or left as-is since they test visual output.

### Project Structure Notes

- `src/app/globals.css` — source of truth for all design tokens
- `src/app/(marketing)/page.tsx` — 18 occurrences (highest priority, most visible)
- `src/features/modes/replay-studio.tsx` — 34 occurrences (highest count)
- `src/features/modes/dashboard-chat.tsx` — 7 occurrences
- `src/features/auth/api-key-prompt.tsx` — 14 occurrences
- `src/components/migration-indicator.tsx` — 9 occurrences
- `src/app/(marketing)/signup/page.tsx` — 7 occurrences
- `src/components/snapshot-cta.tsx` — 6 occurrences
- `src/components/progress-trends.tsx` — 6 occurrences
- `src/app/(marketing)/login/page.tsx` — 5 occurrences
- `src/components/status-bar.tsx` — 4 occurrences
- `src/components/data-card.tsx` — 4 occurrences
- `src/components/profile-menu.tsx` — 2 occurrences (plus other inline hex patterns)
- `src/app/(auth)/settings/page.tsx` — 3 occurrences
- `src/components/drill-controller.tsx` — 3 occurrences
- `src/app/(marketing)/layout.tsx` — 2 occurrences
- Plus 5 more files with 1 occurrence each

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual Constants]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: _bmad-output/implementation-artifacts/1-2-configure-design-system-and-dark-studio-aesthetic.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
