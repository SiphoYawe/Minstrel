import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from '@/stores/app-store';
import { useMidiStore } from '@/stores/midi-store';
import { detectKeyExpiry } from '@/lib/api-key-expiry-detector';

/**
 * Integration tests for API key expiry detection during active sessions.
 * Verifies AC3: Practice data continues recording when AI features fail due to expired keys.
 */
describe('API Key Expiry - Session Integration', () => {
  beforeEach(() => {
    // Reset stores to clean state
    useAppStore.setState({
      apiKeyStatus: 'active',
      hasApiKey: true,
    });
    useMidiStore.setState({
      notesPlayed: [],
      totalNotesPlayed: 0,
      errorMessage: null,
    });
  });

  it('marks API key as invalid when auth error is detected', () => {
    // Simulate an auth error from AI provider
    const authError = new Error('Request failed with status code 401');

    detectKeyExpiry(authError);

    // Key should be marked as invalid
    expect(useAppStore.getState().apiKeyStatus).toBe('invalid');
  });

  it('does not affect MIDI recording when API key becomes invalid', () => {
    // Start with active MIDI session
    const initialMidiState = {
      notesPlayed: [
        { note: 60, velocity: 100, timestamp: 1000 },
        { note: 62, velocity: 90, timestamp: 1100 },
      ],
      totalNotesPlayed: 2,
    };
    useMidiStore.setState(initialMidiState);

    // Simulate API key expiry
    const authError = new Error('API key expired');
    detectKeyExpiry(authError);

    // Verify key is invalid
    expect(useAppStore.getState().apiKeyStatus).toBe('invalid');

    // Continue MIDI recording by adding more notes
    const newNote = { note: 64, velocity: 95, timestamp: 1200 };
    useMidiStore.setState({
      notesPlayed: [...useMidiStore.getState().notesPlayed, newNote],
      totalNotesPlayed: useMidiStore.getState().totalNotesPlayed + 1,
    });

    // MIDI state should be independent and continue tracking
    const midiState = useMidiStore.getState();
    expect(midiState.notesPlayed).toHaveLength(3);
    expect(midiState.totalNotesPlayed).toBe(3);
    expect(midiState.notesPlayed[2]).toEqual(newNote);
  });

  it('MIDI store does not reset when app store key status changes', () => {
    // Set up MIDI session data
    useMidiStore.setState({
      notesPlayed: [{ note: 60, velocity: 100, timestamp: 1000 }],
      totalNotesPlayed: 10,
    });

    // Change API key status multiple times
    useAppStore.getState().setApiKeyStatus('invalid');
    useAppStore.getState().setApiKeyStatus('validating');
    useAppStore.getState().setApiKeyStatus('active');

    // MIDI state should remain unchanged
    const midiState = useMidiStore.getState();
    expect(midiState.notesPlayed).toHaveLength(1);
    expect(midiState.totalNotesPlayed).toBe(10);
  });

  it('demonstrates stores are completely independent', () => {
    // Both stores start in good state
    expect(useAppStore.getState().apiKeyStatus).toBe('active');
    expect(useMidiStore.getState().totalNotesPlayed).toBe(0);

    // Simulate concurrent operations
    const operations = [
      // MIDI operations
      () => useMidiStore.setState({ totalNotesPlayed: 1 }),
      () => useMidiStore.setState({ totalNotesPlayed: 2 }),
      // AI key status changes
      () => useAppStore.getState().setApiKeyStatus('invalid'),
      // More MIDI operations
      () => useMidiStore.setState({ totalNotesPlayed: 3 }),
      () => useMidiStore.setState({ totalNotesPlayed: 4 }),
    ];

    // Execute all operations
    operations.forEach((op) => op());

    // Both stores maintain their own state independently
    expect(useAppStore.getState().apiKeyStatus).toBe('invalid');
    expect(useMidiStore.getState().totalNotesPlayed).toBe(4);
  });

  it('MIDI error handling is independent of API key status', () => {
    // Set API key as invalid
    useAppStore.getState().setApiKeyStatus('invalid');

    // MIDI can still set its own error messages (unrelated to AI)
    useMidiStore.getState().setErrorMessage('MIDI device disconnected');

    // Both errors coexist independently
    expect(useAppStore.getState().apiKeyStatus).toBe('invalid');
    expect(useMidiStore.getState().errorMessage).toBe('MIDI device disconnected');
  });
});
