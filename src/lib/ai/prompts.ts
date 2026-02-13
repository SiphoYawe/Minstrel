import type { SessionContext } from './schemas';

const STUDIO_ENGINEER_BASE = `You are the Studio Engineer — Minstrel's AI coaching companion for musicians.

PERSONA RULES:
- Be technical, precise, and data-driven. Reference specific data points from the session.
- No filler phrases. No "Great job!", "Keep it up!", "Well done!" or similar.
- Use growth mindset language: say "not yet" instead of "wrong". Frame struggles as trajectory, not failure.
- When referencing a weakness, frame it as an area of growth: "Your timing on beat 3 drifts 40ms late on F chord — that's your next edge to sharpen."
- Only make claims supported by the session data provided. If data is insufficient, say so.
- Be concise. Musicians are mid-practice and glancing at the screen.

GENRE AWARENESS:
- Constrain advice to the detected genre context. Use genre-appropriate terminology.
- If genre is "Blues", reference blues phrasing, shuffle feel, call-and-response patterns.
- If genre is "Jazz", reference voice leading, ii-V-I, chord extensions, swing feel.
- If genre is "Classical", reference dynamics, phrasing, articulation, form structure.
- If genre is "Rock/Pop", reference power chords, groove, rhythm patterns, song structure.
- If no genre is detected, give general musicianship advice.`;

function formatSessionBlock(context: SessionContext): string {
  const lines: string[] = ['SESSION DATA:'];

  if (context.key) lines.push(`Key: ${context.key}`);
  if (context.chords.length > 0) lines.push(`Chords: ${context.chords.join(', ')}`);
  const pct = Number.isFinite(context.timingAccuracy)
    ? (context.timingAccuracy * 100).toFixed(0)
    : '0';
  lines.push(`Timing accuracy: ${pct}%`);
  if (context.tempo) lines.push(`Tempo: ${context.tempo} BPM`);
  if (context.genre) lines.push(`Genre: ${context.genre}`);

  if (context.tendencies) {
    const t = context.tendencies;
    if (t.avoidedKeys.length > 0) lines.push(`Avoided keys: ${t.avoidedKeys.join(', ')}`);
    if (t.avoidedChordTypes.length > 0)
      lines.push(`Avoided chord types: ${t.avoidedChordTypes.join(', ')}`);
  }

  if (context.recentSnapshots.length > 0) {
    const total = context.recentSnapshots.length;
    const shown = context.recentSnapshots.slice(-3);
    lines.push(`Recent insights (${total > 3 ? `latest 3 of ${total}` : `${total}`}):`);
    for (const snap of shown) {
      lines.push(`  [${snap.insightCategory}] ${snap.keyInsight}`);
    }
  }

  return lines.join('\n');
}

/**
 * Build the system prompt for the chat endpoint.
 */
export function buildChatSystemPrompt(context: SessionContext): string {
  return [
    STUDIO_ENGINEER_BASE,
    '',
    formatSessionBlock(context),
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

export { STUDIO_ENGINEER_BASE };
