# Story 1.5: MIDI Troubleshooting Guidance

Status: done

## Story

As a musician,
I want step-by-step troubleshooting when my MIDI device fails to connect,
So that I can resolve the issue without leaving the app.

## Acceptance Criteria

1. **Given** no MIDI device is detected after page load (or after a timeout of 3 seconds), **When** the system detects no MIDI input, **Then** a TroubleshootingPanel component displays step-by-step guidance with at least three steps:
   - Step 1: "Is your device powered on and plugged into a USB port?"
   - Step 2: "Try a different USB port or cable"
   - Step 3: "Check that your browser has MIDI permissions enabled"

2. **Given** the TroubleshootingPanel is visible, **When** each step is displayed, **Then** each step includes a "Try Again" action button that re-scans for MIDI devices by calling the MIDI engine's device detection logic, and the panel updates to reflect the result (device found or still no device).

3. **Given** a MIDI signal is detected on an unexpected channel (e.g., channel 10 which is typically drums), **When** the system detects this mismatch, **Then** a contextual suggestion is displayed: "It looks like your device is sending on channel 10 (drums). Try switching to channel 1 on your instrument for the best experience." The system still accepts input on any channel.

4. **Given** all troubleshooting guidance is user-facing, **When** text and UI elements are rendered, **Then** all language follows growth mindset principles: helpful, never blaming. For example, "Let us help you get connected" not "Connection failed." No technical jargon (no "MIDI port", "USB enumeration", "API unavailable") unless providing browser permission instructions.

5. **Given** the TroubleshootingPanel contains actionable steps, **When** a "Try Again" action succeeds (device found), **Then** the panel auto-dismisses and the StatusBar shows "Connected" with a green indicator. If the action fails, the panel remains with the next step highlighted.

6. **Given** accessibility requirements (NFR20), **When** the TroubleshootingPanel is rendered, **Then** all steps, buttons, and interactive elements are keyboard-navigable, focus management moves logically through steps, and screen readers announce step changes via `aria-live` regions.

## Tasks / Subtasks

- [ ] Task 1: Create troubleshooting logic module (AC: 1, 3)
  - [ ] Create `src/features/midi/troubleshooting.ts` with:
    - `getTroubleshootingSteps(connectionStatus: MidiConnectionStatus, detectedChannel?: number): TroubleshootingStep[]`
    - Define `TroubleshootingStep` type: `{ id: string; title: string; description: string; actionLabel: string; actionFn: () => Promise<boolean> }`
    - Step 1: Device power/connection check -- action triggers `detectDevices()`
    - Step 2: USB port/cable suggestion -- action triggers `detectDevices()` again
    - Step 3: Browser permissions check -- action triggers `requestMidiAccess()`
    - Step 4 (conditional): Channel mismatch -- displayed only when channel 10 detected
  - [ ] Add `isUnexpectedChannel(channel: number): boolean` helper (flags channel 10 / drums)
  - [ ] Return steps in order; mark conditional steps appropriately

- [ ] Task 2: Build TroubleshootingPanel component (AC: 1, 2, 4, 5, 6)
  - [ ] Create `src/components/troubleshooting-panel.tsx` (P2 priority component):
    - `'use client'` directive
    - Receives troubleshooting steps from `troubleshooting.ts`
    - Renders each step as a card with: step number, title, description, and action button
    - Current/active step is visually highlighted
    - Completed steps (where "Try Again" found a device) show a green checkmark
    - Failed steps show amber indicator ("Not yet connected" -- growth mindset)
  - [ ] Implement "Try Again" button per step:
    - Calls the step's `actionFn()`
    - Shows loading state during scan (spinner or pulsing dot)
    - On success: auto-dismiss panel, update StatusBar
    - On failure: advance to next step with subtle visual cue
  - [ ] Style with dark studio aesthetic:
    - Background: `#1A1A1A` surface
    - Border: `#3A3A3A`
    - 0px border radius
    - Text: `#E5E5E5` primary, `#999999` secondary
    - Action button: `#7CB9E8` primary accent
  - [ ] Position the panel prominently but not full-screen (modal-like overlay or inline panel below StatusBar)
  - [ ] Add close/dismiss button (user can manually dismiss even without resolution)

- [ ] Task 3: Integrate with MIDI engine and StatusBar (AC: 2, 5)
  - [ ] Update `src/features/midi/use-midi.ts` to:
    - Trigger troubleshooting flow after 3-second timeout with no device detected
    - Expose `showTroubleshooting: boolean` state
    - Expose `retryConnection(): Promise<void>` action
  - [ ] Update `src/stores/midi-store.ts` to add:
    - `showTroubleshooting: boolean`
    - `detectedChannel: number | null` (for channel mismatch detection)
  - [ ] Wire StatusBar to show a "Help" or "Troubleshoot" link when disconnected, which opens the panel
  - [ ] When "Try Again" succeeds, set `showTroubleshooting: false` in store and let StatusBar render "Connected"

- [ ] Task 4: Handle channel mismatch guidance (AC: 3)
  - [ ] In `midi-engine.ts` or `midi-parser.ts`, detect the channel of incoming MIDI messages
  - [ ] If the first several messages arrive on channel 10, set `midiStore.detectedChannel = 10`
  - [ ] `troubleshooting.ts` includes a conditional step when `detectedChannel === 10`:
    - Title: "Unexpected MIDI Channel"
    - Description: "It looks like your device is sending on channel 10 (typically drums). For the best experience, switch to channel 1 on your instrument. Minstrel will still listen on all channels."
  - [ ] The system continues to accept input on all channels (no blocking)

- [ ] Task 5: Growth mindset language review (AC: 4)
  - [ ] Audit all user-facing strings in the troubleshooting flow:
    - Panel title: "Let's get connected" (not "Connection failed")
    - Step descriptions: helpful, instructional, never accusatory
    - Action labels: "Try Again" (not "Retry" or "Reconnect")
    - Success: "Connected! You're ready to play." (not just "Connected")
    - No technical jargon in user-facing text
  - [ ] Add string constants to a dedicated section in `troubleshooting.ts` or a separate constants file for easy review

- [ ] Task 6: Keyboard navigation and accessibility (AC: 6)
  - [ ] Ensure all interactive elements (buttons, close button) are focusable
  - [ ] Tab order follows logical step sequence: Step 1 button -> Step 2 button -> Step 3 button -> Close
  - [ ] Add `aria-live="polite"` region for status updates when "Try Again" completes
  - [ ] Add `role="alertdialog"` or `role="complementary"` to the panel
  - [ ] Focus traps within the panel when displayed as an overlay (optional: depends on panel positioning)

- [ ] Task 7: Write co-located tests (AC: 1, 2, 3)
  - [ ] Create `src/features/midi/troubleshooting.test.ts`:
    - Test `getTroubleshootingSteps()` returns 3 base steps when no device connected
    - Test `getTroubleshootingSteps()` includes channel mismatch step when channel 10 detected
    - Test `isUnexpectedChannel(10)` returns true
    - Test `isUnexpectedChannel(1)` returns false
  - [ ] Create `src/components/troubleshooting-panel.test.tsx`:
    - Test panel renders all troubleshooting steps
    - Test "Try Again" button calls action function
    - Test panel dismisses on successful connection
    - Test channel mismatch step renders when applicable
    - Test keyboard navigation works (tab through steps)

## Dev Notes

- **TroubleshootingPanel is P2 Priority**: Per UX component priority tiers, TroubleshootingPanel is a Phase 3 / P2 component. However, it is included in Epic 1 because MIDI troubleshooting is essential for the "First Note Experience." The P2 designation means it does not need the full polish of P0 components yet, but must be functional.
- **Auto-Trigger vs. Manual**: The troubleshooting panel auto-appears after a 3-second timeout with no device. It can also be manually triggered from the StatusBar. This follows the "Play First, Everything Else Follows" principle -- we only show troubleshooting when needed.
- **Channel Detection**: MIDI channel is encoded in the low nibble of the status byte (0x90 = channel 0, 0x91 = channel 1, ... 0x99 = channel 9 which is channel 10 in 1-indexed MIDI convention). Channel 10 (0-indexed: 9) is the General MIDI percussion channel.
- **Growth Mindset Language (UX9)**: This story is a key test of the growth mindset principle. Every message must be encouraging and solution-oriented. The troubleshooting flow should feel like a helpful guide, not an error state.
- **Layer Compliance**: `troubleshooting.ts` is Layer 3 (Domain Logic) -- pure logic, no React. `troubleshooting-panel.tsx` is Layer 1 (Presentation). The `use-midi.ts` hook (Layer 2) orchestrates when to show the panel.
- **Dismissibility**: The panel must be dismissible even without resolution. Some users may want to explore the app without MIDI. The audio fallback (Story 1.6) provides an alternative path.
- **No Blocking**: The troubleshooting panel does NOT block the rest of the app. Users should still be able to navigate to other pages or interact with UI elements behind/around the panel.

### Project Structure Notes

- Troubleshooting logic: `src/features/midi/troubleshooting.ts`
- Troubleshooting tests: `src/features/midi/troubleshooting.test.ts`
- TroubleshootingPanel component: `src/components/troubleshooting-panel.tsx`
- TroubleshootingPanel tests: `src/components/troubleshooting-panel.test.tsx`
- Updated files: `src/features/midi/use-midi.ts`, `src/stores/midi-store.ts`, `src/components/status-bar.tsx`

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#External Integrations] (Web MIDI API failure mode: Troubleshooting UI -> audio fallback)
- [Source: _bmad-output/planning-artifacts/architecture.md#UX-Mandated Architecture Constraints] (Component Priority Tiers: TroubleshootingPanel is P2)
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Emotional Design Principles] ("Amber, Not Red", growth mindset)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Effortless Interactions] (MIDI connection: auto-detect)
- [Source: _bmad-output/planning-artifacts/prd.md#FR3] (Step-by-step troubleshooting guidance)
- NFR20: Full keyboard navigation for all UI controls
- NFR28: MIDI device auto-reconnect within 5 seconds

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
