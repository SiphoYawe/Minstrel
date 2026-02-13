import {
  GrowthZoneStatus,
  type DifficultyParameters,
  type DifficultyAdjustment,
  type SkillProfile,
  SkillDimension,
} from './difficulty-types';
import { GROWTH_ZONE } from './growth-zone-detector';

export const DEFAULT_DIFFICULTY: DifficultyParameters = {
  tempo: 80,
  harmonicComplexity: 0.2,
  keyDifficulty: 0.1,
  rhythmicDensity: 0.2,
  noteRange: 0.3,
};

const ADJUSTMENT_SCALE: Record<keyof DifficultyParameters, { min: number; max: number }> = {
  tempo: { min: 2, max: 15 },
  harmonicComplexity: { min: 0.05, max: 0.2 },
  keyDifficulty: { min: 0.05, max: 0.15 },
  rhythmicDensity: { min: 0.05, max: 0.2 },
  noteRange: { min: 0.05, max: 0.15 },
};

const PARAMETER_LIMITS: Record<keyof DifficultyParameters, { min: number; max: number }> = {
  tempo: { min: 40, max: 240 },
  harmonicComplexity: { min: 0.05, max: 1.0 },
  keyDifficulty: { min: 0.05, max: 1.0 },
  rhythmicDensity: { min: 0.05, max: 1.0 },
  noteRange: { min: 0.1, max: 1.0 },
};

// Priority order: tempo → harmonicComplexity → rhythmicDensity → keyDifficulty → noteRange
const ADJUSTMENT_PRIORITY: (keyof DifficultyParameters)[] = [
  'tempo',
  'harmonicComplexity',
  'rhythmicDensity',
  'keyDifficulty',
  'noteRange',
];

const SKILL_TO_PARAM: Record<SkillDimension, keyof DifficultyParameters> = {
  [SkillDimension.Speed]: 'tempo',
  [SkillDimension.HarmonicComplexity]: 'harmonicComplexity',
  [SkillDimension.TechniqueRange]: 'rhythmicDensity',
  [SkillDimension.TimingAccuracy]: 'tempo',
  [SkillDimension.GenreFamiliarity]: 'keyDifficulty',
};

export function initializeDifficulty(skillProfile: SkillProfile | null): DifficultyParameters {
  if (!skillProfile) return { ...DEFAULT_DIFFICULTY };

  const dims = skillProfile.dimensions;
  return {
    tempo: Math.round(60 + dims[SkillDimension.Speed].value * 120),
    harmonicComplexity: Math.max(0.1, dims[SkillDimension.HarmonicComplexity].value * 0.8),
    keyDifficulty: Math.max(0.05, dims[SkillDimension.HarmonicComplexity].value * 0.6),
    rhythmicDensity: Math.max(0.1, dims[SkillDimension.TechniqueRange].value * 0.8),
    noteRange: Math.max(0.15, dims[SkillDimension.TechniqueRange].value * 0.7),
  };
}

function selectParameterToAdjust(
  skillProfile: SkillProfile | null,
  currentParams: DifficultyParameters,
  direction: 'increase' | 'decrease'
): keyof DifficultyParameters {
  if (!skillProfile) return ADJUSTMENT_PRIORITY[0];

  // For increase: pick the parameter corresponding to the user's weakest skill dimension
  // For decrease: pick the parameter corresponding to the user's strongest dimension (back off from strength)
  const dims = skillProfile.dimensions;
  const sorted = Object.entries(dims).sort(
    (a, b) =>
      direction === 'increase'
        ? a[1].value - b[1].value // weakest first for increase
        : b[1].value - a[1].value // strongest first for decrease
  );

  for (const [dim] of sorted) {
    const param = SKILL_TO_PARAM[dim as SkillDimension];
    const limits = PARAMETER_LIMITS[param];
    const current = currentParams[param];
    if (direction === 'increase' && current < limits.max) return param;
    if (direction === 'decrease' && current > limits.min) return param;
  }

  // Fallback to first adjustable parameter in priority order
  return ADJUSTMENT_PRIORITY[0];
}

function computeMagnitude(
  averageAccuracy: number,
  direction: 'increase' | 'decrease',
  param: keyof DifficultyParameters
): number {
  const scale = ADJUSTMENT_SCALE[param];
  let distance: number;

  if (direction === 'increase') {
    // Distance above the too-easy threshold
    distance = Math.max(0, averageAccuracy - GROWTH_ZONE.TOO_EASY_THRESHOLD);
    const maxDistance = 1.0 - GROWTH_ZONE.TOO_EASY_THRESHOLD;
    const normalized = Math.min(1, distance / maxDistance);
    return scale.min + normalized * (scale.max - scale.min);
  } else {
    // Distance below the too-hard threshold
    distance = Math.max(0, GROWTH_ZONE.TOO_HARD_THRESHOLD - averageAccuracy);
    const maxDistance = GROWTH_ZONE.TOO_HARD_THRESHOLD;
    const normalized = Math.min(1, distance / maxDistance);
    return scale.min + normalized * (scale.max - scale.min);
  }
}

export function computeAdjustment(
  zoneStatus: GrowthZoneStatus,
  currentParams: DifficultyParameters,
  skillProfile: SkillProfile | null,
  averageAccuracy: number
): DifficultyAdjustment | null {
  if (zoneStatus === GrowthZoneStatus.GrowthZone) {
    return null;
  }

  const direction = zoneStatus === GrowthZoneStatus.TooEasy ? 'increase' : 'decrease';
  const param = selectParameterToAdjust(skillProfile, currentParams, direction);
  const magnitude = computeMagnitude(averageAccuracy, direction, param);

  return { parameter: param, direction, magnitude };
}

export function applyAdjustment(
  currentParams: DifficultyParameters,
  adjustment: DifficultyAdjustment
): DifficultyParameters {
  const newParams = { ...currentParams };
  const limits = PARAMETER_LIMITS[adjustment.parameter];

  if (adjustment.direction === 'increase') {
    newParams[adjustment.parameter] = Math.min(
      limits.max,
      currentParams[adjustment.parameter] + adjustment.magnitude
    );
  } else if (adjustment.direction === 'decrease') {
    newParams[adjustment.parameter] = Math.max(
      limits.min,
      currentParams[adjustment.parameter] - adjustment.magnitude
    );
  }

  // Round tempo to integer
  if (adjustment.parameter === 'tempo') {
    newParams.tempo = Math.round(newParams.tempo);
  }

  return newParams;
}
