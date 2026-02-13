# Story 10.6: Keyboard Shortcuts Help Panel

Status: ready-for-dev

## Story

As a user,
I want to see a keyboard shortcuts reference panel,
so that I can learn and use shortcuts efficiently.

## Acceptance Criteria

1. Given the user presses Shift+? (Shift + forward slash key) or clicks a "?" help button in the StatusBar, When the shortcut is triggered, Then a keyboard shortcuts panel opens as a modal dialog centered on the viewport. And the modal uses the shadcn/ui Dialog component restyled with the dark studio aesthetic.

2. Given the shortcuts panel renders, When it displays shortcuts, Then it shows all available shortcuts grouped by context: (a) Navigation — mode switching (Cmd/Ctrl+1 Silent Coach, Cmd/Ctrl+2 Dashboard, Cmd/Ctrl+3 Replay), (b) Session — start/stop/pause controls, end session, (c) Replay — play/pause, scrub forward/back, (d) General — open help (Shift+?), open settings, toggle fullscreen. And each shortcut displays the key combination using styled key cap elements (kbd tags).

3. Given the shortcuts panel is displayed, When it renders, Then it matches the dark studio aesthetic: `#0F0F0F` or `#1A1A1A` background, `#7CB9E8` accent for key caps, `0px` border radius on the dialog and all elements, Inter font for descriptions, JetBrains Mono for key labels. And the dialog has a semi-transparent backdrop overlay.

4. Given the shortcuts panel is open, When the user presses Escape or clicks outside the dialog, Then the panel closes. And focus returns to the element that was focused before the panel opened (focus trap and restore pattern).

## Tasks / Subtasks

- [ ] 1. Define keyboard shortcuts data structure (AC: 2)
  - [ ] 1.1 Create `src/lib/keyboard-shortcuts.ts` — centralized shortcuts registry (Layer 3 Domain Logic)
  - [ ] 1.2 Define `KeyboardShortcut` type: `{ id: string, keys: string[], label: string, description: string, context: ShortcutContext, action: string }`
  - [ ] 1.3 Define `ShortcutContext` enum: `Navigation`, `Session`, `Replay`, `General`
  - [ ] 1.4 Export `KEYBOARD_SHORTCUTS: KeyboardShortcut[]` constant array with all app shortcuts:
    - Navigation: `Cmd/Ctrl+1` (Silent Coach), `Cmd/Ctrl+2` (Dashboard), `Cmd/Ctrl+3` (Replay)
    - Session: shortcuts from mode-switcher and session-manager
    - Replay: `Space` (play/pause), `Left/Right` (scrub), from timeline-scrubber
    - General: `Shift+?` (help), `Cmd/Ctrl+,` (settings)
  - [ ] 1.5 Export `getShortcutsByContext(context: ShortcutContext): KeyboardShortcut[]` utility function

- [ ] 2. Create keyboard shortcuts panel component (AC: 1, 2, 3, 4)
  - [ ] 2.1 Create `src/components/keyboard-shortcuts-panel.tsx` — `'use client'` component (Layer 1 Presentation)
  - [ ] 2.2 Use shadcn/ui `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` components as the base
  - [ ] 2.3 Render shortcuts grouped by `ShortcutContext`, each group with a section header
  - [ ] 2.4 Render key combinations using styled `<kbd>` elements: `bg-[#2A2A2A]`, `border border-[#3A3A3A]`, `rounded-none`, `px-2 py-1`, JetBrains Mono font, `text-[#7CB9E8]`
  - [ ] 2.5 Platform-aware key labels: show "Cmd" on macOS, "Ctrl" on Windows/Linux (detect via `navigator.platform` or `navigator.userAgentData`)
  - [ ] 2.6 Apply dark studio aesthetic to dialog: `bg-[#1A1A1A]`, `border border-[#2A2A2A]`, `rounded-none`, semi-transparent backdrop `bg-black/60`
  - [ ] 2.7 Focus trap is handled by shadcn/ui Dialog (uses Radix UI Dialog internally). Verify focus returns to trigger element on close.

- [ ] 3. Register global Shift+? listener (AC: 1)
  - [ ] 3.1 Create `src/hooks/use-keyboard-shortcuts-panel.ts` — hook that manages panel open/close state and registers the global `keydown` listener
  - [ ] 3.2 Listen for `Shift+?` (keyCode for `/` with shift modifier) via `document.addEventListener('keydown', handler)`
  - [ ] 3.3 Prevent default browser behavior for `Shift+?` when the panel toggles
  - [ ] 3.4 Cleanup listener on unmount via `useEffect` return
  - [ ] 3.5 Do not trigger if the user is typing in an input, textarea, or contenteditable element (check `event.target` tag name)

- [ ] 4. Add help button to StatusBar (AC: 1)
  - [ ] 4.1 Update `src/components/status-bar.tsx` — add a "?" icon button in the right section of the StatusBar
  - [ ] 4.2 Style the button: small, subtle, `text-[#7CB9E8]` icon, `rounded-none`, minimal padding
  - [ ] 4.3 On click, open the keyboard shortcuts panel (via shared state from `use-keyboard-shortcuts-panel` hook or a simple `useState` lifted to the parent)
  - [ ] 4.4 Add `aria-label="Keyboard shortcuts"` and `title="Keyboard shortcuts (Shift+?)"` to the button

- [ ] 5. Implement accessibility (AC: 4)
  - [ ] 5.1 Ensure the Dialog has `aria-labelledby` pointing to the dialog title
  - [ ] 5.2 Ensure `role="dialog"` and `aria-modal="true"` are set (handled by Radix Dialog)
  - [ ] 5.3 Test that Escape key closes the dialog and returns focus to the "?" button or previous focus target
  - [ ] 5.4 Ensure all shortcut descriptions are screen-reader friendly: `<kbd>` elements have `aria-label` with full key names (e.g., "Command plus 1" instead of "Cmd+1")

- [ ] 6. Write co-located tests (AC: 1, 2, 3, 4)
  - [ ] 6.1 Create `src/components/keyboard-shortcuts-panel.test.tsx` — test rendering of all shortcut groups, key cap styling, platform detection, dialog open/close via Escape, and focus restoration
  - [ ] 6.2 Create `src/lib/keyboard-shortcuts.test.ts` — test `getShortcutsByContext` filtering, completeness of shortcut registry (all contexts represented)
  - [ ] 6.3 Create `src/hooks/use-keyboard-shortcuts-panel.test.ts` — test Shift+? keydown registration, input element exclusion, cleanup on unmount

## Dev Notes

- **Architecture Layer**: `keyboard-shortcuts.ts` is Layer 3 (Domain Logic) — pure data and utility functions, no side effects. `keyboard-shortcuts-panel.tsx` is Layer 1 (Presentation). `use-keyboard-shortcuts-panel.ts` is Layer 2 (Application Logic).
- **Centralized Shortcuts Registry**: The `KEYBOARD_SHORTCUTS` constant is the single source of truth for all keyboard shortcuts in the app. Other components (mode-switcher, timeline-scrubber, session-manager) should import from this registry rather than defining their own key bindings. This ensures the help panel is always accurate.
- **Platform Detection**: Use `navigator.platform` (available in all target browsers). Check for `'Mac'` prefix to determine macOS vs Windows/Linux. This determines whether to display "Cmd" or "Ctrl" in key labels. The underlying event handling uses `event.metaKey` (Mac) or `event.ctrlKey` (Windows).
- **shadcn/ui Dialog**: The Dialog component provides built-in focus trap, Escape handling, and backdrop click handling via Radix UI primitives. No custom focus trap implementation needed. Restyle with `rounded-none` and dark studio colors.
- **Input Exclusion**: When the user is typing in a chat input, search field, or any text input, `Shift+?` should type a literal `?` character, not open the shortcuts panel. Check `event.target.tagName` for `INPUT`, `TEXTAREA`, or `[contenteditable]` attribute.
- **A11Y-7 Coverage**: This story directly addresses the A11Y-7 accessibility gap identified in the UX specification regarding keyboard shortcut discoverability.
- **Library Versions**: React 19.x, shadcn/ui (Dialog), Radix UI Dialog, Tailwind CSS v4.

### Project Structure Notes

- `src/lib/keyboard-shortcuts.ts` — centralized shortcuts registry and types (create)
- `src/lib/keyboard-shortcuts.test.ts` — co-located tests (create)
- `src/components/keyboard-shortcuts-panel.tsx` — shortcuts modal component (create)
- `src/components/keyboard-shortcuts-panel.test.tsx` — co-located component tests (create)
- `src/hooks/use-keyboard-shortcuts-panel.ts` — panel state and global listener hook (create)
- `src/hooks/use-keyboard-shortcuts-panel.test.ts` — co-located hook tests (create)
- `src/components/status-bar.tsx` — modify to add "?" help button

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Accessibility] — A11Y-7: keyboard shortcut discoverability gap
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#StatusBar] — P0 component, persistent floating overlay
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — `'use client'` directive, shadcn/ui component usage
- [Source: _bmad-output/planning-artifacts/prd.md#Non-Functional Requirements] — NFR20: WCAG 2.1 AA accessibility compliance
- [Source: _bmad-output/implementation-artifacts/2-6-silent-coach-mode-layout.md] — mode switching keyboard shortcuts (Cmd+1/2/3), StatusBar component
- [Source: _bmad-output/implementation-artifacts/6-2-timeline-scrubbing-and-playback-controls.md] — replay keyboard shortcuts (Space, Arrow keys)

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
