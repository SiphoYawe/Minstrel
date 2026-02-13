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
export { TrendDimension, TrendDirection, TrendPeriod } from './engagement-types';
export type { TrendDataPoint, TrendLine, ProgressSummary, SessionMetric } from './engagement-types';
export { generateProgressSummary, computeTrendDirection, formatDelta } from './progress-aggregator';
export { fetchSessionMetrics, fetchSessionCount, fetchWeeklySummaryData } from './progress-service';
export type { WeeklySummary, WeeklyMetricDelta, WeeklyComparison } from './engagement-types';
export {
  computeWeeklySummary,
  getISOWeekBounds,
  calculateTotalPracticeTime,
  formatPracticeTime,
  identifyHighestImpactInsight,
} from './weekly-summary-generator';
export { PersonalRecordType } from './engagement-types';
export type {
  PersonalRecord,
  PersonalRecordWithHistory,
  RecordDetectionInput,
  RecordHistoryEntry,
} from './engagement-types';
export {
  detectNewRecords,
  applyNewRecords,
  updateRecordHistory,
  createEmptyRecordSet,
  formatNewRecord,
} from './record-tracker';
export { fetchPersonalRecords, saveNewRecords } from './record-service';
