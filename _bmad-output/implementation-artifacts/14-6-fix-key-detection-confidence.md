# Story 14.6: Fix Key Detection Confidence

Status: ready-for-dev

## Story

As a musician,
I want the detected key to accurately reflect what I am playing with a confidence indicator,
So that I can trust the harmonic analysis shown on screen.

## Acceptance Criteria

1. Given the key detection algorithm processes note events, When scoring notes for key correlation, Then velocity-weighted scoring is used
2. Given the key detection produces a result, When the confidence score is below 60%, Then the key display shows "detecting..." or the previous high-confidence key
3. Given the detected key changes, When fewer than 3 seconds have elapsed since the last key change, Then the display does not update (debounce/hysteresis)
4. Given the key detection produces a result, When the key is displayed, Then a confidence indicator is shown alongside
5. Given the session recorder writes metadata updates, When a key change matches the cached lastMetadataKey, Then the metadata is still written on the scheduled interval
6. Given the user plays a passage with clear tonal center, When the key detection stabilizes, Then the detected key matches expected tonal center with at least 80% accuracy

## Tasks / Subtasks

1. Add velocity-weighted scoring to key detection (AC: 1)
2. Add confidence threshold (60%) for key display (AC: 2)
3. Add 3-second debounce for key changes (AC: 3)
4. Add confidence indicator to key display (AC: 4)
5. Fix metadata caching bug in session-recorder.ts (AC: 5)
6. Validate key detection accuracy for common progressions (AC: 6)
7. Add unit tests for key detection improvements

## Dev Notes

This story fixes key detection accuracy and stability issues that cause unreliable harmonic analysis.

**Architecture Layer**: Domain Layer (key detection algorithm) + Infrastructure Layer (session recording)

**Technical Details**:

- Primary files: src/features/analysis/key-detection.ts, src/features/analysis/chord-detection.ts
- Velocity weighting: multiply each note's contribution by velocity / 127
- Confidence threshold: confidence = (topScore - secondScore) / topScore — suppress below 0.6
- Debounce: store lastKeyChangeTime and lastConfidentKey; only update if now - lastKeyChangeTime > 3000ms
- Metadata caching bug: src/features/session/session-recorder.ts lines 149-159 — remove the if (key === lastMetadataKey) return guard
- Confidence indicator: display as percentage badge or dot indicator (green: >80%, amber: 60-80%, gray: <60%)

### Project Structure Notes

**Key files to modify**:

- `src/features/analysis/key-detection.ts` - Add velocity weighting, confidence scoring, debounce
- `src/features/analysis/chord-detection.ts` - Ensure chord detection feeds accurate data to key detection
- `src/features/session/session-recorder.ts` - Fix metadata caching bug (lines 149-159)
- `src/components/data-card.tsx` - Add confidence indicator display
- `src/stores/session-store.ts` - Store lastKeyChangeTime and lastConfidentKey

**Key files to create**:

- `src/features/analysis/key-detection.test.ts` - Unit tests for key detection accuracy

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
