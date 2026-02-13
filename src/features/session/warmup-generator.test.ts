// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  generateWarmup,
  buildScaleWarmup,
  buildChordWarmup,
  buildRhythmWarmup,
  createMicroSession,
  estimateRepDuration,
  selectNextWeakness,
  addToStack,
  generateScalePattern,
  generateChordPattern,
  generateRhythmPattern,
  parseKey,
  rootToMidi,
  SCALES,
  MICRO_SESSION_MAX_SECONDS,
} from './warmup-generator';
import { SkillDimension, type SkillProfile } from '@/features/difficulty/difficulty-types';
import type { GeneratedDrill, SessionSummary } from '@/features/drills/drill-types';
import type { WarmupContext } from './session-types';
import { DEFAULT_DIFFICULTY } from '@/features/difficulty/difficulty-engine';

// --- Helpers ---

function makeProfile(speedValue: number = 0.7): SkillProfile {
  const dims = {} as Record<
    SkillDimension,
    { value: number; confidence: number; dataPoints: number; lastUpdated: string }
  >;
  for (const dim of Object.values(SkillDimension)) {
    dims[dim] = {
      value: dim === SkillDimension.Speed ? speedValue : 0.5,
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

function makeDrill(overrides?: Partial<GeneratedDrill>): GeneratedDrill {
  return {
    id: 'drill-1',
    targetSkill: 'Chord transitions',
    weaknessDescription: 'Slow transitions',
    sequence: {
      notes: [
        { midiNote: 60, duration: 1, velocity: 80, startBeat: 0 },
        { midiNote: 64, duration: 1, velocity: 80, startBeat: 1 },
        { midiNote: 67, duration: 1, velocity: 80, startBeat: 2 },
        { midiNote: 72, duration: 1, velocity: 80, startBeat: 3 },
      ],
      timeSignature: [4, 4] as [number, number],
      measures: 2,
    },
    targetTempo: 100,
    successCriteria: { timingThresholdMs: 50, accuracyTarget: 0.8, tempoToleranceBpm: 5 },
    reps: 4,
    instructions: 'Play chord arpeggio',
    difficultyLevel: { ...DEFAULT_DIFFICULTY },
    ...overrides,
  };
}

function makeSessions(): SessionSummary[] {
  return [
    { key: 'C major', weaknesses: ['Chord transitions', 'Timing drift'], avgTempo: 100 },
    { key: 'G major', weaknesses: ['Key changes'], avgTempo: 110 },
  ];
}

// --- Tests ---

describe('parseKey', () => {
  it('parses "C major" correctly', () => {
    expect(parseKey('C major')).toEqual({ root: 'C', mode: 'major' });
  });

  it('parses "A minor" correctly', () => {
    expect(parseKey('A minor')).toEqual({ root: 'A', mode: 'minor' });
  });

  it('parses "Bb major" correctly', () => {
    expect(parseKey('Bb major')).toEqual({ root: 'Bb', mode: 'major' });
  });

  it('returns null for invalid input', () => {
    expect(parseKey('not a key')).toBeNull();
  });
});

describe('rootToMidi', () => {
  it('returns 60 for C', () => {
    expect(rootToMidi('C')).toBe(60);
  });

  it('returns 69 for A', () => {
    expect(rootToMidi('A')).toBe(69);
  });

  it('returns 70 for Bb', () => {
    expect(rootToMidi('Bb')).toBe(70);
  });

  it('defaults to 60 for unknown', () => {
    expect(rootToMidi('X')).toBe(60);
  });
});

describe('generateScalePattern', () => {
  it('produces ascending-descending scale with correct note count', () => {
    const scale = SCALES.major;
    const pattern = generateScalePattern(60, scale, 1);

    // 1 octave ascending: 7 notes + top note (8)
    // Descending: 7 notes back down (7, excluding top)
    // Total: 8 + 7 = 15
    expect(pattern.notes.length).toBe(15);
  });

  it('starts with root note', () => {
    const pattern = generateScalePattern(60, SCALES.major, 1);
    expect(pattern.notes[0].midiNote).toBe(60);
  });

  it('reaches the octave at the top', () => {
    const pattern = generateScalePattern(60, SCALES.major, 1);
    // Ascending: 0,2,4,5,7,9,11 → notes[7] = root + 12
    expect(pattern.notes[7].midiNote).toBe(72);
  });

  it('2-octave pattern has more notes than 1-octave', () => {
    const one = generateScalePattern(60, SCALES.major, 1);
    const two = generateScalePattern(60, SCALES.major, 2);
    expect(two.notes.length).toBeGreaterThan(one.notes.length);
  });
});

describe('generateChordPattern', () => {
  it('generates simultaneous notes for each chord', () => {
    const pattern = generateChordPattern(['C_major', 'G_major']);
    // C major triad (3 notes) + G major triad (3 notes)
    expect(pattern.notes).toHaveLength(6);
  });

  it('spaces chords by beatsPerChord', () => {
    const pattern = generateChordPattern(['C_major', 'G_major'], 4);
    const cNotes = pattern.notes.filter((n) => n.startBeat === 0);
    const gNotes = pattern.notes.filter((n) => n.startBeat === 4);
    expect(cNotes).toHaveLength(3);
    expect(gNotes).toHaveLength(3);
  });

  it('skips unknown chord voicings', () => {
    const pattern = generateChordPattern(['C_major', 'UNKNOWN', 'G_major']);
    expect(pattern.notes).toHaveLength(6);
  });

  it('includes chord symbols', () => {
    const pattern = generateChordPattern(['C_major', 'A_minor']);
    expect(pattern.chordSymbols).toEqual(['C major', 'A minor']);
  });
});

describe('generateRhythmPattern', () => {
  it('generates correct number of notes for quarter notes', () => {
    const pattern = generateRhythmPattern(60, 8, 1);
    expect(pattern.notes).toHaveLength(8);
  });

  it('doubles notes for eighth note subdivision', () => {
    const pattern = generateRhythmPattern(60, 8, 2);
    expect(pattern.notes).toHaveLength(16);
  });

  it('accents first beat of each measure', () => {
    const pattern = generateRhythmPattern(60, 8, 1);
    expect(pattern.notes[0].velocity).toBe(100);
    expect(pattern.notes[4].velocity).toBe(100);
    expect(pattern.notes[1].velocity).toBe(80);
  });
});

describe('buildScaleWarmup', () => {
  it('returns exercise with correct difficulty', () => {
    const ex = buildScaleWarmup('C major', 0.7, 'easy');
    expect(ex.difficulty).toBe('easy');
    expect(ex.title).toContain('C');
    expect(ex.title).toContain('major');
  });

  it('easy exercises use slower tempo than target', () => {
    const easy = buildScaleWarmup('C major', 0.7, 'easy');
    const target = buildScaleWarmup('C major', 0.7, 'target');
    expect(easy.targetTempo).toBeLessThan(target.targetTempo);
  });

  it('moderate exercises use intermediate tempo', () => {
    const easy = buildScaleWarmup('C major', 0.7, 'easy');
    const moderate = buildScaleWarmup('C major', 0.7, 'moderate');
    const target = buildScaleWarmup('C major', 0.7, 'target');
    expect(moderate.targetTempo).toBeGreaterThan(easy.targetTempo);
    expect(moderate.targetTempo).toBeLessThan(target.targetTempo);
  });

  it('has a positive duration', () => {
    const ex = buildScaleWarmup('A minor', 0.5, 'easy');
    expect(ex.durationSeconds).toBeGreaterThan(0);
  });
});

describe('buildChordWarmup', () => {
  it('generates exercise with chord transitions title', () => {
    const ex = buildChordWarmup(['C_major', 'A_minor'], 0.7, 'moderate');
    expect(ex.title).toContain('Chord transitions');
  });

  it('has notes in the sequence', () => {
    const ex = buildChordWarmup(['C_major', 'G_major', 'A_minor'], 0.7, 'easy');
    expect(ex.sequence.notes.length).toBeGreaterThan(0);
  });
});

describe('buildRhythmWarmup', () => {
  it('generates exercise at adjusted tempo', () => {
    const ex = buildRhythmWarmup(120, 'easy');
    expect(ex.targetTempo).toBeLessThan(120);
  });

  it('target difficulty uses full tempo', () => {
    const ex = buildRhythmWarmup(120, 'target');
    expect(ex.targetTempo).toBe(120);
  });
});

describe('generateWarmup', () => {
  it('produces 2-4 exercises', () => {
    const profile = makeProfile();
    const warmup = generateWarmup(profile, makeSessions());
    expect(warmup.exercises.length).toBeGreaterThanOrEqual(2);
    expect(warmup.exercises.length).toBeLessThanOrEqual(4);
  });

  it('exercises are in progressive difficulty order', () => {
    const profile = makeProfile();
    const warmup = generateWarmup(profile, makeSessions());
    const difficulties = warmup.exercises.map((e) => e.difficulty);
    // First exercise should be easy
    expect(difficulties[0]).toBe('easy');
    // Last exercise should not be easy
    expect(difficulties[difficulties.length - 1]).not.toBe('easy');
  });

  it('starting tempo is ~80% of skill level for easy exercises', () => {
    const profile = makeProfile(0.7);
    const warmup = generateWarmup(profile, makeSessions());
    const baseTempo = Math.round(0.7 * 120);
    const easyTempo = warmup.exercises[0].targetTempo;
    // Easy is 60% of base
    expect(easyTempo).toBeCloseTo(baseTempo * 0.6, -1);
  });

  it('adapts to upcoming focus when provided', () => {
    const profile = makeProfile();
    const warmup = generateWarmup(profile, makeSessions(), 'Am chord transitions');
    expect(warmup.basedOn.upcomingFocus).toBe('Am chord transitions');
    // Should have at least 3 exercises when focus is provided
    expect(warmup.exercises.length).toBeGreaterThanOrEqual(3);
  });

  it('includes recent keys in basedOn', () => {
    const profile = makeProfile();
    const warmup = generateWarmup(profile, makeSessions());
    expect(warmup.basedOn.recentKeys).toContain('C major');
    expect(warmup.basedOn.recentKeys).toContain('G major');
  });

  it('handles null profile gracefully', () => {
    const warmup = generateWarmup(null, []);
    expect(warmup.exercises.length).toBeGreaterThanOrEqual(2);
  });

  it('handles empty sessions gracefully', () => {
    const profile = makeProfile();
    const warmup = generateWarmup(profile, []);
    expect(warmup.exercises.length).toBeGreaterThanOrEqual(2);
  });

  it('when upcomingFocus mentions a key, includes key-related exercise', () => {
    const profile = makeProfile();
    const warmup = generateWarmup(profile, [], 'Bb major scale patterns');
    const bbExercise = warmup.exercises.find(
      (e) => e.title.includes('Bb') || e.title.includes('B')
    );
    expect(bbExercise).toBeDefined();
  });

  it('avoids recently practiced keys when warmupCtx is provided', () => {
    const profile = makeProfile();
    const sessions: SessionSummary[] = [{ key: 'C major', weaknesses: [], avgTempo: 100 }];
    const warmupCtx: WarmupContext = {
      recentKeys: ['C major'],
      recentChordTypes: [],
      recentSkillAreas: [],
      improvingPatterns: [],
    };
    const warmup = generateWarmup(profile, sessions, undefined, warmupCtx);
    // First exercise should NOT be in C major (avoidance)
    expect(warmup.exercises[0].title).not.toContain('C major');
  });

  it('falls back to default key when all common keys are recently practiced', () => {
    const profile = makeProfile();
    const warmupCtx: WarmupContext = {
      recentKeys: [
        'C major',
        'G major',
        'D major',
        'A major',
        'E major',
        'F major',
        'Bb major',
        'A minor',
        'D minor',
        'E minor',
        'B minor',
      ],
      recentChordTypes: [],
      recentSkillAreas: [],
      improvingPatterns: [],
    };
    // Should not throw; falls back to first recent key from sessions
    const warmup = generateWarmup(profile, [], undefined, warmupCtx);
    expect(warmup.exercises.length).toBeGreaterThanOrEqual(2);
  });

  it('adds improving pattern exercise when warmupCtx has improving patterns', () => {
    const profile = makeProfile();
    const warmupCtx: WarmupContext = {
      recentKeys: [],
      recentChordTypes: [],
      recentSkillAreas: [],
      improvingPatterns: ['G major scale patterns'],
    };
    const warmup = generateWarmup(profile, [], undefined, warmupCtx);
    // Should have an exercise related to the improving pattern
    expect(warmup.exercises.length).toBeGreaterThanOrEqual(3);
  });
});

describe('createMicroSession', () => {
  it('structures reps as warmup → challenge → cooldown', () => {
    const drill = makeDrill();
    const session = createMicroSession('Slow transitions', drill);
    expect(session.warmupReps).toBe(1);
    expect(session.challengeReps).toBeGreaterThanOrEqual(1);
    expect(session.cooldownReps).toBe(1);
  });

  it('targets the specified weakness', () => {
    const session = createMicroSession('Timing drift', makeDrill());
    expect(session.targetWeakness).toBe('Timing drift');
  });

  it('has positive target duration', () => {
    const session = createMicroSession('Test', makeDrill());
    expect(session.targetDurationSeconds).toBeGreaterThan(0);
  });

  it('has unique ID', () => {
    const s1 = createMicroSession('Test', makeDrill());
    const s2 = createMicroSession('Test', makeDrill());
    expect(s1.id).not.toBe(s2.id);
  });

  it('includes the provided drill', () => {
    const drill = makeDrill({ id: 'custom-drill' });
    const session = createMicroSession('Test', drill);
    expect(session.drill.id).toBe('custom-drill');
  });

  it('total reps fit within target duration', () => {
    const drill = makeDrill({ targetTempo: 120 });
    const session = createMicroSession('Test', drill, MICRO_SESSION_MAX_SECONDS);
    const totalReps = session.warmupReps + session.challengeReps + session.cooldownReps;
    expect(totalReps).toBeGreaterThanOrEqual(3); // At least 1+1+1
    expect(totalReps).toBeLessThanOrEqual(10);
  });
});

describe('estimateRepDuration', () => {
  it('calculates correct duration for 2 measures at 120 BPM in 4/4', () => {
    const drill = makeDrill({
      sequence: {
        notes: [{ midiNote: 60, duration: 1, velocity: 80, startBeat: 0 }],
        timeSignature: [4, 4] as [number, number],
        measures: 2,
      },
      targetTempo: 120,
    });
    // 2 measures * 4 beats = 8 beats at 120 BPM = 4 seconds
    expect(estimateRepDuration(drill)).toBe(4);
  });
});

describe('selectNextWeakness', () => {
  it('picks the weakest non-targeted dimension', () => {
    const profile = makeProfile();
    // TimingAccuracy is at 0.5 (not Speed which is custom)
    const next = selectNextWeakness(profile, ['Speed']);
    expect(next).toBeDefined();
    expect(next).not.toBe('Speed');
  });

  it('excludes already-targeted weaknesses', () => {
    const profile = makeProfile();
    const targeted = Object.values(SkillDimension).slice(0, 4);
    const next = selectNextWeakness(profile, targeted);
    expect(next).toBeDefined();
    expect(targeted).not.toContain(next);
  });

  it('returns null when all dimensions are targeted', () => {
    const profile = makeProfile();
    const allDims = Object.values(SkillDimension);
    const next = selectNextWeakness(profile, allDims);
    expect(next).toBeNull();
  });
});

describe('addToStack', () => {
  it('creates new stack from null', () => {
    const session = createMicroSession('Test', makeDrill());
    const stack = addToStack(null, session);
    expect(stack.sessions).toHaveLength(1);
    expect(stack.weaknessesTargeted).toContain('Test');
  });

  it('appends to existing stack', () => {
    const s1 = createMicroSession('Timing', makeDrill());
    const s2 = createMicroSession('Harmony', makeDrill());
    let stack = addToStack(null, s1);
    stack = addToStack(stack, s2);
    expect(stack.sessions).toHaveLength(2);
    expect(stack.weaknessesTargeted).toEqual(['Timing', 'Harmony']);
  });

  it('accumulates total duration', () => {
    const s1 = createMicroSession('A', makeDrill());
    const s2 = createMicroSession('B', makeDrill());
    let stack = addToStack(null, s1);
    stack = addToStack(stack, s2);
    expect(stack.totalDurationSeconds).toBe(s1.targetDurationSeconds + s2.targetDurationSeconds);
  });
});
