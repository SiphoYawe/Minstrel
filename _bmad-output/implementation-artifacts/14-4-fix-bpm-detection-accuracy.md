# Story 14.4: Fix BPM Detection Accuracy

Status: ready-for-dev

## Story

As a musician,
I want the displayed BPM to accurately reflect my playing tempo,
So that timing-related coaching advice is meaningful and trustworthy.

## Acceptance Criteria

1. Given the tempo detection algorithm processes inter-onset intervals, When an interval falls outside the plausible BPM range (30-300 BPM), Then the interval is discarded as an outlier
2. Given the tempo detection uses a rolling window, When the rolling calculation is performed, Then a rolling median is used instead of a rolling average to resist outlier distortion
3. Given the BPM has been computed, When the confidence level is below a defined threshold, Then the BPM display shows "detecting..." or a low-confidence indicator
4. Given the timing accuracy percentage is computed, When the value is stored or displayed, Then it is clamped to the valid range 0-100 using Math.max(0, Math.min(100, value))
5. Given the timingAccuracy field in lib/ai/schemas.ts expects 0-1, When the context builder divides by 100, Then the source value is validated and clamped BEFORE division
6. Given the user plays with consistent tempo for 10+ seconds, When the BPM stabilizes, Then the displayed BPM fluctuates by no more than +/-3 BPM between consecutive updates

## Tasks / Subtasks

1. Add BPM plausibility filter (30-300 range) (AC: 1)
2. Replace rolling average with rolling median (AC: 2)
3. Add confidence threshold for BPM display (AC: 3)
4. Clamp timing accuracy to 0-100 range (AC: 4)
5. Fix schema mismatch — validate and clamp before division (AC: 5)
6. Add BPM smoothing to limit fluctuation to +/-3 BPM (AC: 6)
7. Add confidence field to tempo detection output
8. Add unit tests for BPM detection accuracy

## Dev Notes

This story fixes critical accuracy issues in BPM detection and timing analysis that undermine coaching credibility.

**Architecture Layer**: Domain Layer (analysis algorithms)

**Technical Details**:

- Primary files: src/features/analysis/tempo-detection.ts, src/features/analysis/timing-analysis.ts
- Replace rolling average with rolling median: sort window values and take middle element
- BPM plausibility: convert inter-onset interval to BPM first (60000 / intervalMs), reject if <30 or >300
- Schema mismatch fix: src/lib/ai/schemas.ts line 8 — ensure context builder clamps before sending to AI
- Add confidence field: confidence = consistentIntervals / totalIntervals
- Smoothing algorithm: exponential moving average or limit delta to +/-3 BPM per update

### Project Structure Notes

**Key files to modify**:

- `src/features/analysis/tempo-detection.ts` - Add plausibility filter, rolling median, confidence
- `src/features/analysis/timing-analysis.ts` - Add clamping to timing accuracy computation
- `src/lib/ai/schemas.ts` - Fix timingAccuracy schema mismatch
- `src/lib/ai/context-builder.ts` - Validate and clamp before division
- `src/components/data-card.tsx` - Display confidence indicators

**Key files to create**:

- `src/features/analysis/tempo-detection.test.ts` - Unit tests for BPM detection
- `src/features/analysis/timing-analysis.test.ts` - Unit tests for timing accuracy

### References

- [Source: _bmad-output/planning-artifacts/epics-12-17.md]
- [Source: _bmad-output/planning-artifacts/critical-issues-and-ux-audit-2026-02-13.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
