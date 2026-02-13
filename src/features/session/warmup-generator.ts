/**
 * Warm-Up & Micro-Session Generator — Layer 3 Domain Logic
 *
 * Rule-based warm-up generation (no LLM needed). Generates scale patterns,
 * chord exercises, and rhythmic warm-ups from skill profiles and recent
 * session data. Also structures micro-sessions with warm-up → challenge → cool-down.
 */

import type { SkillProfile } from '@/features/difficulty/difficulty-types';
import type {
  DrillNote,
  DrillSequence,
  WarmupExercise,
  WarmupRoutine,
  WarmupDifficulty,
  MicroSession,
  MicroSessionStack,
  GeneratedDrill,
  SessionSummary,
} from '@/features/drills/drill-types';
import type { WarmupContext } from './session-types';

// --- Constants ---

export const WARMUP_DURATION_SECONDS = 120;
export const MICRO_SESSION_MIN_SECONDS = 180;
export const MICRO_SESSION_MAX_SECONDS = 300;
const DEFAULT_VELOCITY = 80;

// --- Scale & Chord Data ---

/** Scale intervals from root (semitones). */
export const SCALES: Record<string, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic_major: [0, 2, 4, 7, 9],
  pentatonic_minor: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],
};

/** Map root note names to MIDI note numbers (octave 4). */
const KEY_TO_ROOT: Record<string, number> = {
  C: 60,
  'C#': 61,
  Db: 61,
  D: 62,
  'D#': 63,
  Eb: 63,
  E: 64,
  F: 65,
  'F#': 66,
  Gb: 66,
  G: 67,
  'G#': 68,
  Ab: 68,
  A: 69,
  'A#': 70,
  Bb: 70,
  B: 71,
};

/** Simple triad voicings (MIDI note numbers in octave 3-4 range). */
const CHORD_VOICINGS: Record<string, number[]> = {
  C_major: [48, 52, 55],
  D_major: [50, 54, 57],
  E_major: [52, 56, 59],
  F_major: [53, 57, 60],
  G_major: [55, 59, 62],
  A_major: [57, 61, 64],
  B_major: [59, 63, 66],
  C_minor: [48, 51, 55],
  D_minor: [50, 53, 57],
  E_minor: [52, 55, 59],
  F_minor: [53, 56, 60],
  G_minor: [55, 58, 62],
  A_minor: [57, 60, 64],
  B_minor: [59, 62, 66],
  Bb_major: [58, 62, 65],
  Eb_major: [51, 55, 58],
  Ab_major: [56, 60, 63],
};

// --- Key Parsing ---

export function parseKey(keyString: string): { root: string; mode: 'major' | 'minor' } | null {
  const match = keyString.match(/^([A-G][#b]?)\s*(major|minor)$/i);
  if (!match) return null;
  return { root: match[1], mode: match[2].toLowerCase() as 'major' | 'minor' };
}

export function rootToMidi(root: string): number {
  return KEY_TO_ROOT[root] ?? 60;
}

// --- Scale Pattern Generation ---

/**
 * Generate an ascending-descending scale pattern.
 */
export function generateScalePattern(
  rootNote: number,
  scale: number[],
  octaves: number
): DrillSequence {
  const notes: DrillNote[] = [];
  let beat = 0;

  // Ascending
  for (let oct = 0; oct < octaves; oct++) {
    for (const interval of scale) {
      notes.push({
        midiNote: rootNote + oct * 12 + interval,
        duration: 1,
        velocity: DEFAULT_VELOCITY,
        startBeat: beat++,
      });
    }
  }
  // Top note
  notes.push({
    midiNote: rootNote + octaves * 12,
    duration: 1,
    velocity: DEFAULT_VELOCITY,
    startBeat: beat++,
  });

  // Descending
  for (let oct = octaves - 1; oct >= 0; oct--) {
    for (let i = scale.length - 1; i >= 0; i--) {
      notes.push({
        midiNote: rootNote + oct * 12 + scale[i],
        duration: 1,
        velocity: DEFAULT_VELOCITY,
        startBeat: beat++,
      });
    }
  }

  return {
    notes,
    timeSignature: [4, 4] as [number, number],
    measures: Math.ceil(beat / 4),
  };
}

/**
 * Generate a chord transition pattern.
 */
export function generateChordPattern(
  chordNames: string[],
  beatsPerChord: number = 4
): DrillSequence {
  const notes: DrillNote[] = [];
  const symbols: string[] = [];
  let beat = 0;

  for (const name of chordNames) {
    const voicing = CHORD_VOICINGS[name];
    if (!voicing) continue;

    symbols.push(name.replace('_', ' '));

    // Play chord notes simultaneously
    for (const midiNote of voicing) {
      notes.push({
        midiNote,
        duration: beatsPerChord,
        velocity: DEFAULT_VELOCITY,
        startBeat: beat,
      });
    }
    beat += beatsPerChord;
  }

  return {
    notes,
    chordSymbols: symbols,
    timeSignature: [4, 4] as [number, number],
    measures: Math.ceil(beat / 4),
  };
}

/**
 * Generate a simple rhythmic pattern on a single note.
 */
export function generateRhythmPattern(
  rootNote: number,
  beats: number,
  subdivision: 1 | 2 = 1
): DrillSequence {
  const notes: DrillNote[] = [];
  const totalNotes = beats * subdivision;
  const duration = 1 / subdivision;

  for (let i = 0; i < totalNotes; i++) {
    notes.push({
      midiNote: rootNote,
      duration,
      velocity: i % (4 * subdivision) === 0 ? 100 : DEFAULT_VELOCITY,
      startBeat: i * duration,
    });
  }

  return {
    notes,
    timeSignature: [4, 4] as [number, number],
    measures: Math.ceil(beats / 4),
  };
}

// --- Exercise Builders ---

/**
 * Build a scale warm-up exercise.
 */
export function buildScaleWarmup(
  key: string,
  skillLevel: number,
  difficulty: WarmupDifficulty
): WarmupExercise {
  const parsed = parseKey(key);
  const root = parsed ? rootToMidi(parsed.root) : 60;
  const scaleName = parsed?.mode === 'minor' ? 'minor' : 'major';
  const scale = SCALES[scaleName];
  const octaves = difficulty === 'easy' ? 1 : 2;
  const tempoMultiplier = difficulty === 'easy' ? 0.6 : difficulty === 'moderate' ? 0.8 : 1.0;
  const baseTempo = Math.max(60, Math.round(skillLevel * 120));
  const tempo = Math.round(baseTempo * tempoMultiplier);

  const sequence = generateScalePattern(root, scale, octaves);
  const beatDuration = 60 / tempo;
  const totalBeats = sequence.notes.length;
  const durationSeconds = Math.round(totalBeats * beatDuration);

  return {
    id: crypto.randomUUID(),
    title: `${parsed?.root ?? 'C'} ${scaleName} scale`,
    sequence,
    targetTempo: tempo,
    durationSeconds,
    difficulty,
  };
}

/**
 * Build a chord transition warm-up exercise.
 */
export function buildChordWarmup(
  chords: string[],
  skillLevel: number,
  difficulty: WarmupDifficulty
): WarmupExercise {
  const tempoMultiplier = difficulty === 'easy' ? 0.6 : difficulty === 'moderate' ? 0.8 : 1.0;
  const baseTempo = Math.max(60, Math.round(skillLevel * 120));
  const tempo = Math.round(baseTempo * tempoMultiplier);

  // Convert chord names to voicing keys
  const voicingKeys = chords.map((c) => {
    const normalized = c.replace(/\s+/g, '_');
    return CHORD_VOICINGS[normalized] ? normalized : 'C_major';
  });

  const sequence = generateChordPattern(voicingKeys);
  const totalBeats = sequence.measures * 4;
  const durationSeconds = Math.round((totalBeats * 60) / tempo);

  return {
    id: crypto.randomUUID(),
    title: `Chord transitions: ${chords.join(' \u203A ')}`,
    sequence,
    targetTempo: tempo,
    durationSeconds,
    difficulty,
  };
}

/**
 * Build a rhythmic warm-up exercise.
 */
export function buildRhythmWarmup(tempo: number, difficulty: WarmupDifficulty): WarmupExercise {
  const tempoMultiplier = difficulty === 'easy' ? 0.8 : difficulty === 'moderate' ? 0.9 : 1.0;
  const adjustedTempo = Math.round(tempo * tempoMultiplier);
  const beats = 16;
  const subdivision = difficulty === 'target' ? 2 : 1;

  const sequence = generateRhythmPattern(60, beats, subdivision as 1 | 2);
  const totalBeats = beats;
  const durationSeconds = Math.round((totalBeats * 60) / adjustedTempo);

  return {
    id: crypto.randomUUID(),
    title: `Rhythm: ${adjustedTempo} BPM${subdivision === 2 ? ' (eighth notes)' : ''}`,
    sequence,
    targetTempo: adjustedTempo,
    durationSeconds,
    difficulty,
  };
}

// --- Warm-Up Routine Generation ---

/**
 * Pick a key that hasn't been recently practiced, or fall back to defaults.
 */
function selectAvoidantKey(recentKeys: string[], warmupCtx?: WarmupContext): string {
  if (!warmupCtx || warmupCtx.recentKeys.length === 0) {
    return recentKeys[0] ?? 'C major';
  }

  // All available keys to choose from
  const allKeys = [
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
  ];

  // Filter out recently practiced keys
  const avoided = new Set(warmupCtx.recentKeys.map((k) => k.toLowerCase()));
  const available = allKeys.filter((k) => !avoided.has(k.toLowerCase()));

  if (available.length > 0) return available[0];
  return recentKeys[0] ?? 'C major';
}

/**
 * Generate a ~2 minute warm-up routine based on skill profile and recent sessions.
 * Rule-based (no LLM) for instant generation.
 *
 * @param warmupCtx - Optional context from continuity service for practice avoidance
 */
export function generateWarmup(
  skillProfile: SkillProfile | null,
  recentSessions: SessionSummary[],
  upcomingFocus?: string,
  warmupCtx?: WarmupContext
): WarmupRoutine {
  const speedLevel = skillProfile?.dimensions.Speed?.value ?? 0.5;
  const recentKeys = extractRecentKeys(recentSessions);
  const recentWeaknesses = extractRecentWeaknesses(recentSessions);

  // Use avoidance logic if warmup context is available
  const primaryKey = warmupCtx
    ? selectAvoidantKey(recentKeys, warmupCtx)
    : (recentKeys[0] ?? 'C major');

  const exercises: WarmupExercise[] = [];

  // Exercise 1: Scale warm-up (easy, 60% tempo)
  exercises.push(buildScaleWarmup(primaryKey, speedLevel, 'easy'));

  // Exercise 2: Chord warm-up or second scale (moderate, 80% tempo)
  const chords = deriveChords(primaryKey);
  if (chords.length >= 2) {
    exercises.push(buildChordWarmup(chords, speedLevel, 'moderate'));
  } else {
    const secondKey = recentKeys[1] ?? 'G major';
    exercises.push(buildScaleWarmup(secondKey, speedLevel, 'moderate'));
  }

  // Exercise 3: Build on improving patterns from continuity context
  if (warmupCtx && warmupCtx.improvingPatterns.length > 0 && !upcomingFocus) {
    const improvingFocus = warmupCtx.improvingPatterns[0];
    const focusExercise = buildFocusExercise(improvingFocus, speedLevel);
    if (focusExercise) exercises.push(focusExercise);
  }

  // Exercise 4: Adapt to upcoming focus if specified (target, 100% tempo)
  if (upcomingFocus) {
    const focusExercise = buildFocusExercise(upcomingFocus, speedLevel);
    if (focusExercise) exercises.push(focusExercise);
  }

  // Exercise 5: Rhythm warm-up at target tempo
  const targetTempo = Math.max(80, Math.round(speedLevel * 120));
  exercises.push(buildRhythmWarmup(targetTempo, 'target'));

  // Trim to fit within target duration
  const trimmed = trimToTargetDuration(exercises, WARMUP_DURATION_SECONDS);
  const totalDuration = trimmed.reduce((s, e) => s + e.durationSeconds, 0);

  return {
    exercises: trimmed,
    totalDurationSeconds: totalDuration,
    basedOn: {
      recentKeys,
      recentWeaknesses,
      upcomingFocus,
    },
  };
}

// --- Micro-Session Logic ---

/**
 * Create a micro-session structure with warm-up → challenge → cool-down reps.
 * The drill should be pre-generated via the AI drill API (Story 5.4).
 */
export function createMicroSession(
  weakness: string,
  drill: GeneratedDrill,
  targetDurationSeconds: number = MICRO_SESSION_MAX_SECONDS
): MicroSession {
  const repDurationSec = estimateRepDuration(drill);
  const demoPauseSec = repDurationSec + 2;

  // Calculate rep counts to fit target duration
  // Structure: 1 warmup + N challenge + 1 cooldown, each with demo + attempt + pause
  const perRepTotal = demoPauseSec + repDurationSec + 2;
  const availableForChallenge = targetDurationSeconds - perRepTotal * 2; // subtract warmup + cooldown
  const challengeReps = Math.max(1, Math.min(5, Math.floor(availableForChallenge / perRepTotal)));

  return {
    id: crypto.randomUUID(),
    targetWeakness: weakness,
    warmupReps: 1,
    challengeReps,
    cooldownReps: 1,
    targetDurationSeconds: Math.round((1 + challengeReps + 1) * perRepTotal),
    drill,
  };
}

/**
 * Estimate the duration of one rep in seconds.
 */
export function estimateRepDuration(drill: GeneratedDrill): number {
  const totalBeats = drill.sequence.measures * drill.sequence.timeSignature[0];
  return (totalBeats * 60) / drill.targetTempo;
}

/**
 * Select the next weakness to target for stacking, excluding already-targeted ones.
 */
export function selectNextWeakness(
  skillProfile: SkillProfile,
  alreadyTargeted: string[]
): string | null {
  const dimensions = Object.entries(skillProfile.dimensions)
    .filter(([dim]) => !alreadyTargeted.includes(dim))
    .sort((a, b) => a[1].value - b[1].value);

  if (dimensions.length === 0) return null;

  // Pick the weakest non-targeted dimension
  return dimensions[0][0];
}

/**
 * Add a completed micro-session to a stack, returning the updated stack.
 */
export function addToStack(
  stack: MicroSessionStack | null,
  session: MicroSession
): MicroSessionStack {
  const existing = stack ?? { sessions: [], totalDurationSeconds: 0, weaknessesTargeted: [] };
  return {
    sessions: [...existing.sessions, session],
    totalDurationSeconds: existing.totalDurationSeconds + session.targetDurationSeconds,
    weaknessesTargeted: [...existing.weaknessesTargeted, session.targetWeakness],
  };
}

// --- Helpers ---

function extractRecentKeys(sessions: SessionSummary[]): string[] {
  const keys: string[] = [];
  for (const s of sessions) {
    if (s.key && !keys.includes(s.key)) keys.push(s.key);
  }
  return keys.length > 0 ? keys : ['C major'];
}

function extractRecentWeaknesses(sessions: SessionSummary[]): string[] {
  const weaknesses: string[] = [];
  for (const s of sessions) {
    for (const w of s.weaknesses) {
      if (!weaknesses.includes(w)) weaknesses.push(w);
    }
  }
  return weaknesses;
}

function deriveChords(keyString: string): string[] {
  const parsed = parseKey(keyString);
  if (!parsed) return ['C_major', 'G_major'];

  const root = parsed.root;
  if (parsed.mode === 'major') {
    // I, IV, V triads
    const fourthRoots: Record<string, string> = {
      C: 'F',
      D: 'G',
      E: 'A',
      F: 'Bb',
      G: 'C',
      A: 'D',
      B: 'E',
      'C#': 'F#',
      Db: 'Gb',
      'D#': 'G#',
      Eb: 'Ab',
      'F#': 'B',
      Gb: 'B',
      'G#': 'C#',
      Ab: 'Db',
      'A#': 'D#',
      Bb: 'Eb',
    };
    const fifthRoots: Record<string, string> = {
      C: 'G',
      D: 'A',
      E: 'B',
      F: 'C',
      G: 'D',
      A: 'E',
      B: 'F#',
      'C#': 'G#',
      Db: 'Ab',
      'D#': 'A#',
      Eb: 'Bb',
      'F#': 'C#',
      Gb: 'Db',
      'G#': 'D#',
      Ab: 'Eb',
      'A#': 'F',
      Bb: 'F',
    };
    return [
      `${root}_major`,
      `${fourthRoots[root] ?? 'F'}_major`,
      `${fifthRoots[root] ?? 'G'}_major`,
    ];
  }

  // Minor: i, iv, v
  return [`${root}_minor`, `${root}_minor`, `${root}_minor`];
}

function buildFocusExercise(focus: string, speedLevel: number): WarmupExercise | null {
  const lower = focus.toLowerCase();

  // Try to extract key from focus string
  const keyMatch = lower.match(/([a-g][#b]?)\s*(major|minor)/i);
  if (keyMatch) {
    const key = `${keyMatch[1].charAt(0).toUpperCase()}${keyMatch[1].slice(1)} ${keyMatch[2]}`;
    return buildScaleWarmup(key, speedLevel, 'target');
  }

  // Try to detect chord-related focus
  if (lower.includes('chord') || lower.includes('transition') || lower.includes('voicing')) {
    return buildChordWarmup(['C_major', 'A_minor', 'F_major', 'G_major'], speedLevel, 'target');
  }

  // Try to detect tempo-related focus
  const tempoMatch = lower.match(/(\d+)\s*bpm/);
  if (tempoMatch) {
    return buildRhythmWarmup(parseInt(tempoMatch[1], 10), 'target');
  }

  return null;
}

function trimToTargetDuration(
  exercises: WarmupExercise[],
  targetSeconds: number
): WarmupExercise[] {
  let total = 0;
  const result: WarmupExercise[] = [];

  for (const ex of exercises) {
    if (total + ex.durationSeconds > targetSeconds * 1.2 && result.length >= 2) break;
    result.push(ex);
    total += ex.durationSeconds;
  }

  return result;
}
