/**
 * Session Continuity Service — Layer 3 Domain Logic (Story 6.4)
 *
 * Assembles cross-session context from session summaries.
 * Data-source agnostic: receives ContinuitySessionSummary[] regardless of
 * whether it came from Supabase, Dexie, or a merge of both.
 *
 * No framework or infrastructure imports. Pure domain logic.
 */

import type { ContinuitySessionSummary, ContinuityContext, WarmupContext } from './session-types';
import { prioritizeWeaknesses } from './weakness-prioritizer';

const MAX_RECENT_SESSIONS = 5;

/**
 * Merge and deduplicate session summaries from multiple sources.
 * Prefers Supabase data (more complete from sync) when duplicates exist.
 *
 * @param supabaseSessions - Sessions from Supabase (preferred)
 * @param dexieSessions - Sessions from Dexie (local)
 * @returns Merged, deduplicated list sorted most-recent first
 */
export function mergeSessionSummaries(
  supabaseSessions: ContinuitySessionSummary[],
  dexieSessions: ContinuitySessionSummary[]
): ContinuitySessionSummary[] {
  const seen = new Set<number>();
  const merged: ContinuitySessionSummary[] = [];

  // Supabase sessions take priority
  for (const session of supabaseSessions) {
    if (!seen.has(session.id)) {
      seen.add(session.id);
      merged.push(session);
    }
  }

  // Add local sessions not in Supabase
  for (const session of dexieSessions) {
    if (!seen.has(session.id)) {
      seen.add(session.id);
      merged.push(session);
    }
  }

  // Sort most-recent first
  merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return merged.slice(0, MAX_RECENT_SESSIONS);
}

/**
 * Compute a timing accuracy trend string from recent sessions.
 * Example: "72% → 78% → 83%"
 * Returns null if fewer than 2 sessions have timing data.
 */
function computeTimingTrend(sessions: ContinuitySessionSummary[]): string | null {
  const accuracies = sessions
    .filter((s) => s.timingAccuracy !== null)
    .map((s) => Math.round((s.timingAccuracy ?? 0) * 100));

  if (accuracies.length < 2) return null;

  // Sessions are most-recent-first; reverse for chronological order
  return accuracies.reverse().join('% → ') + '%';
}

/**
 * Build the cross-session continuity context for AI system prompts.
 * Enforces ~500 token budget by limiting to 5 sessions and trimming data.
 *
 * @param sessions - Recent sessions, most-recent first
 * @returns Structured continuity context
 */
export function buildContinuityContext(sessions: ContinuitySessionSummary[]): ContinuityContext {
  const limited = sessions.slice(0, MAX_RECENT_SESSIONS);

  const recentSessions = limited.map((s) => ({
    date: s.date,
    key: s.detectedKey,
    tempo: s.averageTempo,
    timingAccuracy: s.timingAccuracy,
    chordsUsed: s.chordsUsed.slice(0, 5), // cap per session
    keyInsight: s.keyInsight,
  }));

  const timingTrend = computeTimingTrend(limited);
  const lastInsight = limited[0]?.keyInsight ?? null;
  const rankedWeaknesses = prioritizeWeaknesses(limited);

  return {
    recentSessions,
    timingTrend,
    lastInsight,
    rankedWeaknesses,
  };
}

/**
 * Build the warm-up context from recent sessions.
 * Used by the warm-up generator to avoid redundant practice and
 * build on recent progress.
 *
 * @param sessions - Recent 1-2 sessions, most-recent first
 */
export function buildWarmupContext(sessions: ContinuitySessionSummary[]): WarmupContext {
  const recent = sessions.slice(0, 2);

  const recentKeys: string[] = [];
  const recentChordTypes: string[] = [];
  const recentSkillAreas: string[] = [];
  const improvingPatterns: string[] = [];

  for (const session of recent) {
    if (session.detectedKey && !recentKeys.includes(session.detectedKey)) {
      recentKeys.push(session.detectedKey);
    }
    for (const chord of session.chordsUsed) {
      if (!recentChordTypes.includes(chord)) {
        recentChordTypes.push(chord);
      }
    }
    for (const weakness of session.weaknessAreas) {
      if (!recentSkillAreas.includes(weakness)) {
        recentSkillAreas.push(weakness);
      }
    }
  }

  // Detect improving patterns from ranked weaknesses
  const ranked = prioritizeWeaknesses(sessions);
  for (const w of ranked) {
    if (w.trend === 'improving') {
      improvingPatterns.push(w.skill);
    }
  }

  return {
    recentKeys,
    recentChordTypes,
    recentSkillAreas,
    improvingPatterns,
  };
}
