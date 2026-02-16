# Story 23.4: Add Chord HUD Empty and Waiting States

Status: done

## Story

As a musician,
I want to know the chord detection feature is working,
So that I don't think it's broken when waiting for my first chord.

## Acceptance Criteria

1. Given no chord detected yet, When HUD renders, Then shows subtle placeholder: "Play a chord..." in muted text
2. Given chord is detected, When HUD updates, Then brief highlight animation distinguishes transition
3. Given session silent 30+ seconds after chords detected, When HUD would go empty, Then shows last chord dimmed with "(last detected)" label

## Tasks / Subtasks

1. Add placeholder state to chord-hud.tsx for no-chord condition
   - Show "Play a chord..." in muted text when no chord has been detected
   - Ensure placeholder is visually distinct from detected chord display
2. Add highlight animation on first chord detection
   - Brief animation when transitioning from placeholder to first detected chord
   - Animation should be subtle but noticeable
3. Add dimmed "last detected" state for idle periods
   - Track time since last chord detection
   - After 30+ seconds of silence, dim chord display and add "(last detected)" label
   - Retain last detected chord information rather than clearing
4. Add unit tests

## Dev Notes

**Findings Covered**: VIZ-C2
**Files**: `src/components/canvas/chord-hud.tsx`

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Completion Notes List
- Added "Play a chord..." placeholder when no chord detected (returns visible div instead of null)
- Added highlight glow animation (boxShadow) on new chord detection (400ms duration)
- Added "last detected" dimmed state (0.4 opacity) after 30s silence with interval check
- Proper ARIA labels for all states
- 6 new tests covering empty, detected, idle states

### File List
- src/components/viz/chord-hud.tsx (empty/idle states, highlight animation)
- src/components/viz/chord-hud.test.tsx (new, 6 tests)
