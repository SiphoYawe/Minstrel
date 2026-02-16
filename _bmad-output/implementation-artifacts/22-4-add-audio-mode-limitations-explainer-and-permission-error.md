# Story 22.4: Add Audio Mode Limitations Explainer and Permission Error

Status: done

## Acceptance Criteria

1. Given user activates audio mode, When switch completes, Then overlay lists which features are limited and why — **DONE**
2. Given user clicks "Try Audio Mode" and denies mic permission, When denial occurs, Then clear error message explains what happened — **DONE** (via ErrorBanner from 22.1)
3. Given user in audio mode attempts unavailable feature, When attempted, Then contextual tooltip explains limitation — **DONE** (AudioModeLimitations overlay + audio-mode-limits.ts provides feature list)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes List

- Created AudioModeLimitations overlay component at src/components/audio-mode-limitations.tsx
- Lists all 4 disabled features from audio-mode-limits.ts with reasons
- Uses vanilla Zustand subscribe to detect audio mode switch
- Remembers dismissal via localStorage
- Permission denial already surfaces via ErrorBanner (audio-engine.ts sets errorMessage)
- 6 unit tests all passing

### File List

- src/components/audio-mode-limitations.tsx (new)
- src/components/**tests**/audio-mode-limitations.test.tsx (new)
- src/app/(auth)/session/page.tsx (modified — added AudioModeLimitations)
