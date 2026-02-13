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

// --- Drill generation structured output (Story 5.4) ---

export const DrillNoteSchema = z.object({
  midiNote: z.number().min(21).max(108).describe('MIDI note number (21=A0 to 108=C8)'),
  duration: z.number().positive().describe('Duration in beats'),
  velocity: z.number().min(1).max(127).describe('MIDI velocity'),
  startBeat: z.number().min(0).describe('Beat position within the measure'),
});

export const DrillGenerationSchema = z.object({
  targetSkill: z.string().describe('Specific skill this drill targets'),
  instructions: z.string().describe('Brief instruction for the musician'),
  sequence: z.object({
    notes: z.array(DrillNoteSchema).min(1).describe('MIDI note sequence'),
    chordSymbols: z.array(z.string()).optional().describe('Chord symbols for reference'),
    timeSignature: z.tuple([z.number(), z.number()]).describe('Time signature [beats, beat unit]'),
    measures: z.number().int().positive().describe('Number of measures'),
  }),
  targetTempo: z.number().min(40).max(240).describe('Target BPM'),
  successCriteria: z.object({
    timingThresholdMs: z.number().positive().describe('Acceptable timing deviation in ms'),
    accuracyTarget: z.number().min(0).max(1).describe('Required accuracy 0-1'),
    tempoToleranceBpm: z.number().positive().describe('Acceptable tempo variation in BPM'),
  }),
  reps: z.number().int().min(1).max(20).describe('Number of repetitions'),
});

export type DrillGeneration = z.infer<typeof DrillGenerationSchema>;

// --- Drill API request ---

export const DrillRequestSchema = z.object({
  sessionContext: SessionContextSchema,
  weakness: z.string().describe('Description of the weakness to target'),
  difficultyParameters: z
    .object({
      tempo: z.number(),
      harmonicComplexity: z.number(),
      keyDifficulty: z.number(),
      rhythmicDensity: z.number(),
      noteRange: z.number(),
    })
    .describe('Current difficulty parameters'),
  previousDrillDescriptions: z
    .array(z.string())
    .max(5)
    .optional()
    .describe('Previous drills for this weakness to ensure variety'),
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
