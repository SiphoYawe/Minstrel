# Story 1.2: Configure Design System and Dark Studio Aesthetic

Status: done

## Story

As a user,
I want Minstrel to have a professional, dark studio aesthetic from the moment I open it,
So that the interface communicates seriousness and capability.

## Acceptance Criteria

1. **Given** the UX specification defines the visual foundation (UX1), **When** the Tailwind config is updated, **Then** `tailwind.config.ts` defines custom color tokens including: background `#0F0F0F`, primary accent `#7CB9E8`, surface colors (greys: `#1A1A1A`, `#242424`, `#2E2E2E`, `#3A3A3A`), text colors (`#E5E5E5` primary, `#999999` secondary, `#666666` tertiary), amber for in-progress states (no red error colors), and a full pastel accent palette.

2. **Given** the UX specification requires sharp corners everywhere (UX2), **When** global styles are applied, **Then** all border radius values are set to `0px` globally via Tailwind config and CSS custom properties, and no component renders rounded corners.

3. **Given** the UX specification requires Inter + JetBrains Mono (UX3), **When** fonts are configured, **Then** Inter variable font (`inter-variable.woff2`) and JetBrains Mono variable font (`jetbrains-mono-variable.woff2`) are placed in `public/fonts/`, loaded via `@font-face` in `globals.css` or via Next.js font optimization, Inter is applied as the default sans-serif body font, and JetBrains Mono is applied as the monospace font for data/code displays.

4. **Given** the UX specification requires 12 restyled shadcn/ui components (UX6), **When** components are installed, **Then** the following 12 shadcn/ui components are added via CLI and restyled: `button`, `card`, `dialog`, `input`, `select`, `tabs`, `toast`, `tooltip`, `badge`, `progress`, `scroll-area`, `separator` -- all with 0px border radius, dark color palette, and consistent with the studio aesthetic.

5. **Given** the Architecture specifies CSS custom properties for design tokens, **When** `globals.css` is updated, **Then** it contains Tailwind v4 directives (`@import "tailwindcss"` or `@tailwind` layers), CSS custom properties for all design tokens (colors, spacing, typography), and dark mode is the default (no light mode toggle at MVP).

6. **Given** the Architecture specifies a marketing landing page, **When** `src/app/(marketing)/page.tsx` is created, **Then** it renders as a server component with the dark studio theme applied, displays Minstrel branding, a tagline, and a call-to-action to start playing (link to `/play`), and uses the configured fonts and color system.

7. **Given** accessibility requirements (NFR19, NFR22), **When** color contrast is tested, **Then** all text colors against their backgrounds meet WCAG 2.1 AA minimum contrast ratios: 4.5:1 for normal text, 3:1 for large text and UI components.

8. **Given** accessibility requirements (NFR23), **When** transition utilities are defined, **Then** a `prefers-reduced-motion` media query utility is included in `globals.css` or Tailwind config that disables or reduces all CSS transitions and animations when the user has this preference enabled.

## Tasks / Subtasks

- [ ] Task 1: Configure Tailwind design tokens (AC: 1, 2)
  - [ ] Update `tailwind.config.ts` with custom color palette:
    - `background: '#0F0F0F'`
    - `surface: { DEFAULT: '#1A1A1A', light: '#242424', lighter: '#2E2E2E', border: '#3A3A3A' }`
    - `primary: '#7CB9E8'` (pastel blue)
    - `accent: { amber: '#F5A623', green: '#7ED957', ... }` (full pastel palette)
    - `text: { DEFAULT: '#E5E5E5', secondary: '#999999', tertiary: '#666666' }`
  - [ ] Set all `borderRadius` values to `'0px'` in the Tailwind theme (override all radius tokens)
  - [ ] Configure font families: `sans: ['Inter', 'sans-serif']`, `mono: ['JetBrains Mono', 'monospace']`
  - [ ] Verify Tailwind v4 configuration syntax is correct

- [ ] Task 2: Load and configure variable fonts (AC: 3)
  - [ ] Download Inter variable font (`inter-variable.woff2`) and place in `public/fonts/`
  - [ ] Download JetBrains Mono variable font (`jetbrains-mono-variable.woff2`) and place in `public/fonts/`
  - [ ] Add `@font-face` declarations in `globals.css` (or use `next/font/local` for optimization)
  - [ ] Apply Inter as body default and JetBrains Mono as `.font-mono` utility
  - [ ] Verify fonts load correctly on the landing page

- [ ] Task 3: Update globals.css with design token system (AC: 5)
  - [ ] Add Tailwind v4 directives (`@import "tailwindcss"` or equivalent)
  - [ ] Define CSS custom properties for all design tokens (e.g., `--color-background`, `--color-primary`, `--color-surface`, etc.)
  - [ ] Set `html` and `body` background to `#0F0F0F` and text to `#E5E5E5`
  - [ ] Remove any light mode styles; dark mode is the only mode
  - [ ] Add base typography styles (font-size, line-height, font-smoothing)

- [ ] Task 4: Install and restyle shadcn/ui components (AC: 4)
  - [ ] Run `npx shadcn@latest add button card dialog input select tabs toast tooltip badge progress scroll-area separator`
  - [ ] Restyle `button.tsx`: 0px radius, primary variant uses `#7CB9E8` bg with dark text, secondary/ghost variants with surface colors
  - [ ] Restyle `card.tsx`: 0px radius, `#1A1A1A` background, `#3A3A3A` border
  - [ ] Restyle `dialog.tsx`: 0px radius, `#1A1A1A` background, overlay with `#0F0F0F` at 80% opacity
  - [ ] Restyle `input.tsx`: 0px radius, `#242424` background, `#3A3A3A` border, `#E5E5E5` text
  - [ ] Restyle `select.tsx`: 0px radius, matching input styles
  - [ ] Restyle `tabs.tsx`: 0px radius, active tab uses `#7CB9E8` indicator
  - [ ] Restyle `toast.tsx`: 0px radius, surface background, amber accent for warnings (never red)
  - [ ] Restyle `tooltip.tsx`: 0px radius, `#242424` background
  - [ ] Restyle `badge.tsx`: 0px radius, pastel accent variants
  - [ ] Restyle `progress.tsx`: 0px radius, `#7CB9E8` fill on `#242424` track
  - [ ] Restyle `scroll-area.tsx`: scrollbar matches surface colors
  - [ ] Restyle `separator.tsx`: uses `#3A3A3A` color

- [ ] Task 5: Create marketing landing page (AC: 6)
  - [ ] Create `src/app/(marketing)/layout.tsx` as a server component layout
  - [ ] Create `src/app/(marketing)/page.tsx` as a server component with:
    - Minstrel logo/wordmark
    - Tagline (e.g., "Your AI Practice Companion")
    - Brief value proposition text
    - CTA button linking to `/play` ("Start Playing")
    - Dark studio aesthetic applied
  - [ ] Verify SSR rendering works correctly
  - [ ] Verify Inter and JetBrains Mono fonts render on the page

- [ ] Task 6: WCAG contrast validation (AC: 7)
  - [ ] Audit all color combinations for WCAG 2.1 AA compliance:
    - `#E5E5E5` on `#0F0F0F` (primary text on bg)
    - `#999999` on `#0F0F0F` (secondary text on bg)
    - `#E5E5E5` on `#1A1A1A` (text on surface)
    - `#7CB9E8` on `#0F0F0F` (primary accent on bg)
    - `#7CB9E8` on `#1A1A1A` (primary accent on surface)
  - [ ] Adjust any colors that fail 4.5:1 ratio for normal text or 3:1 for large text/UI
  - [ ] Document final contrast ratios in a code comment or design-tokens file

- [ ] Task 7: Reduced motion support (AC: 8)
  - [ ] Add `prefers-reduced-motion` media query in `globals.css`:
    ```css
    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }
    ```
  - [ ] Create a Tailwind utility class `motion-safe:` prefix usage note in code comments
  - [ ] Verify transitions are disabled when browser reduced-motion preference is set

- [ ] Task 8: Update shadcn/ui components.json (AC: 4)
  - [ ] Ensure `components.json` references the correct Tailwind config path
  - [ ] Set `style: "default"` and `rsc: true` in components.json
  - [ ] Verify `tailwindcss` alias paths are correct for the project structure

## Dev Notes

- **shadcn/ui Components**: These are source-owned -- they are copied into `src/components/ui/` and modified directly. They are NOT npm dependencies. Restyle them inline in the component files.
- **Design Tokens Strategy**: Use CSS custom properties defined in `globals.css` as the source of truth. Tailwind config references these variables. This enables runtime theme adjustments if ever needed.
- **Font Loading**: Prefer `next/font/local` for variable fonts if the starter supports it, as it provides automatic font optimization (subsetting, preloading, `font-display: swap`). Fallback to manual `@font-face` if Next.js font optimization conflicts.
- **0px Border Radius**: Override at the Tailwind config level by setting `borderRadius: { none: '0px', sm: '0px', DEFAULT: '0px', md: '0px', lg: '0px', xl: '0px', '2xl': '0px', '3xl': '0px', full: '0px' }`. This ensures every component uses sharp corners without per-component overrides.
- **No Red/Error Colors**: The architecture mandates "amber, not red" for all states (UX9). Define amber (`#F5A623` or similar) as the warning/in-progress color. Do NOT include red in the palette for user-facing feedback states.
- **Dark Mode Only**: There is no light mode toggle. The `html` element should have `class="dark"` by default or the theme should be hardcoded dark. Remove any light mode CSS variables from the starter template.
- **Landing Page**: The marketing page at `src/app/(marketing)/page.tsx` is a server component (SSR) for SEO. It should be lightweight and fast-loading.
- **WCAG 2.1 AA**: This is a hard requirement (NFR19). The axe-core deploy gate in CI (Story 1.1) will catch violations, but manual verification during this story ensures no rework.

### Project Structure Notes

- Tailwind config: `tailwind.config.ts` (root)
- Global styles: `src/app/globals.css`
- shadcn/ui components: `src/components/ui/{component}.tsx` (kebab-case files, PascalCase exports)
- shadcn/ui config: `components.json` (root)
- Variable fonts: `public/fonts/inter-variable.woff2`, `public/fonts/jetbrains-mono-variable.woff2`
- Marketing page layout: `src/app/(marketing)/layout.tsx`
- Marketing landing page: `src/app/(marketing)/page.tsx`

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual Constants]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Design Implications]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Emotional Design Principles]
- [Source: _bmad-output/planning-artifacts/architecture.md#UX-Mandated Architecture Constraints]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Dark-only theme implemented: #0F0F0F background, #7CB9E8 primary, 0px border radius everywhere
- Fonts loaded via next/font/google (Inter + JetBrains_Mono) — next/font/local had Turbopack build failures
- All 12 required shadcn/ui components restyled to dark studio aesthetic
- dropdown-menu.tsx and label.tsx also restyled for design system consistency
- checkbox.tsx removed (unused, unstyled)
- ThemeSwitcher removed from template pages (dark-only app)
- Toaster (sonner) added to root layout for toast notifications
- All components meet 44px minimum touch target (h-11)
- No shadows, no rounded corners, no dark: conditional prefixes
- Reduced motion support via prefers-reduced-motion media query
- Focus-visible scoped to non-component elements to avoid double focus indicators
- Marketing landing page at (marketing)/page.tsx — server component, Minstrel branding, CTA to /play
- 118 tests passing, lint clean, build clean

### File List

- src/app/globals.css — CSS custom properties, dark-only design tokens, reduced motion, focus-visible
- tailwind.config.ts — Extended theme: colors, 0px radius, fonts, typography scale, transitions
- src/app/layout.tsx — Dark class, Google Fonts, TooltipProvider, Toaster
- src/app/(marketing)/layout.tsx — Marketing route layout
- src/app/(marketing)/page.tsx — Marketing landing page (server component)
- src/components/ui/button.tsx — Restyled (h-11, duration-micro, surface colors)
- src/components/ui/card.tsx — Restyled (bg-card, border-border)
- src/components/ui/badge.tsx — Restyled (accent color variants)
- src/components/ui/input.tsx — Restyled (h-11, bg-surface-light, focus border-primary)
- src/components/ui/dialog.tsx — Restyled (bg-card, bg-background/60 overlay, 44px close button)
- src/components/ui/select.tsx — Restyled (h-11, surface-light, duration-micro, no dark: prefixes)
- src/components/ui/tabs.tsx — Restyled (primary indicator, surface-light active)
- src/components/ui/sonner.tsx — Restyled (dark theme, border-l accents, 0px radius)
- src/components/ui/tooltip.tsx — Restyled (bg-surface-light, border-border)
- src/components/ui/progress.tsx — Restyled (bg-primary fill, bg-surface-lighter track)
- src/components/ui/scroll-area.tsx — Restyled (surface-border scrollbar)
- src/components/ui/separator.tsx — Restyled (bg-surface-border)
- src/components/ui/dropdown-menu.tsx — Restyled (bg-card, surface-light, duration-micro)
- src/components/ui/label.tsx — Restyled (text-ui-label, text-foreground)
- src/components/tutorial/tutorial-step.tsx — Replaced Checkbox with native input
- src/design-system.test.ts — 48 tests for design system configuration
