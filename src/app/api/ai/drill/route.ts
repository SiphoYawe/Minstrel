import { generateText, Output } from 'ai';
import { DrillRequestSchema, DrillGenerationSchema } from '@/lib/ai/schemas';
import { getModelForProvider } from '@/lib/ai/provider';
import { buildDrillSystemPrompt } from '@/lib/ai/prompts';
import { authenticateAiRequest, withAiErrorHandling } from '@/lib/ai/route-helpers';
import { AiError } from '@/lib/ai/errors';

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { data: null, error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON in request body.' } },
      { status: 400 }
    );
  }
  const parsed = DrillRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { data: null, error: { code: 'VALIDATION_ERROR', message: 'Invalid request body.' } },
      { status: 400 }
    );
  }

  const { sessionContext, weakness, currentDifficulty, providerId } = parsed.data;

  const authResult = await authenticateAiRequest(providerId);
  if (authResult instanceof Response) return authResult;

  const { apiKey } = authResult;

  return withAiErrorHandling(async () => {
    const model = getModelForProvider(providerId, apiKey);
    const systemPrompt = buildDrillSystemPrompt(sessionContext);

    const { output } = await generateText({
      model,
      system: systemPrompt,
      prompt: `Generate a drill targeting: ${weakness}. Current difficulty level: ${currentDifficulty}/10.`,
      output: Output.object({ schema: DrillGenerationSchema }),
    });

    if (!output) {
      throw new AiError('GENERATION_FAILED');
    }

    return Response.json({ data: output, error: null });
  });
}
