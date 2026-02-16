import { generateText, Output } from 'ai';
import { DrillRequestSchema, DrillGenerationSchema } from '@/lib/ai/schemas';
import { getModelForProvider } from '@/lib/ai/provider';
import { buildDrillSystemPrompt } from '@/lib/ai/prompts';
import { authenticateAiRequest, withAiErrorHandling } from '@/lib/ai/route-helpers';
import { AiError } from '@/lib/ai/errors';
import { getPostHogClient } from '@/lib/posthog-server';
import { validateCsrf } from '@/lib/middleware/csrf';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: Request): Promise<Response> {
  const csrfError = validateCsrf(req);
  if (csrfError) return csrfError;

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

  const { sessionContext, weakness, difficultyParameters, previousDrillDescriptions, providerId } =
    parsed.data;

  const authResult = await authenticateAiRequest(providerId, {
    bucket: 'ai:drill',
    maxRequests: 10,
  });
  if (authResult instanceof Response) return authResult;

  const { apiKey } = authResult;

  return withAiErrorHandling(async () => {
    const model = getModelForProvider(providerId, apiKey);
    const systemPrompt = buildDrillSystemPrompt(sessionContext);

    const promptLines = [
      `Generate a targeted drill for this weakness: ${weakness}`,
      '',
      'DIFFICULTY PARAMETERS:',
      `  Target tempo: ${difficultyParameters.tempo} BPM (+/- 5 BPM)`,
      `  Harmonic complexity: ${(difficultyParameters.harmonicComplexity * 100).toFixed(0)}%`,
      `  Key difficulty: ${(difficultyParameters.keyDifficulty * 100).toFixed(0)}%`,
      `  Rhythmic density: ${(difficultyParameters.rhythmicDensity * 100).toFixed(0)}%`,
      `  Note range: ${(difficultyParameters.noteRange * 100).toFixed(0)}%`,
    ];

    if (previousDrillDescriptions && previousDrillDescriptions.length > 0) {
      promptLines.push(
        '',
        'IMPORTANT: The musician has already practiced these drills for this weakness:',
        ...previousDrillDescriptions.map((d) => `- ${d}`),
        '',
        'Generate a DIFFERENT drill. Vary one or more of:',
        '- Chord voicings (open vs. close, different inversions)',
        '- Rhythmic pattern (straight vs. swing, different subdivisions)',
        '- Key center (try a related key)',
        '- Approach direction (ascending vs. descending)',
        '- Exercise structure (call-and-response, loop, sequence)'
      );
    }

    const DRILL_TIMEOUT_MS = 20_000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DRILL_TIMEOUT_MS);

    const startTime = performance.now();

    let output: Awaited<ReturnType<typeof generateText>>['output'];
    try {
      const result = await generateText({
        model,
        system: systemPrompt,
        prompt: promptLines.join('\n'),
        output: Output.object({ schema: DrillGenerationSchema }),
        abortSignal: controller.signal,
      });
      output = result.output;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        Sentry.captureMessage('Drill generation timed out', {
          level: 'warning',
          extra: { timeoutMs: DRILL_TIMEOUT_MS, weakness },
        });
        return Response.json(
          {
            data: null,
            error: {
              code: 'TIMEOUT',
              message: 'Drill generation timed out. Please try again.',
            },
          },
          { status: 504 }
        );
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }

    const elapsed = performance.now() - startTime;
    if (elapsed > 2000) {
      Sentry.captureMessage('Drill generation exceeded 2s budget', {
        level: 'warning',
        extra: { elapsed, weakness },
      });
    }

    if (!output) {
      throw new AiError('GENERATION_FAILED');
    }

    // Track server-side drill generation
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: authResult.userId,
      event: 'ai_drill_generated',
      properties: {
        weakness,
        provider: providerId,
        target_tempo: difficultyParameters.tempo,
        generation_time_ms: Math.round(elapsed),
      },
    });

    return Response.json({ data: output, error: null });
  });
}
