import { streamText } from 'ai';
import { ChatRequestSchema } from '@/lib/ai/schemas';
import { getModelForProvider } from '@/lib/ai/provider';
import { buildChatSystemPrompt, buildReplayChatSystemPrompt } from '@/lib/ai/prompts';
import { authenticateAiRequest, withAiErrorHandling } from '@/lib/ai/route-helpers';

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

    const result = streamText({
      model,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    return result.toUIMessageStreamResponse();
  });
}
