import { describe, it, expect, beforeEach } from 'vitest';
import { useMidiStore } from './midi-store';
import type { MidiEvent } from '@/features/midi/midi-types';

function makeEvent(overrides: Partial<MidiEvent> = {}): MidiEvent {
  return {
    type: 'note-on',
    note: 60,
    noteName: 'C4',
    velocity: 100,
    channel: 0,
    timestamp: 1000,
    ...overrides,
  };
}

describe('midiStore', () => {
  beforeEach(() => {
    useMidiStore.getState().reset();
  });

  describe('connection state', () => {
    it('has correct initial state', () => {
      const state = useMidiStore.getState();
      expect(state.connectionStatus).toBe('disconnected');
      expect(state.activeDevice).toBeNull();
      expect(state.availableDevices).toEqual([]);
      expect(state.errorMessage).toBeNull();
    });

    it('setConnectionStatus updates connection status', () => {
      useMidiStore.getState().setConnectionStatus('connected');
      expect(useMidiStore.getState().connectionStatus).toBe('connected');
    });

    it('setActiveDevice updates active device', () => {
      const device = {
        id: 'test-1',
        name: 'Test Piano',
        manufacturer: 'Yamaha',
        state: 'connected' as const,
        type: 'input' as const,
      };
      useMidiStore.getState().setActiveDevice(device);
      expect(useMidiStore.getState().activeDevice).toEqual(device);
    });

    it('setAvailableDevices updates available devices', () => {
      const devices = [
        {
          id: 'i1',
          name: 'Input',
          manufacturer: 'A',
          state: 'connected' as const,
          type: 'input' as const,
        },
        {
          id: 'o1',
          name: 'Output',
          manufacturer: 'B',
          state: 'connected' as const,
          type: 'output' as const,
        },
      ];
      useMidiStore.getState().setAvailableDevices(devices);
      expect(useMidiStore.getState().availableDevices).toHaveLength(2);
    });

    it('setErrorMessage updates error message', () => {
      useMidiStore.getState().setErrorMessage('Something went wrong');
      expect(useMidiStore.getState().errorMessage).toBe('Something went wrong');
    });
  });

  describe('event state', () => {
    it('has correct initial event state', () => {
      const state = useMidiStore.getState();
      expect(state.currentEvents).toEqual([]);
      expect(state.latestEvent).toBeNull();
      expect(state.activeNotes).toEqual({});
    });

    it('addEvent appends to currentEvents', () => {
      const event = makeEvent();
      useMidiStore.getState().addEvent(event);

      const state = useMidiStore.getState();
      expect(state.currentEvents).toHaveLength(1);
      expect(state.currentEvents[0]).toEqual(event);
      expect(state.latestEvent).toEqual(event);
    });

    it('addEvent tracks note-on in activeNotes', () => {
      const event = makeEvent({ note: 60, type: 'note-on' });
      useMidiStore.getState().addEvent(event);
      expect(useMidiStore.getState().activeNotes[60]).toEqual(event);
    });

    it('addEvent removes note from activeNotes on note-off', () => {
      useMidiStore.getState().addEvent(makeEvent({ note: 60, type: 'note-on' }));
      expect(useMidiStore.getState().activeNotes[60]).toBeDefined();

      useMidiStore.getState().addEvent(makeEvent({ note: 60, type: 'note-off' }));
      expect(useMidiStore.getState().activeNotes[60]).toBeUndefined();
    });

    it('ring buffer caps at 500 events', () => {
      for (let i = 0; i < 510; i++) {
        useMidiStore.getState().addEvent(makeEvent({ timestamp: i }));
      }
      expect(useMidiStore.getState().currentEvents.length).toBeLessThanOrEqual(500);
    });

    it('ring buffer preserves most recent events', () => {
      for (let i = 0; i < 510; i++) {
        useMidiStore.getState().addEvent(makeEvent({ timestamp: i }));
      }
      const events = useMidiStore.getState().currentEvents;
      // The last event should have the highest timestamp
      expect(events[events.length - 1].timestamp).toBe(509);
    });

    it('removeNote removes from activeNotes', () => {
      useMidiStore.getState().addEvent(makeEvent({ note: 48, type: 'note-on' }));
      useMidiStore.getState().removeNote(48);
      expect(useMidiStore.getState().activeNotes[48]).toBeUndefined();
    });

    it('control-change events do not modify activeNotes reference', () => {
      useMidiStore.getState().addEvent(makeEvent({ note: 60, type: 'note-on' }));
      const notesBefore = useMidiStore.getState().activeNotes;

      useMidiStore
        .getState()
        .addEvent(makeEvent({ type: 'control-change', note: 64, velocity: 127 }));
      const notesAfter = useMidiStore.getState().activeNotes;

      // Same reference — control-change should not create a new activeNotes object
      expect(notesBefore).toBe(notesAfter);
    });

    it('clearEvents resets all event state', () => {
      useMidiStore.getState().addEvent(makeEvent());
      useMidiStore.getState().clearEvents();

      const state = useMidiStore.getState();
      expect(state.currentEvents).toEqual([]);
      expect(state.latestEvent).toBeNull();
      expect(state.activeNotes).toEqual({});
    });
  });

  describe('reset', () => {
    it('clears all state to initial values', () => {
      useMidiStore.getState().setConnectionStatus('connected');
      useMidiStore.getState().setActiveDevice({
        id: 'x',
        name: 'X',
        manufacturer: 'Y',
        state: 'connected',
        type: 'input',
      });
      useMidiStore.getState().setErrorMessage('err');
      useMidiStore.getState().addEvent(makeEvent());

      useMidiStore.getState().reset();

      const state = useMidiStore.getState();
      expect(state.connectionStatus).toBe('disconnected');
      expect(state.activeDevice).toBeNull();
      expect(state.availableDevices).toEqual([]);
      expect(state.errorMessage).toBeNull();
      expect(state.currentEvents).toEqual([]);
      expect(state.latestEvent).toBeNull();
      expect(state.activeNotes).toEqual({});
    });
  });

  describe('subscribeWithSelector', () => {
    it('supports selector-based subscriptions', () => {
      const values: string[] = [];
      const unsub = useMidiStore.subscribe(
        (s) => s.connectionStatus,
        (status) => values.push(status)
      );

      useMidiStore.getState().setConnectionStatus('connecting');
      useMidiStore.getState().setConnectionStatus('connected');

      expect(values).toEqual(['connecting', 'connected']);
      unsub();
    });
  });
});
