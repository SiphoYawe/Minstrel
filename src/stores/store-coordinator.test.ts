import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useMidiStore } from './midi-store';
import { useSessionStore } from './session-store';
import { initStoreCoordinator, teardownStoreCoordinator } from './store-coordinator';

describe('store-coordinator (Story 24.2)', () => {
  beforeEach(() => {
    useMidiStore.getState().reset();
    useSessionStore.getState().resetAnalysis();
    useSessionStore.setState({
      recordingPaused: false,
      sessionMarkers: [],
      sessionStartTimestamp: null,
    });
    initStoreCoordinator();
  });

  afterEach(() => {
    teardownStoreCoordinator();
  });

  it('does nothing when no active session', () => {
    // No active session (sessionStartTimestamp is null)
    useMidiStore.getState().setConnectionStatus('connected');
    useMidiStore.getState().setConnectionStatus('disconnected');

    const state = useSessionStore.getState();
    expect(state.recordingPaused).toBe(false);
    expect(state.sessionMarkers).toEqual([]);
  });

  it('pauses recording and adds marker on MIDI disconnect during active session', () => {
    // Set connected before session starts (no marker generated)
    useMidiStore.getState().setConnectionStatus('connected');
    useSessionStore.getState().setSessionStartTimestamp(Date.now());

    // Disconnect during active session
    useMidiStore.getState().setConnectionStatus('disconnected');

    const state = useSessionStore.getState();
    expect(state.recordingPaused).toBe(true);
    expect(state.sessionMarkers).toHaveLength(1);
    expect(state.sessionMarkers[0].type).toBe('midi-disconnected');
  });

  it('resumes recording and adds marker on MIDI reconnect during active session', () => {
    useMidiStore.getState().setConnectionStatus('connected');
    useSessionStore.getState().setSessionStartTimestamp(Date.now());
    useMidiStore.getState().setConnectionStatus('disconnected');

    // Reconnect
    useMidiStore.getState().setConnectionStatus('connected');

    const state = useSessionStore.getState();
    expect(state.recordingPaused).toBe(false);
    expect(state.sessionMarkers).toHaveLength(2);
    expect(state.sessionMarkers[0].type).toBe('midi-disconnected');
    expect(state.sessionMarkers[1].type).toBe('midi-reconnected');
  });

  it('adds disconnect marker on error status', () => {
    useMidiStore.getState().setConnectionStatus('connected');
    useSessionStore.getState().setSessionStartTimestamp(Date.now());
    useMidiStore.getState().setConnectionStatus('error');

    const state = useSessionStore.getState();
    expect(state.recordingPaused).toBe(true);
    expect(state.sessionMarkers).toHaveLength(1);
    expect(state.sessionMarkers[0].type).toBe('midi-disconnected');
  });

  it('resumes recording when recovering from error to connected', () => {
    useMidiStore.getState().setConnectionStatus('connected');
    useSessionStore.getState().setSessionStartTimestamp(Date.now());
    useMidiStore.getState().setConnectionStatus('error');
    useMidiStore.getState().setConnectionStatus('connected');

    const state = useSessionStore.getState();
    expect(state.recordingPaused).toBe(false);
    expect(state.sessionMarkers).toHaveLength(2);
    expect(state.sessionMarkers[1].type).toBe('midi-reconnected');
  });

  it('is idempotent — multiple init calls do not duplicate subscriptions', () => {
    initStoreCoordinator();
    initStoreCoordinator();

    // Set connected without active session first (no marker)
    useMidiStore.getState().setConnectionStatus('connected');
    // Now start session and disconnect
    useSessionStore.getState().setSessionStartTimestamp(Date.now());
    useMidiStore.getState().setConnectionStatus('disconnected');

    // Should produce exactly 1 marker, not 3 (one per init call)
    expect(useSessionStore.getState().sessionMarkers).toHaveLength(1);
  });

  it('teardown stops coordination', () => {
    // Set connected without active session (no marker)
    useMidiStore.getState().setConnectionStatus('connected');
    useSessionStore.getState().setSessionStartTimestamp(Date.now());

    teardownStoreCoordinator();

    useMidiStore.getState().setConnectionStatus('disconnected');

    expect(useSessionStore.getState().recordingPaused).toBe(false);
    expect(useSessionStore.getState().sessionMarkers).toEqual([]);
  });
});
