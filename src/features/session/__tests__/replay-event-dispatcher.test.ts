// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSessionStore } from '@/stores/session-store';
import { useMidiStore } from '@/stores/midi-store';
import { createMockSession, createMockMidiEvents } from '@/test-utils/session-fixtures';
import type { StoredMidiEvent } from '@/lib/dexie/db';

import {
  startPlayback,
  pausePlayback,
  seekTo,
  findFirstEventIndex,
  resetReplayDispatcher,
} from '../replay-engine';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let rafCallbacks: Array<(time: number) => void> = [];
let currentTime = 0;

/** Base timestamp matching createMockMidiEvents (Date.now() - 300_000). */
const BASE_TS = Date.now() - 300_000;

/**
 * Build a small, deterministic set of StoredMidiEvents with absolute
 * timestamps starting at BASE_TS and spaced 500ms apart (matching the
 * fixture helper pattern).
 */
function makeEvents(count: number = 10): StoredMidiEvent[] {
  return createMockMidiEvents(1, count);
}

/**
 * Build events with explicitly controlled timestamps relative to BASE_TS.
 * Each entry in `relativeMs` defines the offset from BASE_TS.
 */
function makeEventsAtOffsets(
  relativeMs: number[],
  type: 'note-on' | 'note-off' = 'note-on'
): StoredMidiEvent[] {
  return relativeMs.map((offset, i) => ({
    id: i + 1,
    sessionId: 1,
    type,
    note: 60 + i,
    noteName: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][(60 + i) % 12],
    velocity: type === 'note-on' ? 80 : 0,
    channel: 1,
    timestamp: BASE_TS + offset,
    source: 'midi' as const,
    userId: null,
    syncStatus: 'pending' as const,
  }));
}

function advanceFrame(deltaMs: number) {
  currentTime += deltaMs;
  const cbs = [...rafCallbacks];
  rafCallbacks = [];
  cbs.forEach((cb) => cb(currentTime));
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  rafCallbacks = [];
  currentTime = 0;

  vi.stubGlobal('requestAnimationFrame', (cb: (time: number) => void) => {
    rafCallbacks.push(cb);
    return rafCallbacks.length;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {
    rafCallbacks = [];
  });
  vi.stubGlobal('performance', { now: () => currentTime });

  // Reset stores to a clean baseline
  useMidiStore.getState().clearEvents();
  resetReplayDispatcher();

  useSessionStore.setState({
    replaySession: createMockSession({ id: 1, duration: 60 }),
    replayEvents: [],
    replayStatus: 'success',
    replayPosition: 0,
    replayState: 'paused',
    replaySpeed: 1,
  });
});

afterEach(() => {
  pausePlayback();
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('findFirstEventIndex (binary search)', () => {
  it('returns 0 when targetTime is 0 (all events qualify)', () => {
    const events = makeEventsAtOffsets([0, 500, 1000, 1500]);
    // We need to set baseTimestamp so the function uses the correct base.
    // startPlayback sets it internally, but we can call it by starting/stopping.
    useSessionStore.setState({ replayEvents: events });
    startPlayback(); // sets baseTimestamp to events[0].timestamp
    pausePlayback();

    const idx = findFirstEventIndex(events, 0);
    expect(idx).toBe(0);
  });

  it('finds the first event at or after a mid-range targetTime', () => {
    const events = makeEventsAtOffsets([0, 500, 1000, 1500, 2000]);
    useSessionStore.setState({ replayEvents: events });
    startPlayback();
    pausePlayback();

    // targetTime = 750 -> first event with relativeTime >= 750 is at index 2 (offset 1000)
    const idx = findFirstEventIndex(events, 750);
    expect(idx).toBe(2);
  });

  it('returns events.length when no event qualifies', () => {
    const events = makeEventsAtOffsets([0, 500, 1000]);
    useSessionStore.setState({ replayEvents: events });
    startPlayback();
    pausePlayback();

    const idx = findFirstEventIndex(events, 2000);
    expect(idx).toBe(events.length);
  });

  it('returns the exact index when targetTime matches an event offset', () => {
    const events = makeEventsAtOffsets([0, 500, 1000, 1500]);
    useSessionStore.setState({ replayEvents: events });
    startPlayback();
    pausePlayback();

    const idx = findFirstEventIndex(events, 500);
    expect(idx).toBe(1);
  });

  it('handles empty events array', () => {
    const events: StoredMidiEvent[] = [];
    const idx = findFirstEventIndex(events, 0);
    expect(idx).toBe(0);
  });
});

describe('event dispatch during playback', () => {
  it('dispatches note-on events in the frame window to activeNotes', () => {
    const events = makeEventsAtOffsets([100, 200, 300]);
    useSessionStore.setState({ replayEvents: events, replayPosition: 0 });

    startPlayback();
    // Advance 350ms — all three events (at 100, 200, 300) should fire
    advanceFrame(350);

    const activeNotes = useMidiStore.getState().activeNotes;
    // All 3 are note-on (default), notes 60, 61, 62
    expect(activeNotes[60]).toBeDefined();
    expect(activeNotes[61]).toBeDefined();
    expect(activeNotes[62]).toBeDefined();
  });

  it('dispatches events in chronological order', () => {
    const dispatched: number[] = [];
    const originalAddEvent = useMidiStore.getState().addEvent;
    const addEventSpy = vi.fn((event) => {
      dispatched.push(event.note);
      // Still execute original so store updates
      useMidiStore.setState((state) => {
        if (event.type === 'note-on') {
          return { activeNotes: { ...state.activeNotes, [event.note]: event } };
        }
        return state;
      });
    });

    // Temporarily override addEvent
    useMidiStore.setState({ addEvent: addEventSpy } as never);

    const events = makeEventsAtOffsets([100, 200, 300]);
    useSessionStore.setState({ replayEvents: events, replayPosition: 0 });

    startPlayback();
    advanceFrame(350);

    expect(dispatched).toEqual([60, 61, 62]);

    // Restore
    useMidiStore.setState({ addEvent: originalAddEvent } as never);
  });

  it('note-on adds to activeNotes with correct note, velocity, and channel', () => {
    const events = makeEventsAtOffsets([100]);
    // Override velocity/channel for clarity
    events[0].velocity = 100;
    events[0].channel = 3;
    events[0].note = 72;

    useSessionStore.setState({ replayEvents: events, replayPosition: 0 });

    startPlayback();
    advanceFrame(200);

    const active = useMidiStore.getState().activeNotes[72];
    expect(active).toBeDefined();
    expect(active.velocity).toBe(100);
    expect(active.channel).toBe(3);
    expect(active.type).toBe('note-on');
    expect(active.source).toBe('midi');
  });

  it('note-off events remove from activeNotes', () => {
    // First note-on at 100ms, then note-off at 200ms for same note
    const noteOnEvent: StoredMidiEvent = {
      id: 1,
      sessionId: 1,
      type: 'note-on',
      note: 60,
      noteName: 'C',
      velocity: 80,
      channel: 1,
      timestamp: BASE_TS + 100,
      source: 'midi',
      userId: null,
      syncStatus: 'pending',
    };
    const noteOffEvent: StoredMidiEvent = {
      id: 2,
      sessionId: 1,
      type: 'note-off',
      note: 60,
      noteName: 'C',
      velocity: 0,
      channel: 1,
      timestamp: BASE_TS + 200,
      source: 'midi',
      userId: null,
      syncStatus: 'pending',
    };

    useSessionStore.setState({
      replayEvents: [noteOnEvent, noteOffEvent],
      replayPosition: 0,
    });

    startPlayback();
    // Advance past both events
    advanceFrame(300);

    // Note should be gone from activeNotes after note-off
    expect(useMidiStore.getState().activeNotes[60]).toBeUndefined();
  });

  it('does not dispatch events outside the current frame window', () => {
    const events = makeEventsAtOffsets([100, 500, 1000]);
    useSessionStore.setState({ replayEvents: events, replayPosition: 0 });

    startPlayback();
    // Only advance 200ms — only the first event (at 100) should fire
    advanceFrame(200);

    const activeNotes = useMidiStore.getState().activeNotes;
    expect(activeNotes[60]).toBeDefined();
    expect(activeNotes[61]).toBeUndefined(); // at 500ms, not yet reached
    expect(activeNotes[62]).toBeUndefined(); // at 1000ms, not yet reached
  });
});

describe('no dispatch when paused', () => {
  it('does not dispatch events when replay is paused', () => {
    const events = makeEventsAtOffsets([100, 200]);
    useSessionStore.setState({ replayEvents: events, replayPosition: 0 });

    // Do NOT call startPlayback — stay paused
    // Manually advance frame (should be no-op since no rAF scheduled)
    advanceFrame(300);

    const activeNotes = useMidiStore.getState().activeNotes;
    expect(Object.keys(activeNotes).length).toBe(0);
  });

  it('clears active notes when paused', () => {
    const events = makeEventsAtOffsets([100]);
    useSessionStore.setState({ replayEvents: events, replayPosition: 0 });

    startPlayback();
    advanceFrame(200); // dispatches event at 100

    expect(Object.keys(useMidiStore.getState().activeNotes).length).toBeGreaterThan(0);

    pausePlayback();

    // activeNotes should be cleared
    expect(Object.keys(useMidiStore.getState().activeNotes).length).toBe(0);
  });
});

describe('scrub (seekTo) clears notes and resets position', () => {
  it('clears active notes on seek', () => {
    const events = makeEventsAtOffsets([100, 200, 300]);
    useSessionStore.setState({ replayEvents: events, replayPosition: 0 });

    startPlayback();
    advanceFrame(350); // dispatches all three events

    // Notes should be active
    expect(Object.keys(useMidiStore.getState().activeNotes).length).toBeGreaterThan(0);

    // Scrub to a new position
    seekTo(0);

    // Active notes should be cleared
    expect(Object.keys(useMidiStore.getState().activeNotes).length).toBe(0);
    expect(useSessionStore.getState().replayPosition).toBe(0);
  });

  it('clamps negative seek to 0 and clears notes', () => {
    // Seed some notes
    useMidiStore.getState().addEvent({
      type: 'note-on',
      note: 60,
      noteName: 'C',
      velocity: 80,
      channel: 1,
      timestamp: 0,
      source: 'midi',
    });

    seekTo(-500);

    expect(useSessionStore.getState().replayPosition).toBe(0);
    expect(Object.keys(useMidiStore.getState().activeNotes).length).toBe(0);
  });
});

describe('end-of-session clears notes', () => {
  it('clears active notes when playback reaches session end', () => {
    // Session duration = 1 second (duration is in seconds in GuestSession)
    useSessionStore.setState({
      replaySession: createMockSession({ id: 1, duration: 1 }),
    });

    const events = makeEventsAtOffsets([100, 500, 800]);
    useSessionStore.setState({
      replayEvents: events,
      replayPosition: 0,
    });

    startPlayback();
    // Advance past the 1000ms session duration
    advanceFrame(1200);

    // Should be paused
    expect(useSessionStore.getState().replayState).toBe('paused');
    // Position should be capped at session duration
    expect(useSessionStore.getState().replayPosition).toBe(1000);
    // Active notes should be cleared
    expect(Object.keys(useMidiStore.getState().activeNotes).length).toBe(0);
  });
});

describe('resetReplayDispatcher', () => {
  it('resets internal state without side effects on stores', () => {
    // Start and advance playback so internal state is non-zero
    const events = makeEventsAtOffsets([100, 200]);
    useSessionStore.setState({ replayEvents: events, replayPosition: 0 });

    startPlayback();
    advanceFrame(300);
    pausePlayback();

    // Reset dispatcher
    resetReplayDispatcher();

    // Stores remain unaffected by the reset call itself
    expect(useSessionStore.getState().replayState).toBe('paused');
    // The function only resets internal module variables, no observable store change
    // We verify it works by starting a new playback from 0 and checking dispatch
    useMidiStore.getState().clearEvents();
    useSessionStore.setState({ replayPosition: 0, replayEvents: events });

    startPlayback();
    advanceFrame(150);

    // Only the first event (at 100ms) should have been dispatched
    // because previousPosition was reset to 0
    expect(useMidiStore.getState().activeNotes[60]).toBeDefined();
  });
});
