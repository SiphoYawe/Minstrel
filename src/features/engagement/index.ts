export { StreakStatus, AchievementCategory } from './engagement-types';
export type {
  StreakData,
  ProgressMetricRow,
  XpBreakdown,
  SessionXpInput,
  TriggerContext,
  AchievementDefinition,
  UnlockedAchievement,
  AchievementDisplayItem,
} from './engagement-types';
export {
  isSessionMeaningful,
  calculateStreakUpdate,
  getStreakStatus,
  isSameCalendarDay,
  createEmptyStreak,
} from './streak-tracker';
export {
  calculateBaseXp,
  calculateTimingBonus,
  calculateDrillXp,
  calculateRecordXp,
  calculateSessionXp,
  formatXpBreakdown,
} from './xp-calculator';
export { evaluateAchievements, buildTriggerContext } from './achievement-engine';
export { achievementRegistry, ACHIEVEMENT_COUNT } from './achievement-definitions';
export {
  fetchUnlockedAchievements,
  saveUnlockedAchievements,
  fetchAchievementDisplay,
} from './achievement-service';
