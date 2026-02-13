import { useSessionStore } from '@/stores/session-store';

let rafId: number | null = null;
let lastFrameTime: number | null = null;

export function startPlayback(): void {
  const state = useSessionStore.getState();
  if (state.replayState === 'playing') return;

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
      useSessionStore.getState().setReplayPosition(sessionDurationMs);
      pausePlayback();
      return;
    }

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
  useSessionStore.getState().setReplayPosition(Math.max(0, positionMs));
}

export function isPlaying(): boolean {
  return rafId !== null;
}
