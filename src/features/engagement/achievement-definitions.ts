/**
 * Achievement Definitions Registry — Layer 3 Domain Logic (Story 7.3)
 *
 * Static registry of all achievement definitions with pure trigger conditions.
 * Adding new achievements is a single file change here — no migrations needed.
 */

import {
  AchievementCategory,
  type AchievementDefinition,
  type AchievementRegistry,
  type TriggerContext,
} from './engagement-types';

// --- Genre Milestones ---

const genreAchievements: AchievementDefinition[] = [
  {
    achievementId: 'genre-first-jazz',
    name: 'First Jazz Voicing',
    description: 'Played your first dominant 7th chord.',
    category: AchievementCategory.Genre,
    icon: 'jazz',
    triggerCondition: (ctx: TriggerContext) =>
      ctx.chordsDetected.some((c) => /7|dom|dim/.test(c.toLowerCase())),
  },
  {
    achievementId: 'genre-blues-explorer',
    name: 'Blues Explorer',
    description: 'Detected blues patterns in your playing.',
    category: AchievementCategory.Genre,
    icon: 'blues',
    triggerCondition: (ctx: TriggerContext) =>
      ctx.detectedGenres.some((g) => g.toLowerCase() === 'blues'),
  },
  {
    achievementId: 'genre-pop-prodigy',
    name: 'Pop Prodigy',
    description: 'Played a classic I-V-vi-IV progression.',
    category: AchievementCategory.Genre,
    icon: 'pop',
    triggerCondition: (ctx: TriggerContext) =>
      ctx.detectedGenres.some((g) => g.toLowerCase() === 'pop'),
  },
  {
    achievementId: 'genre-classical-touch',
    name: 'Classical Touch',
    description: 'Classical patterns detected in your playing.',
    category: AchievementCategory.Genre,
    icon: 'classical',
    triggerCondition: (ctx: TriggerContext) =>
      ctx.detectedGenres.some((g) => g.toLowerCase() === 'classical'),
  },
  {
    achievementId: 'genre-rock-solid',
    name: 'Rock Solid',
    description: 'Rock patterns detected — power chords unlocked.',
    category: AchievementCategory.Genre,
    icon: 'rock',
    triggerCondition: (ctx: TriggerContext) =>
      ctx.detectedGenres.some((g) => g.toLowerCase() === 'rock'),
  },
];

// --- Technique Milestones ---

const techniqueAchievements: AchievementDefinition[] = [
  {
    achievementId: 'technique-perfect-10',
    name: 'Perfect Timing 10x',
    description: '10 consecutive notes within beat grid tolerance.',
    category: AchievementCategory.Technique,
    icon: 'precision',
    triggerCondition: (ctx: TriggerContext) => ctx.consecutivePerfectReps >= 10,
  },
  {
    achievementId: 'technique-smooth-operator',
    name: 'Smooth Operator',
    description: 'Chord transition under 200ms.',
    category: AchievementCategory.Technique,
    icon: 'smooth',
    triggerCondition: (ctx: TriggerContext) =>
      ctx.fastestChordTransitionMs !== undefined && ctx.fastestChordTransitionMs < 200,
  },
  {
    achievementId: 'technique-accuracy-90',
    name: 'Ninety Percent Club',
    description: 'Achieved 90% timing accuracy in a session.',
    category: AchievementCategory.Technique,
    icon: 'target',
    triggerCondition: (ctx: TriggerContext) => ctx.timingAccuracy >= 0.9,
  },
  {
    achievementId: 'technique-note-500',
    name: 'Half a Thousand',
    description: 'Played 500 notes in a single session.',
    category: AchievementCategory.Technique,
    icon: 'notes',
    triggerCondition: (ctx: TriggerContext) => ctx.totalNotesPlayed >= 500,
  },
  {
    achievementId: 'technique-drill-master',
    name: 'Drill Master',
    description: 'Completed 5 drills successfully.',
    category: AchievementCategory.Technique,
    icon: 'drill',
    triggerCondition: (ctx: TriggerContext) => ctx.drillsPassed >= 5,
  },
];

// --- Consistency Milestones ---

const consistencyAchievements: AchievementDefinition[] = [
  {
    achievementId: 'consistency-first-week',
    name: 'First Week',
    description: '7-day practice streak.',
    category: AchievementCategory.Consistency,
    icon: 'calendar',
    triggerCondition: (ctx: TriggerContext) => ctx.currentStreak >= 7 || ctx.bestStreak >= 7,
  },
  {
    achievementId: 'consistency-month-strong',
    name: 'Month Strong',
    description: '30-day practice streak.',
    category: AchievementCategory.Consistency,
    icon: 'calendar',
    triggerCondition: (ctx: TriggerContext) => ctx.currentStreak >= 30 || ctx.bestStreak >= 30,
  },
  {
    achievementId: 'consistency-century',
    name: 'Century',
    description: '100-day practice streak.',
    category: AchievementCategory.Consistency,
    icon: 'calendar',
    triggerCondition: (ctx: TriggerContext) => ctx.currentStreak >= 100 || ctx.bestStreak >= 100,
  },
  {
    achievementId: 'consistency-yearly-devotion',
    name: 'Yearly Devotion',
    description: '365-day practice streak.',
    category: AchievementCategory.Consistency,
    icon: 'calendar',
    triggerCondition: (ctx: TriggerContext) => ctx.currentStreak >= 365 || ctx.bestStreak >= 365,
  },
  {
    achievementId: 'consistency-thousand-xp',
    name: 'Thousand Club',
    description: 'Accumulated 1,000 XP through practice.',
    category: AchievementCategory.Consistency,
    icon: 'xp',
    triggerCondition: (ctx: TriggerContext) => ctx.lifetimeXp >= 1000,
  },
  {
    achievementId: 'consistency-10-sessions',
    name: 'Getting Started',
    description: 'Completed 10 practice sessions.',
    category: AchievementCategory.Consistency,
    icon: 'sessions',
    triggerCondition: (ctx: TriggerContext) => ctx.lifetimeSessions >= 10,
  },
];

// --- Personal Record Milestones ---

const personalRecordAchievements: AchievementDefinition[] = [
  {
    achievementId: 'record-speed-demon',
    name: 'Speed Demon',
    description: 'Set a new tempo personal record.',
    category: AchievementCategory.PersonalRecord,
    icon: 'speed',
    triggerCondition: (ctx: TriggerContext) =>
      ctx.newRecordTypes?.includes('fastest_tempo') ?? false,
  },
  {
    achievementId: 'record-accuracy-king',
    name: 'Accuracy King',
    description: 'Set a new timing accuracy record.',
    category: AchievementCategory.PersonalRecord,
    icon: 'accuracy',
    triggerCondition: (ctx: TriggerContext) =>
      ctx.newRecordTypes?.includes('best_accuracy') ?? false,
  },
  {
    achievementId: 'record-complexity-up',
    name: 'Complexity Up',
    description: 'Set a new harmonic complexity record.',
    category: AchievementCategory.PersonalRecord,
    icon: 'complexity',
    triggerCondition: (ctx: TriggerContext) =>
      ctx.newRecordTypes?.includes('harmonic_complexity') ?? false,
  },
];

// --- Registry Assembly ---

const allAchievements: AchievementDefinition[] = [
  ...genreAchievements,
  ...techniqueAchievements,
  ...consistencyAchievements,
  ...personalRecordAchievements,
];

export const achievementRegistry: AchievementRegistry = new Map(
  allAchievements.map((a) => [a.achievementId, a])
);

export const ACHIEVEMENT_COUNT = allAchievements.length;
