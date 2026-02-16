// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { buildDrillRequest, buildApiPayload, mapLlmResponseToDrill } from './drill-generator';
import {
  SkillDimension,
  type SkillProfile,
  type DifficultyParameters,
} from '@/features/difficulty/difficulty-types';
import { DEFAULT_DIFFICULTY } from '@/features/difficulty/difficulty-engine';
import type { DrillGeneration, SessionContext } from '@/lib/ai/schemas';

function makeProfile(): SkillProfile {
  const dims = {} as Record<
    SkillDimension,
    { value: number; confidence: number; dataPoints: number; lastUpdated: string }
  >;
  for (const dim of Object.values(SkillDimension)) {
    dims[dim] = {
      value: 0.5,
      confidence: 0.6,
      dataPoints: 10,
      lastUpdated: new Date().toISOString(),
    };
  }
  return {
    userId: 'u1',
    profileVersion: 1,
    lastAssessedAt: new Date().toISOString(),
    dimensions: dims,
  };
}

function makeSessionContext(): SessionContext {
  return {
    key: 'C major',
    chords: ['Cmaj', 'G7'],
    timingAccuracy: 0.72,
    tempo: 100,
    recentSnapshots: [],
    tendencies: null,
    genre: 'Blues',
  };
}

function makeLlmResponse(): DrillGeneration {
  return {
    targetSkill: 'Chord transitions',
    instructions: 'Practice smooth transitions between C and G7',
    sequence: {
      notes: [
        { midiNote: 60, duration: 1, velocity: 80, startBeat: 0 },
        { midiNote: 67, duration: 1, velocity: 80, startBeat: 1 },
      ],
      chordSymbols: ['C', 'G7'],
      timeSignature: [4, 4],
      measures: 2,
    },
    targetTempo: 80,
    successCriteria: {
      timingThresholdMs: 50,
      accuracyTarget: 0.8,
      tempoToleranceBpm: 5,
    },
    reps: 4,
  };
}

describe('buildDrillRequest', () => {
  it('includes all required context fields', () => {
    const profile = makeProfile();
    const params: DifficultyParameters = { ...DEFAULT_DIFFICULTY };
    const request = buildDrillRequest('Slow chord transitions', profile, params, 'Blues');
    expect(request.weakness).toBe('Slow chord transitions');
    expect(request.difficultyParameters).toEqual(params);
    expect(request.genreContext).toBe('Blues');
    expect(Object.keys(request.skillProfile.dimensions).length).toBe(5);
  });

  it('includes previous drill descriptions when provided', () => {
    const request = buildDrillRequest('Timing drift', null, DEFAULT_DIFFICULTY, null, [
      'Practice C to F transition at 80 BPM',
      'Ascending scale in C major',
    ]);
    expect(request.previousDrillDescriptions).toHaveLength(2);
  });

  it('caps previous drills at 5', () => {
    const descriptions = Array.from({ length: 10 }, (_, i) => `Drill ${i}`);
    const request = buildDrillRequest('Timing', null, DEFAULT_DIFFICULTY, null, descriptions);
    expect(request.previousDrillDescriptions).toHaveLength(5);
  });

  it('handles null profile gracefully', () => {
    const request = buildDrillRequest('Timing', null, DEFAULT_DIFFICULTY);
    expect(Object.keys(request.skillProfile.dimensions)).toHaveLength(0);
  });
});

describe('buildApiPayload', () => {
  it('assembles payload with correct shape', () => {
    const request = buildDrillRequest('Timing', null, DEFAULT_DIFFICULTY);
    const context = makeSessionContext();
    const payload = buildApiPayload(request, context, 'openai');
    expect(payload.providerId).toBe('openai');
    expect(payload.sessionContext).toBe(context);
    expect(payload.weakness).toBe('Timing');
    expect(payload.difficultyParameters).toEqual(DEFAULT_DIFFICULTY);
  });

  it('includes genre from sessionContext', () => {
    const request = buildDrillRequest('Timing', null, DEFAULT_DIFFICULTY);
    const context = makeSessionContext(); // genre: 'Blues'
    const payload = buildApiPayload(request, context, 'openai');
    expect(payload.genre).toBe('Blues');
  });

  it('falls back to request genreContext when sessionContext.genre is null', () => {
    const request = buildDrillRequest('Timing', null, DEFAULT_DIFFICULTY, 'Jazz');
    const context = { ...makeSessionContext(), genre: null };
    const payload = buildApiPayload(request, context, 'openai');
    expect(payload.genre).toBe('Jazz');
  });

  it('returns null genre when both sources are null', () => {
    const request = buildDrillRequest('Timing', null, DEFAULT_DIFFICULTY);
    const context = { ...makeSessionContext(), genre: null };
    const payload = buildApiPayload(request, context, 'openai');
    expect(payload.genre).toBeNull();
  });
});

describe('mapLlmResponseToDrill', () => {
  it('creates GeneratedDrill with UUID', () => {
    const llm = makeLlmResponse();
    const drill = mapLlmResponseToDrill(llm, 'Chord transitions', DEFAULT_DIFFICULTY);
    expect(drill.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('maps all LLM fields', () => {
    const llm = makeLlmResponse();
    const drill = mapLlmResponseToDrill(llm, 'Chord transitions', DEFAULT_DIFFICULTY);
    expect(drill.targetSkill).toBe('Chord transitions');
    expect(drill.weaknessDescription).toBe('Chord transitions');
    expect(drill.sequence.notes).toHaveLength(2);
    expect(drill.sequence.timeSignature).toEqual([4, 4]);
    expect(drill.targetTempo).toBe(80);
    expect(drill.successCriteria.accuracyTarget).toBe(0.8);
    expect(drill.reps).toBe(4);
    expect(drill.instructions).toBe('Practice smooth transitions between C and G7');
  });

  it('attaches difficulty parameters', () => {
    const llm = makeLlmResponse();
    const drill = mapLlmResponseToDrill(llm, 'Test', DEFAULT_DIFFICULTY);
    expect(drill.difficultyLevel).toEqual(DEFAULT_DIFFICULTY);
  });

  it('generates unique IDs per call', () => {
    const llm = makeLlmResponse();
    const id1 = mapLlmResponseToDrill(llm, 'Test', DEFAULT_DIFFICULTY).id;
    const id2 = mapLlmResponseToDrill(llm, 'Test', DEFAULT_DIFFICULTY).id;
    expect(id1).not.toBe(id2);
  });
});
