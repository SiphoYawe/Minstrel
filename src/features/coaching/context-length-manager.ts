/**
 * Context length management for AI chat routes.
 *
 * Provides token estimation, provider context limits, and a sliding-window
 * trimming strategy that keeps the most recent messages while generating
 * a compact summary of the removed ones.
 */

/**
 * Provider context window limits (in tokens).
 * Values represent the documented max context for the default model
 * used by each provider (see provider.ts DEFAULT_MODELS).
 */
export const PROVIDER_CONTEXT_LIMITS: Record<string, number> = {
  openai: 128_000,
  anthropic: 200_000,
};

const DEFAULT_CONTEXT_LIMIT = 8_000;
const SUMMARY_BUDGET_TOKENS = 200;

/**
 * Estimate token count from text (~4 chars per token).
 * This is a lightweight heuristic — accurate enough for context-window
 * budgeting without requiring a tokenizer dependency.
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Get context limit for a provider.
 */
export function getContextLimit(providerId: string): number {
  return PROVIDER_CONTEXT_LIMITS[providerId] ?? DEFAULT_CONTEXT_LIMIT;
}

export interface TrimResult {
  trimmedMessages: Array<{ role: string; content: string }>;
  wasTruncated: boolean;
  truncationSummary: string | null;
}

/**
 * Trim messages to fit within context window using a sliding window.
 *
 * Strategy:
 * 1. Reserve space for the system prompt and a short summary of trimmed content.
 * 2. Walk backwards from the most recent message, accumulating token counts.
 * 3. Stop when adding the next message would exceed the budget.
 * 4. Generate a summary note describing what was trimmed.
 */
export function trimMessagesToFit(
  messages: Array<{ role: string; content: string }>,
  systemPromptTokens: number,
  maxContextTokens: number
): TrimResult {
  if (messages.length === 0) {
    return { trimmedMessages: [], wasTruncated: false, truncationSummary: null };
  }

  const availableTokens = maxContextTokens - systemPromptTokens - SUMMARY_BUDGET_TOKENS;

  // If the budget is zero or negative the system prompt alone is too large.
  // Keep at least the last message to avoid sending an empty conversation.
  if (availableTokens <= 0) {
    const last = messages[messages.length - 1];
    return {
      trimmedMessages: [last],
      wasTruncated: messages.length > 1,
      truncationSummary:
        messages.length > 1
          ? `[Context note: ${messages.length - 1} earlier messages were trimmed due to context limits.]`
          : null,
    };
  }

  // Walk backwards accumulating tokens
  let totalTokens = 0;
  let cutIndex = 0; // default: keep everything

  for (let i = messages.length - 1; i >= 0; i--) {
    const msgTokens = estimateTokenCount(messages[i].content);
    if (totalTokens + msgTokens > availableTokens) {
      cutIndex = i + 1;
      break;
    }
    totalTokens += msgTokens;
  }

  if (cutIndex === 0) {
    return {
      trimmedMessages: messages,
      wasTruncated: false,
      truncationSummary: null,
    };
  }

  const removed = messages.slice(0, cutIndex);
  const kept = messages.slice(cutIndex);

  const topicPreviews = removed
    .slice(0, 3)
    .map((m) => m.content.slice(0, 50))
    .join('; ');

  const summary = `[Context note: ${removed.length} earlier message${removed.length === 1 ? ' was' : 's were'} trimmed. Topics discussed: ${topicPreviews}...]`;

  return {
    trimmedMessages: kept,
    wasTruncated: true,
    truncationSummary: summary,
  };
}
