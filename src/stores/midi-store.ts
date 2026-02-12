import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  MidiConnectionStatus,
  MidiDeviceInfo,
  MidiEvent,
  MidiEventStore,
} from '@/features/midi/midi-types';

const MAX_EVENT_BUFFER = 500;

export const useMidiStore = create<MidiEventStore>()(
  subscribeWithSelector((set) => ({
    // Connection state
    connectionStatus: 'disconnected' as MidiConnectionStatus,
    activeDevice: null as MidiDeviceInfo | null,
    availableDevices: [] as MidiDeviceInfo[],
    errorMessage: null as string | null,

    // Event state (Story 1.4)
    currentEvents: [] as MidiEvent[],
    latestEvent: null as MidiEvent | null,
    activeNotes: {} as Record<number, MidiEvent>,

    // Audio mode state (Story 1.6)
    inputSource: 'none' as 'midi' | 'audio' | 'none',

    // Troubleshooting state (Story 1.5)
    showTroubleshooting: false,
    detectedChannel: null as number | null,

    // Connection actions
    setConnectionStatus: (status) => set({ connectionStatus: status }),
    setActiveDevice: (device) => set({ activeDevice: device }),
    setAvailableDevices: (devices) => set({ availableDevices: devices }),
    setErrorMessage: (message) => set({ errorMessage: message }),

    // Audio mode actions
    setInputSource: (source) => set({ inputSource: source }),

    // Troubleshooting actions
    setShowTroubleshooting: (show) => set({ showTroubleshooting: show }),
    setDetectedChannel: (channel) => set({ detectedChannel: channel }),

    // Event actions
    addEvent: (event) =>
      set((state) => {
        // Ring buffer: drop oldest when full
        const events = state.currentEvents;
        const nextEvents =
          events.length >= MAX_EVENT_BUFFER
            ? [...events.slice(-(MAX_EVENT_BUFFER - 1)), event]
            : [...events, event];

        // Only create new activeNotes ref for note-on/note-off (Issue 1/9 fix)
        if (event.type === 'note-on') {
          return {
            currentEvents: nextEvents,
            latestEvent: event,
            activeNotes: { ...state.activeNotes, [event.note]: event },
          };
        }

        if (event.type === 'note-off') {
          const next = { ...state.activeNotes };
          delete next[event.note];
          return {
            currentEvents: nextEvents,
            latestEvent: event,
            activeNotes: next,
          };
        }

        // control-change and others: don't touch activeNotes reference
        return {
          currentEvents: nextEvents,
          latestEvent: event,
        };
      }),

    removeNote: (noteNumber) =>
      set((state) => {
        const nextActiveNotes = { ...state.activeNotes };
        delete nextActiveNotes[noteNumber];
        return { activeNotes: nextActiveNotes };
      }),

    clearEvents: () =>
      set({
        currentEvents: [],
        latestEvent: null,
        activeNotes: {},
      }),

    reset: () =>
      set({
        connectionStatus: 'disconnected',
        activeDevice: null,
        availableDevices: [],
        errorMessage: null,
        currentEvents: [],
        latestEvent: null,
        activeNotes: {},
        inputSource: 'none',
        showTroubleshooting: false,
        detectedChannel: null,
      }),
  }))
);
