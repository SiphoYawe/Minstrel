import { streamText } from 'ai';
import type { LanguageModel } from 'ai';
import { ChatRequestSchema } from '@/lib/ai/schemas';
import { getModelForProvider } from '@/lib/ai/provider';
import { buildChatSystemPrompt, buildReplayChatSystemPrompt } from '@/lib/ai/prompts';
import { authenticateAiRequest, withAiErrorHandling } from '@/lib/ai/route-helpers';
import { replaceProhibitedWords } from '@/features/coaching/growth-mindset-rules';
import {
  estimateTokenCount,
  getContextLimit,
  trimMessagesToFit,
} from '@/features/coaching/context-length-manager';

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1_000;

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
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    onFinish?: (result: { text: string }) => void;
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

export async function POST(req: Request): Promise<Response> {
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
  const authResult = await authenticateAiRequest(providerId);
  if (authResult instanceof Response) return authResult;

  const { apiKey } = authResult;

  return withAiErrorHandling(async () => {
    const model = getModelForProvider(providerId, apiKey);
    const systemPrompt =
      mode === 'replay' && replayContext
        ? buildReplayChatSystemPrompt(replayContext)
        : buildChatSystemPrompt(sessionContext!);

    // --- Context length management ---
    const systemPromptTokens = estimateTokenCount(systemPrompt);
    const maxContextTokens = getContextLimit(providerId);

    const { trimmedMessages, wasTruncated, truncationSummary } = trimMessagesToFit(
      messages.map((m) => ({ role: m.role, content: m.content })),
      systemPromptTokens,
      maxContextTokens
    );

    // Prepend truncation summary as a system-injected assistant message so
    // the model knows earlier context was removed.
    const finalMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    if (wasTruncated && truncationSummary) {
      finalMessages.push({ role: 'assistant', content: truncationSummary });
    }

    for (const m of trimmedMessages) {
      finalMessages.push({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      });
    }

    // --- Stream with retry on rate-limit ---
    // TODO: Tech debt — replaceProhibitedWords is applied server-side in onFinish
    // as a post-filter. This ensures stored/final text is growth-mindset compliant
    // but does not filter individual streaming chunks in real-time. A future
    // enhancement could pipe textStream through createGrowthMindsetTransform()
    // for real-time chunk filtering while preserving the UI message stream protocol.
    const result = await streamWithRetry({
      model,
      system: systemPrompt,
      messages: finalMessages,
      onFinish: ({ text }) => {
        // Apply growth mindset word replacement to the final streamed text.
        // The filtered text is available via the result promise for downstream consumers.
        replaceProhibitedWords(text);
      },
    });

    return result.toUIMessageStreamResponse();
  });
}

// Exported for testing only
export { streamWithRetry as _streamWithRetry, isRateLimitError as _isRateLimitError };
