import type { DrillGenerationRequest, GeneratedDrill } from './drill-types';
import type { DifficultyParameters, SkillProfile } from '@/features/difficulty/difficulty-types';
import type { DrillGeneration, SessionContext } from '@/lib/ai/schemas';
import type { SupportedProvider } from '@/lib/ai/provider';

export function buildDrillRequest(
  weakness: string,
  skillProfile: SkillProfile | null,
  difficultyParameters: DifficultyParameters,
  genreContext?: string | null,
  previousDrillDescriptions?: string[]
): DrillGenerationRequest {
  const dimensions: Record<string, { value: number; confidence: number }> = {};
  if (skillProfile) {
    for (const [dim, score] of Object.entries(skillProfile.dimensions)) {
      dimensions[dim] = { value: score.value, confidence: score.confidence };
    }
  }

  return {
    weakness,
    skillProfile: { dimensions },
    difficultyParameters,
    genreContext: genreContext ?? undefined,
    previousDrillDescriptions: previousDrillDescriptions?.slice(0, 5),
  };
}

export function buildApiPayload(
  request: DrillGenerationRequest,
  sessionContext: SessionContext,
  providerId: SupportedProvider
) {
  return {
    sessionContext,
    weakness: request.weakness,
    genre: sessionContext.genre ?? request.genreContext ?? null,
    difficultyParameters: request.difficultyParameters,
    previousDrillDescriptions: request.previousDrillDescriptions,
    providerId,
  };
}

export function mapLlmResponseToDrill(
  llmResponse: DrillGeneration,
  weakness: string,
  difficultyParameters: DifficultyParameters
): GeneratedDrill {
  return {
    id: crypto.randomUUID(),
    targetSkill: llmResponse.targetSkill,
    weaknessDescription: weakness,
    sequence: {
      notes: llmResponse.sequence.notes,
      chordSymbols: llmResponse.sequence.chordSymbols,
      timeSignature: llmResponse.sequence.timeSignature,
      measures: llmResponse.sequence.measures,
    },
    targetTempo: llmResponse.targetTempo,
    successCriteria: llmResponse.successCriteria,
    reps: llmResponse.reps,
    instructions: llmResponse.instructions,
    difficultyLevel: difficultyParameters,
  };
}

export async function requestDrill(
  request: DrillGenerationRequest,
  sessionContext: SessionContext,
  providerId: SupportedProvider
): Promise<GeneratedDrill> {
  const payload = buildApiPayload(request, sessionContext, providerId);

  const response = await fetch('/api/ai/drill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const code = errorBody?.error?.code ?? 'GENERATION_FAILED';
    const message =
      errorBody?.error?.message ?? 'Could not create a drill right now. Try again in a moment.';
    throw new Error(`[${code}] ${message}`);
  }

  const { data } = await response.json();
  return mapLlmResponseToDrill(data, request.weakness, request.difficultyParameters);
}
