# Story 22.7: Add Session Expiry UI Response

Status: done

## Story

As a user whose session has expired,
I want to see a clear notification with re-login option,
So that I understand what happened and can resume quickly.

## Acceptance Criteria

1. Given sessionExpired is true, When flag is set, Then persistent non-dismissible banner appears: "Your session has expired. Sign in again to continue."
2. Given session expiry banner visible, When user clicks "Sign in", Then redirected to login with return URL
3. Given session expires during practice, When detected, Then local IndexedDB data preserved with reassuring message

## Tasks / Subtasks

1. Create SessionExpiredBanner component
   - Non-dismissible persistent banner
   - Clear message: "Your session has expired. Sign in again to continue."
   - "Sign in" button as primary action
2. Wire to appStore.sessionExpired
   - Subscribe to sessionExpired flag
   - Show banner immediately when flag becomes true
3. Add return URL logic to sign-in redirect
   - Capture current route as return URL
   - Pass return URL to auth redirect so user returns to same page
4. Preserve local data with reassurance message
   - Ensure IndexedDB data is not cleared on session expiry
   - Display reassuring message: "Your practice data is safely saved locally."
5. Add unit tests

## Dev Notes

**Findings Covered**: SET-C8, MIDI-C17
**Files**: `src/stores/app-store.ts`, layout components

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes List

- Updated existing SessionExpiredModal with data preservation reassurance: "Your practice data is safely saved locally."
- Changed button text from "Log In" to "Sign In" to match AC2
- Changed message from "Please log in again" to "Sign in again" to match story requirements
- IndexedDB data is already preserved by design (no clear-on-expiry logic)
- 7 unit tests all passing (added 1 new test for reassurance message)

### File List

- src/components/session-expired-modal.tsx (modified — added reassurance message, updated button text)
- src/components/session-expired-modal.test.tsx (modified — updated text assertions, added reassurance test)
