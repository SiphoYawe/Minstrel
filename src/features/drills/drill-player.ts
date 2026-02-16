/**
 * Drill Playback Scheduler & Phase Orchestrator — Layer 2/3
 *
 * Schedules and plays drill sequences through either MIDI output or
 * Web Audio API fallback. Manages the Demonstrate → Listen → Attempt
 * phase transitions that form Minstrel's signature interaction loop.
 */

import type { GeneratedDrill, DrillNote } from './drill-types';
import { DrillPhase } from './drill-types';
import {
  sendNoteOn,
  sendNoteOff,
  sendAllNotesOff,
  midiNoteToFrequency,
} from '@/features/midi/midi-output';

/** Callback fired as each note plays during demonstration. */
export type NotePlayCallback = (note: DrillNote, index: number, total: number) => void;

/** Output target: either a MIDI output port or a Web Audio context for fallback. */
export type DrillOutput =
  | { type: 'midi'; port: MIDIOutput }
  | { type: 'audio'; audioContext: AudioContext };

export interface DrillPlayerOptions {
  onNotePlay?: NotePlayCallback;
  onComplete?: () => void;
}

export interface PlaybackHandle {
  /** Stop playback immediately. Sends allNotesOff for MIDI output. */
  stop(): void;
  /** Resolves when playback finishes or is stopped. */
  completed: Promise<void>;
}

/** Milliseconds of scheduling buffer before first note fires. */
const SCHEDULE_AHEAD_MS = 100;

/** ADSR envelope constants for audio fallback. */
const ATTACK_S = 0.01;
const DECAY_S = 0.05;
const SUSTAIN_LEVEL = 0.7;
const RELEASE_S = 0.1;

/**
 * Schedule and play all notes from a generated drill.
 *
 * For MIDI output, notes are scheduled upfront using Web MIDI API timestamps
 * for hardware-level precision. For audio fallback, Web Audio API scheduling
 * is used with oscillator synthesis and ADSR envelopes.
 *
 * Visual callbacks fire via setTimeout at each note's start time to drive
 * Canvas visualization updates.
 */
export function playDrill(
  drill: GeneratedDrill,
  output: DrillOutput,
  options?: DrillPlayerOptions
): PlaybackHandle {
  let stopped = false;
  const timers: ReturnType<typeof setTimeout>[] = [];
  let resolveCompleted: (() => void) | null = null;

  const completed = new Promise<void>((resolve) => {
    resolveCompleted = resolve;
  });

  const beatDurationMs = 60000 / drill.targetTempo;
  const notes = drill.sequence.notes;
  let maxEndMs = 0;

  // Compute audio base time once (only used for audio output)
  const audioBaseTime =
    output.type === 'audio' ? output.audioContext.currentTime + SCHEDULE_AHEAD_MS / 1000 : 0;

  // Compute MIDI base timestamp once (only used for MIDI output)
  const midiBaseTime = output.type === 'midi' ? performance.now() + SCHEDULE_AHEAD_MS : 0;

  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    const noteStartMs = note.startBeat * beatDurationMs;
    const noteDurationMs = note.duration * beatDurationMs;
    const noteEndMs = noteStartMs + noteDurationMs;

    if (noteEndMs > maxEndMs) maxEndMs = noteEndMs;

    if (output.type === 'midi') {
      sendNoteOn(output.port, note.midiNote, note.velocity, 0, midiBaseTime + noteStartMs);
      sendNoteOff(output.port, note.midiNote, 0, midiBaseTime + noteEndMs);
    }

    if (output.type === 'audio') {
      const beatDurationS = beatDurationMs / 1000;
      scheduleAudioNote(output.audioContext, note, audioBaseTime, beatDurationS);
    }

    // Schedule visual callback
    if (options?.onNotePlay) {
      const cb = options.onNotePlay;
      const idx = i;
      const total = notes.length;
      const timer = setTimeout(() => {
        if (!stopped) cb(note, idx, total);
      }, SCHEDULE_AHEAD_MS + noteStartMs);
      timers.push(timer);
    }
  }

  // Schedule completion callback
  const completionTimer = setTimeout(
    () => {
      if (!stopped) {
        stopped = true;
        options?.onComplete?.();
        resolveCompleted?.();
      }
    },
    SCHEDULE_AHEAD_MS + maxEndMs + 200
  );
  timers.push(completionTimer);

  const stop = () => {
    if (stopped) return;
    stopped = true;
    for (const timer of timers) clearTimeout(timer);
    timers.length = 0;
    if (output.type === 'midi') {
      sendAllNotesOff(output.port);
    }
    resolveCompleted?.();
  };

  return { stop, completed };
}

/**
 * Schedule a single note using Web Audio API oscillator synthesis.
 * Uses a triangle wave with ADSR envelope for a clean, functional tone.
 */
function scheduleAudioNote(
  ctx: AudioContext,
  note: DrillNote,
  baseTime: number,
  beatDurationS: number
): void {
  const noteStart = baseTime + note.startBeat * beatDurationS;
  const noteEnd = noteStart + note.duration * beatDurationS;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.value = midiNoteToFrequency(note.midiNote);

  const velocityGain = note.velocity / 127;

  // ADSR envelope
  gain.gain.setValueAtTime(0, noteStart);
  gain.gain.linearRampToValueAtTime(velocityGain, noteStart + ATTACK_S);
  gain.gain.linearRampToValueAtTime(SUSTAIN_LEVEL * velocityGain, noteStart + ATTACK_S + DECAY_S);
  // Hold sustain until release begins
  const releaseStart = Math.max(noteStart + ATTACK_S + DECAY_S, noteEnd - RELEASE_S);
  gain.gain.setValueAtTime(SUSTAIN_LEVEL * velocityGain, releaseStart);
  gain.gain.linearRampToValueAtTime(0, noteEnd);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(noteStart);
  osc.stop(noteEnd + 0.05);

  // STATE-M6: Disconnect audio nodes after oscillator ends to prevent accumulation
  osc.addEventListener('ended', () => {
    osc.disconnect();
    gain.disconnect();
  });
}

/** Pause duration (ms) between demonstration end and "Your turn" prompt. */
const LISTEN_PAUSE_MS = 1500;

export interface DrillCycleController {
  /** Begin the demonstrate → listen → attempt flow. */
  startDemonstration(): void;
  /** Stop the current cycle immediately. */
  stop(): void;
  /** Resolves when demonstration + listen pause completes and attempt phase begins. */
  readyForAttempt: Promise<void>;
}

/**
 * Create a drill cycle controller that orchestrates the phase transitions:
 *   Demonstrate → Listen (1.5s pause) → Attempt
 *
 * The caller manages Setup beforehand and Analyze/Complete afterwards.
 */
export function createDrillCycle(
  drill: GeneratedDrill,
  output: DrillOutput,
  onPhaseChange: (phase: DrillPhase) => void,
  onNotePlay?: NotePlayCallback
): DrillCycleController {
  let playbackHandle: PlaybackHandle | null = null;
  let listenTimer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;
  let resolveReady: (() => void) | null = null;

  const readyForAttempt = new Promise<void>((resolve) => {
    resolveReady = resolve;
  });

  return {
    startDemonstration() {
      if (stopped) return;
      onPhaseChange(DrillPhase.Demonstrate);
      playbackHandle = playDrill(drill, output, {
        onNotePlay,
        onComplete: () => {
          if (stopped) return;
          onPhaseChange(DrillPhase.Listen);
          listenTimer = setTimeout(() => {
            if (stopped) return;
            onPhaseChange(DrillPhase.Attempt);
            resolveReady?.();
          }, LISTEN_PAUSE_MS);
        },
      });
    },

    stop() {
      if (stopped) return;
      stopped = true;
      playbackHandle?.stop();
      if (listenTimer) clearTimeout(listenTimer);
      resolveReady?.();
    },

    readyForAttempt,
  };
}

/** Velocity multiplier for demonstration/preview emphasis. Capped at 127. */
const PREVIEW_VELOCITY_MULT = 1.2;

export interface PreviewOptions {
  onNotePlay?: NotePlayCallback;
  onComplete?: () => void;
}

/**
 * Preview a drill with emphasized velocity (1.2×, capped at 127).
 * Uses the same scheduling engine as playDrill but applies the
 * demonstration emphasis to every note for a clearer preview.
 */
export function previewDrill(
  drill: GeneratedDrill,
  output: DrillOutput,
  options?: PreviewOptions
): PlaybackHandle {
  const emphasizedDrill: GeneratedDrill = {
    ...drill,
    sequence: {
      ...drill.sequence,
      notes: drill.sequence.notes.map((note) => ({
        ...note,
        velocity: Math.min(127, Math.round(note.velocity * PREVIEW_VELOCITY_MULT)),
      })),
    },
  };
  return playDrill(emphasizedDrill, output, options);
}

// Re-export for test access
export { SCHEDULE_AHEAD_MS, LISTEN_PAUSE_MS, PREVIEW_VELOCITY_MULT };
