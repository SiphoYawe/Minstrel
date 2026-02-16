import {
  GrowthZoneStatus,
  type DifficultyParameters,
  type DifficultyAdjustment,
  type SkillProfile,
  SkillDimension,
} from './difficulty-types';
import { GROWTH_ZONE } from './growth-zone-detector';
import type { DrillSuccessCriteria } from '@/features/drills/drill-types';

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

// --- Human-readable parameter labels ---

const PARAM_LABELS: Record<keyof DifficultyParameters, string> = {
  tempo: 'tempo',
  harmonicComplexity: 'harmonic complexity',
  keyDifficulty: 'key difficulty',
  rhythmicDensity: 'rhythmic density',
  noteRange: 'note range',
};

/**
 * Generate a human-readable explanation for a difficulty adjustment.
 * Growth mindset framing: "We noticed X. Adjusting Y to keep you in the growth zone."
 */
export function explainAdjustment(
  adjustment: DifficultyAdjustment | null,
  zoneStatus: GrowthZoneStatus,
  averageAccuracy: number
): string | null {
  if (!adjustment) return null;

  const paramLabel = PARAM_LABELS[adjustment.parameter];
  const accuracyPct = Math.round(averageAccuracy * 100);

  if (adjustment.direction === 'increase') {
    return `We noticed your recent accuracy was ${accuracyPct}%. Increasing ${paramLabel} to keep you in the growth zone.`;
  }

  if (adjustment.direction === 'decrease') {
    return `We noticed your recent accuracy was ${accuracyPct}%. Easing ${paramLabel} to keep you in the growth zone.`;
  }

  return null;
}

/**
 * Describe the specific metrics that triggered a difficulty change.
 */
export function describeAdjustmentTriggers(
  adjustment: DifficultyAdjustment,
  previousParams: DifficultyParameters,
  newParams: DifficultyParameters
): string[] {
  const triggers: string[] = [];
  const param = adjustment.parameter;
  const label = PARAM_LABELS[param];
  const prev = previousParams[param];
  const next = newParams[param];

  if (param === 'tempo') {
    triggers.push(`${label}: ${Math.round(prev)} → ${Math.round(next)} BPM`);
  } else {
    triggers.push(`${label}: ${(prev * 100).toFixed(0)}% → ${(next * 100).toFixed(0)}%`);
  }

  return triggers;
}

/**
 * Derive success criteria from difficulty parameters.
 * Ensures that drill success criteria and the difficulty engine share
 * the same source of truth — no independent hardcoded values.
 */
export function deriveSuccessCriteria(params: DifficultyParameters): DrillSuccessCriteria {
  // Base timing threshold scales inversely with tempo difficulty
  // At 80 BPM → generous 80ms, at 200 BPM → tight 30ms
  const tempoNormalized =
    (params.tempo - PARAMETER_LIMITS.tempo.min) /
    (PARAMETER_LIMITS.tempo.max - PARAMETER_LIMITS.tempo.min);
  const timingThresholdMs = Math.round(80 - tempoNormalized * 50);

  // Accuracy target scales with complexity — more complex = slightly lower bar
  const complexity = (params.harmonicComplexity + params.rhythmicDensity) / 2;
  const accuracyTarget = Math.max(0.6, Math.min(0.95, 0.9 - complexity * 0.15));

  // Tempo tolerance scales with target tempo
  const tempoToleranceBpm = Math.round(Math.max(5, 15 - tempoNormalized * 10));

  return {
    timingThresholdMs: Math.max(20, timingThresholdMs),
    accuracyTarget: Math.round(accuracyTarget * 100) / 100,
    tempoToleranceBpm,
  };
}
