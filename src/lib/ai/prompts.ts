import type { SessionContext } from './schemas';
import type { ReplayContext } from './schemas';
import type { DataSufficiency } from '@/features/coaching/context-builder';
import type { ContinuityContext } from '@/features/session/session-types';
import { getGenreTerminologyHints } from '@/features/coaching/genre-terminology';
import { formatContinuitySection } from '@/features/coaching/context-builder';

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
  sufficiency?: DataSufficiency,
  continuity?: ContinuityContext
): string {
  const continuitySection = continuity ? formatContinuitySection(continuity) : '';

  return [
    STUDIO_ENGINEER_BASE,
    '',
    formatGenreSection(context.genre ?? null),
    '',
    formatSessionBlock(context),
    '',
    formatSufficiencySection(sufficiency),
    '',
    continuitySection,
    continuitySection ? '' : '',
    "CRITICAL: Only reference data points present in the SESSION DATA above. If the user asks about something not covered by the data, say explicitly that you don't have enough information for that assessment yet.",
    'When referencing data, be precise: cite specific numbers, chord names, timestamps, and improvement deltas.',
    'Use structured formatting: ## for section headers, - for bullet points. Key advice should use [TIP:...] markers.',
    'If data sufficiency is limited, acknowledge it: "I only have [N] notes to work with so far. Here\'s what I can see..."',
    '',
    'CHAT INSTRUCTIONS:',
    "- Answer the musician's question using the session data above.",
    '- Keep responses under 150 words unless the question demands detail.',
    '- If asked about something outside the session data, acknowledge the limitation.',
    '',
    'RICH RESPONSE MARKERS (use these to embed inline visualizations when relevant):',
    '- [CHORD:Dm7] — shows a mini piano keyboard with the chord highlighted',
    '- [SCALE:D_dorian] — shows a one-octave keyboard with scale notes highlighted',
    '- [TIMING:early,onTime,late] — shows a timing distribution bar (use integers, e.g. [TIMING:15,70,15])',
    '- [TIP:Your practice tip text here] — renders a styled practice tip callout',
    '- [DRILL:Drill Name|target skill] — renders a drill suggestion card with a start button',
    '- Use these sparingly — only when a visual would genuinely help. Not every response needs markers.',
    '- Place markers on their own line for best rendering.',
    continuitySection
      ? '- When the user asks about progress or history, reference the CROSS-SESSION HISTORY above.'
      : '',
  ].join('\n');
}

/**
 * Build the system prompt for the drill generation endpoint.
 */
export function buildDrillSystemPrompt(
  context: SessionContext,
  continuity?: ContinuityContext
): string {
  const continuitySection = continuity ? formatContinuitySection(continuity) : '';

  return [
    STUDIO_ENGINEER_BASE,
    '',
    formatGenreSection(context.genre ?? null),
    '',
    formatSessionBlock(context),
    '',
    continuitySection,
    continuitySection ? '' : '',
    'DRILL GENERATION INSTRUCTIONS:',
    '- Generate a targeted drill that addresses the specified weakness.',
    '- The drill should be achievable at the current difficulty level but push the edge.',
    '- Include specific notes, chords, and tempo targets.',
    '- Success criteria should be measurable via MIDI analysis.',
    '- Frame the drill as a growth opportunity, not a punishment.',
    continuity && continuity.rankedWeaknesses.length > 0
      ? `- PRIORITY: Focus on these ranked weaknesses from recent sessions: ${continuity.rankedWeaknesses
          .slice(0, 3)
          .map((w) => w.skill)
          .join(', ')}.`
      : '',
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

function formatReplayMomentBlock(context: ReplayContext): string {
  const lines: string[] = [`REPLAY MOMENT DATA (at ${context.timestampFormatted}):`];

  if (context.notesAtMoment.length > 0)
    lines.push(`NOTES AT MOMENT: ${context.notesAtMoment.join(', ')}`);
  else lines.push('NOTES AT MOMENT: (silence)');

  if (context.chordAtMoment) lines.push(`CHORD AT MOMENT: ${context.chordAtMoment}`);
  if (context.key) lines.push(`KEY: ${context.key}`);
  if (context.tempo) lines.push(`TEMPO: ${context.tempo} BPM`);

  const pct = Number.isFinite(context.timingAccuracy)
    ? (context.timingAccuracy * 100).toFixed(0)
    : '0';
  lines.push(`TIMING ACCURACY (window): ${pct}%`);

  if (context.chordProgression.length > 0)
    lines.push(`CHORD PROGRESSION (leading up): ${context.chordProgression.join(' → ')}`);

  if (context.nearbySnapshots.length > 0) {
    lines.push(`NEARBY ANALYSIS SNAPSHOTS (${context.nearbySnapshots.length}):`);
    for (const snap of context.nearbySnapshots) {
      lines.push(`  [${snap.insightCategory}] ${snap.keyInsight}`);
    }
  }

  lines.push(
    `CONTEXT WINDOW: ±${Math.round(context.windowMs / 1000)}s around ${context.timestampFormatted}`
  );

  return lines.join('\n');
}

/**
 * Build the system prompt for replay-mode chat (timestamp-specific questions).
 */
export function buildReplayChatSystemPrompt(context: ReplayContext): string {
  return [
    STUDIO_ENGINEER_BASE,
    '',
    'REPLAY MODE INSTRUCTIONS:',
    `You are analyzing a specific recorded moment at timestamp ${context.timestampFormatted}.`,
    'Reference ONLY the data from this exact moment and the surrounding context window.',
    'Do not make claims about the entire session unless explicitly asked.',
    'If the data at this moment is insufficient to answer, say so explicitly.',
    'When the musician asks about timing, reference actual deviations.',
    'When the musician asks about harmony, reference the detected key, chord, and note names.',
    'When comparing multiple moments, explicitly cite both timestamps.',
    '',
    formatGenreSection(context.genre ?? null),
    '',
    formatReplayMomentBlock(context),
    '',
    'CHAT INSTRUCTIONS:',
    "- Answer the musician's question about THIS specific moment using the data above.",
    '- Keep responses under 150 words unless the question demands detail.',
    '- Be precise: cite specific note names, chord quality, timestamps, and data.',
    '- If asked about something outside the replay moment data, acknowledge the limitation.',
  ].join('\n');
}

export { STUDIO_ENGINEER_BASE };
