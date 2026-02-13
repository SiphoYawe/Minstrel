export const PROHIBITED_WORDS = [
  'wrong',
  'bad',
  'failed',
  'mistake',
  'error',
  'poor',
  'terrible',
  'awful',
  'incorrect',
  'failure',
] as const;

export const GROWTH_REFRAMES: Record<string, string> = {
  wrong: 'not yet there',
  mistake: 'opportunity',
  failed: 'in progress',
  error: 'area to develop',
  bad: 'developing',
  poor: 'emerging',
  terrible: 'early stage',
  awful: 'just starting',
  incorrect: 'not yet aligned',
  failure: 'growth point',
};

export const TRAJECTORY_TEMPLATES = [
  '{metric} went from {old} to {new} over {attempts} attempts. {encouragement}',
  'Not there yet — but the trajectory is clear: {data_point}',
  'This is exactly where improvement happens. {specific_feedback}',
  'Closing in: {metric} moved from {old} to {new}. {next_step}',
  '{metric} is developing. Current: {new}, started at: {old}. Keep pushing.',
] as const;

export interface GrowthMindsetValidation {
  isCompliant: boolean;
  violations: string[];
}

export function validateGrowthMindset(text: string): GrowthMindsetValidation {
  const lower = text.toLowerCase();
  const violations: string[] = [];

  for (const word of PROHIBITED_WORDS) {
    // Match whole words only to avoid false positives (e.g. "errors" in "errorStatus")
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches) {
      const reframe = GROWTH_REFRAMES[word];
      violations.push(
        `Found prohibited word "${word}" (${matches.length}x). Suggest: "${reframe}"`
      );
    }
  }

  return {
    isCompliant: violations.length === 0,
    violations,
  };
}
