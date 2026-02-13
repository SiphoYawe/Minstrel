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
    noteSequence: [
      { note: 'C', octave: 4, duration: 'quarter' },
      { note: 'E', octave: 4, duration: 'quarter' },
      { note: 'G', octave: 4, duration: 'half' },
    ],
    chordSequence: ['Cmaj', 'Am', 'Fmaj', 'G7'],
    targetTempo: 100,
    successCriteria: 'Play all transitions with < 50ms gap',
    difficultyLevel: 5,
    variation: 'Ascending arpeggio pattern with swing feel',
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

  it('rejects DrillGeneration with difficultyLevel > 10', () => {
    const data = { ...validDrillGeneration(), difficultyLevel: 11 };
    const result = DrillGenerationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects DrillGeneration with difficultyLevel < 1', () => {
    const data = { ...validDrillGeneration(), difficultyLevel: 0 };
    const result = DrillGenerationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects DrillGeneration with empty noteSequence', () => {
    const data = { ...validDrillGeneration(), noteSequence: [] };
    const result = DrillGenerationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects DrillGeneration with empty chordSequence', () => {
    const data = { ...validDrillGeneration(), chordSequence: [] };
    const result = DrillGenerationSchema.safeParse(data);
    expect(result.success).toBe(false);
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
