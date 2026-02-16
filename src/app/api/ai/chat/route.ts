import { streamText } from 'ai';
import type { LanguageModel, TextStreamPart, ToolSet } from 'ai';
import { ChatRequestSchema } from '@/lib/ai/schemas';
import { getModelForProvider, DEFAULT_MODELS } from '@/lib/ai/provider';
import type { SupportedProvider } from '@/lib/ai/provider';
import {
  buildChatSystemPrompt,
  buildReplayChatSystemPrompt,
  sanitizeUserMessage,
} from '@/lib/ai/prompts';
import { authenticateAiRequest, withAiErrorHandling } from '@/lib/ai/route-helpers';
import { replaceProhibitedWords, PROHIBITED_WORDS } from '@/features/coaching/growth-mindset-rules';
import {
  estimateTokenCount,
  getContextLimit,
  trimMessagesToFit,
} from '@/features/coaching/context-length-manager';
import { extractTokenUsage, recordTokenUsage } from '@/features/coaching/token-tracker';
import { validateCsrf } from '@/lib/middleware/csrf';

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1_000;

/** Hard per-request token budget (AI-H2). Requests exceeding this get trimmed. */
export const PER_REQUEST_TOKEN_BUDGET = 8_000;

/**
 * Detect whether an error is a 429 / rate-limit response from the provider.
 */
function isRateLimitError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  if (message.includes('429') || message.includes('rate') || message.includes('too many')) {
    return true;
  }

  // Vercel AI SDK and provider SDKs may expose statusCode
  if (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    (error as { statusCode: number }).statusCode === 429
  ) {
    return true;
  }

  return false;
}

/**
 * Stream text with exponential-backoff retry on 429 rate-limit errors.
 * All other errors are re-thrown immediately.
 */
async function streamWithRetry(
  params: {
    model: LanguageModel;
    system: string;
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    experimental_transform?: (options: {
      tools: ToolSet;
      stopStream: () => void;
    }) => TransformStream<TextStreamPart<ToolSet>, TextStreamPart<ToolSet>>;
    onFinish?: (result: {
      text: string;
      usage: { inputTokens?: number; outputTokens?: number };
    }) => void;
  },
  maxRetries = MAX_RETRIES
) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await streamText(params);
    } catch (error: unknown) {
      if (!isRateLimitError(error) || attempt === maxRetries) {
        throw error;
      }
      const delay = RETRY_BASE_MS * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Unreachable — the loop either returns or throws.
  throw new Error('Retry exhausted');
}

/**
 * Creates a StreamTextTransform that replaces prohibited words in text-delta
 * chunks in real-time, buffering across chunk boundaries to avoid splitting
 * words mid-replacement.
 */
function createGrowthMindsetStreamTransform() {
  const maxWordLen = Math.max(...PROHIBITED_WORDS.map((w) => w.length));

  return () => {
    let buffer = '';
    let lastDeltaId = '';

    return new TransformStream<TextStreamPart<ToolSet>, TextStreamPart<ToolSet>>({
      transform(part, controller) {
        if (part.type !== 'text-delta') {
          // Flush buffer on text-end before passing through
          if (part.type === 'text-end' && buffer.length > 0) {
            controller.enqueue({
              type: 'text-delta' as const,
              id: lastDeltaId,
              text: replaceProhibitedWords(buffer),
            });
            buffer = '';
          }
          controller.enqueue(part);
          return;
        }

        lastDeltaId = part.id;
        buffer += part.text;

        // Flush safe prefix when buffer exceeds the danger zone
        if (buffer.length > maxWordLen + 2) {
          const safeEnd = buffer.length - maxWordLen - 1;
          let splitAt = -1;
          for (let i = safeEnd; i >= 0; i--) {
            if (/\s/.test(buffer[i])) {
              splitAt = i + 1;
              break;
            }
          }
          if (splitAt > 0) {
            const safe = buffer.slice(0, splitAt);
            buffer = buffer.slice(splitAt);
            controller.enqueue({ ...part, text: replaceProhibitedWords(safe) });
          }
        }
      },
      flush(controller) {
        if (buffer.length > 0) {
          controller.enqueue({
            type: 'text-delta' as const,
            id: lastDeltaId,
            text: replaceProhibitedWords(buffer),
          } as TextStreamPart<ToolSet>);
          buffer = '';
        }
      },
    });
  };
}

export async function POST(req: Request): Promise<Response> {
  const csrfError = validateCsrf(req);
  if (csrfError) return csrfError;

  // Parse and validate request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { data: null, error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON in request body.' } },
      { status: 400 }
    );
  }
  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { data: null, error: { code: 'VALIDATION_ERROR', message: 'Invalid request body.' } },
      { status: 400 }
    );
  }

  const { messages, sessionContext, replayContext, mode, providerId } = parsed.data;

  // Validate context matches mode
  if (mode === 'replay' && !replayContext) {
    return Response.json(
      {
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'Replay mode requires replayContext.' },
      },
      { status: 400 }
    );
  }
  if (mode === 'live' && !sessionContext) {
    return Response.json(
      {
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'Live mode requires sessionContext.' },
      },
      { status: 400 }
    );
  }

  // Authenticate, rate-limit, and decrypt API key
  const authResult = await authenticateAiRequest(providerId, {
    bucket: 'ai:chat',
    maxRequests: 100,
  });
  if (authResult instanceof Response) return authResult;

  const { apiKey, userId } = authResult;

  return withAiErrorHandling(async () => {
    const model = getModelForProvider(providerId, apiKey);
    const modelId = DEFAULT_MODELS[providerId as SupportedProvider] ?? providerId;
    const systemPrompt =
      mode === 'replay' && replayContext
        ? buildReplayChatSystemPrompt(replayContext)
        : buildChatSystemPrompt(sessionContext!);

    // --- Context length management ---
    const systemPromptTokens = estimateTokenCount(systemPrompt);
    const providerContextLimit = getContextLimit(providerId);

    // Use the smaller of the provider context limit and the per-request budget (AI-H2).
    const maxContextTokens = Math.min(providerContextLimit, PER_REQUEST_TOKEN_BUDGET);

    const { trimmedMessages, wasTruncated, truncationSummary } = trimMessagesToFit(
      messages.map((m) => ({ role: m.role, content: m.content })),
      systemPromptTokens,
      maxContextTokens
    );

    // Prepend truncation summary as a system-injected message so the model
    // knows earlier context was removed. Uses 'system' role so it is clearly
    // metadata rather than a fake assistant utterance (AI-H3).
    const finalMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

    if (wasTruncated && truncationSummary) {
      finalMessages.push({ role: 'system', content: truncationSummary });
    }

    for (const m of trimmedMessages) {
      finalMessages.push({
        role: m.role as 'user' | 'assistant',
        // Sanitize user messages to prevent prompt injection
        content: m.role === 'user' ? sanitizeUserMessage(m.content) : m.content,
      });
    }

    // --- Stream with retry on rate-limit ---
    const result = await streamWithRetry({
      model,
      system: systemPrompt,
      messages: finalMessages,
      experimental_transform: createGrowthMindsetStreamTransform(),
      onFinish: ({ text, usage }) => {
        // Apply growth mindset word replacement to the final text for storage.
        const filteredText = replaceProhibitedWords(text);

        // Track token usage from AI SDK usage object (not text estimation).
        const tokenUsage = extractTokenUsage({ usage });
        recordTokenUsage({
          sessionId: '',
          userId,
          role: 'assistant',
          content: filteredText.slice(0, 500),
          tokenCount: tokenUsage.totalTokens,
          model: modelId,
          provider: providerId,
          metadata: {
            prompt_tokens: tokenUsage.promptTokens,
            completion_tokens: tokenUsage.completionTokens,
            mode,
          },
        }).catch(() => {
          // Token tracking is non-critical — silently degrade
        });
      },
    });

    return result.toUIMessageStreamResponse();
  });
}

// Exported for testing only
export { streamWithRetry as _streamWithRetry, isRateLimitError as _isRateLimitError };
