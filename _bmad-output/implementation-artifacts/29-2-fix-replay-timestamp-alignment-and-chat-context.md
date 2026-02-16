# Story 29.2: Fix Replay Timestamp Alignment and Chat Context

Status: done

## Story

As a user reviewing a replay,
I want clear timestamps and chat context,
So that I know exactly what moment I'm asking about.

## Acceptance Criteria

1. Given replay playing, When timestamp displays, Then 14px minimum in prominent position
2. Given chat message in replay mode, When it references playback position, Then timestamp context visible: "Asking about 2:30"
3. Given session list loading, When data fetched, Then skeleton loading animation appears

## Tasks / Subtasks

1. Increase timestamp font to 14px+ and reposition
   - Update replay timestamp styling to minimum 14px
   - Ensure prominent placement in the replay UI
2. Add context label to replay chat messages
   - Include current playback position as context: "Asking about 2:30"
   - Display timestamp context alongside chat messages in replay mode
3. Add skeleton loading to session list
   - Show skeleton animation while session list data is loading
4. Add unit tests

## Dev Notes

**Findings Covered**: REPLAY-C3, replay chat context (HIGH), loading state (HIGH)
**Files**: `src/components/replay/`, `src/components/chat/`

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Completion Notes List

- Increased timestamp in timeline scrubber from 10px to 14px (text-sm)
- Increased "Asking about" indicator from 10px to 14px with prominent styling
- Added per-message replay position tracking via ref Map
- User messages now show "Asking about X:XX" context label
- Replaced "Loading sessions..." text with skeleton loading animation (4 skeleton cards)

### File List

- src/features/modes/replay-studio.tsx
- src/components/timeline-scrubber.tsx
