export { SkillDimension } from './difficulty-types';
export type { DimensionScore, SkillProfile, SessionPerformanceData } from './difficulty-types';
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
