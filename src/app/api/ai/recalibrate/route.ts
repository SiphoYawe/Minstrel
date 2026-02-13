import { generateText, Output } from 'ai';
import { RecalibrationRequestSchema, RecalibrationResultSchema } from '@/lib/ai/schemas';
import { getModelForProvider } from '@/lib/ai/provider';
import { buildRecalibrationSystemPrompt } from '@/lib/ai/prompts';
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

  const parsed = RecalibrationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { data: null, error: { code: 'VALIDATION_ERROR', message: 'Invalid request body.' } },
      { status: 400 }
    );
  }

  const { profileHistory, sessionSummaries, currentOverloadStrategy, providerId } = parsed.data;

  const authResult = await authenticateAiRequest(providerId);
  if (authResult instanceof Response) return authResult;

  const { apiKey } = authResult;

  return withAiErrorHandling(async () => {
    const model = getModelForProvider(providerId, apiKey);
    const systemPrompt = buildRecalibrationSystemPrompt();

    const profileSummary = profileHistory
      .map((p, i) => {
        const dims = Object.entries(p.dimensions)
          .map(
            ([dim, score]) =>
              `${dim}: ${(score.value * 100).toFixed(0)}% (conf: ${(score.confidence * 100).toFixed(0)}%)`
          )
          .join(', ');
        return `Session ${i + 1}: ${dims}`;
      })
      .join('\n');

    const sessionSummary = sessionSummaries
      .map(
        (s, i) =>
          `Session ${i + 1}: accuracy ${(s.avgAccuracy * 100).toFixed(0)}%, growth zone ${(s.growthZoneRatio * 100).toFixed(0)}%, genre: ${s.genre ?? 'unknown'}, key: ${s.key ?? 'unknown'}`
      )
      .join('\n');

    const { output } = await generateText({
      model,
      system: systemPrompt,
      prompt: [
        'Analyze cross-session skill progression and recommend recalibration:',
        '',
        'SKILL PROFILE HISTORY:',
        profileSummary,
        '',
        'SESSION SUMMARIES:',
        sessionSummary,
        '',
        `CURRENT FOCUS: ${currentOverloadStrategy.focusDimension}`,
        `PLATEAUED DIMENSIONS: ${
          Object.entries(currentOverloadStrategy.plateauFlags)
            .filter(([, v]) => v)
            .map(([k]) => k)
            .join(', ') || 'none'
        }`,
      ].join('\n'),
      output: Output.object({ schema: RecalibrationResultSchema }),
    });

    if (!output) {
      throw new AiError('GENERATION_FAILED');
    }

    return Response.json({ data: output, error: null });
  });
}
