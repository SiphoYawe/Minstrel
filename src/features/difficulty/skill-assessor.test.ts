// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  assessTimingAccuracy,
  assessHarmonicComplexity,
  assessTechniqueRange,
  assessSpeed,
  assessGenreFamiliarity,
  createSkillProfile,
  blendProfiles,
  updateConfidence,
} from './skill-assessor';
import { SkillDimension } from './difficulty-types';
import {
  createBeginnerFixture,
  createIntermediateFixture,
  createAdvancedFixture,
} from '@/test-utils/skill-fixtures';

describe('individual dimension assessors', () => {
  it('assessTimingAccuracy returns 0 for no timing events', () => {
    const data = createBeginnerFixture();
    data.timingEvents = [];
    expect(assessTimingAccuracy(data)).toBe(0);
  });

  it('assessTimingAccuracy normalizes 0-100 to 0-1', () => {
    const data = createBeginnerFixture();
    data.timingAccuracy = 75;
    expect(assessTimingAccuracy(data)).toBe(0.75);
  });

  it('assessHarmonicComplexity returns 0 for no chords', () => {
    const data = createBeginnerFixture();
    data.detectedChords = [];
    expect(assessHarmonicComplexity(data)).toBe(0);
  });

  it('assessHarmonicComplexity scores higher for complex chords', () => {
    const simple = createBeginnerFixture();
    const complex = createIntermediateFixture();
    expect(assessHarmonicComplexity(complex)).toBeGreaterThan(assessHarmonicComplexity(simple));
  });

  it('assessTechniqueRange returns 0 for no notes', () => {
    const data = createBeginnerFixture();
    data.noteCount = 0;
    expect(assessTechniqueRange(data)).toBe(0);
  });

  it('assessSpeed returns 0 when maxCleanTempoBpm is null', () => {
    const data = createBeginnerFixture();
    data.maxCleanTempoBpm = null;
    expect(assessSpeed(data)).toBe(0);
  });

  it('assessSpeed normalizes between TEMPO_MIN and TEMPO_MAX', () => {
    const data = createBeginnerFixture();
    data.maxCleanTempoBpm = 130;
    const score = assessSpeed(data);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });

  it('assessGenreFamiliarity returns 0 for no genre patterns', () => {
    const data = createBeginnerFixture();
    expect(assessGenreFamiliarity(data)).toBe(0);
  });

  it('assessGenreFamiliarity scores higher with multi-genre exposure', () => {
    const single = createIntermediateFixture();
    const multi = createAdvancedFixture();
    expect(assessGenreFamiliarity(multi)).toBeGreaterThan(assessGenreFamiliarity(single));
  });
});

describe('createSkillProfile', () => {
  it('beginner fixture scores all dimensions below 0.4', () => {
    const profile = createSkillProfile(createBeginnerFixture());
    for (const dim of Object.values(SkillDimension)) {
      expect(profile.dimensions[dim].value).toBeLessThan(0.4);
    }
  });

  it('intermediate fixture scores timing and harmonic above 0.4', () => {
    const profile = createSkillProfile(createIntermediateFixture());
    expect(profile.dimensions[SkillDimension.TimingAccuracy].value).toBeGreaterThan(0.4);
    expect(profile.dimensions[SkillDimension.HarmonicComplexity].value).toBeGreaterThan(0.4);
  });

  it('advanced fixture scores high across all dimensions', () => {
    const profile = createSkillProfile(createAdvancedFixture());
    expect(profile.dimensions[SkillDimension.TimingAccuracy].value).toBeGreaterThan(0.7);
    expect(profile.dimensions[SkillDimension.HarmonicComplexity].value).toBeGreaterThan(0.5);
    expect(profile.dimensions[SkillDimension.Speed].value).toBeGreaterThan(0.5);
  });

  it('all dimension values are between 0 and 1', () => {
    for (const fixture of [
      createBeginnerFixture(),
      createIntermediateFixture(),
      createAdvancedFixture(),
    ]) {
      const profile = createSkillProfile(fixture);
      for (const dim of Object.values(SkillDimension)) {
        expect(profile.dimensions[dim].value).toBeGreaterThanOrEqual(0);
        expect(profile.dimensions[dim].value).toBeLessThanOrEqual(1);
      }
    }
  });

  it('sets userId when provided', () => {
    const profile = createSkillProfile(createBeginnerFixture(), 'user-123');
    expect(profile.userId).toBe('user-123');
  });

  it('sets profileVersion', () => {
    const profile = createSkillProfile(createBeginnerFixture());
    expect(profile.profileVersion).toBe(1);
  });
});

describe('blendProfiles', () => {
  it('weights new session by alpha', () => {
    const existing = createSkillProfile(createBeginnerFixture());
    const newSession = createSkillProfile(createAdvancedFixture());
    const blended = blendProfiles(existing, newSession, 0.3);

    // Blended should be between beginner and advanced
    const dim = SkillDimension.TimingAccuracy;
    expect(blended.dimensions[dim].value).toBeGreaterThan(existing.dimensions[dim].value);
    expect(blended.dimensions[dim].value).toBeLessThan(newSession.dimensions[dim].value);
  });

  it('returns a new object (does not mutate existing)', () => {
    const existing = createSkillProfile(createBeginnerFixture());
    const newSession = createSkillProfile(createIntermediateFixture());
    const existingCopy = JSON.parse(JSON.stringify(existing));

    blendProfiles(existing, newSession);

    expect(existing).toEqual(existingCopy);
  });

  it('combines data points from both profiles', () => {
    const existing = createSkillProfile(createBeginnerFixture());
    const newSession = createSkillProfile(createIntermediateFixture());
    const blended = blendProfiles(existing, newSession);

    const dim = SkillDimension.TimingAccuracy;
    expect(blended.dimensions[dim].dataPoints).toBe(
      existing.dimensions[dim].dataPoints + newSession.dimensions[dim].dataPoints
    );
  });

  it('confidence increases with combined data points', () => {
    const existing = createSkillProfile(createBeginnerFixture());
    const newSession = createSkillProfile(createIntermediateFixture());
    const blended = blendProfiles(existing, newSession);

    const dim = SkillDimension.TimingAccuracy;
    expect(blended.dimensions[dim].confidence).toBeGreaterThan(existing.dimensions[dim].confidence);
  });
});

describe('updateConfidence', () => {
  it('increases confidence with more data points', () => {
    const dim =
      createSkillProfile(createBeginnerFixture()).dimensions[SkillDimension.TimingAccuracy];
    const updated = updateConfidence(dim, 20);
    expect(updated.confidence).toBeGreaterThan(dim.confidence);
    expect(updated.dataPoints).toBe(dim.dataPoints + 20);
  });

  it('does not mutate original', () => {
    const dim =
      createSkillProfile(createBeginnerFixture()).dimensions[SkillDimension.TimingAccuracy];
    const originalPoints = dim.dataPoints;
    updateConfidence(dim, 10);
    expect(dim.dataPoints).toBe(originalPoints);
  });

  it('confidence approaches 1 with large data points', () => {
    let dim = createSkillProfile(createBeginnerFixture()).dimensions[SkillDimension.TimingAccuracy];
    dim = updateConfidence(dim, 100);
    expect(dim.confidence).toBeGreaterThan(0.95);
  });
});
