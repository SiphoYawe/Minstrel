// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  SessionContextSchema,
  ChatRequestSchema,
  DrillGenerationSchema,
  AnalysisResultSchema,
  AnalysisRequestSchema,
} from './schemas';

// --- Helpers: valid fixture data ---

function validSessionContext() {
  return {
    key: 'C major',
    chords: ['Cmaj', 'Fmaj', 'G7'],
    timingAccuracy: 0.85,
    tempo: 120,
    recentSnapshots: [
      {
        keyInsight: 'Steady tempo maintained',
        insightCategory: 'TIMING' as const,
        timestamp: Date.now(),
      },
    ],
    tendencies: {
      avoidedKeys: ['F# major'],
      avoidedChordTypes: ['diminished'],
      commonIntervals: [3, 5, 7],
    },
    genre: 'Blues',
  };
}

function validChatRequest() {
  return {
    messages: [
      { role: 'user' as const, content: 'How can I improve my timing?' },
      { role: 'assistant' as const, content: 'Try using a metronome.' },
    ],
    sessionContext: validSessionContext(),
    providerId: 'openai' as const,
  };
}

function validDrillGeneration() {
  return {
    targetSkill: 'chord transitions',
    instructions: 'Practice smooth C to G7 transitions',
    sequence: {
      notes: [
        { midiNote: 60, duration: 1, velocity: 80, startBeat: 0 },
        { midiNote: 64, duration: 1, velocity: 80, startBeat: 1 },
        { midiNote: 67, duration: 2, velocity: 80, startBeat: 2 },
      ],
      chordSymbols: ['Cmaj', 'Am', 'Fmaj', 'G7'],
      timeSignature: [4, 4] as [number, number],
      measures: 2,
    },
    targetTempo: 100,
    successCriteria: {
      timingThresholdMs: 50,
      accuracyTarget: 0.8,
      tempoToleranceBpm: 5,
    },
    reps: 4,
  };
}

function validAnalysisResult() {
  return {
    skillDimensions: [
      { name: 'Timing', score: 0.8, rationale: 'Consistent eighth-note pulse' },
      { name: 'Harmony', score: 0.6, rationale: 'Avoids complex voicings' },
    ],
    recommendedDifficulty: 4,
    rationale: 'Solid fundamentals but harmonic variety needs work',
  };
}

function validAnalysisRequest() {
  return {
    sessionHistory: [validSessionContext()],
    currentProfile: {
      overallLevel: 5,
      strengths: ['timing', 'rhythm'],
      weaknesses: ['chord voicings'],
    },
    providerId: 'anthropic' as const,
  };
}

// --- Tests ---

describe('SessionContextSchema', () => {
  it('accepts valid SessionContext data', () => {
    const result = SessionContextSchema.safeParse(validSessionContext());
    expect(result.success).toBe(true);
  });

  it('accepts SessionContext with nullable fields set to null', () => {
    const data = {
      ...validSessionContext(),
      key: null,
      tempo: null,
      tendencies: null,
      genre: null,
    };
    const result = SessionContextSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('accepts SessionContext with optional question field', () => {
    const data = { ...validSessionContext(), question: 'What key am I in?' };
    const result = SessionContextSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('rejects SessionContext with timingAccuracy > 1', () => {
    const data = { ...validSessionContext(), timingAccuracy: 1.5 };
    const result = SessionContextSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects SessionContext with timingAccuracy < 0', () => {
    const data = { ...validSessionContext(), timingAccuracy: -0.1 };
    const result = SessionContextSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('ChatRequestSchema', () => {
  it('accepts valid ChatRequest data', () => {
    const result = ChatRequestSchema.safeParse(validChatRequest());
    expect(result.success).toBe(true);
  });

  it('rejects ChatRequest with invalid role', () => {
    const data = {
      ...validChatRequest(),
      messages: [{ role: 'system', content: 'You are helpful.' }],
    };
    const result = ChatRequestSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects ChatRequest with invalid providerId', () => {
    const data = { ...validChatRequest(), providerId: 'google' };
    const result = ChatRequestSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('DrillGenerationSchema', () => {
  it('accepts valid DrillGeneration data', () => {
    const result = DrillGenerationSchema.safeParse(validDrillGeneration());
    expect(result.success).toBe(true);
  });

  it('rejects DrillGeneration with midiNote out of piano range', () => {
    const data = validDrillGeneration();
    data.sequence.notes = [{ midiNote: 10, duration: 1, velocity: 80, startBeat: 0 }];
    const result = DrillGenerationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects DrillGeneration with tempo > 240', () => {
    const data = { ...validDrillGeneration(), targetTempo: 250 };
    const result = DrillGenerationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects DrillGeneration with tempo < 40', () => {
    const data = { ...validDrillGeneration(), targetTempo: 30 };
    const result = DrillGenerationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects DrillGeneration with empty notes array', () => {
    const data = validDrillGeneration();
    data.sequence.notes = [];
    const result = DrillGenerationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects DrillGeneration with reps > 20', () => {
    const data = { ...validDrillGeneration(), reps: 25 };
    const result = DrillGenerationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects DrillGeneration with more than 64 notes', () => {
    const data = validDrillGeneration();
    data.sequence.notes = Array.from({ length: 65 }, (_, i) => ({
      midiNote: 60,
      duration: 1,
      velocity: 80,
      startBeat: i,
    }));
    const result = DrillGenerationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('accepts DrillGeneration with exactly 64 notes', () => {
    const data = validDrillGeneration();
    data.sequence.notes = Array.from({ length: 64 }, (_, i) => ({
      midiNote: 60,
      duration: 1,
      velocity: 80,
      startBeat: i,
    }));
    const result = DrillGenerationSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

describe('AnalysisResultSchema', () => {
  it('accepts valid AnalysisResult data', () => {
    const result = AnalysisResultSchema.safeParse(validAnalysisResult());
    expect(result.success).toBe(true);
  });

  it('rejects AnalysisResult with score > 1', () => {
    const data = {
      ...validAnalysisResult(),
      skillDimensions: [{ name: 'Timing', score: 1.5, rationale: 'Over the limit' }],
    };
    const result = AnalysisResultSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects AnalysisResult with score < 0', () => {
    const data = {
      ...validAnalysisResult(),
      skillDimensions: [{ name: 'Timing', score: -0.1, rationale: 'Under the limit' }],
    };
    const result = AnalysisResultSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('AnalysisRequestSchema', () => {
  it('accepts valid AnalysisRequest data', () => {
    const result = AnalysisRequestSchema.safeParse(validAnalysisRequest());
    expect(result.success).toBe(true);
  });

  it('rejects AnalysisRequest with overallLevel out of range', () => {
    const data = {
      ...validAnalysisRequest(),
      currentProfile: { overallLevel: 11, strengths: [], weaknesses: [] },
    };
    const result = AnalysisRequestSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
