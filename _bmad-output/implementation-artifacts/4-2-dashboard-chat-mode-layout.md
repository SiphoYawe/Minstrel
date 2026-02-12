# Story 4.2: Dashboard + Chat Mode Layout

Status: ready-for-dev

## Story

As a musician,
I want split-screen with visualization and chat,
So I can see playing data and ask questions side by side.

## Acceptance Criteria

1. **Given** the user is in a session, **When** they switch to Dashboard + Chat mode via the ModeSwitcher component, **Then** the layout splits into two regions: VisualizationCanvas occupying approximately 60% of the viewport width on the left, and a data/chat panel occupying approximately 40% on the right (UX5). **And** the split uses CSS Grid or Flexbox, not JavaScript-driven resizing.

2. **Given** the Dashboard + Chat mode is active, **When** the right panel renders, **Then** the AIChatPanel component (P1 priority) renders in the lower portion of the right panel with a message input field and conversation area. **And** the component follows the dark studio aesthetic (0px border radius, #0F0F0F background, #7CB9E8 accent, Inter + JetBrains Mono typography).

3. **Given** the Dashboard + Chat mode is active, **When** session analysis data is available, **Then** the DataCard component (P1 priority) renders in the upper portion of the right panel displaying current session metrics: detected key, current tempo (BPM), timing accuracy (%), and recent chords played. **And** each metric updates in real time as the user plays via Zustand `sessionStore` selectors.

4. **Given** the user is in Silent Coach mode with an active visualization, **When** they switch to Dashboard + Chat mode, **Then** the VisualizationCanvas continues rendering without interruption (no reload, no flash, no pause). **And** the Canvas simply resizes from ~90% width to ~60% width with a smooth transition. **And** the visualization state (current notes, analysis overlay) is preserved.

5. **Given** the user switches between modes multiple times, **When** they return to Dashboard + Chat mode, **Then** the session context persists: chat history within the session is preserved, DataCard metrics are current, and the Canvas shows the latest visualization state. **And** no data is lost or reset on mode switch.

6. **Given** the user wants quick mode switching, **When** they press the designated keyboard shortcut, **Then** the mode switches immediately between Silent Coach and Dashboard + Chat. **And** the shortcut is displayed in a tooltip on the ModeSwitcher. **And** the shortcut does not conflict with standard browser or music software shortcuts.

7. **Given** the minimum viewport requirement is 1024px, **When** the Dashboard + Chat layout renders at exactly 1024px width, **Then** both the Canvas and the right panel are usable with no overflow, no horizontal scroll, and no overlapping elements. **And** the panel proportions adjust gracefully (the 60/40 split may flex slightly to ensure minimum readable widths for both regions).

## Tasks / Subtasks

- [ ] Task 1: Create the Dashboard + Chat mode layout component (AC: 1, 7)
  - [ ] Create `src/features/modes/dashboard-chat.tsx`
  - [ ] Mark as `'use client'` (interactive component with hooks and browser APIs)
  - [ ] Implement two-column layout using CSS Grid: `grid-template-columns: 3fr 2fr` (60/40 split)
  - [ ] Left column renders `<VisualizationCanvas />` at full available height
  - [ ] Right column contains a vertical split: DataCard area on top, AIChatPanel on bottom
  - [ ] Set `min-width` constraints: left column min 580px, right column min 380px at 1024px viewport
  - [ ] Apply dark studio styling: `bg-[#0F0F0F]`, `border-l border-[#1A1A1A]` separator between columns
  - [ ] Add smooth width transition via `transition-all duration-300` for mode switch animation
  - [ ] Write co-located test `src/features/modes/dashboard-chat.test.tsx` verifying layout renders with both columns

- [ ] Task 2: Build the DataCard component (AC: 3)
  - [ ] Create `src/components/data-card.tsx`
  - [ ] Mark as `'use client'`
  - [ ] Subscribe to `sessionStore` using selective Zustand selectors (never select entire store):
    - [ ] `useSessionStore((s) => s.currentKey)` for detected key
    - [ ] `useSessionStore((s) => s.currentTempo)` for BPM
    - [ ] `useSessionStore((s) => s.timingAccuracy)` for timing percentage
    - [ ] `useSessionStore((s) => s.recentChords)` for chord list
  - [ ] Render a 2x2 grid of metric cards using shadcn/ui Card component:
    - [ ] Key (e.g., "C Major") with JetBrains Mono font
    - [ ] Tempo (e.g., "95 BPM") with JetBrains Mono font
    - [ ] Timing (e.g., "73%") with amber accent for in-progress, pastel blue for strong
    - [ ] Chords (e.g., "C Am F G") as a horizontal sequence
  - [ ] Use 0px border radius, dark card backgrounds (`#141414`), subtle border (`#1A1A1A`)
  - [ ] Add ARIA labels for accessibility (e.g., `aria-label="Current key: C Major"`)
  - [ ] Write co-located test `src/components/data-card.test.tsx` verifying rendering and metric display

- [ ] Task 3: Build the AIChatPanel component shell (AC: 2)
  - [ ] Create `src/components/ai-chat-panel.tsx`
  - [ ] Mark as `'use client'`
  - [ ] Implement basic chat UI structure:
    - [ ] Message display area (scrollable, takes remaining vertical space)
    - [ ] Message input area at the bottom: text input + submit button
    - [ ] Use shadcn/ui ScrollArea for message container
    - [ ] Use shadcn/ui Input and Button for the message input row
  - [ ] Style with dark studio aesthetic: monospace (JetBrains Mono) for AI responses, Inter for user messages
  - [ ] Apply 0px border radius on all elements
  - [ ] If no API key is configured (check `useAppStore((s) => s.hasApiKey)`), render the graceful degradation prompt: "Connect your API key in Settings to unlock AI coaching" with a link to `/settings`
  - [ ] Accept props: `messages: ChatMessage[]`, `onSubmit: (message: string) => void`, `isLoading: boolean`
  - [ ] Display user messages right-aligned, AI messages left-aligned
  - [ ] Include typing indicator (3 animated dots) when `isLoading` is true
  - [ ] Add `aria-live="polite"` on message area for screen reader updates
  - [ ] Write co-located test `src/components/ai-chat-panel.test.tsx` verifying render states (empty, with messages, loading, no API key)

- [ ] Task 4: Integrate Canvas continuity across mode switches (AC: 4, 5)
  - [ ] Modify `src/features/modes/mode-switcher.tsx` to manage mode state via `sessionStore` (add `currentMode: 'silent-coach' | 'dashboard-chat' | 'replay-studio'` if not already present)
  - [ ] Ensure VisualizationCanvas is rendered in a shared parent above mode-specific layouts so it is NOT unmounted/remounted on switch
  - [ ] Use CSS to control Canvas width: `w-full` in Silent Coach, `w-[60%]` or grid column in Dashboard + Chat
  - [ ] Verify Canvas subscribes to `midiStore` via vanilla Zustand subscribe (not React re-renders) -- this is preserved by keeping the Canvas mounted
  - [ ] Preserve Canvas `<canvas>` element DOM reference across mode switches (no re-creation)
  - [ ] Write integration test verifying Canvas element identity is preserved across mode switch

- [ ] Task 5: Implement keyboard shortcut for mode switching (AC: 6)
  - [ ] Add keyboard event listener in `mode-switcher.tsx` for mode toggle shortcut
  - [ ] Use `Ctrl+Shift+D` (or `Cmd+Shift+D` on Mac) to toggle between Silent Coach and Dashboard + Chat
  - [ ] Register via `useEffect` with `keydown` event listener (cleanup on unmount)
  - [ ] Check for conflicts with common browser shortcuts and music software (avoid Ctrl+S, Ctrl+Z, Ctrl+C, etc.)
  - [ ] Display shortcut hint in ModeSwitcher tooltip: "Dashboard Mode (Ctrl+Shift+D)"
  - [ ] Support `prefers-reduced-motion` by skipping transition animation when enabled

- [ ] Task 6: Wire session context persistence across modes (AC: 5)
  - [ ] Verify `sessionStore` state persists across mode switches (it should by default as Zustand is global)
  - [ ] Add `chatHistory: ChatMessage[]` to `sessionStore` if not present (session-scoped, not persisted to DB in this story)
  - [ ] When switching to Dashboard + Chat, AIChatPanel reads `chatHistory` from `sessionStore`
  - [ ] When user sends a message, it is appended to `sessionStore.chatHistory`
  - [ ] DataCard reads latest session metrics from `sessionStore` on each render (already done via selectors in Task 2)
  - [ ] Write test verifying chat history and metrics survive a round-trip mode switch

- [ ] Task 7: Update sessionStore with required state fields (AC: 3, 5)
  - [ ] Add to `src/stores/session-store.ts`:
    - [ ] `currentMode: 'silent-coach' | 'dashboard-chat' | 'replay-studio'` (default: `'silent-coach'`)
    - [ ] `chatHistory: ChatMessage[]` (default: `[]`)
    - [ ] `currentKey: string | null`
    - [ ] `currentTempo: number | null`
    - [ ] `timingAccuracy: number | null`
    - [ ] `recentChords: string[]`
  - [ ] Add corresponding actions: `setMode(mode)`, `addChatMessage(message)`, `clearChatHistory()`
  - [ ] Define `ChatMessage` type in `src/features/coaching/coaching-types.ts`: `{ id: string; role: 'user' | 'assistant'; content: string; timestamp: number }`

## Dev Notes

- **Two-Layer Rendering Preserved**: The Canvas/WebGL layer must remain mounted and rendering independently of mode switches. The key architectural pattern (AR13) is that Canvas subscribes to `midiStore` via vanilla Zustand `subscribe`, completely bypassing React. Mode switching should only change the Canvas container width, never unmount/remount the Canvas element.

- **Layout Strategy**: Use CSS Grid for the Dashboard + Chat layout. The Canvas component should be a sibling or child that is always rendered, with its container width controlled by the active mode. Consider a structure like:
  ```tsx
  <div className="grid" style={{ gridTemplateColumns: mode === 'dashboard-chat' ? '3fr 2fr' : '1fr' }}>
    <VisualizationCanvas />
    {mode === 'dashboard-chat' && <DashboardPanel />}
  </div>
  ```

- **Zustand Selector Discipline**: DataCard must use individual selectors, never `useSessionStore()` without a selector. Each metric should be its own selector call to prevent unnecessary re-renders when unrelated state changes.

- **AIChatPanel is a Shell in This Story**: The actual AI chat functionality (sending to API, receiving streamed responses) is implemented in Story 4.3. This story builds the UI shell with props-based interface. The `onSubmit` callback and `messages` prop will be wired to the Vercel AI SDK `useChat` hook in Story 4.3.

- **Graceful Degradation**: AIChatPanel checks `appStore.hasApiKey` (set in Story 3.5). When false, the chat input is replaced with a prompt linking to Settings. The DataCard still renders normally since session metrics come from client-side analysis, not AI.

- **Accessibility Requirements (NFR19-24)**:
  - All interactive elements must be keyboard navigable
  - DataCard metrics need `aria-label` attributes with full context
  - AIChatPanel message area needs `aria-live="polite"` for screen reader updates
  - Color contrast must meet WCAG 2.1 AA (4.5:1 for text against dark backgrounds)
  - `prefers-reduced-motion` respected for mode switch transitions

- **Component Priority Tiers**: AIChatPanel and DataCard are P1 components (Weeks 3-5 per UX spec). ModeSwitcher is P0 (should already exist from Epic 2 Story 2.6).

### Project Structure Notes

Files created or modified in this story:
```
src/features/modes/
  dashboard-chat.tsx          # Dashboard + Chat mode layout (NEW)
  dashboard-chat.test.tsx     # Layout tests (NEW)
  mode-switcher.tsx           # Add keyboard shortcut, Dashboard mode (MODIFY)

src/components/
  data-card.tsx               # Session metrics display (NEW)
  data-card.test.tsx          # DataCard tests (NEW)
  ai-chat-panel.tsx           # AI chat UI shell (NEW)
  ai-chat-panel.test.tsx      # AIChatPanel tests (NEW)

src/stores/
  session-store.ts            # Add mode, chatHistory, metrics fields (MODIFY)

src/features/coaching/
  coaching-types.ts           # ChatMessage type (NEW)
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] -- Zustand store selectors, Canvas/Zustand integration
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] -- Zustand selector patterns, Canvas subscription pattern
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Mode-Specific Layouts] -- Dashboard + Chat: 60% canvas left, 40% panel right
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Priority Tiers] -- AIChatPanel (P1), DataCard (P1)
- [Source: _bmad-output/planning-artifacts/architecture.md#UX-Mandated Architecture Constraints] -- Two-layer rendering, mode layouts
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.2]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
