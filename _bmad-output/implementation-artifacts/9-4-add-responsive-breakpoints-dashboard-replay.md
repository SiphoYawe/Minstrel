# Story 9.4: Add Responsive Breakpoints to Dashboard and Replay Layouts

Status: ready-for-dev

## Story

As a user on a smaller screen,
I want the dashboard and replay layouts to adapt gracefully,
So that the interface remains usable at various viewport widths.

## Acceptance Criteria

1. **Given** the dashboard split layout (`src/features/modes/dashboard-chat.tsx` line 47: `grid-cols-1 lg:grid-cols-[3fr_2fr]`), **When** the viewport is below 1024px (`lg` breakpoint), **Then** the layout stacks vertically with the canvas on top and the panel below. The canvas takes a fixed height (e.g., 50vh or 400px minimum) and the panel fills the remaining space with scrollable content.

2. **Given** the replay studio layout (`src/features/modes/replay-studio.tsx`), **When** the viewport is below 1024px, **Then** the timeline and analysis panel stack vertically with appropriate spacing. The canvas area remains usable at reduced height and the tab panel is accessible below.

3. **Given** the minimum supported width is 1024px per the architecture spec, **When** the viewport is below 768px, **Then** a non-blocking informational banner appears at the top: "Best experienced on a larger screen. Minstrel is optimized for desktop browsers with MIDI support." The banner can be dismissed and does not prevent usage.

4. **Given** the `StatusBar` (`src/components/status-bar.tsx`), **When** rendered on screens narrower than 1024px, **Then** it remains functional, does not overflow, and the center key/tempo display gracefully hides (it already has `hidden sm:flex` at line 138). The session timer and MIDI status remain visible.

5. **Given** the `ModeSwitcher` (`src/features/modes/mode-switcher.tsx`), **When** rendered on smaller screens, **Then** the tab labels remain readable and the component does not overflow. If needed, labels can abbreviate (e.g., "Coach" instead of "Silent Coach") on small viewports.

## Tasks / Subtasks

- [ ] 1. Verify and enhance dashboard-chat.tsx responsive behavior (AC: 1)
  - [ ] 1.1 Open `src/features/modes/dashboard-chat.tsx` and verify the existing `grid-cols-1 lg:grid-cols-[3fr_2fr]` at line 47
  - [ ] 1.2 Add minimum height constraints for the canvas area in stacked mode: `min-h-[400px] lg:min-h-0` or `h-[50vh] lg:h-full`
  - [ ] 1.3 Ensure the panel section is scrollable in stacked mode: `overflow-y-auto` when vertical
  - [ ] 1.4 Verify the data card, engagement section, and AI chat panel render correctly in stacked layout
  - [ ] 1.5 Test at 768px, 1024px, and 1440px viewport widths

- [ ] 2. Add responsive breakpoints to replay-studio.tsx (AC: 2)
  - [ ] 2.1 Open `src/features/modes/replay-studio.tsx` and identify the main layout grid/flex structure
  - [ ] 2.2 Add responsive classes to stack the canvas and panel vertically below 1024px
  - [ ] 2.3 Ensure the `TimelineScrubber` component remains usable at narrower widths
  - [ ] 2.4 Ensure the tab panel (Insights/Sessions/Chat) is accessible in stacked layout
  - [ ] 2.5 Test at 768px, 1024px, and 1440px viewport widths

- [ ] 3. Create small-screen banner component (AC: 3)
  - [ ] 3.1 Create `src/components/small-screen-banner.tsx` — a client component that checks `window.innerWidth` on mount
  - [ ] 3.2 Display a dismissable banner when viewport is below 768px: "Best experienced on a larger screen. Minstrel is optimized for desktop browsers with MIDI support."
  - [ ] 3.3 Use `localStorage` to remember dismissal so it does not reappear on page reload
  - [ ] 3.4 Style with design tokens: `bg-card border-b border-border text-muted-foreground text-xs`
  - [ ] 3.5 Include an accessible dismiss button with `aria-label="Dismiss screen size notice"`
  - [ ] 3.6 Add the banner to session pages: `src/app/(auth)/session/page.tsx` and `src/app/(guest)/play/page.tsx`

- [ ] 4. Verify StatusBar responsive behavior (AC: 4)
  - [ ] 4.1 Confirm `src/components/status-bar.tsx` line 138 already hides center analysis display on small screens (`hidden sm:flex`)
  - [ ] 4.2 Verify the MIDI status cluster (left) and session timer (right) remain visible and non-overlapping at narrow widths
  - [ ] 4.3 If the device name truncation (`truncate max-w-[200px] sm:max-w-[300px]` at line 110) is insufficient, add more aggressive truncation below 640px

- [ ] 5. Verify ModeSwitcher responsive behavior (AC: 5)
  - [ ] 5.1 Check `src/features/modes/mode-switcher.tsx` at narrow widths — verify tabs do not overflow
  - [ ] 5.2 If labels overflow, add responsive label abbreviations (e.g., `<span className="hidden sm:inline">Silent </span>Coach`)
  - [ ] 5.3 Verify the keyboard shortcut numbers remain visible at all widths

- [ ] 6. Integration testing (AC: 1, 2, 3, 4, 5)
  - [ ] 6.1 Test complete session flow (connect MIDI → play → switch modes → replay) at 1024px width
  - [ ] 6.2 Test at 768px width to verify stacked layouts and small-screen banner
  - [ ] 6.3 Verify no horizontal scrollbar appears at any tested width

## Dev Notes

- **Architecture Layer**: Presentation (Layer 1) — responsive layout and breakpoints
- The architecture spec states 1024px minimum width (NFR), but the current implementation has no graceful degradation below that threshold.
- Tailwind breakpoints: `sm` = 640px, `md` = 768px, `lg` = 1024px, `xl` = 1280px. The dashboard already uses `lg:grid-cols-[3fr_2fr]` which is correct for the 1024px breakpoint.
- The `SilentCoach` mode (`src/features/modes/silent-coach.tsx`) is inherently responsive since it is just a full-screen canvas — no additional work needed there.
- The `ModeSwitcher` is positioned `fixed right-4 top-12 z-30` in both `silent-coach.tsx` (line 26) and `dashboard-chat.tsx` (line 42). At very narrow widths, it may overlap with the StatusBar MIDI status — verify this.
- For the small-screen banner, use a `useEffect` + `useState` pattern to check width client-side. Do NOT use `window.innerWidth` during SSR.

### Project Structure Notes

- `src/features/modes/dashboard-chat.tsx` — main dashboard layout (line 47: grid definition)
- `src/features/modes/replay-studio.tsx` — replay layout
- `src/components/small-screen-banner.tsx` — new component (create)
- `src/app/(auth)/session/page.tsx` — authenticated session page (add banner)
- `src/app/(guest)/play/page.tsx` — guest play page (add banner)
- `src/components/status-bar.tsx` — verify responsive behavior (line 138: center hide)
- `src/features/modes/mode-switcher.tsx` — verify tab label overflow
- `src/features/modes/silent-coach.tsx` — no changes needed (inherently responsive)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Non-Functional Requirements]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Layout Modes]
- [Source: _bmad-output/planning-artifacts/prd.md#NFR-Screen-Size]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
