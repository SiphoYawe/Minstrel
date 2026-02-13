// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  initializeDifficulty,
  computeAdjustment,
  applyAdjustment,
  DEFAULT_DIFFICULTY,
} from './difficulty-engine';
import {
  GrowthZoneStatus,
  SkillDimension,
  type SkillProfile,
  type DifficultyParameters,
} from './difficulty-types';

function makeSkillProfile(overrides: Partial<Record<SkillDimension, number>> = {}): SkillProfile {
  const defaults: Record<SkillDimension, number> = {
    [SkillDimension.TimingAccuracy]: 0.5,
    [SkillDimension.HarmonicComplexity]: 0.5,
    [SkillDimension.TechniqueRange]: 0.5,
    [SkillDimension.Speed]: 0.5,
    [SkillDimension.GenreFamiliarity]: 0.5,
  };
  const merged = { ...defaults, ...overrides };

  const dimensions = {} as Record<
    SkillDimension,
    { value: number; confidence: number; dataPoints: number; lastUpdated: string }
  >;
  for (const [dim, value] of Object.entries(merged)) {
    dimensions[dim as SkillDimension] = {
      value,
      confidence: 0.5,
      dataPoints: 10,
      lastUpdated: new Date().toISOString(),
    };
  }

  return {
    userId: 'test-user',
    profileVersion: 1,
    lastAssessedAt: new Date().toISOString(),
    dimensions,
  };
}

describe('initializeDifficulty', () => {
  it('returns default parameters when no profile', () => {
    const result = initializeDifficulty(null);
    expect(result).toEqual(DEFAULT_DIFFICULTY);
  });

  it('does not mutate DEFAULT_DIFFICULTY', () => {
    const result = initializeDifficulty(null);
    result.tempo = 999;
    expect(DEFAULT_DIFFICULTY.tempo).toBe(80);
  });

  it('converts low skill profile to easy parameters', () => {
    const profile = makeSkillProfile({
      [SkillDimension.Speed]: 0.1,
      [SkillDimension.HarmonicComplexity]: 0.1,
      [SkillDimension.TechniqueRange]: 0.1,
    });
    const result = initializeDifficulty(profile);
    expect(result.tempo).toBeLessThanOrEqual(80);
    expect(result.harmonicComplexity).toBeLessThanOrEqual(0.2);
    expect(result.rhythmicDensity).toBeLessThanOrEqual(0.2);
  });

  it('converts high skill profile to harder parameters', () => {
    const profile = makeSkillProfile({
      [SkillDimension.Speed]: 0.9,
      [SkillDimension.HarmonicComplexity]: 0.9,
      [SkillDimension.TechniqueRange]: 0.9,
    });
    const result = initializeDifficulty(profile);
    expect(result.tempo).toBeGreaterThan(100);
    expect(result.harmonicComplexity).toBeGreaterThan(0.5);
    expect(result.rhythmicDensity).toBeGreaterThan(0.5);
  });
});

describe('computeAdjustment', () => {
  const defaultParams = { ...DEFAULT_DIFFICULTY };
  const profile = makeSkillProfile();

  it('returns null for GrowthZone', () => {
    const result = computeAdjustment(GrowthZoneStatus.GrowthZone, defaultParams, profile, 0.72);
    expect(result).toBeNull();
  });

  it('returns increase direction for TooEasy', () => {
    const result = computeAdjustment(GrowthZoneStatus.TooEasy, defaultParams, profile, 0.95);
    expect(result).not.toBeNull();
    expect(result!.direction).toBe('increase');
  });

  it('returns decrease direction for TooHard', () => {
    const result = computeAdjustment(GrowthZoneStatus.TooHard, defaultParams, profile, 0.3);
    expect(result).not.toBeNull();
    expect(result!.direction).toBe('decrease');
  });

  it('adjusts only one parameter at a time', () => {
    const result = computeAdjustment(GrowthZoneStatus.TooEasy, defaultParams, profile, 0.95);
    expect(result).not.toBeNull();
    // Only one parameter should be specified
    expect(typeof result!.parameter).toBe('string');
    expect(result!.magnitude).toBeGreaterThan(0);
  });

  it('magnitude is proportional to distance from zone', () => {
    const result95 = computeAdjustment(GrowthZoneStatus.TooEasy, defaultParams, null, 0.95);
    const result99 = computeAdjustment(GrowthZoneStatus.TooEasy, defaultParams, null, 0.99);
    expect(result95).not.toBeNull();
    expect(result99).not.toBeNull();
    // Higher accuracy should produce larger magnitude
    expect(result99!.magnitude).toBeGreaterThan(result95!.magnitude);
  });

  it('works with null skill profile', () => {
    const result = computeAdjustment(GrowthZoneStatus.TooEasy, defaultParams, null, 0.95);
    expect(result).not.toBeNull();
    expect(result!.direction).toBe('increase');
  });
});

describe('applyAdjustment', () => {
  it('increases tempo when direction is increase', () => {
    const params: DifficultyParameters = { ...DEFAULT_DIFFICULTY };
    const result = applyAdjustment(params, {
      parameter: 'tempo',
      direction: 'increase',
      magnitude: 10,
    });
    expect(result.tempo).toBe(params.tempo + 10);
  });

  it('decreases tempo when direction is decrease', () => {
    const params: DifficultyParameters = { ...DEFAULT_DIFFICULTY, tempo: 120 };
    const result = applyAdjustment(params, {
      parameter: 'tempo',
      direction: 'decrease',
      magnitude: 10,
    });
    expect(result.tempo).toBe(110);
  });

  it('clamps tempo to max limit', () => {
    const params: DifficultyParameters = { ...DEFAULT_DIFFICULTY, tempo: 235 };
    const result = applyAdjustment(params, {
      parameter: 'tempo',
      direction: 'increase',
      magnitude: 15,
    });
    expect(result.tempo).toBeLessThanOrEqual(240);
  });

  it('clamps tempo to min limit', () => {
    const params: DifficultyParameters = { ...DEFAULT_DIFFICULTY, tempo: 42 };
    const result = applyAdjustment(params, {
      parameter: 'tempo',
      direction: 'decrease',
      magnitude: 15,
    });
    expect(result.tempo).toBeGreaterThanOrEqual(40);
  });

  it('rounds tempo to integer', () => {
    const params: DifficultyParameters = { ...DEFAULT_DIFFICULTY };
    const result = applyAdjustment(params, {
      parameter: 'tempo',
      direction: 'increase',
      magnitude: 7.3,
    });
    expect(Number.isInteger(result.tempo)).toBe(true);
  });

  it('adjusts harmonicComplexity correctly', () => {
    const params: DifficultyParameters = { ...DEFAULT_DIFFICULTY };
    const result = applyAdjustment(params, {
      parameter: 'harmonicComplexity',
      direction: 'increase',
      magnitude: 0.1,
    });
    expect(result.harmonicComplexity).toBeCloseTo(params.harmonicComplexity + 0.1, 5);
  });

  it('does not mutate original params', () => {
    const params: DifficultyParameters = { ...DEFAULT_DIFFICULTY };
    const original = { ...params };
    applyAdjustment(params, { parameter: 'tempo', direction: 'increase', magnitude: 10 });
    expect(params).toEqual(original);
  });

  it('maintain direction does not change value', () => {
    const params: DifficultyParameters = { ...DEFAULT_DIFFICULTY };
    const result = applyAdjustment(params, {
      parameter: 'tempo',
      direction: 'maintain',
      magnitude: 0,
    });
    expect(result.tempo).toBe(params.tempo);
  });
});
