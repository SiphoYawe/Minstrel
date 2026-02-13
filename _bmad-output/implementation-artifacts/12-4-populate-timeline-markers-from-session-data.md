# Story 12.4: Populate Timeline Markers from Session Data

Status: ready-for-dev

## Story

As a musician reviewing a past session,
I want to see markers on the replay timeline for snapshots, drills, and key changes,
So that I can quickly navigate to interesting moments in my session.

## Acceptance Criteria

1. Given a session is loaded into replay mode, When the timeline scrubber renders, Then snapshot markers appear at the timestamps where session snapshots were generated
2. Given the session contains drill events, When the timeline renders, Then drill start/end markers appear at the timestamps of each drill attempt
3. Given the session contains key changes, When the timeline renders, Then key change markers appear at the timestamps where the detected key changed
4. Given markers are rendered on the timeline, When the user hovers over a marker, Then a tooltip shows the marker type and relevant data
5. Given markers are rendered on the timeline, When the user clicks a marker, Then the playback position jumps to that marker's timestamp
6. Given a session has no snapshots, drills, or key changes, When the timeline renders, Then no markers appear but the timeline remains fully functional

## Tasks / Subtasks

1. Update TimelineMarker type to support snapshot/drill/keyChange types
   - Extend TimelineMarker interface with type discriminator
   - Add metadata fields for each marker type
   - Update TypeScript definitions
2. Generate snapshot markers from session.snapshots
   - Map session.snapshots array to TimelineMarker[]
   - Set type: 'snapshot' and timestamp from snapshot data
   - Include relevant metadata (snapshot ID, note count, etc.)
3. Generate drill markers from session.drills
   - Map session.drills array to TimelineMarker[]
   - Set type: 'drill' with start/end timestamps
   - Include drill type, difficulty, result metadata
4. Generate key change markers from session.metadata
   - Scan session.metadata for key changes
   - Create TimelineMarker for each key change event
   - Set type: 'keyChange' with new key information
5. Add hover tooltip showing marker type and data
   - Implement tooltip component for timeline markers
   - Display marker type and relevant metadata on hover
   - Style tooltip using design tokens (Inter font, pastel blue accent)
6. Add click-to-jump behavior for markers
   - Handle click events on timeline markers
   - Update replayPosition in sessionStore to marker timestamp
   - Trigger replay engine to jump to new position
7. Handle empty session data gracefully
   - Return empty markers array if no session data
   - Ensure timeline renders correctly with no markers
   - Add null/undefined checks for session data
8. Add tests for marker generation
   - Test snapshot marker generation
   - Test drill marker generation
   - Test key change marker generation
   - Test tooltip display
   - Test click-to-jump behavior
   - Test empty session data handling

## Dev Notes

**Architecture Layer**: Presentation Layer (replay-studio.tsx, timeline-scrubber.tsx)

**Technical Details**:

- Primary fix: `src/features/modes/replay-studio.tsx` line 80 — replace `const markers = useMemo<TimelineMarker[]>(() => [], [])` with actual marker generation from session data
- Session data sources: session.snapshots (snapshot markers), session.drills (drill markers), session.metadata changes (key change markers)
- TimelineMarker type defined in `src/components/timeline-scrubber.tsx` — ensure it supports type: 'snapshot' | 'drill' | 'keyChange' with associated metadata
- Markers should be visually distinct by type (different colors or icons using the design token palette)

### Project Structure Notes

**Files to Modify**:

- `/Users/siphoyawe/Desktop/Projects/Minstrel/src/features/modes/replay-studio.tsx` — replace empty markers array with actual generation logic
- `/Users/siphoyawe/Desktop/Projects/Minstrel/src/components/timeline-scrubber.tsx` — update TimelineMarker type, add tooltip and click handlers
- `/Users/siphoyawe/Desktop/Projects/Minstrel/src/types/session.ts` — ensure session data types support marker extraction

**Files to Create**:

- `/Users/siphoyawe/Desktop/Projects/Minstrel/src/components/__tests__/timeline-markers.test.tsx` — marker generation and interaction tests

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
