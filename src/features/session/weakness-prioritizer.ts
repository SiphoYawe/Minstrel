/**
 * Weakness Prioritizer — Layer 3 Domain Logic (Story 6.4)
 *
 * Ranks weaknesses from recent sessions by recency and severity.
 * Used to feed the drill generator with the highest-priority areas to target.
 * No framework imports — pure domain logic.
 */

import type { ContinuitySessionSummary, RankedWeakness } from './session-types';

/**
 * Recency decay: sessions from today get 1.0, yesterday 0.8, etc.
 * Exponential decay with base 0.8 per day.
 */
function recencyScore(sessionDate: string, now: Date): number {
  const sessionTime = new Date(sessionDate).getTime();
  const daysAgo = (now.getTime() - sessionTime) / (1000 * 60 * 60 * 24);
  return Math.pow(0.8, Math.max(0, daysAgo));
}

/**
 * Detect trend for a skill across sessions (most recent first).
 * Looks at whether the skill appeared in progressively fewer recent sessions
 * (improving) or more (declining).
 */
function detectTrend(
  skill: string,
  sessions: ContinuitySessionSummary[]
): 'improving' | 'stable' | 'declining' {
  if (sessions.length < 2) return 'stable';

  // Check timing accuracy trend if this is a timing-related weakness
  const isTimingRelated =
    skill.toLowerCase().includes('timing') || skill.toLowerCase().includes('rhythm');
  if (isTimingRelated) {
    const accuracies = sessions
      .filter((s) => s.timingAccuracy !== null)
      .map((s) => s.timingAccuracy!);
    if (accuracies.length >= 2) {
      const recent = accuracies[0];
      const older = accuracies[accuracies.length - 1];
      const delta = recent - older;
      if (delta > 0.05) return 'improving';
      if (delta < -0.05) return 'declining';
      return 'stable';
    }
  }

  // For general weaknesses, count appearances in recent vs older sessions
  const halfIdx = Math.floor(sessions.length / 2);
  const recentHalf = sessions.slice(0, halfIdx || 1);
  const olderHalf = sessions.slice(halfIdx || 1);

  const recentCount = recentHalf.filter((s) =>
    s.weaknessAreas.some((w) => w.toLowerCase() === skill.toLowerCase())
  ).length;
  const olderCount = olderHalf.filter((s) =>
    s.weaknessAreas.some((w) => w.toLowerCase() === skill.toLowerCase())
  ).length;

  const recentRate = recentCount / recentHalf.length;
  const olderRate = olderCount / Math.max(1, olderHalf.length);

  if (recentRate < olderRate - 0.2) return 'improving';
  if (recentRate > olderRate + 0.2) return 'declining';
  return 'stable';
}

/**
 * Prioritize weaknesses from recent sessions for drill selection.
 *
 * Score = (recencyWeight * recencyScore) + (severityWeight * severityScore)
 * Weaknesses showing improvement get a 0.5x multiplier.
 *
 * @param sessions - Recent sessions ordered most-recent first
 * @returns Ranked weaknesses sorted by priority (highest first)
 */
export function prioritizeWeaknesses(sessions: ContinuitySessionSummary[]): RankedWeakness[] {
  if (sessions.length === 0) return [];

  const now = new Date();
  const RECENCY_WEIGHT = 0.6;
  const SEVERITY_WEIGHT = 0.4;
  const IMPROVING_MULTIPLIER = 0.5;

  // Collect all unique weaknesses with their metadata
  const weaknessMap = new Map<
    string,
    { lastDate: string; sessionCount: number; totalRecency: number }
  >();

  for (const session of sessions) {
    for (const weakness of session.weaknessAreas) {
      const key = weakness.toLowerCase();
      const existing = weaknessMap.get(key);
      const rec = recencyScore(session.date, now);

      if (!existing) {
        weaknessMap.set(key, {
          lastDate: session.date,
          sessionCount: 1,
          totalRecency: rec,
        });
      } else {
        existing.sessionCount++;
        existing.totalRecency += rec;
        // Keep the most recent date
        if (session.date > existing.lastDate) {
          existing.lastDate = session.date;
        }
      }
    }
  }

  const ranked: Array<RankedWeakness & { score: number }> = [];

  for (const [skill, data] of weaknessMap) {
    const avgRecency = data.totalRecency / data.sessionCount;
    // Severity: how frequently this weakness appears across sessions
    const severityScore = Math.min(1, data.sessionCount / sessions.length);
    const trend = detectTrend(skill, sessions);

    let score = RECENCY_WEIGHT * avgRecency + SEVERITY_WEIGHT * severityScore;
    if (trend === 'improving') {
      score *= IMPROVING_MULTIPLIER;
    }

    ranked.push({
      skill,
      severity: severityScore,
      lastSessionDate: data.lastDate,
      trend,
      score,
    });
  }

  // Sort by score descending
  ranked.sort((a, b) => b.score - a.score);

  // Return without the internal score field
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return ranked.map(({ score, ...rest }) => rest);
}
