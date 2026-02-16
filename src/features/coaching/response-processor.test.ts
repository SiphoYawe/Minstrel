import { describe, it, expect, vi } from 'vitest';
import * as Sentry from '@sentry/nextjs';
import { processAiResponse, segmentResponseText } from './response-processor';

vi.mock('@sentry/nextjs', () => ({
  captureMessage: vi.fn(),
}));

describe('processAiResponse', () => {
  it('returns compliant for growth-mindset text', () => {
    const result = processAiResponse('Timing accuracy at 82%. Developing nicely.');
    expect(result.growthMindsetCompliant).toBe(true);
    expect(result.content).toBe('Timing accuracy at 82%. Developing nicely.');
  });

  it('detects non-compliant text', () => {
    const result = processAiResponse('That was a bad mistake.');
    expect(result.growthMindsetCompliant).toBe(false);
  });

  it('logs growth mindset violations to Sentry', () => {
    vi.mocked(Sentry.captureMessage).mockClear();
    processAiResponse('That was a bad mistake.');
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'Growth mindset violation in AI response',
      expect.objectContaining({
        level: 'warning',
        extra: expect.objectContaining({
          violations: expect.any(Array),
          responseLength: expect.any(Number),
        }),
      })
    );
  });

  it('does not log to Sentry for compliant text', () => {
    vi.mocked(Sentry.captureMessage).mockClear();
    processAiResponse('Great progress on your timing.');
    expect(Sentry.captureMessage).not.toHaveBeenCalled();
  });

  it('extracts metric references (percentages)', () => {
    const result = processAiResponse('Your timing: 82%. Chord accuracy: 91%.');
    const metrics = result.dataReferences.filter((r) => r.type === 'metric');
    expect(metrics.length).toBe(2);
    expect(metrics[0].text).toBe('82%');
    expect(metrics[1].text).toBe('91%');
  });

  it('extracts timing references (ms, BPM)', () => {
    const result = processAiResponse('Latency dropped to 40ms. Tempo: 120 BPM.');
    const timings = result.dataReferences.filter((r) => r.type === 'timing');
    expect(timings.length).toBe(2);
  });

  it('extracts chord references', () => {
    const result = processAiResponse('Try Cmaj7 to Dm7 for smoother voice leading.');
    const chords = result.dataReferences.filter((r) => r.type === 'chord');
    expect(chords.some((c) => c.text === 'Cmaj7')).toBe(true);
    expect(chords.some((c) => c.text === 'Dm7')).toBe(true);
  });

  it('extracts key references', () => {
    const result = processAiResponse('You are playing in C major. Consider shifting to G major.');
    const keys = result.dataReferences.filter((r) => r.type === 'key');
    expect(keys.length).toBe(2);
  });

  it('returns empty references for plain text', () => {
    const result = processAiResponse('Keep practicing those transitions.');
    expect(result.dataReferences).toHaveLength(0);
  });
});

describe('segmentResponseText', () => {
  it('returns single segment for plain text', () => {
    const segments = segmentResponseText('Just a plain message.');
    expect(segments).toHaveLength(1);
    expect(segments[0].highlight).toBeNull();
  });

  it('segments text with metric highlights', () => {
    const segments = segmentResponseText('Accuracy: 82% overall.');
    expect(segments.length).toBeGreaterThan(1);
    const highlighted = segments.find((s) => s.highlight === 'metric');
    expect(highlighted).toBeDefined();
    expect(highlighted!.text).toBe('82%');
  });

  it('preserves all text content after segmentation', () => {
    const original = 'Your timing at 120 BPM is 82% accurate.';
    const segments = segmentResponseText(original);
    const reassembled = segments.map((s) => s.text).join('');
    expect(reassembled).toBe(original);
  });

  it('handles multiple different reference types', () => {
    const segments = segmentResponseText('Cmaj7 at 120 BPM with 82% accuracy');
    const types = new Set(segments.filter((s) => s.highlight).map((s) => s.highlight));
    expect(types.size).toBeGreaterThanOrEqual(2);
  });
});
