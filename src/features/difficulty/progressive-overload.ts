import {
  SkillDimension,
  PROGRESSIVE_OVERLOAD_CONFIG,
  type SkillProfile,
  type DimensionScore,
  type DifficultyParameters,
  type DifficultyAdjustment,
  type OverloadStrategy,
} from './difficulty-types';
import { initializeDifficulty } from './difficulty-engine';

const {
  PLATEAU_SESSION_THRESHOLD,
  PLATEAU_IMPROVEMENT_THRESHOLD,
  MAX_INCREMENT_SCALE,
  BASE_INCREMENTS,
  RECALIBRATION_INTERVAL,
} = PROGRESSIVE_OVERLOAD_CONFIG;

const DIMENSION_TO_PARAM: Record<SkillDimension, keyof DifficultyParameters> = {
  [SkillDimension.Speed]: 'tempo',
  [SkillDimension.HarmonicComplexity]: 'harmonicComplexity',
  [SkillDimension.TechniqueRange]: 'rhythmicDensity',
  [SkillDimension.TimingAccuracy]: 'tempo',
  [SkillDimension.GenreFamiliarity]: 'keyDifficulty',
};

export function detectPlateaus(profileHistory: SkillProfile[]): Record<SkillDimension, boolean> {
  const result = {} as Record<SkillDimension, boolean>;
  for (const dim of Object.values(SkillDimension)) {
    result[dim] = isPlateaued(profileHistory, dim);
  }
  return result;
}

function isPlateaued(history: SkillProfile[], dimension: SkillDimension): boolean {
  if (history.length < PLATEAU_SESSION_THRESHOLD) return false;
  const recent = history.slice(-PLATEAU_SESSION_THRESHOLD);
  const first = recent[0].dimensions[dimension].value;
  const last = recent[recent.length - 1].dimensions[dimension].value;
  return Math.abs(last - first) < PLATEAU_IMPROVEMENT_THRESHOLD;
}

export function selectFocusDimension(
  skillProfile: SkillProfile,
  overloadStrategy: OverloadStrategy | null
): SkillDimension {
  const dims = skillProfile.dimensions;
  const plateauFlags = overloadStrategy?.plateauFlags ?? ({} as Record<SkillDimension, boolean>);

  // Sort dimensions by value ascending (weakest first), filter out plateaued and low-confidence
  const candidates = Object.entries(dims)
    .filter(([dim, score]) => {
      const d = dim as SkillDimension;
      if (plateauFlags[d]) return false;
      if (score.confidence < 0.2) return false;
      return true;
    })
    .sort((a, b) => a[1].value - b[1].value);

  if (candidates.length > 0) {
    return candidates[0][0] as SkillDimension;
  }

  // If all plateaued or low confidence, pick absolute weakest
  const allSorted = Object.entries(dims).sort((a, b) => a[1].value - b[1].value);
  return allSorted[0][0] as SkillDimension;
}

export function computeStabilityScale(growthZoneRatio: number): number {
  // growthZoneRatio: fraction of reps that were in the growth zone (0-1)
  // More stable = bigger step (capped at MAX_INCREMENT_SCALE)
  if (growthZoneRatio >= 0.8) return 1.2;
  if (growthZoneRatio >= 0.5) return 1.0;
  if (growthZoneRatio >= 0.3) return 0.7;
  return 0.5;
}

export function computeOverloadStep(
  skillProfile: SkillProfile,
  overloadStrategy: OverloadStrategy | null,
  growthZoneRatio: number
): DifficultyAdjustment {
  const focusDimension =
    overloadStrategy?.focusDimension ?? selectFocusDimension(skillProfile, overloadStrategy);
  const param = DIMENSION_TO_PARAM[focusDimension];
  const scale = Math.min(MAX_INCREMENT_SCALE, computeStabilityScale(growthZoneRatio));
  const magnitude = BASE_INCREMENTS[param] * scale;

  return {
    parameter: param,
    direction: 'increase',
    magnitude,
  };
}

export function handlePlateau(
  dimension: SkillDimension,
  currentStrategy: OverloadStrategy,
  skillProfile: SkillProfile
): OverloadStrategy {
  const newPlateauFlags = { ...currentStrategy.plateauFlags, [dimension]: true };

  // Switch focus to non-plateaued weakest dimension
  const newFocus = selectFocusDimension(skillProfile, {
    ...currentStrategy,
    plateauFlags: newPlateauFlags,
  });

  return {
    ...currentStrategy,
    focusDimension: newFocus,
    plateauFlags: newPlateauFlags,
    incrementScale: Math.max(0.5, currentStrategy.incrementScale * 0.8),
  };
}

export function reconcileProfiles(local: SkillProfile, server: SkillProfile): SkillProfile {
  const merged: SkillProfile = {
    userId: server.userId ?? local.userId,
    profileVersion: Math.max(local.profileVersion, server.profileVersion),
    lastAssessedAt:
      local.lastAssessedAt > server.lastAssessedAt ? local.lastAssessedAt : server.lastAssessedAt,
    dimensions: {} as Record<SkillDimension, DimensionScore>,
  };

  for (const dim of Object.values(SkillDimension)) {
    const localDim = local.dimensions[dim];
    const serverDim = server.dimensions[dim];
    merged.dimensions[dim] = localDim.lastUpdated > serverDim.lastUpdated ? localDim : serverDim;
  }

  return merged;
}

export function createInitialOverloadStrategy(
  skillProfile: SkillProfile,
  profileHistory: SkillProfile[]
): OverloadStrategy {
  const plateauFlags = detectPlateaus(profileHistory);
  const focusDimension = selectFocusDimension(skillProfile, {
    focusDimension: SkillDimension.TimingAccuracy,
    incrementScale: 1.0,
    plateauFlags,
    sessionsSinceLastRecalibration: 0,
  });

  return {
    focusDimension,
    incrementScale: 1.0,
    plateauFlags,
    sessionsSinceLastRecalibration: 0,
  };
}

export function needsRecalibration(strategy: OverloadStrategy): boolean {
  return strategy.sessionsSinceLastRecalibration >= RECALIBRATION_INTERVAL;
}

export function computeStartingParameters(
  skillProfile: SkillProfile | null,
  overloadStep: DifficultyAdjustment | null
): DifficultyParameters {
  const base = initializeDifficulty(skillProfile);
  if (!overloadStep) return base;

  const param = overloadStep.parameter;
  return {
    ...base,
    [param]:
      param === 'tempo'
        ? Math.round(base[param] + overloadStep.magnitude)
        : base[param] + overloadStep.magnitude,
  };
}
