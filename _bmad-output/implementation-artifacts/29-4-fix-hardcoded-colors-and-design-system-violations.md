# Story 29.4: Fix Hardcoded Colors and Design System Violations

Status: done

## Story

As a developer,
I want all colors to use the design system,
So that theme changes are consistent and maintainable.

## Acceptance Criteria

1. Given hardcoded hex colors, When replaced, Then all use CSS custom properties or Tailwind tokens
2. Given rounded-full in data-card, When fixed, Then uses rounded-none per design mandate
3. Given inline RGBA colors, When replaced, Then use Tailwind opacity utilities or CSS custom properties
4. Given design system audited, Then color compliance 95%+ (up from 70%)

## Tasks / Subtasks

1. Create CSS custom properties for all musical visualization colors
   - Define semantic color tokens for chord, scale, and visualization elements
2. Replace hardcoded hex in affected components
   - Update chord-hud, chord-progression-strip, chord-diagram, scale-display, ai-coaching-preview, mock-visualization
   - Use CSS custom properties or Tailwind tokens exclusively
3. Fix rounded-full violation in data-card.tsx
   - Replace rounded-full with rounded-none per design mandate (sharp corners)
4. Replace inline RGBA with Tailwind utilities
   - Convert inline RGBA values to Tailwind opacity utilities or CSS custom properties
5. Add unit tests

## Dev Notes

**Findings Covered**: DS-C1, DS-C2, inline RGBA (HIGH)
**Files**: `chord-hud.tsx`, `chord-progression-strip.tsx`, `chord-diagram.tsx`, `scale-display.tsx`, `ai-coaching-preview.tsx`, `mock-visualization.tsx`, `data-card.tsx`

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes List

- Added --viz-\*-rgb CSS custom properties for Canvas 2D API color tokens
- Added --viz-primary-dark, --viz-surface-dark, --viz-border-dark CSS properties
- Created src/lib/viz-colors.ts shared module with RGB constants + vizRgba() helper
- Replaced all hardcoded hex (#7CB9E8, #5A9BD4, #2A2A2A, #1A1A1A, #0F0F0F, #B4A7D6, #E8C77B, #666666) in SVG components with hsl(var(--...)) CSS custom properties
- Replaced inline rgba() in chord-hud.tsx with Tailwind opacity utilities (text-white/30, bg-background/70)
- Replaced bg-[rgba(15,15,15,0.85)] in canvas-legend.tsx with bg-background/85
- Updated Canvas 2D renderers to use vizRgba() from shared module
- Fixed rounded-full violation in data-card.tsx (removed rounded-full per sharp corners mandate)
- 9 tests for viz-colors module, all passing

### File List

- src/app/globals.css
- src/lib/viz-colors.ts (new)
- src/lib/viz-colors.test.ts (new)
- src/components/chat/chord-diagram.tsx
- src/components/chat/scale-display.tsx
- src/components/illustrations/ai-coaching-preview.tsx
- src/components/illustrations/mock-visualization.tsx
- src/components/viz/canvas-legend.tsx
- src/components/viz/chord-hud.tsx
- src/components/chord-progression-strip.tsx
- src/components/viz/piano-roll-renderer.ts
- src/components/viz/timing-grid-renderer.ts
- src/components/viz/harmonic-overlay-renderer.ts
- src/components/viz/visualization-canvas.tsx
- src/components/data-card.tsx
