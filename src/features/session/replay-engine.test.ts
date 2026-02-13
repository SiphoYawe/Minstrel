// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSessionStore } from '@/stores/session-store';
import { createMockSession } from '@/test-utils/session-fixtures';

// Must import after mocking rAF
import {
  startPlayback,
  pausePlayback,
  togglePlayback,
  setPlaybackSpeed,
  seekTo,
  isPlaying,
} from './replay-engine';

let rafCallbacks: Array<(time: number) => void> = [];
let currentTime = 0;

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
  vi.stubGlobal('performance', {
    now: () => currentTime,
  });

  useSessionStore.setState({
    replaySession: createMockSession({ id: 1, duration: 60 }), // 60 seconds
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

function advanceFrame(deltaMs: number) {
  currentTime += deltaMs;
  const cbs = [...rafCallbacks];
  rafCallbacks = [];
  cbs.forEach((cb) => cb(currentTime));
}

describe('startPlayback', () => {
  it('sets replayState to playing', () => {
    startPlayback();
    expect(useSessionStore.getState().replayState).toBe('playing');
  });

  it('advances position on each frame', () => {
    startPlayback();
    advanceFrame(100); // 100ms
    const pos = useSessionStore.getState().replayPosition;
    expect(pos).toBeGreaterThan(0);
    expect(pos).toBeLessThanOrEqual(200); // Allow slight timing variance
  });

  it('respects speed multiplier', () => {
    useSessionStore.setState({ replaySpeed: 2 });
    startPlayback();
    advanceFrame(100);
    const pos = useSessionStore.getState().replayPosition;
    // At 2x speed, 100ms real time = 200ms replay time
    expect(pos).toBeCloseTo(200, -1);
  });

  it('does not double-start if already playing', () => {
    startPlayback();
    const initialRafCount = rafCallbacks.length;
    startPlayback();
    expect(rafCallbacks.length).toBe(initialRafCount);
  });
});

describe('pausePlayback', () => {
  it('sets replayState to paused', () => {
    startPlayback();
    pausePlayback();
    expect(useSessionStore.getState().replayState).toBe('paused');
  });

  it('stops advancing position', () => {
    startPlayback();
    advanceFrame(100);
    pausePlayback();
    const pos = useSessionStore.getState().replayPosition;
    advanceFrame(100);
    expect(useSessionStore.getState().replayPosition).toBe(pos);
  });

  it('isPlaying returns false after pause', () => {
    startPlayback();
    pausePlayback();
    expect(isPlaying()).toBe(false);
  });
});

describe('togglePlayback', () => {
  it('starts playback when paused', () => {
    togglePlayback();
    expect(useSessionStore.getState().replayState).toBe('playing');
  });

  it('pauses playback when playing', () => {
    startPlayback();
    togglePlayback();
    expect(useSessionStore.getState().replayState).toBe('paused');
  });
});

describe('auto-pause at end', () => {
  it('pauses when position reaches session duration', () => {
    useSessionStore.setState({ replayPosition: 59_500 }); // 500ms from end
    startPlayback();
    advanceFrame(600); // enough to exceed 60s (60000ms)
    expect(useSessionStore.getState().replayState).toBe('paused');
    expect(useSessionStore.getState().replayPosition).toBe(60_000);
  });
});

describe('setPlaybackSpeed', () => {
  it('updates speed in store', () => {
    setPlaybackSpeed(1.5);
    expect(useSessionStore.getState().replaySpeed).toBe(1.5);
  });
});

describe('seekTo', () => {
  it('updates position to specified timestamp', () => {
    seekTo(30_000);
    expect(useSessionStore.getState().replayPosition).toBe(30_000);
  });

  it('clamps to 0 for negative values', () => {
    seekTo(-1000);
    expect(useSessionStore.getState().replayPosition).toBe(0);
  });
});
