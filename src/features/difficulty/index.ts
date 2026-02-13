export { SkillDimension, GrowthZoneStatus } from './difficulty-types';
export { PROGRESSIVE_OVERLOAD_CONFIG } from './difficulty-types';
export type {
  DimensionScore,
  SkillProfile,
  SessionPerformanceData,
  DifficultyParameters,
  DifficultyAdjustment,
  DifficultyState,
  RepPerformance,
  AccuracyTrend,
  OverloadStrategy,
  RecalibrationResult,
} from './difficulty-types';
export {
  createSkillProfile,
  blendProfiles,
  updateConfidence,
  assessTimingAccuracy,
  assessHarmonicComplexity,
  assessTechniqueRange,
  assessSpeed,
  assessGenreFamiliarity,
} from './skill-assessor';
export {
  initializeDifficulty,
  computeAdjustment,
  applyAdjustment,
  DEFAULT_DIFFICULTY,
} from './difficulty-engine';
export {
  detectZone,
  isTooEasy,
  isTooHard,
  isInGrowthZone,
  getAccuracyTrend,
  GROWTH_ZONE,
} from './growth-zone-detector';
export {
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
