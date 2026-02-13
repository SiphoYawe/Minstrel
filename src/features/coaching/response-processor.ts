import { validateGrowthMindset } from './growth-mindset-rules';

export interface DataReference {
  text: string;
  type: 'metric' | 'chord' | 'timing' | 'key';
  startIndex: number;
  endIndex: number;
}

export interface ProcessedResponse {
  content: string;
  dataReferences: DataReference[];
  growthMindsetCompliant: boolean;
}

// Patterns to detect data references in AI responses
const METRIC_PATTERN = /\b(\d{1,3}(?:\.\d+)?%)/g;
const TIMING_PATTERN = /\b(\d{1,4}\s*(?:ms|BPM|bpm))\b/g;
const CHORD_PATTERN = /\b([A-G][#b]?(?:maj|min|dim|aug|sus|add|m|M|7|9|11|13|°|ø)*(?:\d{0,2}))\b/g;
const KEY_PATTERN = /\b([A-G][#b]?\s+(?:major|minor))\b/gi;
const TRAJECTORY_PATTERN = /(\d+(?:\.\d+)?%?\s*(?:->|→|to)\s*\d+(?:\.\d+)?%?)/g;

export function processAiResponse(response: string): ProcessedResponse {
  const validation = validateGrowthMindset(response);
  const dataReferences = extractDataReferences(response);

  return {
    content: response,
    dataReferences,
    growthMindsetCompliant: validation.isCompliant,
  };
}

function extractDataReferences(text: string): DataReference[] {
  const refs: DataReference[] = [];
  const seen = new Set<string>();

  function addMatches(pattern: RegExp, type: DataReference['type']) {
    let match: RegExpExecArray | null;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(text)) !== null) {
      const key = `${match.index}-${match[0]}`;
      if (!seen.has(key)) {
        seen.add(key);
        refs.push({
          text: match[0],
          type,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        });
      }
    }
  }

  // Extract in priority order (more specific patterns first)
  addMatches(TRAJECTORY_PATTERN, 'timing');
  addMatches(KEY_PATTERN, 'key');
  addMatches(TIMING_PATTERN, 'timing');
  addMatches(METRIC_PATTERN, 'metric');
  addMatches(CHORD_PATTERN, 'chord');

  return refs.sort((a, b) => a.startIndex - b.startIndex);
}

/**
 * Render response text with highlighted data references.
 * Returns an array of segments: plain text and highlighted references.
 */
export interface TextSegment {
  text: string;
  highlight: DataReference['type'] | null;
}

export function segmentResponseText(response: string): TextSegment[] {
  const refs = extractDataReferences(response);
  if (refs.length === 0) return [{ text: response, highlight: null }];

  const segments: TextSegment[] = [];
  let cursor = 0;

  for (const ref of refs) {
    if (ref.startIndex > cursor) {
      segments.push({ text: response.slice(cursor, ref.startIndex), highlight: null });
    }
    if (ref.startIndex >= cursor) {
      segments.push({ text: ref.text, highlight: ref.type });
      cursor = ref.endIndex;
    }
  }

  if (cursor < response.length) {
    segments.push({ text: response.slice(cursor), highlight: null });
  }

  return segments;
}
