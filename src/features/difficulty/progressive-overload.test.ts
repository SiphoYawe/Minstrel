// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  detectPlateaus,
  selectFocusDimension,
  computeOverloadStep,
  computeStabilityScale,
  handlePlateau,
  reconcileProfiles,
  createInitialOverloadStrategy,
  needsRecalibration,
  computeStartingParameters,
} from './progressive-overload';
import {
  SkillDimension,
  type SkillProfile,
  type DimensionScore,
  type OverloadStrategy,
  PROGRESSIVE_OVERLOAD_CONFIG,
} from './difficulty-types';
import { DEFAULT_DIFFICULTY } from './difficulty-engine';

function makeDimScore(value: number, confidence = 0.5, dataPoints = 10): DimensionScore {
  return { value, confidence, dataPoints, lastUpdated: new Date().toISOString() };
}

function makeProfile(
  overrides: Partial<Record<SkillDimension, number>> = {},
  lastUpdated?: string
): SkillProfile {
  const defaults: Record<SkillDimension, number> = {
    [SkillDimension.TimingAccuracy]: 0.5,
    [SkillDimension.HarmonicComplexity]: 0.5,
    [SkillDimension.TechniqueRange]: 0.5,
    [SkillDimension.Speed]: 0.5,
    [SkillDimension.GenreFamiliarity]: 0.5,
  };
  const merged = { ...defaults, ...overrides };
  const dims = {} as Record<SkillDimension, DimensionScore>;
  for (const [dim, value] of Object.entries(merged)) {
    dims[dim as SkillDimension] = {
      ...makeDimScore(value),
      lastUpdated: lastUpdated ?? new Date().toISOString(),
    };
  }
  return {
    userId: 'test',
    profileVersion: 1,
    lastAssessedAt: lastUpdated ?? new Date().toISOString(),
    dimensions: dims,
  };
}

function makeStrategy(overrides: Partial<OverloadStrategy> = {}): OverloadStrategy {
  return {
    focusDimension: SkillDimension.TimingAccuracy,
    incrementScale: 1.0,
    plateauFlags: {
      [SkillDimension.TimingAccuracy]: false,
      [SkillDimension.HarmonicComplexity]: false,
      [SkillDimension.TechniqueRange]: false,
      [SkillDimension.Speed]: false,
      [SkillDimension.GenreFamiliarity]: false,
    },
    sessionsSinceLastRecalibration: 0,
    ...overrides,
  };
}

describe('detectPlateaus', () => {
  it('returns all false with fewer than 3 profiles', () => {
    const history = [makeProfile(), makeProfile()];
    const result = detectPlateaus(history);
    expect(Object.values(result).every((v) => v === false)).toBe(true);
  });

  it('detects plateau when dimension value barely changes', () => {
    const history = [
      makeProfile({ [SkillDimension.Speed]: 0.5 }),
      makeProfile({ [SkillDimension.Speed]: 0.505 }),
      makeProfile({ [SkillDimension.Speed]: 0.51 }),
    ];
    const result = detectPlateaus(history);
    expect(result[SkillDimension.Speed]).toBe(true);
  });

  it('does not flag dimension with meaningful improvement', () => {
    const history = [
      makeProfile({ [SkillDimension.Speed]: 0.5 }),
      makeProfile({ [SkillDimension.Speed]: 0.55 }),
      makeProfile({ [SkillDimension.Speed]: 0.6 }),
    ];
    const result = detectPlateaus(history);
    expect(result[SkillDimension.Speed]).toBe(false);
  });
});

describe('selectFocusDimension', () => {
  it('selects weakest non-plateaued dimension', () => {
    const profile = makeProfile({
      [SkillDimension.TimingAccuracy]: 0.8,
      [SkillDimension.HarmonicComplexity]: 0.3,
      [SkillDimension.TechniqueRange]: 0.6,
      [SkillDimension.Speed]: 0.7,
      [SkillDimension.GenreFamiliarity]: 0.4,
    });
    const result = selectFocusDimension(profile, null);
    expect(result).toBe(SkillDimension.HarmonicComplexity);
  });

  it('skips plateaued dimensions', () => {
    const profile = makeProfile({
      [SkillDimension.HarmonicComplexity]: 0.3,
      [SkillDimension.Speed]: 0.4,
    });
    const strategy = makeStrategy({
      plateauFlags: {
        [SkillDimension.TimingAccuracy]: false,
        [SkillDimension.HarmonicComplexity]: true,
        [SkillDimension.TechniqueRange]: false,
        [SkillDimension.Speed]: false,
        [SkillDimension.GenreFamiliarity]: false,
      },
    });
    const result = selectFocusDimension(profile, strategy);
    expect(result).not.toBe(SkillDimension.HarmonicComplexity);
  });

  it('falls back to absolute weakest if all plateaued', () => {
    const profile = makeProfile({
      [SkillDimension.TimingAccuracy]: 0.9,
      [SkillDimension.HarmonicComplexity]: 0.2,
    });
    const strategy = makeStrategy({
      plateauFlags: {
        [SkillDimension.TimingAccuracy]: true,
        [SkillDimension.HarmonicComplexity]: true,
        [SkillDimension.TechniqueRange]: true,
        [SkillDimension.Speed]: true,
        [SkillDimension.GenreFamiliarity]: true,
      },
    });
    const result = selectFocusDimension(profile, strategy);
    expect(result).toBe(SkillDimension.HarmonicComplexity);
  });
});

describe('computeStabilityScale', () => {
  it('returns 1.2 for 80%+ growth zone ratio', () => {
    expect(computeStabilityScale(0.85)).toBe(1.2);
  });

  it('returns 1.0 for 50-79% growth zone ratio', () => {
    expect(computeStabilityScale(0.65)).toBe(1.0);
  });

  it('returns 0.7 for 30-49% growth zone ratio', () => {
    expect(computeStabilityScale(0.4)).toBe(0.7);
  });

  it('returns 0.5 for below 30%', () => {
    expect(computeStabilityScale(0.15)).toBe(0.5);
  });
});

describe('computeOverloadStep', () => {
  it('produces increase direction', () => {
    const profile = makeProfile();
    const result = computeOverloadStep(profile, null, 0.7);
    expect(result.direction).toBe('increase');
  });

  it('adjusts only one parameter', () => {
    const profile = makeProfile();
    const result = computeOverloadStep(profile, null, 0.7);
    expect(typeof result.parameter).toBe('string');
    expect(result.magnitude).toBeGreaterThan(0);
  });

  it('scales increment with growth zone stability', () => {
    const profile = makeProfile();
    const low = computeOverloadStep(profile, null, 0.2);
    const high = computeOverloadStep(profile, null, 0.9);
    expect(high.magnitude).toBeGreaterThan(low.magnitude);
  });

  it('uses strategy focusDimension when available', () => {
    const profile = makeProfile();
    const strategy = makeStrategy({ focusDimension: SkillDimension.HarmonicComplexity });
    const result = computeOverloadStep(profile, strategy, 0.7);
    expect(result.parameter).toBe('harmonicComplexity');
  });
});

describe('handlePlateau', () => {
  it('flags the plateaued dimension', () => {
    const profile = makeProfile({
      [SkillDimension.Speed]: 0.8,
      [SkillDimension.HarmonicComplexity]: 0.3,
    });
    const strategy = makeStrategy({ focusDimension: SkillDimension.Speed });
    const result = handlePlateau(SkillDimension.Speed, strategy, profile);
    expect(result.plateauFlags[SkillDimension.Speed]).toBe(true);
  });

  it('switches focus to non-plateaued dimension', () => {
    const profile = makeProfile({
      [SkillDimension.Speed]: 0.8,
      [SkillDimension.HarmonicComplexity]: 0.3,
    });
    const strategy = makeStrategy({ focusDimension: SkillDimension.Speed });
    const result = handlePlateau(SkillDimension.Speed, strategy, profile);
    expect(result.focusDimension).not.toBe(SkillDimension.Speed);
  });

  it('reduces increment scale', () => {
    const strategy = makeStrategy({ incrementScale: 1.0 });
    const profile = makeProfile();
    const result = handlePlateau(SkillDimension.Speed, strategy, profile);
    expect(result.incrementScale).toBeLessThan(1.0);
  });
});

describe('reconcileProfiles', () => {
  it('takes most recent lastAssessedAt per dimension', () => {
    const local = makeProfile({ [SkillDimension.Speed]: 0.8 }, '2026-02-13T10:00:00Z');
    const server = makeProfile({ [SkillDimension.Speed]: 0.6 }, '2026-02-13T12:00:00Z');
    const result = reconcileProfiles(local, server);
    expect(result.dimensions[SkillDimension.Speed].value).toBe(0.6);
  });

  it('uses local when local is more recent', () => {
    const local = makeProfile({ [SkillDimension.Speed]: 0.8 }, '2026-02-13T14:00:00Z');
    const server = makeProfile({ [SkillDimension.Speed]: 0.6 }, '2026-02-13T12:00:00Z');
    const result = reconcileProfiles(local, server);
    expect(result.dimensions[SkillDimension.Speed].value).toBe(0.8);
  });

  it('preserves higher profileVersion', () => {
    const local = makeProfile();
    local.profileVersion = 3;
    const server = makeProfile();
    server.profileVersion = 5;
    const result = reconcileProfiles(local, server);
    expect(result.profileVersion).toBe(5);
  });
});

describe('createInitialOverloadStrategy', () => {
  it('returns strategy with no plateaus for new user', () => {
    const profile = makeProfile();
    const result = createInitialOverloadStrategy(profile, []);
    expect(Object.values(result.plateauFlags).every((v) => v === false)).toBe(true);
    expect(result.sessionsSinceLastRecalibration).toBe(0);
  });

  it('detects plateaus from history', () => {
    const history = [
      makeProfile({ [SkillDimension.Speed]: 0.5 }),
      makeProfile({ [SkillDimension.Speed]: 0.505 }),
      makeProfile({ [SkillDimension.Speed]: 0.51 }),
    ];
    const result = createInitialOverloadStrategy(history[2], history);
    expect(result.plateauFlags[SkillDimension.Speed]).toBe(true);
  });
});

describe('needsRecalibration', () => {
  it('returns true when sessions >= recalibration interval', () => {
    const strategy = makeStrategy({
      sessionsSinceLastRecalibration: PROGRESSIVE_OVERLOAD_CONFIG.RECALIBRATION_INTERVAL,
    });
    expect(needsRecalibration(strategy)).toBe(true);
  });

  it('returns false when sessions < recalibration interval', () => {
    const strategy = makeStrategy({ sessionsSinceLastRecalibration: 2 });
    expect(needsRecalibration(strategy)).toBe(false);
  });
});

describe('computeStartingParameters', () => {
  it('returns default parameters for null profile', () => {
    const result = computeStartingParameters(null, null);
    expect(result).toEqual(DEFAULT_DIFFICULTY);
  });

  it('applies overload step to base parameters', () => {
    const profile = makeProfile({ [SkillDimension.Speed]: 0.5 });
    const base = computeStartingParameters(profile, null);
    const withOverload = computeStartingParameters(profile, {
      parameter: 'tempo',
      direction: 'increase',
      magnitude: 5,
    });
    expect(withOverload.tempo).toBe(Math.round(base.tempo + 5));
  });

  it('does not modify non-overload parameters', () => {
    const profile = makeProfile();
    const base = computeStartingParameters(profile, null);
    const withOverload = computeStartingParameters(profile, {
      parameter: 'tempo',
      direction: 'increase',
      magnitude: 5,
    });
    expect(withOverload.harmonicComplexity).toBe(base.harmonicComplexity);
  });
});
