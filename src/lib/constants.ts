export const APP_NAME = 'Minstrel';
export const APP_DESCRIPTION = 'AI-powered real-time MIDI practice companion';

// Analysis constants (Story 2.1)
export const SIMULTANEITY_WINDOW_MS = 50;
export const SILENCE_THRESHOLD_MS = 10_000;

// Timing analysis constants (Story 2.2 + Story 14.4 fixes)
export const ON_BEAT_TOLERANCE_MS = 30;
export const TEMPO_SHIFT_THRESHOLD = 0.1;
export const MIN_NOTES_FOR_TEMPO = 4;
export const MIN_BEATS_FOR_SHIFT = 8;
export const TIMING_ROLLING_WINDOW = 32;
export const TIMING_UPDATE_INTERVAL_MS = 500;
export const TIMING_UPDATE_NOTE_COUNT = 4;
export const MIN_IOI_MS = 200; // floor: 300 BPM → 200ms per beat
export const MAX_IOI_MS = 2000; // ceiling: 30 BPM → 2000ms per beat
export const MIN_CONSISTENT_INTERVALS = 8; // confidence threshold
export const MAX_BPM_DELTA = 3; // max BPM change per update for stability

// Harmonic analysis constants (Story 2.3)
export const PITCH_CLASS_ROLLING_WINDOW = 64;
export const KEY_DETECTION_CHORD_WINDOW = 8;

// Genre & tendency analysis constants (Story 2.4)
export const PATTERN_ANALYSIS_INTERVAL_MS = 30_000;
export const MIN_NOTES_FOR_TENDENCIES = 200;
export const MIN_CHORDS_FOR_TENDENCIES = 50;
export const AVOIDANCE_KEY_THRESHOLD = 0.02;
export const TEMPO_BUCKET_SIZE = 10;
export const TEMPO_BUCKET_MIN = 40;
export const TEMPO_BUCKET_MAX = 200;
export const ACCUMULATOR_MAX_NOTES = 2000;
export const ACCUMULATOR_MAX_CHORDS = 500;

// Snapshot overlay constants (Story 2.5)
export const SNAPSHOT_FADE_IN_MS = 300;
export const SNAPSHOT_FADE_OUT_MS = 200;

// Session recording constants (Story 2.8)
export const MAX_BUFFER_SIZE = 10_000;
export const AUTOSAVE_INTERVAL_MS = 30_000;
export const METADATA_UPDATE_INTERVAL_MS = 10_000;

// AI rate limiting constants (Story 4.1)
export const RATE_LIMIT_MAX = 100;
export const RATE_LIMIT_WINDOW_MS = 60_000;

// Replay constants (Story 6.2)
export const REPLAY_SPEEDS = [0.5, 1, 1.5, 2] as const;
export const SCRUB_STEP_SMALL_MS = 1000;
export const SCRUB_STEP_LARGE_MS = 10_000;

// Engagement / streak constants (Story 7.1)
export const MIN_MEANINGFUL_PRACTICE_MS = 180_000; // 3 minutes
export const STREAK_RESET_WINDOW_MS = 172_800_000; // 48 hours
export const STREAK_MILESTONES = [7, 30, 100, 365] as const;

// XP constants (Story 7.2)
export const XP_BASE_RATE_PER_MINUTE = 1;
export const XP_MIN_QUALIFYING_MINUTES = 3;
export const XP_TIMING_IMPROVEMENT_MULTIPLIER = 2;
export const XP_DRILL_COMPLETION_BONUS = 15;
export const XP_DRILL_ATTEMPT_BONUS = 5;
export const XP_NEW_RECORD_BONUS = 25;

// Progress trends constants (Story 7.4)
export const MIN_SESSIONS_FOR_TRENDS = 3;
export const TREND_PERIODS = { '7d': 7, '30d': 30, '90d': 90 } as const;
export const TREND_FLAT_THRESHOLD = 0.02;

// Weekly summary constants (Story 7.5)
export const WEEK_START_DAY = 1; // Monday (ISO 8601)

// Session end experience constants (Story 17.4)
export const SESSION_END_SILENCE_MS = 60_000; // 60 seconds before showing summary
export const GROWTH_MINDSET_MESSAGES = [
  'Every note you played today was a step forward.',
  "You showed up — that's the hardest part. The rest is momentum.",
  "Progress isn't always loud. Sometimes it's in the spaces between notes.",
  "Your ears are sharper than yesterday, even if it doesn't feel like it yet.",
  "The fact that you noticed what needs work means you're already improving.",
  'Consistency beats intensity. See you next session.',
  "Today's rough patches are tomorrow's breakthroughs.",
  "You're building muscle memory that compounds over time.",
  "Great musicians aren't born — they're built, one session at a time.",
  'The instrument remembers your effort, even when you forget.',
  'What felt hard today will feel natural soon.',
  "You practiced — that puts you ahead of everyone who didn't.",
] as const;

// Personal records constants (Story 7.6)
export const CLEAN_TEMPO_ACCURACY_THRESHOLD = 0.85;
export const RECORD_TYPES = {
  CleanTempo: { label: 'Clean Tempo', unit: 'BPM' },
  TimingAccuracy: { label: 'Timing Accuracy', unit: '%' },
  HarmonicComplexity: { label: 'Harmonic Complexity', unit: 'chords' },
  PracticeStreak: { label: 'Practice Streak', unit: 'days' },
} as const;
