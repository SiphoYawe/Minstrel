# Story 9.6: Add Mobile Redirect and Browser Incompatibility Messages

Status: ready-for-dev

## Story

As a user visiting on mobile or an unsupported browser,
I want a clear message explaining device/browser requirements,
So that I understand why the app is not working and know what to do.

## Acceptance Criteria

1. **Given** a user visits on a mobile device (touch-only, viewport < 768px, or user agent indicates mobile), **When** a session/play page loads, **Then** a full-page message appears explaining "Minstrel requires a desktop browser with MIDI support" with specific suggestions (Chrome or Edge on desktop). The message includes a link back to the marketing home page.

2. **Given** a user visits on Firefox or Safari (browsers without Web MIDI API support), **When** a session/play page loads, **Then** a message appears explaining "Your browser does not support the Web MIDI API. Please use Chrome or Edge." with a link to download Chrome. The message also mentions that Web MIDI API is an evolving standard.

3. **Given** the browser detection runs, **When** the Web MIDI API is available (`navigator.requestMIDIAccess` exists) and the device is not mobile, **Then** no redirect or message appears — the normal session experience loads.

4. **Given** the mobile/browser check, **When** it runs, **Then** it does NOT block the marketing page (`/`), login page (`/auth/login`), signup page (`/auth/sign-up`), or settings page (`/settings`). Only session/play pages that require MIDI are protected: `/session` and `/play`.

5. **Given** the detection logic, **When** it evaluates the browser, **Then** it checks for `navigator.requestMIDIAccess` as the primary signal (feature detection over user agent sniffing). Mobile detection uses a combination of `navigator.maxTouchPoints > 0`, viewport width, and `navigator.userAgent` as secondary signals.

## Tasks / Subtasks

- [ ] 1. Create browser check utility (AC: 3, 5)
  - [ ] 1.1 Create `src/lib/browser-check.ts` with the following exports:
    ```ts
    export function isMidiSupported(): boolean {
      return typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;
    }

    export function isMobileDevice(): boolean {
      if (typeof navigator === 'undefined') return false;
      const hasTouchOnly = navigator.maxTouchPoints > 0 && !window.matchMedia('(pointer: fine)').matches;
      const isNarrow = window.innerWidth < 768;
      return hasTouchOnly && isNarrow;
    }

    export type BrowserCheckResult =
      | { compatible: true }
      | { compatible: false; reason: 'mobile' }
      | { compatible: false; reason: 'no-midi' };

    export function checkBrowserCompatibility(): BrowserCheckResult {
      if (isMobileDevice()) return { compatible: false, reason: 'mobile' };
      if (!isMidiSupported()) return { compatible: false, reason: 'no-midi' };
      return { compatible: true };
    }
    ```
  - [ ] 1.2 Add unit tests in `src/lib/browser-check.test.ts`

- [ ] 2. Create browser incompatible component (AC: 1, 2)
  - [ ] 2.1 Create `src/components/browser-incompatible.tsx` — a full-page component that displays:
    - For `reason: 'mobile'`: "Minstrel requires a desktop browser" with explanation about MIDI hardware, link to marketing page
    - For `reason: 'no-midi'`: "Your browser does not support Web MIDI API" with link to download Chrome, explanation of Web MIDI standard
  - [ ] 2.2 Style with design tokens: `bg-background text-foreground`, centered layout, `text-primary` for links
  - [ ] 2.3 Include the Minstrel logo/wordmark at the top
  - [ ] 2.4 Include a "Go to home page" link (`/`) for both scenarios
  - [ ] 2.5 For the no-midi case, include a "Download Chrome" external link: `https://www.google.com/chrome/`
  - [ ] 2.6 Ensure the component is accessible: proper heading hierarchy, descriptive link text, sufficient contrast

- [ ] 3. Create BrowserGate wrapper component (AC: 3, 4)
  - [ ] 3.1 Create `src/components/browser-gate.tsx` — a client component that wraps session page content:
    ```tsx
    'use client';
    import { useState, useEffect } from 'react';
    import { checkBrowserCompatibility, type BrowserCheckResult } from '@/lib/browser-check';
    import { BrowserIncompatible } from './browser-incompatible';

    export function BrowserGate({ children }: { children: React.ReactNode }) {
      const [result, setResult] = useState<BrowserCheckResult | null>(null);

      useEffect(() => {
        setResult(checkBrowserCompatibility());
      }, []);

      // During SSR / initial hydration, render nothing (avoid flash)
      if (result === null) return null;
      if (!result.compatible) return <BrowserIncompatible reason={result.reason} />;
      return <>{children}</>;
    }
    ```
  - [ ] 3.2 The component renders `null` during SSR to avoid hydration mismatches (browser APIs not available on server)

- [ ] 4. Integrate BrowserGate at session/play routes (AC: 4)
  - [ ] 4.1 Wrap the content of `src/app/(auth)/session/page.tsx` with `<BrowserGate>`:
    ```tsx
    import { BrowserGate } from '@/components/browser-gate';
    // ...
    return (
      <BrowserGate>
        {/* existing content */}
      </BrowserGate>
    );
    ```
  - [ ] 4.2 Wrap the content of `src/app/(guest)/play/page.tsx` with `<BrowserGate>` similarly
  - [ ] 4.3 Do NOT add `BrowserGate` to: `src/app/(marketing)/page.tsx`, login, signup, settings, or replay pages

- [ ] 5. Handle replay page (AC: 4)
  - [ ] 5.1 Evaluate whether `src/app/(auth)/replay/[id]/page.tsx` needs the browser gate
  - [ ] 5.2 Replay viewing may not require active MIDI — if it only plays back recorded data, it can work without Web MIDI API. If so, do NOT add the gate to the replay page.
  - [ ] 5.3 If replay requires MIDI output (for demonstration playback), add the gate

- [ ] 6. Testing (AC: 1, 2, 3, 4, 5)
  - [ ] 6.1 Test on Chrome desktop: verify no gate message appears, session loads normally
  - [ ] 6.2 Test on Firefox desktop: verify the "no-midi" message appears on `/session` and `/play`
  - [ ] 6.3 Test on Safari desktop: verify the "no-midi" message appears on `/session` and `/play`
  - [ ] 6.4 Test on Chrome mobile (emulated via DevTools): verify the "mobile" message appears on `/session` and `/play`
  - [ ] 6.5 Verify marketing page (`/`) loads without any gate on all browsers and devices
  - [ ] 6.6 Verify login/signup/settings pages load without gate on all browsers
  - [ ] 6.7 Unit test the `checkBrowserCompatibility` function with mocked `navigator` values

## Dev Notes

- **Architecture Layer**: Infrastructure (Layer 4) — browser capability detection; Presentation (Layer 1) — incompatibility UI
- Feature detection (`'requestMIDIAccess' in navigator`) is the gold standard for checking Web MIDI support. Do NOT rely solely on user agent parsing.
- Mobile detection is inherently imprecise. The combination of `maxTouchPoints > 0` + `!pointer: fine` + narrow viewport provides reasonable accuracy. Tablets with keyboard/mouse attached may have MIDI support — err on the side of allowing access.
- The `BrowserGate` component returns `null` during SSR to prevent hydration mismatches. The brief flash of empty content before the check completes is acceptable (it will be faster than the MIDI connection anyway).
- The marketing page MUST remain accessible on all devices and browsers — it serves as the landing experience for all visitors.
- Firefox has experimental Web MIDI API support behind a flag (`dom.webmidi.enabled`) since Firefox 108 — the message should mention this as an option for advanced users.
- The existing MIDI connection flow in `src/features/midi/use-midi.ts` already handles the `unsupported` status — the browser gate provides an earlier, more user-friendly interception.

### Project Structure Notes

- `src/lib/browser-check.ts` — new utility (create)
- `src/lib/browser-check.test.ts` — new test file (create)
- `src/components/browser-incompatible.tsx` — new component (create)
- `src/components/browser-gate.tsx` — new component (create)
- `src/app/(auth)/session/page.tsx` — add BrowserGate wrapper
- `src/app/(guest)/play/page.tsx` — add BrowserGate wrapper
- `src/app/(auth)/replay/[id]/page.tsx` — evaluate (may not need gate)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Browser Support]
- [Source: _bmad-output/planning-artifacts/prd.md#FR6-Web-MIDI-API]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Device Requirements]
- [Source: _bmad-output/implementation-artifacts/1-3-web-midi-device-connection-and-auto-detection.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
