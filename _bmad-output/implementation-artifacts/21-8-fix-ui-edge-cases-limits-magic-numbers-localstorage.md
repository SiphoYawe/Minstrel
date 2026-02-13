# Story 21.8: Fix UI Edge Cases — Hardcoded Limits, Magic Numbers, localStorage

Status: ready-for-dev

## Story

As a user with varying data volumes and browser configurations,
I want configurable session limits, CSS-based textarea sizing, consistent typography, and safe localStorage access,
So that the UI adapts to my data, styling is consistent, and the app doesn't crash with disabled storage.

## Acceptance Criteria

1. Given the replay studio session list, When it loads, Then the hardcoded `.limit(20)` is replaced with configurable pagination
2. Given the chat textarea max height, When computed, Then it uses CSS-based calculation instead of magic number `120`
3. Given drill controller typography, When audited, Then all text sizes consistently use design token classes
4. Given `localStorage` access in mobile-redirect, When called, Then all access is wrapped in try/catch with fallback

## Tasks / Subtasks

1. Make session list limit configurable (UI-L1)
   - Replace hardcoded `.limit(20)` with state-driven pagination
   - Add "Load More" button
2. Use CSS for textarea max-height (UI-L2)
   - Replace `Math.min(el.scrollHeight, 120)` with `className="max-h-[30vh]"`
3. Audit drill controller typography (UI-L3)
   - Replace raw text sizes with design token classes
4. Wrap localStorage in try/catch (UI-L4)
   - Create `getLocalStorage(key, fallback)` utility
   - Apply to mobile-redirect
5. Add unit tests

## Dev Notes

**Findings Covered**: UI-L1, UI-L2, UI-L3, UI-L4
**Files**: `src/features/modes/replay-studio.tsx`, `src/components/ai-chat-panel.tsx`, `src/components/drill-controller.tsx`, `src/components/mobile-redirect.tsx`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
