export { SkillDimension, GrowthZoneStatus } from './difficulty-types';
export type {
  DimensionScore,
  SkillProfile,
  SessionPerformanceData,
  DifficultyParameters,
  DifficultyAdjustment,
  DifficultyState,
  RepPerformance,
  AccuracyTrend,
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
