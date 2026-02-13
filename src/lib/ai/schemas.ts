import { z } from 'zod/v4';

// --- Session Context (passed to AI for grounding) ---

export const SessionContextSchema = z.object({
  key: z.string().nullable().describe('Detected key center, e.g. "C major"'),
  chords: z.array(z.string()).describe('Recent chord labels, e.g. ["Cmaj","Fmaj","G7"]'),
  timingAccuracy: z.number().min(0).max(1).describe('0–1 accuracy score'),
  tempo: z.number().nullable().describe('Average BPM, null if not detected'),
  recentSnapshots: z
    .array(
      z.object({
        keyInsight: z.string(),
        insightCategory: z.enum(['TIMING', 'HARMONIC', 'TENDENCY', 'GENERAL']),
        timestamp: z.number(),
      })
    )
    .max(50)
    .describe('Recent analysis snapshots for context (max 50)'),
  tendencies: z
    .object({
      avoidedKeys: z.array(z.string()),
      avoidedChordTypes: z.array(z.string()),
      commonIntervals: z.array(z.number()),
    })
    .nullable()
    .describe('Playing tendencies detected so far'),
  genre: z.string().nullable().describe('Detected genre, e.g. "Blues"'),
  question: z.string().optional().describe('User question, if any'),
});

export type SessionContext = z.infer<typeof SessionContextSchema>;

// --- Chat API request ---

export const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .max(200),
  sessionContext: SessionContextSchema,
  providerId: z.enum(['openai', 'anthropic']),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

// --- Drill generation structured output ---

export const DrillGenerationSchema = z.object({
  targetSkill: z.string().describe('The skill this drill targets, e.g. "chord transitions"'),
  noteSequence: z
    .array(z.object({ note: z.string(), octave: z.number(), duration: z.string() }))
    .min(1)
    .describe('Sequence of notes for the drill (at least 1)'),
  chordSequence: z
    .array(z.string())
    .min(1)
    .describe('Chord progression for the drill (at least 1)'),
  targetTempo: z.number().describe('BPM target for the drill'),
  successCriteria: z.string().describe('What counts as completing the drill successfully'),
  difficultyLevel: z.number().min(1).max(10).describe('1–10 difficulty scale'),
  variation: z.string().describe('Description of what makes this drill unique'),
});

export type DrillGeneration = z.infer<typeof DrillGenerationSchema>;

// --- Drill API request ---

export const DrillRequestSchema = z.object({
  sessionContext: SessionContextSchema,
  weakness: z.string().describe('Description of the weakness to target'),
  currentDifficulty: z.number().min(1).max(10),
  providerId: z.enum(['openai', 'anthropic']),
});

export type DrillRequest = z.infer<typeof DrillRequestSchema>;

// --- Analysis structured output ---

export const AnalysisResultSchema = z.object({
  skillDimensions: z
    .array(
      z.object({
        name: z.string(),
        score: z.number().min(0).max(1),
        rationale: z.string(),
      })
    )
    .describe('Assessment across skill dimensions'),
  recommendedDifficulty: z.number().min(1).max(10).describe('Recommended difficulty level'),
  rationale: z.string().describe('Why this difficulty is recommended'),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

// --- Analysis API request ---

export const AnalysisRequestSchema = z.object({
  sessionHistory: z
    .array(SessionContextSchema)
    .max(100)
    .describe('History of recent session contexts (max 100)'),
  currentProfile: z
    .object({
      overallLevel: z.number().min(1).max(10),
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
    })
    .describe('Current player profile'),
  providerId: z.enum(['openai', 'anthropic']),
});

export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>;

// --- Cross-Session Recalibration (Story 5.3) ---

export const RecalibrationRequestSchema = z.object({
  profileHistory: z
    .array(
      z.object({
        dimensions: z.record(
          z.string(),
          z.object({
            value: z.number().min(0).max(1),
            confidence: z.number().min(0).max(1),
            dataPoints: z.number(),
          })
        ),
        lastAssessedAt: z.string(),
      })
    )
    .min(3)
    .max(20)
    .describe('Recent skill profile snapshots (min 3 sessions)'),
  sessionSummaries: z
    .array(
      z.object({
        sessionDate: z.string(),
        durationMs: z.number(),
        avgAccuracy: z.number(),
        growthZoneRatio: z.number(),
        genre: z.string().nullable(),
        key: z.string().nullable(),
      })
    )
    .min(3)
    .max(20),
  currentOverloadStrategy: z.object({
    focusDimension: z.string(),
    incrementScale: z.number(),
    plateauFlags: z.record(z.string(), z.boolean()),
  }),
  providerId: z.enum(['openai', 'anthropic']),
});

export type RecalibrationRequest = z.infer<typeof RecalibrationRequestSchema>;

export const RecalibrationResultSchema = z.object({
  recommendedFocus: z
    .enum(['TimingAccuracy', 'HarmonicComplexity', 'TechniqueRange', 'Speed', 'GenreFamiliarity'])
    .describe('The skill dimension to focus on next'),
  parameterAdjustments: z
    .object({
      tempo: z.number().optional(),
      harmonicComplexity: z.number().optional(),
      keyDifficulty: z.number().optional(),
      rhythmicDensity: z.number().optional(),
      noteRange: z.number().optional(),
    })
    .describe('Specific parameter adjustments for next session'),
  plateauDimensions: z
    .array(
      z.enum([
        'TimingAccuracy',
        'HarmonicComplexity',
        'TechniqueRange',
        'Speed',
        'GenreFamiliarity',
      ])
    )
    .describe('Dimensions that have plateaued'),
  reasoning: z.string().describe('Musical pedagogy reasoning for recommendations'),
});

export type RecalibrationResultType = z.infer<typeof RecalibrationResultSchema>;
