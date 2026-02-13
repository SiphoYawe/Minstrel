import { useSessionStore } from '@/stores/session-store';
import { useMidiStore } from '@/stores/midi-store';
import type { StoredMidiEvent } from '@/lib/dexie/db';
import type { MidiEvent } from '@/features/midi/midi-types';
import { playReplayNote, stopReplayNote, stopAllReplayNotes } from './replay-audio';

let rafId: number | null = null;
let lastFrameTime: number | null = null;
let previousPosition: number = 0;
let baseTimestamp: number = 0;

/**
 * Binary search to find the index of the first event whose relative timestamp
 * is >= targetTime. Returns events.length if no event qualifies.
 *
 * Exported for testing only; not part of the public API.
 */
export function findFirstEventIndex(events: StoredMidiEvent[], targetTime: number): number {
  let lo = 0;
  let hi = events.length;

  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    const relativeTime = events[mid].timestamp - baseTimestamp;
    if (relativeTime < targetTime) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }

  return lo;
}

/**
 * Converts a StoredMidiEvent into a MidiEvent suitable for the midi store.
 * Uses the current wall-clock time for the dispatched timestamp so the
 * visualization system treats it as a live event.
 */
function toMidiEvent(stored: StoredMidiEvent): MidiEvent {
  return {
    type: stored.type,
    note: stored.note,
    noteName: stored.noteName,
    velocity: stored.velocity,
    channel: stored.channel,
    timestamp: performance.now(),
    source: 'midi',
  };
}

/**
 * Dispatches all replay events whose relative timestamps fall within
 * [prevPos, curPos) to the midi store, in chronological order.
 */
function dispatchEventsInRange(prevPos: number, curPos: number, events: StoredMidiEvent[]): void {
  if (events.length === 0) return;

  const startIdx = findFirstEventIndex(events, prevPos);

  for (let i = startIdx; i < events.length; i++) {
    const relativeTime = events[i].timestamp - baseTimestamp;

    // Past the current window — stop scanning
    if (relativeTime >= curPos) break;

    // Only dispatch events within [prevPos, curPos)
    if (relativeTime >= prevPos) {
      const evt = events[i];
      useMidiStore.getState().addEvent(toMidiEvent(evt));

      // Send audio output for the replay event
      if (evt.type === 'note-on') {
        playReplayNote(evt.note, evt.velocity, evt.channel);
      } else if (evt.type === 'note-off') {
        stopReplayNote(evt.note, evt.channel);
      }
    }
  }
}

export function startPlayback(): void {
  const state = useSessionStore.getState();
  if (state.replayState === 'playing') return;

  // Initialize dispatcher state from current replay position and events
  previousPosition = state.replayPosition;
  baseTimestamp = state.replayEvents[0]?.timestamp ?? 0;

  useSessionStore.getState().setReplayState('playing');
  lastFrameTime = performance.now();

  function tick() {
    const now = performance.now();
    const { replayPosition, replaySpeed, replayState, replayEvents, replaySession } =
      useSessionStore.getState();

    if (replayState !== 'playing') {
      rafId = null;
      lastFrameTime = null;
      return;
    }

    const deltaMs = (now - (lastFrameTime ?? now)) * replaySpeed;
    lastFrameTime = now;

    const newPosition = replayPosition + deltaMs;

    // Calculate session duration
    let sessionDurationMs = 0;
    if (replaySession?.duration) {
      sessionDurationMs = replaySession.duration * 1000;
    } else if (replayEvents.length > 0) {
      const first = replayEvents[0].timestamp;
      const last = replayEvents[replayEvents.length - 1].timestamp;
      sessionDurationMs = last - first;
    }

    if (sessionDurationMs > 0 && newPosition >= sessionDurationMs) {
      // Dispatch any remaining events up to end-of-session
      dispatchEventsInRange(previousPosition, sessionDurationMs, replayEvents);
      previousPosition = sessionDurationMs;

      useSessionStore.getState().setReplayPosition(sessionDurationMs);
      stopAllReplayNotes();
      useMidiStore.getState().clearEvents();
      pausePlayback();
      return;
    }

    // Dispatch events that fall within this frame's time window
    dispatchEventsInRange(previousPosition, newPosition, replayEvents);
    previousPosition = newPosition;

    useSessionStore.getState().setReplayPosition(newPosition);
    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);
}

export function pausePlayback(): void {
  useSessionStore.getState().setReplayState('paused');
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  lastFrameTime = null;
  // Clear active notes and stop audio to prevent stuck notes when paused
  stopAllReplayNotes();
  useMidiStore.getState().clearEvents();
}

export function togglePlayback(): void {
  const state = useSessionStore.getState();
  if (state.replayState === 'playing') {
    pausePlayback();
  } else {
    startPlayback();
  }
}

export function setPlaybackSpeed(speed: number): void {
  useSessionStore.getState().setReplaySpeed(speed);
}

export function seekTo(positionMs: number): void {
  const clamped = Math.max(0, positionMs);
  useSessionStore.getState().setReplayPosition(clamped);
  // Clear active notes, stop audio, and reset dispatcher position on scrub
  stopAllReplayNotes();
  useMidiStore.getState().clearEvents();
  previousPosition = clamped;
}

export function isPlaying(): boolean {
  return rafId !== null;
}

/**
 * Resets internal dispatcher state. Call when loading a new replay session
 * or when tearing down the replay view.
 */
export function resetReplayDispatcher(): void {
  previousPosition = 0;
  baseTimestamp = 0;
}
