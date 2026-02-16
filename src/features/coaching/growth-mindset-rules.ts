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
  "can't",
  'never',
  'impossible',
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
  "can't": "haven't yet",
  never: 'not yet',
  impossible: 'challenging',
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

/**
 * Replace prohibited words with growth mindset alternatives.
 * Uses word-boundary-aware regex to avoid partial matches.
 * AI-L6: Handles contractions (e.g. "can't") by escaping special regex
 * characters and using appropriate boundary patterns.
 */
export function replaceProhibitedWords(text: string): string {
  let result = text;
  for (const [word, reframe] of Object.entries(GROWTH_REFRAMES)) {
    // Escape special regex characters (e.g. apostrophe in "can't")
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Use \b for word boundary. For words with apostrophes, \b still works
    // because the word boundary is at the start letter before the apostrophe.
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    result = result.replace(regex, (match) => {
      // Preserve original casing pattern
      if (match === match.toUpperCase()) return reframe.toUpperCase();
      if (match[0] === match[0].toUpperCase())
        return reframe.charAt(0).toUpperCase() + reframe.slice(1);
      return reframe;
    });
  }
  return result;
}

/**
 * Creates a TransformStream that replaces prohibited words in streamed text.
 * Buffers partial words at chunk boundaries to handle splits by finding
 * the last word boundary (whitespace/punctuation) to split safely.
 */
export function createGrowthMindsetTransform(): TransformStream<string, string> {
  let buffer = '';
  // Min buffer size before we attempt to flush safe content
  const minBufferSize = Math.max(...PROHIBITED_WORDS.map((w) => w.length)) + 2;

  return new TransformStream({
    transform(chunk, controller) {
      buffer += chunk;

      if (buffer.length > minBufferSize) {
        // Find the last word boundary (space, punctuation, etc.) to split safely.
        // This ensures we never split in the middle of a word.
        const lastBoundary = findLastWordBoundary(buffer, minBufferSize);

        if (lastBoundary > 0) {
          const safe = buffer.slice(0, lastBoundary);
          buffer = buffer.slice(lastBoundary);
          controller.enqueue(replaceProhibitedWords(safe));
        }
      }
    },
    flush(controller) {
      if (buffer.length > 0) {
        controller.enqueue(replaceProhibitedWords(buffer));
        buffer = '';
      }
    },
  });
}

/**
 * Find the last word boundary position in text, ensuring at least
 * `reserveFromEnd` characters remain after the split point.
 * Returns 0 if no safe boundary is found.
 */
function findLastWordBoundary(text: string, reserveFromEnd: number): number {
  // Search from (text.length - reserveFromEnd) backwards for a word boundary
  const searchEnd = text.length - reserveFromEnd;
  for (let i = searchEnd; i >= 0; i--) {
    if (/\s/.test(text[i])) {
      // Split after the whitespace
      return i + 1;
    }
  }
  return 0;
}

export function validateGrowthMindset(text: string): GrowthMindsetValidation {
  const lower = text.toLowerCase();
  const violations: string[] = [];

  for (const word of PROHIBITED_WORDS) {
    // Match whole words only to avoid false positives (e.g. "errors" in "errorStatus")
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
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
