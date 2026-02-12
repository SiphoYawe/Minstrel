import { describe, it, expect } from 'vitest';
import { getDisabledFeatures, isFeatureDisabledInAudioMode } from './audio-mode-limits';

describe('getDisabledFeatures', () => {
  it('returns all MIDI-only features', () => {
    const features = getDisabledFeatures();
    expect(features.length).toBe(4);
  });

  it('includes exact velocity tracking', () => {
    const features = getDisabledFeatures();
    expect(features.find((f) => f.featureId === 'exact-velocity')).toBeDefined();
  });

  it('includes precise timing', () => {
    const features = getDisabledFeatures();
    expect(features.find((f) => f.featureId === 'precise-timing')).toBeDefined();
  });

  it('includes MIDI output', () => {
    const features = getDisabledFeatures();
    expect(features.find((f) => f.featureId === 'midi-output')).toBeDefined();
  });

  it('includes chord detection', () => {
    const features = getDisabledFeatures();
    expect(features.find((f) => f.featureId === 'chord-detection')).toBeDefined();
  });

  it('all features have reason "Requires MIDI connection"', () => {
    const features = getDisabledFeatures();
    for (const feature of features) {
      expect(feature.reason).toBe('Requires MIDI connection');
    }
  });

  it('all features have label and featureId', () => {
    const features = getDisabledFeatures();
    for (const feature of features) {
      expect(feature.featureId).toBeTruthy();
      expect(feature.label).toBeTruthy();
    }
  });
});

describe('isFeatureDisabledInAudioMode', () => {
  it('returns true for known disabled features', () => {
    expect(isFeatureDisabledInAudioMode('exact-velocity')).toBe(true);
    expect(isFeatureDisabledInAudioMode('precise-timing')).toBe(true);
    expect(isFeatureDisabledInAudioMode('midi-output')).toBe(true);
    expect(isFeatureDisabledInAudioMode('chord-detection')).toBe(true);
  });

  it('returns false for unknown features', () => {
    expect(isFeatureDisabledInAudioMode('some-other-feature')).toBe(false);
  });
});
