/**
 * Replay Audio Playback — Layer 3 Domain Logic
 *
 * Handles audio output during replay mode: sends MIDI events to the
 * output port if available, or falls back to Web Audio oscillator synthesis.
 * Mirrors the pattern from drill-player.ts but operates note-by-note
 * in real time rather than scheduling ahead.
 */

import { useMidiStore } from '@/stores/midi-store';
import {
  sendNoteOn,
  sendNoteOff,
  sendAllNotesOff,
  midiNoteToFrequency,
} from '@/features/midi/midi-output';

// --- Web Audio fallback state ---

let audioCtx: AudioContext | null = null;

/** Active oscillator nodes keyed by MIDI note number for proper cleanup. */
const activeOscillators = new Map<number, { oscillator: OscillatorNode; gain: GainNode }>();

/** ADSR envelope constants (matching drill-player.ts). */
const ATTACK_S = 0.01;
const DECAY_S = 0.05;
const SUSTAIN_LEVEL = 0.7;
const RELEASE_S = 0.08;

/**
 * Lazy-initialize a shared AudioContext for replay fallback synthesis.
 * Returns null in SSR or if AudioContext is unavailable.
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (audioCtx && audioCtx.state !== 'closed') return audioCtx;

  const AudioCtxClass =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtxClass) return null;

  audioCtx = new AudioCtxClass();
  return audioCtx;
}

/**
 * Play a note-on event through the MIDI output port or Web Audio fallback.
 */
export function playReplayNote(note: number, velocity: number, channel: number = 0): void {
  // Try MIDI output first
  const outputPort = useMidiStore.getState().outputPort;
  if (outputPort) {
    sendNoteOn(outputPort, note, velocity, channel);
    return;
  }

  // Web Audio fallback: triangle wave with ADSR envelope
  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if suspended (autoplay policy)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  // Stop any existing note on the same pitch to avoid stacking
  stopReplayNote(note, channel);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.value = midiNoteToFrequency(note);

  const velocityGain = (velocity / 127) * 0.5; // Reduce overall volume
  const now = ctx.currentTime;

  // ADSR attack + decay
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(velocityGain, now + ATTACK_S);
  gain.gain.linearRampToValueAtTime(SUSTAIN_LEVEL * velocityGain, now + ATTACK_S + DECAY_S);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);

  activeOscillators.set(note, { oscillator: osc, gain });
}

/**
 * Stop a playing note (note-off) through MIDI output or Web Audio fallback.
 */
export function stopReplayNote(note: number, channel: number = 0): void {
  // Try MIDI output first
  const outputPort = useMidiStore.getState().outputPort;
  if (outputPort) {
    sendNoteOff(outputPort, note, channel);
    // Also clean up any Web Audio oscillator that may be playing
  }

  // Clean up Web Audio oscillator
  const entry = activeOscillators.get(note);
  if (entry) {
    const ctx = entry.gain.context as AudioContext;
    const now = ctx.currentTime;
    // Apply release envelope
    entry.gain.gain.cancelScheduledValues(now);
    entry.gain.gain.setValueAtTime(entry.gain.gain.value, now);
    entry.gain.gain.linearRampToValueAtTime(0, now + RELEASE_S);
    entry.oscillator.stop(now + RELEASE_S + 0.05);
    activeOscillators.delete(note);
  }
}

/**
 * Stop all currently playing replay notes. Called on pause, seek, and
 * end-of-session to prevent stuck notes.
 */
export function stopAllReplayNotes(): void {
  // MIDI output: send all-notes-off
  const outputPort = useMidiStore.getState().outputPort;
  if (outputPort) {
    sendAllNotesOff(outputPort);
  }

  // Web Audio: release all active oscillators
  for (const [note] of activeOscillators) {
    const entry = activeOscillators.get(note);
    if (entry) {
      try {
        const ctx = entry.gain.context as AudioContext;
        const now = ctx.currentTime;
        entry.gain.gain.cancelScheduledValues(now);
        entry.gain.gain.setValueAtTime(entry.gain.gain.value, now);
        entry.gain.gain.linearRampToValueAtTime(0, now + 0.02);
        entry.oscillator.stop(now + 0.05);
      } catch {
        // Oscillator may already be stopped
      }
    }
  }
  activeOscillators.clear();
}
