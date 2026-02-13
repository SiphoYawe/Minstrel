import { generateText, Output } from 'ai';
import { AnalysisRequestSchema, AnalysisResultSchema } from '@/lib/ai/schemas';
import { getModelForProvider } from '@/lib/ai/provider';
import { buildAnalysisSystemPrompt } from '@/lib/ai/prompts';
import { authenticateAiRequest, withAiErrorHandling } from '@/lib/ai/route-helpers';
import { AiError } from '@/lib/ai/errors';
import { getPostHogClient } from '@/lib/posthog-server';

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
  const parsed = AnalysisRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { data: null, error: { code: 'VALIDATION_ERROR', message: 'Invalid request body.' } },
      { status: 400 }
    );
  }

  const { sessionHistory, currentProfile, providerId } = parsed.data;

  const authResult = await authenticateAiRequest(providerId);
  if (authResult instanceof Response) return authResult;

  const { apiKey } = authResult;

  // Use the most recent session context for prompt building
  const latestContext = sessionHistory[sessionHistory.length - 1];

  return withAiErrorHandling(async () => {
    const model = getModelForProvider(providerId, apiKey);
    const systemPrompt = buildAnalysisSystemPrompt(latestContext);

    const { output } = await generateText({
      model,
      system: systemPrompt,
      prompt: [
        `Analyze this player's skill profile and recommend a difficulty calibration.`,
        `Current level: ${currentProfile.overallLevel}/10`,
        `Strengths: ${currentProfile.strengths.join(', ') || 'none identified'}`,
        `Weaknesses: ${currentProfile.weaknesses.join(', ') || 'none identified'}`,
        `Sessions analyzed: ${sessionHistory.length}`,
      ].join('\n'),
      output: Output.object({ schema: AnalysisResultSchema }),
    });

    if (!output) {
      throw new AiError('GENERATION_FAILED');
    }

    // Track server-side analysis completion
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: 'server', // No user context in this API route
      event: 'ai_analysis_completed',
      properties: {
        provider: providerId,
        sessions_analyzed: sessionHistory.length,
        current_level: currentProfile.overallLevel,
        strengths_count: currentProfile.strengths.length,
        weaknesses_count: currentProfile.weaknesses.length,
      },
    });

    return Response.json({ data: output, error: null });
  });
}
