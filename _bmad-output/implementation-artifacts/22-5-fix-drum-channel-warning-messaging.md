# Story 22.5: Fix Drum Channel Warning Messaging

Status: done

## Acceptance Criteria

1. Given drum channel (channel 10) detected, When warning appears, Then it clearly explains percussion detected, melodic features limited, keep playing — **DONE**
2. Given warning is shown with CTA, When action is provided, Then it is specific ("Continue") — **DONE**

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes List

- Rewrote channel-mismatch step title to "Percussion channel detected"
- Rewrote description to be clear and non-contradictory: explains what's limited, confirms listening on all channels
- Removed contradictory "switch to channel 1" instruction
- Changed actionLabel from "Got It" to "Continue" for specificity
- 9 unit tests all passing

### File List

- src/features/midi/troubleshooting.ts (modified — rewritten drum channel messaging)
- src/features/midi/**tests**/troubleshooting.test.ts (new)
