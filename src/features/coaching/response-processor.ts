import * as Sentry from '@sentry/nextjs';
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

  if (!validation.isCompliant) {
    Sentry.captureMessage('Growth mindset violation in AI response', {
      level: 'warning',
      extra: {
        violations: validation.violations,
        responseLength: response.length,
      },
    });
  }

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

/**
 * Rich content segment types for inline visualizations in chat responses.
 */
export type RichSegment =
  | { type: 'text'; text: string; highlight: DataReference['type'] | null }
  | { type: 'chord'; chord: string }
  | { type: 'scale'; scaleName: string }
  | { type: 'timing'; early: number; onTime: number; late: number }
  | { type: 'tip'; content: string }
  | { type: 'drill'; drillName: string; targetSkill: string };

// Structured markers that the AI may embed in responses
const RICH_MARKER_PATTERN =
  /\[CHORD:([^\]]+)\]|\[SCALE:([^\]]+)\]|\[TIMING:(\d+),(\d+),(\d+)\]|\[TIP:([^\]]+)\]|\[DRILL:([^|]+)\|([^\]]+)\]/g;

/**
 * Parse response text into rich segments, extracting structured markers
 * and falling back to text highlighting for non-marker content.
 */
export function parseRichSegments(response: string): RichSegment[] {
  const segments: RichSegment[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  const regex = new RegExp(RICH_MARKER_PATTERN.source, RICH_MARKER_PATTERN.flags);

  while ((match = regex.exec(response)) !== null) {
    // Add text before this marker
    if (match.index > cursor) {
      const textBefore = response.slice(cursor, match.index);
      for (const seg of segmentResponseText(textBefore)) {
        segments.push({ type: 'text', text: seg.text, highlight: seg.highlight });
      }
    }

    // Parse marker type
    if (match[1] != null) {
      segments.push({ type: 'chord', chord: match[1] });
    } else if (match[2] != null) {
      segments.push({ type: 'scale', scaleName: match[2] });
    } else if (match[3] != null && match[4] != null && match[5] != null) {
      segments.push({
        type: 'timing',
        early: parseInt(match[3], 10),
        onTime: parseInt(match[4], 10),
        late: parseInt(match[5], 10),
      });
    } else if (match[6] != null) {
      segments.push({ type: 'tip', content: match[6] });
    } else if (match[7] != null && match[8] != null) {
      segments.push({ type: 'drill', drillName: match[7], targetSkill: match[8] });
    }

    cursor = match.index + match[0].length;
  }

  // Add remaining text
  if (cursor < response.length) {
    const remaining = response.slice(cursor);
    for (const seg of segmentResponseText(remaining)) {
      segments.push({ type: 'text', text: seg.text, highlight: seg.highlight });
    }
  }

  // If no rich markers found, just return text segments
  if (segments.length === 0) {
    return segmentResponseText(response).map((seg) => ({
      type: 'text' as const,
      text: seg.text,
      highlight: seg.highlight,
    }));
  }

  return segments;
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
