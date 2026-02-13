import type { SessionContext } from './schemas';
import type { DataSufficiency } from '@/features/coaching/context-builder';
import { getGenreTerminologyHints } from '@/features/coaching/genre-terminology';

const STUDIO_ENGINEER_BASE = `You are the Studio Engineer — Minstrel's AI coaching companion for musicians.

PERSONA RULES:
- Be technical, precise, and data-driven. Reference specific data points from the session.
- No filler phrases. No "Great job!", "Keep it up!", "Well done!" or similar.
- No cheerleading: warmth comes from precision and specificity, not praise.
- Every sentence must carry information. If it doesn't inform, remove it.
- When the musician struggles, increase specificity (coach energy).
- Use growth mindset language: say "not yet" instead of "wrong". Frame struggles as trajectory, not failure.
- When referencing a weakness, frame it as an area of growth: "Your timing on beat 3 drifts 40ms late on F chord — that's your next edge to sharpen."
- Only make claims supported by the session data provided. If data is insufficient, say so explicitly.
- Be concise. Musicians are mid-practice and glancing at the screen.

MANDATORY LANGUAGE RULES:
- NEVER use: "wrong", "bad", "failed", "mistake", "error", "poor", "terrible", "awful", "incorrect", "failure"
- ALWAYS use trajectory language: "not yet", "in progress", "closing in", "developing"
- When referencing struggles, ALWAYS include progress data: "Your timing went from X to Y"
- Frame every area of improvement as forward motion, not deficit
- If you must point out something that needs work, pair it with what IS working`;

function formatSessionBlock(context: SessionContext): string {
  const lines: string[] = [
    'SESSION DATA (reference these specific data points in your responses):',
  ];

  if (context.key) lines.push(`KEY: ${context.key}`);
  if (context.chords.length > 0) lines.push(`CHORDS PLAYED: ${context.chords.join(', ')}`);
  const pct = Number.isFinite(context.timingAccuracy)
    ? (context.timingAccuracy * 100).toFixed(0)
    : '0';
  lines.push(`TIMING ACCURACY: ${pct}%`);
  if (context.tempo) lines.push(`TEMPO: ${context.tempo} BPM`);
  if (context.genre) lines.push(`GENRE: ${context.genre}`);

  if (context.tendencies) {
    const t = context.tendencies;
    if (t.avoidedKeys.length > 0) lines.push(`AVOIDED KEYS: ${t.avoidedKeys.join(', ')}`);
    if (t.avoidedChordTypes.length > 0)
      lines.push(`AVOIDED CHORD TYPES: ${t.avoidedChordTypes.join(', ')}`);
    if (t.commonIntervals.length > 0)
      lines.push(`COMMON INTERVALS: ${t.commonIntervals.join(', ')}`);
  }

  if (context.recentSnapshots.length > 0) {
    const total = context.recentSnapshots.length;
    const shown = context.recentSnapshots.slice(-3);
    lines.push(`RECENT SNAPSHOTS (${total > 3 ? `latest 3 of ${total}` : `${total}`}):`);
    for (const snap of shown) {
      lines.push(`  [${snap.insightCategory}] ${snap.keyInsight}`);
    }
  }

  return lines.join('\n');
}

function formatGenreSection(genre: string | null): string {
  if (!genre) {
    return 'GENRE CONTEXT: No genre detected yet. Use neutral music theory terminology.';
  }

  const genreInstructions: Record<string, string> = {
    Blues:
      'Use blues terminology: 12-bar, turnaround, shuffle feel, blue note, call and response, bend.',
    Jazz: 'Use jazz terminology: ii-V-I, altered dominant, tritone substitution, voice leading, walking bass, comping, changes.',
    Pop: 'Use pop/rock terminology: verse-chorus, hook, riff, power chord, pentatonic.',
    Rock: 'Use rock terminology: power chord, pentatonic, riff, palm mute, drop tuning, groove.',
    Classical:
      'Use classical terminology: counterpoint, cadence, modulation, resolution, harmonic progression.',
  };

  const instructions = genreInstructions[genre] || `Genre: ${genre}. Use appropriate terminology.`;
  const hints = getGenreTerminologyHints(genre);
  const parts = [
    `GENRE CONTEXT: ${genre}`,
    instructions,
    `Constrain advice to ${genre} conventions. Do not suggest techniques from unrelated genres unless explicitly asked.`,
  ];
  if (hints) parts.push(hints);
  return parts.join('\n');
}

function formatSufficiencySection(sufficiency?: DataSufficiency): string {
  if (!sufficiency) return '';

  if (!sufficiency.hasSufficientData) {
    return `DATA SUFFICIENCY: LIMITED\nAvailable: ${sufficiency.availableInsights.join(', ') || 'None yet'}\nMissing: ${sufficiency.missingInsights.join(', ')}\nIf asked about missing areas, explain what data is needed.`;
  }

  if (sufficiency.missingInsights.length > 0) {
    return `DATA SUFFICIENCY: PARTIAL\nAvailable: ${sufficiency.availableInsights.join(', ')}\nNot yet available: ${sufficiency.missingInsights.join(', ')}`;
  }

  return '';
}

/**
 * Build the system prompt for the chat endpoint.
 */
export function buildChatSystemPrompt(
  context: SessionContext,
  sufficiency?: DataSufficiency
): string {
  return [
    STUDIO_ENGINEER_BASE,
    '',
    formatGenreSection(context.genre ?? null),
    '',
    formatSessionBlock(context),
    '',
    formatSufficiencySection(sufficiency),
    '',
    "CRITICAL: Only reference data points present in the SESSION DATA above. If the user asks about something not covered by the data, say explicitly that you don't have enough information for that assessment yet.",
    'When referencing data, be precise: cite specific numbers, chord names, timestamps, and improvement deltas.',
    'If data sufficiency is limited, acknowledge it: "I only have [N] notes to work with so far. Here\'s what I can see..."',
    '',
    'CHAT INSTRUCTIONS:',
    "- Answer the musician's question using the session data above.",
    '- Keep responses under 150 words unless the question demands detail.',
    '- If asked about something outside the session data, acknowledge the limitation.',
  ].join('\n');
}

/**
 * Build the system prompt for the drill generation endpoint.
 */
export function buildDrillSystemPrompt(context: SessionContext): string {
  return [
    STUDIO_ENGINEER_BASE,
    '',
    formatGenreSection(context.genre ?? null),
    '',
    formatSessionBlock(context),
    '',
    'DRILL GENERATION INSTRUCTIONS:',
    '- Generate a targeted drill that addresses the specified weakness.',
    '- The drill should be achievable at the current difficulty level but push the edge.',
    '- Include specific notes, chords, and tempo targets.',
    '- Success criteria should be measurable via MIDI analysis.',
    '- Frame the drill as a growth opportunity, not a punishment.',
  ].join('\n');
}

/**
 * Build the system prompt for the difficulty calibration endpoint.
 */
export function buildAnalysisSystemPrompt(context: SessionContext): string {
  return [
    STUDIO_ENGINEER_BASE,
    '',
    formatGenreSection(context.genre ?? null),
    '',
    formatSessionBlock(context),
    '',
    'ANALYSIS INSTRUCTIONS:',
    '- Assess the player across multiple skill dimensions based on session history.',
    '- Score each dimension 0–1 with a brief rationale grounded in the data.',
    '- Recommend a difficulty level (1–10) that keeps the player in their growth zone.',
    '- The growth zone is slightly above comfort — challenging but not overwhelming.',
    '- Provide a clear rationale for the recommended difficulty.',
  ].join('\n');
}

/**
 * Build the system prompt for cross-session recalibration.
 */
export function buildRecalibrationSystemPrompt(): string {
  return [
    STUDIO_ENGINEER_BASE,
    '',
    'RECALIBRATION INSTRUCTIONS:',
    "You are analyzing a musician's skill profile history across multiple sessions.",
    'Identify:',
    '1. Which skill dimension would benefit most from focused practice',
    '2. Whether any dimensions have plateaued (no meaningful improvement over 3+ sessions)',
    '3. Specific parameter adjustments for the next session',
    '',
    'Return structured recommendations. Be specific about musical context.',
    'Use growth mindset framing — plateaus are opportunities to try different approaches.',
    '',
    'Key constraints:',
    '- Only recommend focus on dimensions with sufficient confidence (>0.3)',
    '- Parameter adjustments should be incremental, not dramatic',
    '- If a dimension is plateaued, suggest switching focus rather than increasing intensity',
    '- Consider genre context when making recommendations',
  ].join('\n');
}

export { STUDIO_ENGINEER_BASE };
